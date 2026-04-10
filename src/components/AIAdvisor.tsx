import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, SendHorizontal, Loader2, ShoppingCart, ChevronLeft, AlertCircle, MessageCircle, Target, Zap, CheckCircle2 } from 'lucide-react';
import { searchProducts, type Product } from '../lib/shopify';
import { useCart } from '../context/CartContext';

// ---------- Config ----------

const DIETARY_PREFERENCES = [
  'Vegan',
  'Vegetarisch',
  'Glutenvrij',
  'Lactosevrij',
  'Suikervrij',
  'Geen specifieke wensen',
];

const NO_PREFERENCE = 'Geen specifieke wensen';

// ---------- Types ----------

type Phase = 'idle' | 'loading' | 'question' | 'diets' | 'results';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AdvisorResult {
  product: Product;
  reason: string;
}

// ---------- GPT Prompts ----------

const PROMPT_QUESTION = `Je bent gezondheidsadviseur voor HLTY.shop.
Stel PRECIES ÉÉN open vervolgvraag op basis van wat de klant vertelt.
Doel: beter begrijpen wat de klant nodig heeft voor een gericht productadvies.
Gebruik gewone begrijpelijke taal, geen vakjargon.
De vraag moet open zijn — geen multiple choice, de klant typt zelf een antwoord.
Antwoord ALLEEN met JSON: {"text":"jouw open vraag hier"}`;

const PROMPT_PLAN = `Je bent gezondheidsadviseur voor HLTY.shop.
Op basis van het gesprek bepaal je een zoekstrategie.
Geef 2-3 Nederlandse zoektermen (specifieke ingrediënten zoals "magnesium", "vitamine B", "kurkuma", "omega-3").
Houd rekening met eventuele dieetwensen/allergieën van de klant.
Schrijf ook een korte persoonlijke samenvatting (2 zinnen) voor de klant.
Antwoord ALLEEN met JSON:
{"queries":["term1","term2"],"summary":"Samenvatting voor de klant"}`;

const PROMPT_PITCH = `Je bent gezondheidsadviseur voor HLTY.shop.
Je krijgt een lijst producten en de situatie van de klant.
Schrijf per product ÉÉN korte, persoonlijke zin (maximaal 20 woorden) waarom juist DIT specifieke product past bij de klant.
Gebruik in elke zin de productnaam, het actieve ingrediënt of een uniek kenmerk van dat product.
Elke zin moet duidelijk verschillend zijn — geen herhaling van dezelfde tekst!
Antwoord ALLEEN met JSON:
{"pitches":[{"handle":"product-handle","text":"Zin over dit specifieke product"}]}`;

// ---------- GPT client (via Vercel serverless proxy) ----------

async function callGPT(systemPrompt: string, history: ChatMessage[], maxTokens = 256): Promise<string> {
  const res = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
      maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI-aanvraag mislukt (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as { content?: string };
  return data.content ?? '';
}

function parseJSON<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Geen geldig antwoord van AI');
  return JSON.parse(match[0]) as T;
}

// ---------- Component ----------

