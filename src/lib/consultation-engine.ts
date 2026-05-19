// ============================================================================
// Productadvisor — Selectie-engine
// ============================================================================
//
// Pure selectie-logica die de gebruikersinvoer omzet naar een resultaat.
// Werkt zonder AI-call zolang stap 5 (vrije tekst) leeg is.
//
// Architectuur (Optie C hybride):
//   1. Klant doorloopt stappen 1–4 (alle klikkeuzes)
//   2. Bij submit:
//      - stap 5 leeg → regel-lookup → filter (dieet) → prioriteren
//        (leefstijl) → top 3 + uitleg → klaar
//      - stap 5 gevuld → AI-fallback krijgt regel-output als basis en mag
//        personaliseren (zie consultation-ai.ts — later toe te voegen)
// ============================================================================

import {
  type GoalKey,
  type DietKey,
  type MappingRule,
  type MappingProduct,
  type DietAlternativeProduct,
  findSingleGoalRule,
  findDoubleGoalRule,
  findFallbackPair,
} from './consultation-rules';
import { selectLifestyleTip } from './consultation-lifestyle-tips';

// ---------- Types ----------

// DietKey wordt nu in consultation-rules.ts gedefinieerd (zodat MappingProduct
// het kan gebruiken zonder circulaire import). Hier re-exporteren zodat
// bestaande imports (o.a. HealthConsultation.tsx) blijven werken.
export type { DietKey };

export interface LifestyleAnswers {
  nutrition: boolean | null;
  stress: boolean | null;
  sleep: boolean | null;
}

export interface ConsultationInput {
  goals: GoalKey[];
  answers: Partial<Record<GoalKey, string>>;
  diets: DietKey[];
  lifestyle: LifestyleAnswers;
  freeText: string;
}

export interface ConsultationResult {
  summary: string;
  products: MappingProduct[];
  medicalDisclaimer?: string;
  lifestyleTip?: string;
  /**
   * Geruststellende notitie bij suikervrij/glutenvrij. Het hele HLTY-
   * assortiment voldoet al aan "geen toegevoegde suiker" + glutenvrij,
   * dus i.p.v. producten te filteren tonen we deze positieve bevestiging.
   */
  dietNote?: string;
  /** Welke mapping-IDs zijn gebruikt om dit resultaat te produceren — handig voor analytics */
  sourceMappingIds: string[];
}

/**
 * Bepaalt de geruststellende dieet-notitie voor suikervrij/glutenvrij.
 * Geen van beide gekozen → undefined (geen notitie).
 */
function composeDietNote(diets: DietKey[]): string | undefined {
  const suikervrij = diets.includes('suikervrij');
  const glutenvrij = diets.includes('glutenvrij');
  if (suikervrij && glutenvrij) {
    return 'Goed nieuws — ons hele assortiment is vrij van toegevoegde suikers én gluten. Alle aanbevelingen hieronder passen dus bij jouw voorkeuren.';
  }
  if (suikervrij) {
    return 'Goed nieuws — ons hele assortiment is vrij van toegevoegde suikers. Alle aanbevelingen hieronder passen dus bij jouw voorkeuren.';
  }
  if (glutenvrij) {
    return 'Goed nieuws — ons hele assortiment is glutenvrij. Alle aanbevelingen hieronder passen dus bij jouw voorkeuren.';
  }
  return undefined;
}

// ============================================================================
// Hoofdfunctie — entry point voor HealthConsultation.tsx
// ============================================================================

export function runConsultation(input: ConsultationInput): ConsultationResult {
  // 1. Verzamel kandidaten via regel-lookup
  const { rules, candidates } = collectCandidates(input);

  // 2. Dieet-substitutie: vervang/verwijder producten op basis van dieet
  const dietApplied = applyDietSubstitution(candidates, input.diets);

  // 3. Prioriteer op leefstijl (en behoud volgorde-prioriteit binnen mapping)
  const prioritized = applyLifestyleModifier(dietApplied, input.lifestyle, input.goals);

  // 4. Dedupliceer en pak top 3
  const top3 = dedupeAndTake(prioritized, 3);

  // 5. Stel samenvatting (+ leefstijl-addendum) en disclaimer samen
  const baseSummary = composeSummary(rules);
  const lifestyleAddendum = composeLifestyleAddendum(input.lifestyle);
  const summary = lifestyleAddendum
    ? `${baseSummary} ${lifestyleAddendum}`
    : baseSummary;
  const medicalDisclaimer = pickDisclaimer(rules);
  // Leefstijl-tip wordt contextueel gekozen uit de library op basis van
  // stap 3 (dieet) + stap 4 (leefstijl) — niet uit de mapping zelf.
  const lifestyleTip = selectLifestyleTip(input.goals, input.diets, input.lifestyle)
    ?? pickLifestyleTip(rules);
  const dietNote = composeDietNote(input.diets);

  return {
    summary,
    products: top3,
    medicalDisclaimer,
    lifestyleTip,
    dietNote,
    sourceMappingIds: rules.map((r) => r.id),
  };
}

