import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Zap, Dumbbell, Brain, ShieldCheck, Bone, Heart, Wind, Sparkles,
  ArrowRight, ArrowLeft, Check, RotateCcw, Loader2, ShoppingCart, MessageCircle,
  Sprout, Lightbulb, AlertCircle,
} from 'lucide-react';
import {
  type GoalKey,
  STEP2_QUESTIONS,
} from '../lib/consultation-rules';
import {
  runConsultation,
  type ConsultationResult,
  type DietKey,
} from '../lib/consultation-engine';
import { useCart } from '../context/CartContext';
import { getProduct } from '../lib/shopify';

// ============================================================================
// Types
// ============================================================================

// Stap 5 (vrije tekst / 'detail') + AI-fallback zijn vóór de eerste
// feedback-ronde uit de flow gehaald — zie docs/_productadvisor-wishlist.md
// (Fase 4). De AI-infrastructuur staat nog in consultation-engine.ts.
type Step = 'goals' | 'intensity' | 'diet' | 'lifestyle' | 'loading' | 'results';

type LifestyleAnswer = boolean | null;

// ============================================================================
// UI-data — visuele eigenschappen van de 9 doelen
// (de business-logica zit in consultation-rules.ts)
// ============================================================================

const GOALS: { key: GoalKey; icon: typeof Moon; label: string; color: string }[] = [
  { key: 'slaap',     icon: Moon,        label: 'Beter slapen',         color: '#5E5CE6' },
  { key: 'energie',   icon: Zap,         label: 'Meer energie',         color: '#FF9500' },
  { key: 'spieren',   icon: Dumbbell,    label: 'Spieren & herstel',    color: '#FF3B30' },
  { key: 'focus',     icon: Brain,       label: 'Focus & concentratie', color: '#007AFF' },
  { key: 'weerstand', icon: ShieldCheck, label: 'Weerstand',            color: '#34C759' },
  { key: 'gewricht',  icon: Bone,        label: 'Gewrichten',           color: '#AF52DE' },
  { key: 'hart',      icon: Heart,       label: 'Hart & vaten',         color: '#FF2D55' },
  { key: 'stress',    icon: Wind,        label: 'Stress & rust',        color: '#00C7BE' },
  { key: 'hormonen',  icon: Sparkles,    label: 'Hormonen',             color: '#BF5AF2' },
];

// Dieet-keuze: label voor UI, key voor engine
const DIET_OPTIONS: { key: DietKey; label: string }[] = [
  { key: 'vegan',       label: 'Vegan' },
  { key: 'vegetarisch', label: 'Vegetarisch' },
  { key: 'lactosevrij', label: 'Lactosevrij' },
  { key: 'glutenvrij',  label: 'Glutenvrij' },
  { key: 'suikervrij',  label: 'Suikervrij' },
  { key: 'geen',        label: 'Geen specifieke wensen' },
];
const NO_DIET_KEY: DietKey = 'geen';

const LIFESTYLE_QUESTIONS: { key: 'nutrition' | 'stress' | 'sleep'; question: string }[] = [
  { key: 'nutrition', question: 'Eet je elke dag voldoende groente en fruit?' },
  { key: 'stress',    question: 'Voel je je vaak gestrest of opgejaagd?' },
  { key: 'sleep',     question: 'Slaap je doorgaans 7 uur of meer per nacht?' },
];

// ============================================================================
// Component
// ============================================================================