export default function AIAdvisor() {
  const { addItem } = useCart();

  const [phase, setPhase] = useState<Phase>('idle');
  const [input, setInput] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [openAnswer, setOpenAnswer] = useState('');
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [results, setResults] = useState<AdvisorResult[]>([]);
  const [summary, setSummary] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  const historyRef = useRef<ChatMessage[]>([]);

  // ---- Step 1: first message → 1 open follow-up question ----
  async function handleStart(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!input.trim() || phase === 'loading') return;
    setErrorMsg('');
    setPhase('loading');

    const history: ChatMessage[] = [{ role: 'user', content: input.trim() }];
    historyRef.current = history;

    try {
      const raw = await callGPT(PROMPT_QUESTION, history);
      const parsed = parseJSON<{ text: string }>(raw);
      setQuestionText(parsed.text);
      setOpenAnswer('');
      setPhase('question');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Er is iets misgegaan');
      setPhase('idle');
    }
  }

  // ---- Step 2: open answer confirmed → dietary question ----
  function handleQuestionConfirm(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!openAnswer.trim()) return;

    historyRef.current = [
      ...historyRef.current,
      { role: 'assistant', content: questionText },
      { role: 'user', content: openAnswer.trim() },
    ];

    setSelectedDiets([]);
    setPhase('diets');
  }

  // ---- Diet toggle handler ----
  function toggleDiet(diet: string) {
    setSelectedDiets((prev) => {
      if (diet === NO_PREFERENCE) {
        // Selecting "geen wensen" clears everything else
        return prev.includes(NO_PREFERENCE) ? [] : [NO_PREFERENCE];
      }
      // Selecting any specific diet clears "geen wensen"
      const withoutNoPref = prev.filter((d) => d !== NO_PREFERENCE);
      return withoutNoPref.includes(diet)
        ? withoutNoPref.filter((d) => d !== diet)
        : [...withoutNoPref, diet];
    });
  }

  // ---- Tag-based dietary filter ----
  function matchesDietaryPrefs(product: Product, prefs: string[]): boolean {
    if (prefs.length === 0 || prefs.includes(NO_PREFERENCE)) return true;
    const lowerTags = product.tags.map((t) => t.toLowerCase());
    // Every selected preference must match at least one BEWUST-* tag
    return prefs.every((pref) => {
      const needle = pref.toLowerCase();
      return lowerTags.some((t) => t.startsWith('bewust-') && t.includes(needle));
    });
  }

  // ---- Step 3: diets selected → two-step GPT flow ----
  async function handleDietsConfirm() {
    if (selectedDiets.length === 0 || phase === 'loading') return;
    setPhase('loading');

    const dietNote =
      selectedDiets.includes(NO_PREFERENCE) || selectedDiets.length === 0
        ? 'De klant heeft geen specifieke dieetwensen of allergieën.'
        : `De klant heeft de volgende dieetwensen/allergieën: ${selectedDiets.join(', ')}. Houd hier rekening mee in je advies.`;

    const planHistory: ChatMessage[] = [
      ...historyRef.current,
      { role: 'user', content: dietNote },
    ];

    try {
      // ---- Stage A: plan queries + summary ----
      const rawPlan = await callGPT(PROMPT_PLAN, planHistory);
      const { queries, summary: sum } = parseJSON<{
        queries: string[];
        summary: string;
      }>(rawPlan);

      setSummary(sum);

      const applyDietFilter = !selectedDiets.includes(NO_PREFERENCE) && selectedDiets.length > 0;

      // ---- Stage B: search Shopify for each query ----
      const sets = await Promise.all(
        queries.map((q) =>
          searchProducts(q, 10, 'BEST_SELLING' as const).then((r) =>
            r.products.filter((p) => p.variants[0]?.availableForSale)
          )
        )
      );

      // Merge unique products, preferring dietary matches
      const seen = new Set<string>();
      const dietMatches: Product[] = [];
      const otherProducts: Product[] = [];

      for (const set of sets) {
        for (const product of set) {
          if (seen.has(product.handle)) continue;
          seen.add(product.handle);
          if (!applyDietFilter || matchesDietaryPrefs(product, selectedDiets)) {
            dietMatches.push(product);
          } else {
            otherProducts.push(product);
          }
        }
      }

      // Pick top 5: prefer diet-matching; fall back to others if needed
      let selected = dietMatches.slice(0, 5);
      if (selected.length < 5) {
        selected = [...selected, ...otherProducts.slice(0, 5 - selected.length)];
      }

      if (selected.length === 0) {
        throw new Error('Geen producten gevonden voor jouw situatie.');
      }

      // ---- Stage C: pitch each product individually ----
      const productDigest = selected
        .map((p) => ({
          handle: p.handle,
          title: p.title,
          vendor: p.vendor,
          description: (p.description || '').slice(0, 200),
          tags: p.tags.slice(0, 15),
        }));

      const pitchHistory: ChatMessage[] = [
        ...planHistory,
        {
          role: 'user',
          content: `Hier zijn de gevonden producten:\n${JSON.stringify(productDigest, null, 2)}`,
        },
      ];

      let pitchMap = new Map<string, string>();
      try {
        const rawPitch = await callGPT(PROMPT_PITCH, pitchHistory, 700);
        const { pitches } = parseJSON<{
          pitches: { handle: string; text: string }[];
        }>(rawPitch);
        pitchMap = new Map(pitches.map((p) => [p.handle, p.text]));
      } catch {
        // If pitch call fails, we still show products without custom reasons
        pitchMap = new Map();
      }

      const merged: AdvisorResult[] = selected.map((product) => ({
        product,
        reason: pitchMap.get(product.handle) ?? '',
      }));

      setResults(merged);
      setPhase('results');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Er is iets misgegaan');
      setPhase('diets');
    }
  }

  async function handleAddToCart(variantId: string, productId: string) {
    setAddingId(productId);
    try { await addItem(variantId); }
    finally { setAddingId(null); }
  }

  function reset() {
    setPhase('idle'); setInput(''); setQuestionText(''); setOpenAnswer('');
    setSelectedDiets([]); setResults([]); setSummary(''); setErrorMsg('');
    historyRef.current = [];
  }

  const stepMap: Record<Phase, number> = { idle: 0, loading: 0, question: 1, diets: 2, results: 3 };
  const currentStep = stepMap[phase];
  const totalSteps = 3;

  // ---------- Render ----------

  const EXAMPLE_PROMPTS = [
    'Ik ben vaak moe na het werk',
    'Ik wil meer spiermassa opbouwen',
    'Ik slaap slecht',
    'Ik heb last van mijn gewrichten',
  ];

  const FEATURES = [
    { icon: Target, title: 'Persoonlijk advies', desc: 'Op basis van jouw situatie' },
    { icon: Zap, title: 'Direct resultaat', desc: 'In enkele seconden' },
    { icon: CheckCircle2, title: 'Physio-gekeurd', desc: '900+ geselecteerde producten' },
  ];

  return (
    <div className="w-full">
      <div className="relative rounded-[32px] overflow-hidden glass-dark">
        {/* Ambient gradient blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[var(--color-primary)]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative grid lg:grid-cols-[1fr_1.1fr] gap-0 min-h-[520px]">
          {/* Left: Info column */}
          <div className="p-8 sm:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI Productadviseur
            </div>

            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.05]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Welk supplement
              <br />
              <span className="text-[var(--color-primary)]">past bij jou?</span>
            </h2>

            <p className="mt-5 text-white/60 text-base leading-relaxed max-w-md">
              Beschrijf je situatie in eigen woorden en onze AI-adviseur zoekt de beste producten voor jou uit ons volledige assortiment.
            </p>

            {/* Features */}
            <div className="mt-8 space-y-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-4 h-4 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-white/50">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Interactive column */}
          <div className="p-6 sm:p-10 flex flex-col">
            {/* Progress / header */}
            {phase !== 'idle' ? (
              <div className="mb-6">
                <div className="flex items-center justify-between text-[11px] text-white/60 mb-2 font-medium">
                  <span className="uppercase tracking-widest">
                    {phase === 'results' ? 'Jouw advies' : `Stap ${currentStep} van ${totalSteps}`}
                  </span>
                  <button
                    onClick={reset}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Opnieuw
                  </button>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--color-primary)] rounded-full"
                    animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/60">
                <MessageCircle className="w-3.5 h-3.5" />
                Start het gesprek
              </div>
            )}

            <div className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">

              {/* IDLE */}
              {phase === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex-1 flex flex-col"
                >
                  <form onSubmit={handleStart} className="flex-1 flex flex-col">
                    <div className="relative flex-1">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleStart(e);
                          }
                        }}
                        placeholder="Beschrijf je doel, klacht of wens..."
                        rows={5}
                        className="w-full h-full min-h-[140px] px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-primary)]/60 focus:bg-white/10 resize-none transition-all"
                      />
                    </div>

                    {/* Example prompts */}
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
                        Voorbeelden
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {EXAMPLE_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => setInput(prompt)}
                            className="px-3 py-1.5 text-xs font-medium text-white/70 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-white hover:border-[var(--color-primary)]/40 transition-all"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="mt-3 flex items-start gap-2 text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {errorMsg}
                      </div>
                    )}

                    <div className="mt-5 flex justify-end">
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="btn-primary px-6 py-3 text-sm gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <SendHorizontal className="w-4 h-4" />
                        Start advies
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* LOADING */}
              {phase === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[200px]"
                >
                  <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[var(--color-primary)] animate-pulse" />
                  </div>
                  <p className="text-sm text-white/60">Bezig met analyseren...</p>
                </motion.div>
              )}

              {/* OPEN FOLLOW-UP QUESTION */}
              {phase === 'question' && (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col"
                >
                  <p className="text-base font-semibold text-white mb-4 leading-snug">
                    {questionText}
                  </p>
                  <form onSubmit={handleQuestionConfirm} className="flex-1 flex flex-col">
                    <textarea
                      value={openAnswer}
                      onChange={(e) => setOpenAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleQuestionConfirm(e);
                        }
                      }}
                      placeholder="Typ hier je antwoord..."
                      rows={4}
                      autoFocus
                      className="w-full flex-1 min-h-[140px] px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-primary)]/60 focus:bg-white/10 resize-none transition-all mb-4"
                    />
                    <button
                      type="submit"
                      disabled={!openAnswer.trim()}
                      className="btn-primary w-full py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Volgende
                    </button>
                  </form>
                </motion.div>
              )}

              {/* DIETARY PREFERENCES */}
              {phase === 'diets' && (
                <motion.div
                  key="diets"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col"
                >
                  <p className="text-base font-semibold text-white mb-1 leading-snug">
                    Heb je allergieën of dieetwensen?
                  </p>
                  <p className="text-xs text-white/50 mb-4">
                    Selecteer alles wat van toepassing is. Wij filteren daarop in het advies.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {DIETARY_PREFERENCES.map((diet) => {
                      const checked = selectedDiets.includes(diet);
                      return (
                        <button
                          key={diet}
                          onClick={() => toggleDiet(diet)}
                          className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            checked
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-white'
                              : 'border-white/10 bg-white/5 text-white/70 hover:border-[var(--color-primary)]/40 hover:bg-white/10'
                          } ${diet === NO_PREFERENCE ? 'col-span-2' : ''}`}
                        >
                          <span
                            className={`w-4 h-4 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                              checked
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                                : 'border-white/30'
                            }`}
                          >
                            {checked && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </span>
                          {diet}
                        </button>
                      );
                    })}
                  </div>
                  {errorMsg && (
                    <div className="mb-3 flex items-start gap-2 text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {errorMsg}
                    </div>
                  )}
                  <button
                    onClick={handleDietsConfirm}
                    disabled={selectedDiets.length === 0}
                    className="btn-primary w-full py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed mt-auto"
                  >
                    Bekijk mijn advies
                  </button>
                </motion.div>
              )}

              {/* RESULTS */}
              {phase === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-start gap-3 mb-5 p-4 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25">
                    <Sparkles className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/90 leading-relaxed">{summary}</p>
                  </div>

                  <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">
                    {results.length} aanbevelingen voor jou
                  </p>

                  <div className="space-y-3">
                    {results.map(({ product, reason }, i) => {
                      const variant = product.variants[0];
                      const image = product.images[0];
                      const price = parseFloat(variant.price.amount).toFixed(2);
                      const isAdding = addingId === product.id;

                      return (
                        <motion.div
                          key={product.handle}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                              {image ? (
                                <img
                                  src={image.url}
                                  alt={image.altText ?? product.title}
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Sparkles className="w-5 h-5 text-[var(--color-primary)]/30" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white line-clamp-2 leading-tight">
                                {product.title}
                              </p>
                              <p className="text-xs text-white/50 mt-0.5">{product.vendor}</p>
                              <p className="text-sm font-bold text-[var(--color-primary)] mt-1">€{price}</p>
                            </div>
                            <button
                              onClick={() => handleAddToCart(variant.id, product.id)}
                              disabled={isAdding}
                              className="btn-primary px-3 py-2 text-xs gap-1.5 flex-shrink-0 disabled:opacity-40"
                            >
                              {isAdding ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShoppingCart className="w-3.5 h-3.5" />
                              )}
                              <span className="hidden sm:inline">Toevoegen</span>
                            </button>
                          </div>
                          {reason && (
                            <p className="mt-2.5 text-xs text-white/60 leading-relaxed border-t border-white/10 pt-2.5">
                              {reason}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