// ============================================================================
// Stap 1 — Kandidaten verzamelen op basis van keuzes
// ============================================================================

function collectCandidates(input: ConsultationInput): {
  rules: MappingRule[];
  candidates: MappingProduct[];
} {
  const { goals, answers } = input;

  // Geval 1: één doel → één enkele-doel mapping
  if (goals.length === 1) {
    const goal = goals[0];
    const answer = answers[goal];
    if (!answer) return { rules: [], candidates: [] };

    const rule = findSingleGoalRule(goal, answer);
    if (!rule) return { rules: [], candidates: [] };

    return { rules: [rule], candidates: [...rule.products] };
  }

  // Geval 2: twee doelen → eerst zoeken naar gecureerde paar-mapping
  if (goals.length === 2) {
    const [goalA, goalB] = goals;
    const pairRule = findDoubleGoalRule(goalA, goalB);

    if (pairRule && pairRule.products.length > 0) {
      return { rules: [pairRule], candidates: [...pairRule.products] };
    }

    // Geval 2b: geen gecureerde paar-mapping → combineer individuele mappings
    const answerA = answers[goalA];
    const answerB = answers[goalB];
    if (!answerA || !answerB) return { rules: [], candidates: [] };

    const { ruleA, ruleB } = findFallbackPair(goalA, answerA, goalB, answerB);
    const used: MappingRule[] = [];
    const cands: MappingProduct[] = [];
    if (ruleA) { used.push(ruleA); cands.push(...ruleA.products); }
    if (ruleB) { used.push(ruleB); cands.push(...ruleB.products); }
    return { rules: used, candidates: cands };
  }

  return { rules: [], candidates: [] };
}

// ============================================================================
// Stap 2 — Dieet-substitutie (FASE 3 — afgestemd met Stefan, 18 mei 2026)
// ============================================================================
//
// Werking: elk product heeft optionele INTERNE `dietTags` (bv. ['whey',
// 'lactose']) — gecureerd in consultation-rules.ts, NIET uit Shopify.
// Per gekozen dieet bepaalt DIET_EXCLUDES welke tags conflicteren.
//
// Bij een conflict:
//   - is er een `dietAlternatives` entry voor dat dieet → product wordt
//     VERVANGEN door dat plantaardige alternatief (priority blijft behouden)
//   - geen alternatief → product valt weg
//
// Zo ziet een vegan-klant echt andere producten dan een standaard-klant,
// en blijft de top-3 zo veel mogelijk gevuld.
// ============================================================================

const DIET_EXCLUDES: Record<DietKey, string[]> = {
  vegan:       ['whey', 'vis', 'visolie', 'gelatine', 'schaaldier', 'ei', 'melk', 'lactose'],
  vegetarisch: ['vis', 'visolie', 'gelatine', 'schaaldier'],
  lactosevrij: ['whey', 'lactose', 'melk'],
  glutenvrij:  ['gluten'],
  suikervrij:  ['toegevoegde-suiker'],
  geen:        [],
};

/** Bouwt de set uitgesloten tags voor de gekozen dieten. */
function buildExcludedTags(diets: DietKey[]): Set<string> {
  const excluded = new Set<string>();
  for (const diet of diets) {
    for (const t of DIET_EXCLUDES[diet] ?? []) excluded.add(t);
  }
  return excluded;
}

/** True als dit product (via zijn dietTags) botst met de uitgesloten tags. */
function conflictsWithDiet(p: MappingProduct, excluded: Set<string>): boolean {
  if (!p.dietTags || p.dietTags.length === 0) return false;
  return p.dietTags.some((tag) => excluded.has(tag));
}

/**
 * Vervang of verwijder producten op basis van het gekozen dieet.
 * - geen dieet / 'geen' gekozen → ongemoeid laten
 * - conflict + alternatief voor een conflicterend dieet → omruilen
 * - conflict + geen alternatief → weglaten
 */
