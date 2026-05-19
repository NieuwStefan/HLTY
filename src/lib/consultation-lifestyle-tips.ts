// ============================================================================
// Productadvisor — Lifestyle-tip library + selectie-engine
// ============================================================================
//
// Op de resultaatpagina toont de adviseur 1 leefstijl-tip onder de producten.
// Deze tip komt NIET uit de mapping zelf — hij wordt dynamisch gekozen op
// basis van wat de klant invulde in stap 3 (dieet) en stap 4 (leefstijl).
//
// Werking:
//   - Elke tip heeft optionele filters: doel(en), leefstijl-condities, dieet
//   - De engine filtert alle tips die matchen
//   - Tip met de hoogste priority wint
//
// HLTY-tone: concreet, wetenschappelijk-onderbouwd, geen genees-claims,
// geen marketing-vaagheid. Een tip moet *extra* waarde geven naast de
// supplementen — vaak iets dat goedkoper of effectiever werkt dan suppletie.
// ============================================================================

import type { GoalKey } from './consultation-rules';
import type { DietKey, LifestyleAnswers } from './consultation-engine';

export interface LifestyleTip {
  id: string;
  text: string;
  /** Tip is alleen geldig als ten minste één van deze doelen geselecteerd is.
   *  Leeg = altijd geldig. */
  whenGoals?: GoalKey[];
  /** Tip is alleen geldig als alle gespecificeerde leefstijl-antwoorden matchen.
   *  Leeg = altijd geldig. nutrition=false betekent "eet niet voldoende groente/fruit". */
  whenLifestyle?: Partial<{ nutrition: boolean; stress: boolean; sleep: boolean }>;
  /** Tip is alleen geldig als ten minste één van deze dieten geselecteerd is.
   *  Leeg = altijd geldig. */
  whenDiets?: DietKey[];
  /** Hoger = preferred bij meerdere matches. Conventie:
   *  100 = drie-conditie match (goal + lifestyle + diet), zeer specifiek
   *   80 = twee-conditie match
   *   60 = één leefstijl-conditie + algemeen
   *   40 = doel-specifiek alleen
   *   20 = algemeen (laatste fallback) */
  priority: number;
}

// ============================================================================
// Tip-library
// ============================================================================

