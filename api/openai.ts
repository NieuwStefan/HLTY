// Vercel serverless function — proxies OpenAI chat completion calls so the
// API key never leaves the server.
//
// Accepts POST { systemPrompt: string, messages: {role, content}[], maxTokens?: number }
// Returns    { content: string }

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  systemPrompt: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

interface VercelRequest {
  method?: string;
  body?: RequestBody | string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });
    return;
  }

  let body: RequestBody;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as RequestBody);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const { systemPrompt, messages, maxTokens } = body ?? ({} as RequestBody);

  if (!systemPrompt || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Missing systemPrompt or messages' });
    return;
  }

  // Basic safety limits
  if (messages.length > 20) {
    res.status(400).json({ error: 'Too many messages' });
    return;
  }

  const tokens = typeof maxTokens === 'number' && maxTokens > 0 && maxTokens <= 1500 ? maxTokens : 256;

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: tokens,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(upstream.status).json({ error: 'Upstream error', detail: text.slice(0, 500) });
      return;
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? '';
    res.status(200).json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