export default function HealthConsultation() {
  // --- Step + flow state ---
  const [step, setStep] = useState<Step>('goals');

  // --- User input ---
  const [goals, setGoals] = useState<GoalKey[]>([]);
  const [answers, setAnswers] = useState<Partial<Record<GoalKey, string>>>({});
  const [diets, setDiets] = useState<DietKey[]>([]);
  const [lifestyle, setLifestyle] = useState<Record<'nutrition' | 'stress' | 'sleep', LifestyleAnswer>>({
    nutrition: null, stress: null, sleep: null,
  });

  // --- Result state (set door engine na 'lifestyle' submit) ---
  const [result, setResult] = useState<ConsultationResult | null>(null);

  // --- Cart state per product-handle: 'idle' | 'loading' | 'added' | 'error' ---
  const { addItem } = useCart();
  const [cartState, setCartState] = useState<Record<string, 'idle' | 'loading' | 'added' | 'error'>>({});

  // --- Gekozen smaak per product (key = product.handle, value = smaak-handle) ---
  const [selectedFlavor, setSelectedFlavor] = useState<Record<string, string>>({});

  async function handleAddToCart(handle: string) {
    setCartState((s) => ({ ...s, [handle]: 'loading' }));
    try {
      const product = await getProduct(handle);
      const variant = product.variants.find((v) => v.availableForSale) ?? product.variants[0];
      if (!variant) throw new Error('Geen variant gevonden');
      await addItem(variant.id, 1);
      setCartState((s) => ({ ...s, [handle]: 'added' }));
      setTimeout(() => setCartState((s) => ({ ...s, [handle]: 'idle' })), 2000);
    } catch (err) {
      console.error('[Consultation] add-to-cart error', err);
      setCartState((s) => ({ ...s, [handle]: 'error' }));
      setTimeout(() => setCartState((s) => ({ ...s, [handle]: 'idle' })), 2500);
    }
  }

  // --- Helpers ---
  const stepOrder: Step[] = ['goals', 'intensity', 'diet', 'lifestyle'];
  const currentIndex = stepOrder.indexOf(step as Step);
  const totalSteps = stepOrder.length;
  const isOnFormStep = currentIndex >= 0;

  function toggleGoal(key: GoalKey) {
    setGoals((prev) => {
      if (prev.includes(key)) {
        // Deselect: ook het bijbehorende antwoord wissen
        setAnswers((a) => {
          const { [key]: _, ...rest } = a;
          void _;
          return rest;
        });
        return prev.filter((g) => g !== key);
      }
      if (prev.length >= 2) return prev;
      return [...prev, key];
    });
  }

  function setAnswerForGoal(goal: GoalKey, answerKey: string) {
    setAnswers((prev) => ({ ...prev, [goal]: answerKey }));
  }

  function toggleDiet(diet: DietKey) {
    setDiets((prev) => {
      if (diet === NO_DIET_KEY) {
        return prev.includes(NO_DIET_KEY) ? [] : [NO_DIET_KEY];
      }
      const withoutNone = prev.filter((d) => d !== NO_DIET_KEY);
      return withoutNone.includes(diet)
        ? withoutNone.filter((d) => d !== diet)
        : [...withoutNone, diet];
    });
  }

  function setLifestyleAnswer(key: 'nutrition' | 'stress' | 'sleep', answer: boolean) {
    setLifestyle((prev) => ({ ...prev, [key]: answer }));
  }

  function submitConsultation() {
    setStep('loading');
    try {
      // Stap 5 (vrije tekst) + AI-fallback zijn uit de flow gehaald —
      // we gebruiken het deterministische regel-pad direct (freeText leeg).
      const engineResult = runConsultation({
        goals,
        answers,
        diets,
        lifestyle,
        freeText: '',
      });
      setResult(engineResult);
    } catch (err) {
      console.error('[Consultation] engine error', err);
      setResult({
        summary: 'Er ging iets mis bij het samenstellen van je advies. Probeer het opnieuw.',
        products: [],
        sourceMappingIds: [],
      });
    }
    setStep('results');
  }

  function next() {
    if (step === 'goals')     { setStep('intensity'); return; }
    if (step === 'intensity') { setStep('diet'); return; }
    if (step === 'diet')      { setStep('lifestyle'); return; }
    if (step === 'lifestyle') { submitConsultation(); return; }
  }

  function back() {
    if (step === 'intensity') { setStep('goals'); return; }
    if (step === 'diet')      { setStep('intensity'); return; }
    if (step === 'lifestyle') { setStep('diet'); return; }
  }

  function reset() {
    setStep('goals');
    setGoals([]);
    setAnswers({});
    setDiets([]);
    setLifestyle({ nutrition: null, stress: null, sleep: null });
    setResult(null);
  }

  const canProceed = (() => {
    if (step === 'goals')     return goals.length > 0;
    if (step === 'intensity') return goals.every((g) => answers[g] !== undefined);
    if (step === 'diet')      return diets.length > 0;
    if (step === 'lifestyle') return lifestyle.nutrition !== null && lifestyle.stress !== null && lifestyle.sleep !== null;
    return false;
  })();

  return (
    <div className="w-full">
      <div className="relative rounded-[32px] overflow-hidden glass-dark">
        {/* Ambient gradient blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[var(--color-primary)]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative p-6 sm:p-10 lg:p-12 min-h-[760px] flex flex-col">
          {/* Header progress (alle form-stappen) */}
          {isOnFormStep && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">
                  Stap {currentIndex + 1} van {totalSteps}
                </span>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Opnieuw
                </button>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--color-primary)] rounded-full"
                  animate={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Step content — flex-1 zorgt voor consistente paneelhoogte */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">

              {/* ========== STAP 1 — GOALS (intro + klikbare tegels) ========== */}
              {step === 'goals' && (
                <motion.div
                  key="goals"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                  className="grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-10 items-start"
                >
                  {/* Links: intro */}
                  <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest mb-6">
                      <MessageCircle className="w-3.5 h-3.5" />
                      HLTY Consultation
                    </div>
                    <h3
                      className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.05]"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Vind in <span className="text-[var(--color-primary)]">60 seconden</span><br />
                      jouw supplementen
                    </h3>
                    <p className="mt-5 text-white/70 text-base leading-relaxed max-w-md">
                      Een paar snelle vragen — wij koppelen je antwoorden aan de meest passende
                      producten uit ons fysio-gekeurde assortiment.
                    </p>
                    <div className="mt-8 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-white/70">
                        <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/15 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        Geen account of e-mail nodig
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/70">
                        <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/15 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        Direct advies, gebaseerd op jouw doelen
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/70">
                        <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/15 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        Alleen wat écht bij jou past
                      </div>
                    </div>
                  </div>

                  {/* Rechts: klikbare tegels */}
                  <div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">
                      Waar wil je aan werken? <span className="text-white/40 font-normal normal-case tracking-normal">— kies maximaal 2</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {GOALS.map((g) => {
                        const active = goals.includes(g.key);
                        const Icon = g.icon;
                        return (
                          <button
                            key={g.key}
                            onClick={() => toggleGoal(g.key)}
                            className={`
                              relative p-3 rounded-2xl border-2 transition-all text-left
                              ${active
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}
                              ${!active && goals.length >= 2 ? 'opacity-40 cursor-not-allowed' : ''}
                            `}
                            disabled={!active && goals.length >= 2}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                              style={{ backgroundColor: `${g.color}25` }}
                            >
                              <Icon className="w-5 h-5" style={{ color: g.color }} />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-white leading-tight">{g.label}</p>
                            {active && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========== STAP 2 — Doel-specifieke vragen (1 of 2 blokken) ========== */}
              {step === 'intensity' && (
                <motion.div
                  key="intensity"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Montserrat' }}>
                    {goals.length === 2 ? 'Iets specifieker over je doelen' : 'Iets specifieker over je doel'}
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    {goals.length === 2
                      ? 'We stellen per doel één korte vraag — zo blijven de aanbevelingen scherp.'
                      : 'Dit helpt ons bepalen welke producten het beste passen.'}
                  </p>

                  <div className="space-y-6">
                    {goals.map((goalKey) => {
                      const goalConfig = GOALS.find((g) => g.key === goalKey);
                      const questionConfig = STEP2_QUESTIONS[goalKey];
                      if (!goalConfig || !questionConfig) return null;
                      const GoalIcon = goalConfig.icon;
                      return (
                        <div key={goalKey} className="rounded-2xl bg-white/5 border border-white/10 p-5">
                          {/* Doel-header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${goalConfig.color}25` }}
                            >
                              <GoalIcon className="w-4.5 h-4.5" style={{ color: goalConfig.color }} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                                {goalConfig.label}
                              </p>
                              <p className="text-sm font-semibold text-white">
                                {questionConfig.question}
                              </p>
                            </div>
                          </div>

                          {/* Antwoord-opties */}
                          <div className="space-y-2">
                            {questionConfig.options.map((opt) => {
                              const active = answers[goalKey] === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  onClick={() => setAnswerForGoal(goalKey, opt.key)}
                                  className={`
                                    w-full p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between
                                    ${active
                                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15'
                                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5'}
                                  `}
                                >
                                  <span className="text-sm font-medium text-white">{opt.label}</span>
                                  <div className={`
                                    w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                                    ${active ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-white/30'}
                                  `}>
                                    {active && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ========== STAP 3 — DIET ========== */}
              {step === 'diet' && (
                <motion.div
                  key="diet"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Montserrat' }}>
                    Dieet of allergieën?
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    Wij filteren producten die niet bij jouw voorkeuren passen.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {DIET_OPTIONS.map((d) => {
                      const active = diets.includes(d.key);
                      const isNo = d.key === NO_DIET_KEY;
                      return (
                        <button
                          key={d.key}
                          onClick={() => toggleDiet(d.key)}
                          className={`
                            p-4 rounded-2xl border-2 transition-all flex items-center gap-3
                            ${active
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15'
                              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}
                            ${isNo ? 'col-span-2 sm:col-span-3' : ''}
                          `}
                        >
                          <div className={`
                            w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all
                            ${active ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-white/30'}
                          `}>
                            {active && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm font-semibold text-white">{d.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ========== STAP 4 — LIFESTYLE ========== */}
              {step === 'lifestyle' && (
                <motion.div
                  key="lifestyle"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Montserrat' }}>
                    Drie korte vragen over jouw situatie
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    Helpt ons om de aanbevelingen nog beter af te stemmen.
                  </p>

                  <div className="space-y-4">
                    {LIFESTYLE_QUESTIONS.map((q) => {
                      const value = lifestyle[q.key];
                      return (
                        <div key={q.key} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                          <p className="text-base font-semibold text-white mb-3">{q.question}</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setLifestyleAnswer(q.key, true)}
                              className={`
                                flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all
                                ${value === true
                                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-white'
                                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'}
                              `}
                            >
                              Ja
                            </button>
                            <button
                              onClick={() => setLifestyleAnswer(q.key, false)}
                              className={`
                                flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all
                                ${value === false
                                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-white'
                                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'}
                              `}
                            >
                              Nee
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Stap 5 (vrije tekst) is uit de flow gehaald — zie
                  docs/_productadvisor-wishlist.md (Fase 4 AI-fallback). */}

              {/* ========== LOADING ========== */}
              {step === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center gap-4 min-h-[420px]"
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-[var(--color-primary)] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-white">Jouw advies wordt samengesteld...</p>
                    <p className="text-sm text-white/50 mt-1">We matchen je antwoorden aan ons assortiment</p>
                  </div>
                </motion.div>
              )}

              {/* ========== RESULTS ========== */}
              {step === 'results' && result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                      Jouw persoonlijke advies
                    </span>
                    <button
                      onClick={reset}
                      className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Opnieuw beginnen
                    </button>
                  </div>

                  {/* Summary */}
                  {result.summary && (
                    <div className="p-5 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25 mb-6 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white/90 leading-relaxed">{result.summary}</p>
                    </div>
                  )}

                  {/* Dieet-geruststelling (suikervrij / glutenvrij) */}
                  {result.dietNote && (
                    <div className="p-4 rounded-2xl bg-emerald-400/10 border border-emerald-400/25 mb-6 flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white/90 leading-relaxed">{result.dietNote}</p>
                    </div>
                  )}

                  {/* Producten */}
                  {result.products.length > 0 ? (
                    <>
                      <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">
                        Top {result.products.length} voor jou
                      </p>
                      <div className="space-y-4">
                        {result.products.map((product, i) => {
                          // Effectieve handle: gekozen smaak of standaard
                          const effectiveHandle =
                            selectedFlavor[product.handle] ?? product.handle;
                          const state = cartState[effectiveHandle];
                          return (
                          <motion.div
                            key={product.handle}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.08 }}
                            className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                                <Sprout className="w-6 h-6 text-[var(--color-primary)]/60" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-1">
                                  {product.tagline}
                                </p>
                                <h4 className="text-base font-bold text-white leading-snug">{product.productName}</h4>
                                <p className="text-sm font-semibold text-white/70 mt-1">{product.price}</p>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <p className="text-sm text-white/80 leading-relaxed">{product.explanation}</p>
                            </div>
                            {/* Smaak-kiezer (alleen bij producten met losse smaak-producten) */}
                            {product.flavorOptions && product.flavorOptions.length > 0 && (
                              <div className="mt-4">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                                  Kies je smaak
                                </label>
                                <select
                                  value={effectiveHandle}
                                  onChange={(e) =>
                                    setSelectedFlavor((s) => ({
                                      ...s,
                                      [product.handle]: e.target.value,
                                    }))
                                  }
                                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]/60 transition-colors"
                                >
                                  {product.flavorOptions.map((f) => (
                                    <option key={f.handle} value={f.handle} className="bg-[#1a1a2e] text-white">
                                      {f.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div className="mt-5 flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => handleAddToCart(effectiveHandle)}
                                disabled={state === 'loading' || state === 'added'}
                                className="btn-primary px-5 py-2.5 text-xs gap-1.5 inline-flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                {state === 'loading' ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Bezig...
                                  </>
                                ) : state === 'added' ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Toegevoegd
                                  </>
                                ) : state === 'error' ? (
                                  <>
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Probeer opnieuw
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    In winkelwagen
                                  </>
                                )}
                              </button>
                              <a
                                href={`/product/${effectiveHandle}`}
                                className="px-5 py-2.5 text-xs gap-1.5 inline-flex items-center justify-center rounded-full border border-white/20 text-white/85 hover:bg-white/5 hover:border-white/30 transition-colors"
                              >
                                Bekijk product
                                <ArrowRight className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </motion.div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    // Placeholder voor empty mapping (curatie nog niet gedaan)
                    <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-white/15 text-center">
                      <AlertCircle className="w-8 h-8 text-amber-300/80 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-white mb-1">Mapping nog niet ingevuld</p>
                      <p className="text-xs text-white/50 max-w-md mx-auto">
                        Voor jouw exacte keuze-combinatie zijn we nog bezig met het samenstellen van het juiste advies.
                        Onze fysiotherapeuten en het HLTY-team werken hieraan.
                      </p>
                      <p className="text-[10px] text-white/30 mt-3">
                        Mapping IDs: {result.sourceMappingIds.join(', ') || 'geen match'}
                      </p>
                    </div>
                  )}

                  {/* Optionele leefstijl-tip */}
                  {result.lifestyleTip && (
                    <div className="mt-5 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-start gap-3">
                      <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white/85 leading-relaxed">{result.lifestyleTip}</p>
                    </div>
                  )}

                  {/* Optionele medische disclaimer */}
                  {result.medicalDisclaimer && (
                    <div className="mt-5 p-4 rounded-2xl bg-red-400/10 border border-red-400/25 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white/85 leading-relaxed">{result.medicalDisclaimer}</p>
                    </div>
                  )}

                  <p className="mt-6 text-xs text-white/40 text-center">
                    Heb je twijfels of een medische klacht? Raadpleeg eerst een medisch professional.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer navigation */}
          {isOnFormStep && (
            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10">
              {step !== 'goals' ? (
                <button
                  onClick={back}
                  className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white/70 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Terug
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={next}
                disabled={!canProceed}
                className="btn-primary px-6 py-3 text-sm gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step === 'lifestyle' ? 'Bekijk mijn advies' : 'Volgende'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