function applyDietSubstitution(
  products: MappingProduct[],
  diets: DietKey[],
): MappingProduct[] {
  const active = diets.filter((d) => d !== 'geen');
  if (active.length === 0) return products;

  const excluded = buildExcludedTags(active);
  const result: MappingProduct[] = [];

  for (const p of products) {
    if (!conflictsWithDiet(p, excluded)) {
      result.push(p);
      continue;
    }

    // Conflict — zoek een alternatief voor één van de gekozen dieten dat
    // dit product daadwerkelijk uitsluit.
    let replacement: DietAlternativeProduct | undefined;
    for (const diet of active) {
      const conflictsThisDiet = (p.dietTags ?? []).some((tag) =>
        (DIET_EXCLUDES[diet] ?? []).includes(tag),
      );
      if (conflictsThisDiet && p.dietAlternatives?.[diet]) {
        replacement = p.dietAlternatives[diet];
        break;
      }
    }

    if (replacement) {
      // Promoveer het alternatief tot volwaardig MappingProduct, met de
      // priority van het origineel. Geen dietTags → wordt niet nóg eens
      // gesubstitueerd (onze alternatieven zijn allemaal plantaardig).
      result.push({
        handle: replacement.handle,
        priority: p.priority,
        tagline: replacement.tagline,
        productName: replacement.productName,
        price: replacement.price,
        ingredient: replacement.ingredient,
        explanation: replacement.explanation,
      });
    }
    // Geen alternatief → product valt stilzwijgend weg.
  }

  return result;
}

// ============================================================================
// Stap 3 — Leefstijl-modifier (FASE 3 — afgestemd, 19 mei 2026)
// ============================================================================
//
// Een 'NEE' op een leefstijl-vraag verschuift de prioriteit van producten
// die specifiek bij die situatie passen. De gecureerde mapping-volgorde
// (door Stefan/fysio bepaald) blijft het uitgangspunt — leefstijl stuurt
// bij, het gooit niet willekeurig om.
//
// LIFESTYLE_BOOST = 1.5 per matchende conditie, STAPELBAAR. Reden voor
// deze sterkte: priorities zijn 1..5 integers. Met de oude 0.3 bleef de
// top-3 vrijwel altijd identiek (te zwak). Met 1.5:
//   - 1 matchende conditie  → product schuift ~1,5 plek omhoog
//   - 2 matchende condities → -3.0, een sterk-relevant #4/#5 product
//     kan dan écht in de top-3 komen (zichtbaar effect, gewenst)
// Een product moet wél daadwerkelijk relevant zijn voor de leefstijl-
// conditie (keyword-match op het werkzame ingrediënt) om te stijgen.
//
// Condities:
//   nutrition=false (eet onvoldoende groente/fruit)
//     → basis-vitamines & mineralen krijgen voorrang
//   stress=true (voelt zich vaak gestrest)
//     → adaptogenen / kalmerende ingrediënten krijgen voorrang
//   sleep=false (slaapt < 7u)
//     → slaap- & herstel-ondersteunende ingrediënten krijgen voorrang
//
// LET OP: composeLifestyleAddendum() hieronder beschrijft in tekst exact
// wat deze modifier doet — die twee MOETEN consistent blijven, anders
// "praat het advies tegen zichzelf".
// ============================================================================

const LIFESTYLE_BOOST = 1.5;

const NUTRITION_RE = /vitamine|multivit|mineraal|b-complex|b6|b12|ijzer|zink|magnesium|omega|d3|d-3|vitamine c/;
const STRESS_RE = /ashwagandha|rhodiola|magnesium|l-theanine|theanine|valeriaan|adaptogeen|b-complex/;
const SLEEP_RE = /magnesium|melatonine|5-htp|valeriaan|ashwagandha|l-theanine|theanine|slaap/;

interface ScoredProduct extends MappingProduct {
  /** Effectieve sorteer-score: lager = hoger geprioriteerd */
  effectivePriority: number;
}

function applyLifestyleModifier(
  products: MappingProduct[],
  lifestyle: LifestyleAnswers,
  _goals: GoalKey[],
): ScoredProduct[] {
  return products
    .map((p, index) => {
      let boost = 0; // negatieve boost = hoger in lijst
      const ing = p.ingredient.toLowerCase();

      if (lifestyle.nutrition === false && NUTRITION_RE.test(ing)) boost -= LIFESTYLE_BOOST;
      if (lifestyle.stress === true && STRESS_RE.test(ing)) boost -= LIFESTYLE_BOOST;
      if (lifestyle.sleep === false && SLEEP_RE.test(ing)) boost -= LIFESTYLE_BOOST;

      return {
        product: { ...p, effectivePriority: p.priority + boost } as ScoredProduct,
        index,
      };
    })
    // Stabiele sort: bij gelijke effectivePriority blijft de gecureerde
    // mapping-volgorde behouden (curatie-intentie respecteren).
    .sort((a, b) =>
      a.product.effectivePriority - b.product.effectivePriority || a.index - b.index,
    )
    .map((x) => x.product);
}