export const LIFESTYLE_TIPS: LifestyleTip[] = [
  // -----------------------------------------------------------------------
  // VOEDING (nutrition=false → "eet niet voldoende groente/fruit")
  // -----------------------------------------------------------------------
  {
    id: 'nutrition_general',
    text: 'Voeg dagelijks 2 vuisten groente en 1 vuist fruit toe — supplementen werken vele malen effectiever op een goede voedingsbasis dan als compensatie voor wat ontbreekt.',
    whenLifestyle: { nutrition: false },
    priority: 60,
  },
  {
    id: 'nutrition_plus_stress',
    text: 'Stress put B-vitamines en magnesium snel uit, en suikerpieken versterken stressreacties. Bouw 2 vaste eet-momenten per dag op met groene bladgroenten en peulvruchten — fundamenteler effect dan welke adaptogeen dan ook.',
    whenLifestyle: { nutrition: false, stress: true },
    priority: 80,
  },
  {
    id: 'nutrition_plus_sleep',
    text: 'Begin met één simpele verandering: een handvol ongezouten noten en een glas water bij het ontbijt. Stabiele bloedsuiker en magnesium uit noten ondersteunen zowel je energie overdag als je slaap \'s nachts.',
    whenLifestyle: { nutrition: false, sleep: false },
    priority: 80,
  },
  {
    id: 'nutrition_plus_energy_goal',
    text: 'Verlaag toegevoegde suikers — vooral in dranken — voor stabielere energie zonder dips. De combinatie van eiwit, vezels en gezonde vetten bij elke maaltijd is fundamenteler dan welke energie-supplement dan ook.',
    whenLifestyle: { nutrition: false },
    whenGoals: ['energie'],
    priority: 80,
  },

  // -----------------------------------------------------------------------
  // STRESS (stress=true → "voelt zich vaak gestrest of opgejaagd")
  // -----------------------------------------------------------------------
  {
    id: 'stress_general',
    text: 'Bouw dagelijks een \'no-input\' moment in van 10-15 minuten — een wandeling buiten zonder telefoon, of een ademoefening — om je parasympatische zenuwstelsel te activeren. Werkt op de oorzaak, niet alleen op symptomen.',
    whenLifestyle: { stress: true },
    priority: 60,
  },
  {
    id: 'stress_plus_sleep',
    text: 'De 4-7-8 ademoefening (4 sec inademen, 7 vasthouden, 8 uitademen) voor het slapen activeert je rustsysteem direct. Werkt vooral goed als piekergedachten je wakker houden.',
    whenLifestyle: { stress: true, sleep: false },
    priority: 80,
  },
  {
    id: 'stress_plus_focus_goal',
    text: 'Reduceer cafeïne na 14:00 uur — voor mensen met chronische stress versterkt cafeïne \'s middags de cortisolpiek, wat focus juist verstoort en doorslapen lastiger maakt.',
    whenLifestyle: { stress: true },
    whenGoals: ['focus'],
    priority: 80,
  },
  {
    id: 'stress_plus_resistance_goal',
    text: 'Chronische stress onderdrukt je immuunsysteem direct via cortisol. Iedere ademoefening, wandeling of meditatie heeft een meetbaar positief effect op je weerstand — meer dan welke immuunbooster dan ook.',
    whenLifestyle: { stress: true },
    whenGoals: ['weerstand'],
    priority: 80,
  },

  // -----------------------------------------------------------------------
  // SLAAP (sleep=false → "minder dan 7 uur per nacht")
  // -----------------------------------------------------------------------
  {
    id: 'sleep_general',
    text: 'Vaste slaaptijden zijn voor je interne klok belangrijker dan totale duur — ga elke dag binnen 30 minuten op hetzelfde tijdstip naar bed, óók in het weekend. Een ritueel werkt sterker dan welke supplement dan ook.',
    whenLifestyle: { sleep: false },
    priority: 60,
  },
  {
    id: 'sleep_plus_energy_goal',
    text: 'Eén nacht 5 uur slaap heeft hetzelfde effect op je cognitieve prestaties als 0,1% alcohol in je bloed. Supplementen kunnen niet compenseren wat te weinig slaap kapot maakt — slaap is de eerste interventie.',
    whenLifestyle: { sleep: false },
    whenGoals: ['energie'],
    priority: 80,
  },
  {
    id: 'sleep_plus_muscle_goal',
    text: 'Spieren herstellen niet tijdens training maar \'s nachts — vooral in de eerste 4 uur. Onder 7 uur slaap zie je 30-60% minder spierwinst, ongeacht hoeveel je traint of eet.',
    whenLifestyle: { sleep: false },
    whenGoals: ['spieren'],
    priority: 80,
  },
  {
    id: 'sleep_plus_resistance_goal',
    text: 'Onderzoek toont dat onder 7 uur slapen het infectierisico met 3-4 keer verhoogt. Slaap is de meest onderschatte immuunbooster die er is — meer impact dan welke vitamine dan ook.',
    whenLifestyle: { sleep: false },
    whenGoals: ['weerstand'],
    priority: 80,
  },
  {
    id: 'sleep_plus_hormones_goal',
    text: 'Slaaptekort verstoort testosteron, oestrogeen en groeihormoon binnen één week meetbaar. Hormonale balans zonder voldoende slaap is bouwen op zand.',
    whenLifestyle: { sleep: false },
    whenGoals: ['hormonen'],
    priority: 80,
  },

  // -----------------------------------------------------------------------
  // DIEET-SPECIFIEK (vegan / vegetarisch / lactosevrij)
  // -----------------------------------------------------------------------
  {
    id: 'vegan_b12',
    text: 'Bij plantaardig eten is B12-suppletie altijd nodig — zonder uitzondering. IJzer uit planten neemt het lichaam beter op met vitamine C erbij; combineer linzen of spinazie met paprika of citrus in dezelfde maaltijd.',
    whenDiets: ['vegan'],
    whenGoals: ['energie', 'spieren', 'focus'],
    priority: 80,
  },
  {
    id: 'vegan_protein',
    text: 'Streef bij plantaardig eten naar 1,4-1,8 g eiwit per kg lichaamsgewicht uit een mix van peulvruchten, soja, granen en noten. De diversiteit zorgt voor het volledige aminozuurprofiel — geen enkele bron is op zichzelf compleet.',
    whenDiets: ['vegan'],
    whenGoals: ['spieren'],
    priority: 100,
  },
  {
    id: 'vegan_essentials',
    text: 'Vier voedingsstoffen verdienen bij plantaardig eten extra aandacht: B12, vitamine D, omega-3 (DHA/EPA uit algen) en zink. Plantaardige diëten dekken vaak veel goed, maar deze vier verdienen suppletie of bewuste keuzes.',
    whenDiets: ['vegan'],
    priority: 60,
  },
  {
    id: 'vegetarian_protein',
    text: 'Combineer peulvruchten met granen (linzen + rijst, hummus + brood) in dezelfde maaltijd voor complete eiwitten. Eieren en zuivel zijn aanvulling, geen vervanging van die basis.',
    whenDiets: ['vegetarisch'],
    whenGoals: ['spieren'],
    priority: 80,
  },
  {
    id: 'lactose_whey',
    text: 'Whey isolaat bevat tot 90% minder lactose dan whey concentraat en is vaak goed verteerbaar bij milde lactose-intolerantie. Plantaardige alternatieven (erwt, fava bean, hennep) leveren vergelijkbare eiwitkwaliteit.',
    whenDiets: ['lactosevrij'],
    whenGoals: ['spieren'],
    priority: 80,
  },

  // -----------------------------------------------------------------------
  // DOEL-SPECIFIEK (fallback wanneer geen specifieke leefstijl-issue)
  // -----------------------------------------------------------------------
  {
    id: 'goal_sleep',
    text: 'Bouw avondrituelen op vaste tijden — je hersenen koppelen die signalen aan slaap. Een ritueel werkt sterker dan welke supplementatie dan ook en duurt 2-3 weken voor het inslijt.',
    whenGoals: ['slaap'],
    priority: 40,
  },
  {
    id: 'goal_heart',
    text: '30 minuten matig bewegen per dag (wandelen, fietsen, zwemmen) heeft een vergelijkbaar effect op je hart als de meeste cardiovasculaire supplementen. Beweging is de basis, suppletie de aanvulling.',
    whenGoals: ['hart'],
    priority: 40,
  },
  {
    id: 'goal_focus',
    text: 'Drink je eerste koffie 90-120 minuten na het opstaan. Direct na het wakker worden onderdrukt cafeïne het natuurlijke cortisol dat je alertheid geeft — de boost werkt dan juist korter en zwakker.',
    whenGoals: ['focus'],
    priority: 40,
  },
  {
    id: 'goal_joint',
    text: 'Krachttraining 2x per week versterkt het spierkorset rondom je gewrichten meer dan suppletie. Belasting (niet vermijden) is wat kraakbeen sterk houdt — bouw rustig op met begeleiding.',
    whenGoals: ['gewricht'],
    priority: 40,
  },
  {
    id: 'goal_resistance',
    text: '8 uur slaap heeft een groter effect op weerstand dan welke vitamine dan ook. Bouw daarnaast aan een gevarieerde darmflora via gefermenteerde voeding zoals yoghurt, zuurkool of kefir.',
    whenGoals: ['weerstand'],
    priority: 40,
  },
  {
    id: 'goal_hormones',
    text: 'Krachttraining 2-3x per week ondersteunt zowel mannelijk testosteron als vrouwelijke hormonale balans aantoonbaar. Geen supplement evenaart dit effect — dit is fundament, suppletie is verfijning.',
    whenGoals: ['hormonen'],
    priority: 40,
  },
  {
    id: 'goal_stress',
    text: 'Adaptogenen werken pas merkbaar na 2-4 weken consistente inname. Combineer met dagelijkse beweging en consistente bedtijden voor sneller resultaat — de basis bepaalt of suppletie werkt.',
    whenGoals: ['stress'],
    priority: 40,
  },
  {
    id: 'goal_energy',
    text: 'Hydratie wordt onderschat — zelfs 2% dehydratie verlaagt je cognitieve en fysieke prestaties merkbaar. Drink ongeveer 30 ml per kg lichaamsgewicht per dag, meer bij sport of warm weer.',
    whenGoals: ['energie'],
    priority: 40,
  },
  {
    id: 'goal_muscle',
    text: 'Eiwit-timing is minder belangrijk dan totaal per dag — streef naar 1,6-2,0 g per kg lichaamsgewicht, verspreid over 3-4 maaltijden voor optimale spiergroei. Consistentie beats perfectie.',
    whenGoals: ['spieren'],
    priority: 40,
  },

  // -----------------------------------------------------------------------
  // ALGEMENE FALLBACK — wanneer geen specifieke match
  // -----------------------------------------------------------------------
  {
    id: 'general_foundation',
    text: 'Supplementen werken het beste op een sterke leefstijl-basis: voldoende slaap, dagelijkse beweging en gevarieerde voeding. Beschouw ze als gerichte ondersteuning, niet als vervanging.',
    priority: 20,
  },
  {
    id: 'general_lifestyle_solid',
    text: 'Je leefstijl-fundament staat — supplementen zijn dan ook echt aanvulling, geen compensatie. Geef ze 4-6 weken consistent om effect te merken; minder snel is normaal.',
    whenLifestyle: { nutrition: true, stress: false, sleep: true },
    priority: 50,
  },
];

