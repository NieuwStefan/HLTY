import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, SendHorizontal, Loader2, ShoppingCart, ChevronLeft, AlertCircle, MessageCircle, Target, Zap, CheckCircle2 } from 'lucide-react';
import OpenAI from 'openai';
import { searchProducts, type Product } from '../lib/shopify';
import { useCart } from '../context/CartContext';

// ---------- Config ----------

const BRANDS = [
  'HLTY', 'Orthica', 'Royal Green', 'Arctic Blue',
  'Activo', 'Mattisson', 'ESN', 'The Green Athlete',
  'Geen voorkeur',
];

// ---------- Types ----------

type Phase = 'idle' | 'loading' | 'question' | 'brands' | 'results';

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

const PROMPT_RESULTS = `Je bent gezondheidsadviseur voor HLTY.shop.
Op basis van het gesprek geef je zoektermen en producttoelichtingen.
Geef 2-3 zoektermen (specifieke ingrediënten zoals "magnesium", "vitamine B", "kurkuma", "omega-3").
Per zoekterm schrijf je 1 korte zin waarom dit de klant kan ondersteunen.
Als er geen merkvoorkeur is, kies dan de meest effectieve/populaire optie ongeacht merk.
Schrijf ook een korte persoonlijke samenvatting.
Antwoord ALLEEN met JSON:
{"queries":["term1","term2"],"reasons":["Reden1","Reden2"],"summary":"Samenvatting voor de klant"}`;

// ---------- OpenAI client ----------

let openaiClient: OpenAI | null = null;
function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }
  return openaiClient;
}

async function callGPT(systemPrompt: string, history: ChatMessage[]): Promise<string> {
  const completion = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 256,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
  });
  return completion.choices[0]?.message?.content ?? '';
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
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
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

  // ---- Step 2: open answer confirmed → brand question ----
  function handleQuestionConfirm(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!openAnswer.trim()) return;

    historyRef.current = [
      ...historyRef.current,
      { role: 'assistant', content: questionText },
      { role: 'user', content: openAnswer.trim() },
    ];

    setSelectedBrand(null);
    setPhase('brands');
  }

  // ---- Step 3: brand selected → fetch results ----
  async function handleBrandConfirm() {
    if (!selectedBrand || phase === 'loading') return;
    setPhase('loading');

    const brandNote = selectedBrand === 'Geen voorkeur'
      ? 'De klant heeft geen merkvoorkeur. Kies de beste producten op basis van kwaliteit en populariteit.'
      : `De klant heeft een voorkeur voor het merk: ${selectedBrand}.`;

    const history: ChatMessage[] = [
      ...historyRef.current,
      { role: 'user', content: brandNote },
    ];

    try {
      const raw = await callGPT(PROMPT_RESULTS, history);
      const { queries, reasons, summary: sum } = parseJSON<{
        queries: string[];
        reasons: string[];
        summary: string;
      }>(raw);

      setSummary(sum);

      const preferredBrand = selectedBrand !== 'Geen voorkeur' ? selectedBrand : null;

      // No brand preference: sort by BEST_SELLING so Shopify returns the most popular product
      const sortKey = preferredBrand ? 'RELEVANCE' : 'BEST_SELLING';

      const sets = await Promise.all(
        queries.map((q, i) =>
          searchProducts(q, 8, sortKey as 'RELEVANCE' | 'BEST_SELLING')
            .then((r: { products: Product[] }) => {
              let products = r.products.filter((p) => p.variants[0]?.availableForSale);
              if (preferredBrand) {
                const brandHits = products.filter((p) => p.vendor === preferredBrand);
                const others = products.filter((p) => p.vendor !== preferredBrand);
                products = [...brandHits, ...others];
              }
              return products.slice(0, 3).map((p) => ({ product: p, reason: reasons[i] ?? '' }));
            })
        )
      );

      const seen = new Set<string>();
      const merged: AdvisorResult[] = [];
      for (const set of sets) {
        for (const item of set) {
          if (!seen.has(item.product.handle)) {
            seen.add(item.product.handle);
            merged.push(item);
            if (merged.length >= 5) break;
          }
        }
        if (merged.length >= 5) break;
      }

      setResults(merged);
      setPhase('results');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Er is iets misgegaan');
      setPhase('brands');
    }
  }

  async function handleAddToCart(variantId: string, productId: string) {
    setAddingId(productId);
    try { await addItem(variantId); }
    finally { setAddingId(null); }
  }

  function reset() {
    setPhase('idle'); setInput(''); setQuestionText(''); setOpenAnswer('');
    setSelectedBrand(null); setResults([]); setSummary(''); setErrorMsg('');
    historyRef.current = [];
  }

  const stepMap: Record<Phase, number> = { idle: 0, loading: 0, question: 1, brands: 2, results: 3 };
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

              {/* BRAND PREFERENCE */}
              {phase === 'brands' && (
                <motion.div
                  key="brands"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col"
                >
                  <p className="text-base font-semibold text-white mb-1 leading-snug">
                    Heb je een voorkeur voor een bepaald merk?
                  </p>
                  <p className="text-xs text-white/50 mb-4">
                    Kies een merk of ga zonder voorkeur verder — wij kiezen dan de best beoordeelde optie.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {BRANDS.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          selectedBrand === brand
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-white'
                            : 'border-white/10 bg-white/5 text-white/70 hover:border-[var(--color-primary)]/40 hover:bg-white/10'
                        } ${brand === 'Geen voorkeur' ? 'col-span-2' : ''}`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                            selectedBrand === brand
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                              : 'border-white/30'
                          }`}
                        />
                        {brand}
                      </button>
                    ))}
                  </div>
                  {errorMsg && (
                    <div className="mb-3 flex items-start gap-2 text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {errorMsg}
                    </div>
                  )}
                  <button
                    onClick={handleBrandConfirm}
                    disabled={!selectedBrand}
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