// ============================================================================
// Stap 4 — Dedup + take top N
// ============================================================================

function dedupeAndTake(products: ScoredProduct[], n: number): MappingProduct[] {
  const seen = new Set<string>();
  const result: MappingProduct[] = [];
  for (const p of products) {
    if (seen.has(p.handle)) continue;
    seen.add(p.handle);
    // Strip effectivePriority — niet nodig voor consument
    const { effectivePriority: _, ...rest } = p;
    void _;
    result.push(rest);
    if (result.length >= n) break;
  }
  return result;
}

// ============================================================================
// Stap 5 — Samenvatting & disclaimer samenstellen
// ============================================================================

function composeSummary(rules: MappingRule[]): string {
  if (rules.length === 0) {
    return 'Op basis van je antwoorden hebben we een aantal passende supplementen geselecteerd.';
  }
  if (rules.length === 1) return rules[0].summary || '';

  // Twee fallback-mappings samenvoegen — voor nu simpel:
  // gebruik eerste samenvatting + verwijzing naar tweede doel.
  return rules.map((r) => r.summary).filter(Boolean).join(' ');
}

/**
 * Genereert een korte leefstijl-zin die ACHTER de mapping-samenvatting komt.
 * Beschrijft in mensentaal exact wat applyLifestyleModifier doet — die twee
 * moeten consistent blijven (anders "praat het advies tegen zichzelf").
 *
 * - Eén of meer leefstijl-knelpunten → benoemt ze + welke ingrediënten
 *   daarom voorrang krijgen
 * - Alle drie expliciet "goed" → korte bevestiging
 * - Niets beantwoord (null) → undefined (geen addendum)
 */
function composeLifestyleAddendum(ls: LifestyleAnswers): string | undefined {
  const factors: string[] = [];
  const focusParts: string[] = [];
  if (ls.nutrition === false) {
    factors.push('minder gevarieerde voeding');
    focusParts.push('basis-vitamines en -mineralen');
  }
  if (ls.stress === true) {
    factors.push('stress');
    focusParts.push('kalmerende, stress-regulerende ingrediënten');
  }
  if (ls.sleep === false) {
    factors.push('te weinig slaap');
    focusParts.push('slaap- en herstelondersteuning');
  }

  if (factors.length === 0) {
    if (ls.nutrition === true && ls.stress === false && ls.sleep === true) {
      return 'Je leefstijl-basis is sterk — dit advies is daar een gerichte aanvulling op.';
    }
    return undefined;
  }

  const joinNl = (arr: string[]) =>
    arr.length === 1
      ? arr[0]
      : `${arr.slice(0, -1).join(', ')} en ${arr[arr.length - 1]}`;

  return `Op basis van je leefstijl — ${joinNl(factors)} — geven we ${joinNl(focusParts)} in dit advies extra voorrang.`;
}

function pickDisclaimer(rules: MappingRule[]): string | undefined {
  // Eerste gevonden disclaimer wint
  for (const r of rules) {
    if (r.medicalDisclaimer) return r.medicalDisclaimer;
  }
  return undefined;
}

function pickLifestyleTip(rules: MappingRule[]): string | undefined {
  for (const r of rules) {
    if (r.lifestyleTip) return r.lifestyleTip;
  }
  return undefined;
}

// ============================================================================
// Stap 6 — AI-fallback (FASE 4 — placeholder, later invullen)
// ============================================================================
//
// Wanneer de klant stap 5 (vrije tekst) invult, willen we de basis-output
// van runConsultation() doorgeven aan een AI-call die mag personaliseren.
//
// TODO (Claude): implementeren via /api/openai endpoint:
//   - input: ConsultationInput + ConsultationResult (de baseline)
//   - prompt: "Hier is de basis-aanbeveling op basis van keuzes X. Klant
//     vermeldde aanvullend: [stap 5 tekst]. Pas waar nodig de producten en/of
//     uitleg-teksten aan. Antwoord in JSON volgens ConsultationResult-schema."
//   - fallback: bij API-fout gebruik gewoon de baseline (geen blocker)
// ============================================================================

export async function runConsultationWithAI(
  input: ConsultationInput,
): Promise<ConsultationResult> {
  // Bereken eerst de regel-baseline
  const baseline = runConsultation(input);

  // Geen vrije tekst → direct baseline
  if (!input.freeText.trim()) return baseline;

  // TODO Fase 4: hier komt de OpenAI-call
  // Voor nu: log dat we zouden personaliseren, retourneer baseline
  console.info('[Consultation] Stap 5 ingevuld — AI-personalisatie volgt in fase 4');
  return baseline;
}