// ============================================================================
// Selectie-engine
// ============================================================================

function lifestyleMatches(
  required: Partial<{ nutrition: boolean; stress: boolean; sleep: boolean }> | undefined,
  actual: LifestyleAnswers,
): boolean {
  if (!required) return true;
  for (const [key, expected] of Object.entries(required)) {
    const value = actual[key as keyof LifestyleAnswers];
    // null = not answered; treat als geen-match wanneer een specifieke waarde vereist is
    if (value !== expected) return false;
  }
  return true;
}

/**
 * Selecteer de meest passende leefstijl-tip op basis van:
 *  - geselecteerde doel(en)
 *  - dieet-keuzes (multi-select)
 *  - leefstijl-antwoorden (nutrition / stress / sleep)
 *
 * Strategie: filter alle tips die alle hun condities matchen, kies hoogste priority.
 * Bij gelijke priority: eerste in de library-volgorde.
 */
export function selectLifestyleTip(
  goals: GoalKey[],
  diets: DietKey[],
  lifestyle: LifestyleAnswers,
): string | undefined {
  const matching = LIFESTYLE_TIPS.filter((tip) => {
    // Goal-filter
    if (tip.whenGoals && tip.whenGoals.length > 0) {
      if (!tip.whenGoals.some((g) => goals.includes(g))) return false;
    }
    // Diet-filter
    if (tip.whenDiets && tip.whenDiets.length > 0) {
      if (!tip.whenDiets.some((d) => diets.includes(d))) return false;
    }
    // Lifestyle-filter
    if (!lifestyleMatches(tip.whenLifestyle, lifestyle)) return false;
    return true;
  });

  if (matching.length === 0) return undefined;

  matching.sort((a, b) => b.priority - a.priority);
  return matching[0].text;
}
