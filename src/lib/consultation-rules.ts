// ============================================================================
// Productadvisor — Mapping-regels (Optie C hybride architectuur)
// ============================================================================
//
// Dit bestand bevat de 37 curated mappings die het hart vormen van de
// HLTY Consultation: 27 enkele-doel + 10 dubbele-doel.
//
// Wanneer een klant stap 5 (vrije tekst) LEEG laat → de engine kiest één
// van deze mappings en retourneert direct het resultaat (geen AI-call).
// Wanneer stap 5 wél is ingevuld → AI-fallback gebruikt deze mapping als
// basis maar mag personaliseren.
//
// Alle 37 entries staan hieronder als PLACEHOLDERS klaar — Stefan + fysio
// vullen ze in via docs/_productadvisor-mappings-template.md. Claude
// converteert de ingevulde template later naar deze structuur.
// ============================================================================

// ---------- Doel-keys (sluiten aan op HealthConsultation.tsx) ----------

export type GoalKey =
  | 'slaap' | 'energie' | 'spieren' | 'focus'
  | 'weerstand' | 'gewricht' | 'hart' | 'stress' | 'hormonen';

// ---------- Stap-2-antwoord-keys per doel ----------
// Elke goal heeft 3 mogelijke antwoorden (A1/A2/A3 zoals in mappings-doc).

export const STEP2_QUESTIONS: Record<GoalKey, { question: string; options: { key: string; label: string }[] }> = {
  slaap: {
    question: 'Wat speelt voor jou het meest?',
    options: [
      { key: 'inslapen',         label: 'Moeite met inslapen' },
      { key: 'nachts_wakker',    label: "Vaak 's nachts wakker" },
      { key: 'niet_uitgerust',   label: 'Niet uitgerust opstaan' },
    ],
  },
  energie: {
    question: 'Wanneer ervaar je het meest vermoeidheid?',
    options: [
      { key: 'hele_dag',         label: 'De hele dag, structureel' },
      { key: 'middag_na_werk',   label: "'s Middags / na werk" },
      { key: 'mentale_inspanning', label: 'Bij mentale inspanning' },
    ],
  },
  spieren: {
    question: 'Wat is je hoofdfocus?',
    options: [
      { key: 'spiermassa',       label: 'Spiermassa opbouwen' },
      { key: 'uithouding',       label: 'Uithoudingsvermogen & herstel' },
      { key: 'algemeen',         label: 'Algemene fitheid' },
    ],
  },
  focus: {
    question: 'In welke situatie het meest?',
    options: [
      { key: 'werk_studie',      label: 'Werk of studie' },
      { key: 'onder_stress',     label: 'Onder stress' },
      { key: 'algemeen_moe',     label: 'Algemene mentale vermoeidheid' },
    ],
  },
  weerstand: {
    question: 'Wat past het beste bij jou?',
    options: [
      { key: 'algemeen',         label: 'Algemene ondersteuning' },
      { key: 'vaak_verkouden',   label: 'Vaak verkouden' },
      { key: 'seizoen',          label: 'Seizoens-ondersteuning' },
    ],
  },
  gewricht: {
    question: 'Waar zit de klacht voornamelijk?',
    options: [
      { key: 'knieen',           label: 'Knieën' },
      { key: 'rug_nek',          label: 'Rug / nek' },
      { key: 'schouders_meerdere', label: 'Schouders / meerdere plekken' },
    ],
  },
  hart: {
    question: 'Wat past het beste bij jouw situatie?',
    options: [
      { key: 'preventie',        label: 'Algemene preventie' },
      { key: 'verhoogd_risico',  label: 'Verhoogd risico' },
      { key: 'op_advies_arts',   label: 'Op advies van arts' },
    ],
  },
  stress: {
    question: 'Wat ervaar je vooral?',
    options: [
      { key: 'mentale_onrust',   label: 'Mentale onrust' },
      { key: 'lichamelijke_spanning', label: 'Lichamelijke spanning' },
      { key: 'slecht_slapen',    label: 'Slecht slapen door stress' },
    ],
  },
  hormonen: {
    question: 'Wat past het beste bij jou?',
    options: [
      { key: 'balans',           label: 'Algemene balans' },
      { key: 'energie_vitaliteit', label: 'Energie & vitaliteit' },
      { key: 'levensfase',       label: 'Specifieke levensfase' },
    ],
  },
};

// ---------- Dieet-keys (sluiten aan op HealthConsultation.tsx) ----------
// Gedefinieerd hier (niet in consultation-engine.ts) zodat MappingProduct
// dit type kan gebruiken zonder circulaire import. consultation-engine.ts
// re-exporteert DietKey voor backwards-compat.

export type DietKey =
  | 'vegan' | 'vegetarisch' | 'lactosevrij' | 'glutenvrij' | 'suikervrij' | 'geen';

// ============================================================================
// INTERNE DIEET-TAGS — bewust NIET uit Shopify
// ============================================================================
//
// `dietTags` op een product zijn handmatig gecureerd in dit bestand, los van
// Shopify's eigen tag-systeem. Reden: Stefan houdt niet altijd controle over
// Shopify-tags (Holland Pharma-sync kan ze overschrijven). Deze tags leven
// dus alleen in deze tool en zijn 100% onder onze controle.
//
// Bekende tag-waarden + welke dieten ze uitsluiten (zie DIET_EXCLUDES in
// consultation-engine.ts):
//   'vis'        → visolie / vis-collageen / visgelatine  (vegan, vegetarisch)
//   'schaaldier' → glucosamine uit krab/garnaal           (vegan, vegetarisch)
//   'gelatine'   → dierlijke softgel-coating               (vegan, vegetarisch)
//   'whey'       → wei-eiwit uit melk                       (vegan, lactosevrij)
//   'lactose'    → significante lactose                     (vegan, lactosevrij)
//   'gluten'     → glutenbevattend                          (glutenvrij)
// ============================================================================

// ---------- Mapping-data structures ----------

/**
 * Eén smaak/variant die als LOSSE Shopify-product bestaat (niet als
 * variant binnen één product). Wordt getoond als smaak-kiezer in de
 * productkaart. Generiek herbruikbaar voor dosering/grootte-keuze
 * (zie docs/_productadvisor-wishlist.md).
 */
export interface FlavorOption {
  /** Label in de dropdown, bv. "Vanilla Milk" */
  label: string;
  /** Shopify product-handle van deze specifieke smaak */
  handle: string;
}

/**
 * Vervangend product wanneer het hoofdproduct niet bij een dieet past.
 * Bevat dezelfde weergave-velden als MappingProduct (geen verdere nesting).
 */
export interface DietAlternativeProduct {
  handle: string;
  tagline: string;
  productName: string;
  price: string;
  ingredient: string;
  explanation: string;
}

/**
 * Eén product in een mapping — wordt vóór tonen op dieet vervangen/gefilterd
 * en geprioriteerd op leefstijl (in consultation-engine.ts).
 */
export interface MappingProduct {
  /** Shopify product handle (de URL-naam) — voor link + cart-koppeling */
  handle: string;
  /** Volgorde-prioriteit binnen deze mapping. 1 = hoogst. */
  priority: number;
  /** Korte HLTY-tagline, format "<Ingredient> — <Angle>" bv. "Magnesium — Spieren los" */
  tagline: string;
  /** Volledige Shopify-titel, bv. "Orthica Magnesium-400 120 Tabletten" */
  productName: string;
  /** Prijs zoals genoteerd door Stefan, bv. "€33,95". Display-only; live prijs komt van Shopify */
  price: string;
  /** Korte naam van het primaire werkzame ingrediënt (intern, voor leefstijl-matching) */
  ingredient: string;
  /** INTERNE dieet-tags (niet uit Shopify) — bv. ['whey', 'lactose'] */
  dietTags?: string[];
  /**
   * Per dieet een vervangend product. Wanneer een gekozen dieet dit product
   * uitsluit én er staat hier een alternatief voor dat dieet, ruilt de engine
   * het product om (met behoud van priority). Geen alternatief → product valt weg.
   */
  dietAlternatives?: Partial<Record<DietKey, DietAlternativeProduct>>;
  /**
   * Optioneel: smaak/variant-keuzes die als losse Shopify-producten bestaan.
   * Aanwezig → productkaart toont een smaak-kiezer; cart + "Bekijk product"
   * gebruiken de gekozen handle i.p.v. de standaard `handle`.
   */
  flavorOptions?: FlavorOption[];
  /** Gecombineerde uitleg (waarom + hoe) — komt onder productnaam op resultaatpagina */
  explanation: string;
}

/**
 * Een complete mapping — wordt geactiveerd bij een specifieke combinatie
 * van keuzes in stap 1 + stap 2.
 */
export interface MappingRule {
  /** Mensbare ID, bv. 'slaap_inslapen' of 'slaap_energie_paar' */
  id: string;
  /**
   * Welke doel(en) deze mapping activeren.
   * - Lengte 1 = enkele-doel mapping (27 stuks)
   * - Lengte 2 = dubbele-doel mapping voor één van de 10 logische paren
   */
  goals: GoalKey[];
  /**
   * Voor enkele-doel: één answer-key uit STEP2_QUESTIONS.
   * Voor dubbele-doel: leeg (mapping geldt voor alle antwoord-combinaties
   * van het paar; antwoorden beïnvloeden alleen filter/prioriteit via engine).
   */
  answers: Partial<Record<GoalKey, string>>;
  /** Korte introtekst boven de productlijst, in HLTY-tone */
  summary: string;
  /** 5–8 productkandidaten waaruit engine top 3 selecteert na filtering */
  products: MappingProduct[];
  /** Optionele medische disclaimer onderaan resultaatpagina */
  medicalDisclaimer?: string;
  /** Optionele leefstijl-tip naast de producten */
  lifestyleTip?: string;
}

// ============================================================================
// DEEL 1 — 27 enkele-doel mappings (placeholders — invullen via template doc)
// ============================================================================


export const SINGLE_GOAL_RULES: MappingRule[] = [
  {
    id: 'slaap_inslapen',
    goals: ['slaap'],
    answers: { slaap: 'inslapen' },
    summary: 'Bij moeite met inslapen pakken we twee fronten tegelijk aan: het zenuwstelsel kalmeren en de natuurlijke melatonine-productie ondersteunen. Deze combinatie helpt je hoofd tot rust te brengen zonder je suf te maken — geen vervanger van slaapmedicatie, wel een natuurlijke ondersteuning.',
    products: [
      {
        handle: 'fittergy-5-htp-100mg-griffonia-extract-60-vegetarische-capsules',
        priority: 1,
        tagline: '5-HTP — Melatonine basis',
        productName: 'Fittergy 5-HTP 100mg Griffonia Extract 60 caps',
        price: '€26,99',
        ingredient: '5-HTP',
        explanation: 'Directe bouwstof voor melatonine; helpt je lichaam zijn eigen slaaphormoon aanmaken zodat je sneller indommelt.',
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 2,
        tagline: 'Magnesium — Spieren los',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Ontspant spieren en zenuwstelsel, waardoor je makkelijker loslaat aan het einde van de dag.',
      },
      {
        handle: 'mattisson-l-theanine-200mg-sunphenon-60-vegetarische-capsules',
        priority: 3,
        tagline: 'L-Theanine — Hoofd stil',
        productName: 'Mattisson L-Theanine 200mg Sunphenon 60 caps',
        price: '€17,95',
        ingredient: 'L-Theanine',
        explanation: 'Kalmeert actieve gedachten zonder je suf te maken, ideaal als je hoofd \'s avonds maar door blijft draaien.',
      },
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 4,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Verlaagt het stresshormoon cortisol, zodat je lichaam en geest tot rust kunnen komen voor het slapen.',
      },
      {
        handle: 'mattisson-valeriaan-relax-complex-60-capsules',
        priority: 5,
        tagline: 'Valeriaan — Oud betrouwbaar',
        productName: 'Mattisson Valeriaan Relax Complex 60 caps',
        price: '€19,95',
        ingredient: 'Valeriaan',
        explanation: 'Kruidenextract dat al eeuwen gebruikt wordt om sneller in slaap te vallen.',
      },
    ],
  },
  {
    id: 'slaap_nachts_wakker',
    goals: ['slaap'],
    answers: { slaap: 'nachts_wakker' },
    summary: 'Wakker worden \'s nachts hangt vaak samen met verhoogd cortisol of magnesiumtekort dat de slaapcyclus verstoort. Deze producten ondersteunen een diepere, ononderbroken nachtrust en helpen je systeem \'s nachts te herstellen.',
    products: [
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 1,
        tagline: 'Magnesium — Spieren los',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Ondersteunt een diepere slaapcyclus en vermindert de kans op onrustig of onderbroken slapen.',
      },
      {
        handle: 'fittergy-5-htp-100mg-griffonia-extract-60-vegetarische-capsules',
        priority: 2,
        tagline: '5-HTP — Hormoonbalans',
        productName: 'Fittergy 5-HTP 100mg Griffonia Extract 60 caps',
        price: '€26,99',
        ingredient: '5-HTP',
        explanation: 'Voorloper van serotonine en melatonine, helpt de slaapkwaliteit gedurende de nacht stabiel te houden.',
      },
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 3,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Verlaagt het nachtelijk cortisol dat je stresssysteem actief houdt en je wakker doet liggen.',
      },
      {
        handle: 'orthica-tri-zink-25-60-capsules',
        priority: 4,
        tagline: 'Zink — Herstel nacht',
        productName: 'Orthica Tri-Zink-25 60 Vegacapsules',
        price: '€12,95',
        ingredient: 'Zink',
        explanation: 'Ondersteunt de aanmaak van slaapbevorderende neurotransmitters en draagt bij aan een rustiger, ononderbroken nachtritme.',
      },
      {
        handle: 'mattisson-valeriaan-relax-complex-60-capsules',
        priority: 5,
        tagline: 'Valeriaan — Oud betrouwbaar',
        productName: 'Mattisson Valeriaan Relax Complex 60 caps',
        price: '€19,95',
        ingredient: 'Valeriaan',
        explanation: 'Ondersteunt een rustigere doorslaap en vermindert nachtelijk ontwaken.',
      },
    ],
  },
  {
    id: 'slaap_niet_uitgerust',
    goals: ['slaap'],
    answers: { slaap: 'niet_uitgerust' },
    summary: 'Niet uitgerust opstaan wijst op slaap die kwalitatief tekortschiet, niet op te weinig uren. We combineren ingrediënten die de slaapdiepte ondersteunen met bouwstoffen die nachtelijk herstel mogelijk maken.',
    products: [
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 1,
        tagline: 'Magnesium — Spieren los',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Tekort aan magnesium verslechtert de slaapkwaliteit en diepte, wat je uitgeput doet ontwaken.',
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 2,
        tagline: 'Vitamine D3 — Slaapkwaliteit',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Een laag D3-gehalte is gelinkt aan oppervlakkige, niet-herstellende slaap.',
      },
      {
        handle: 'orthica-tri-zink-25-60-capsules',
        priority: 3,
        tagline: 'Zink — Herstel nacht',
        productName: 'Orthica Tri-Zink-25 60 Vegacapsules',
        price: '€12,95',
        ingredient: 'Zink',
        explanation: 'Ondersteunt het herstelproces tijdens de slaap en draagt bij aan een meer verkwikkende nachtrust.',
      },
      {
        handle: 'mattisson-l-theanine-200mg-sunphenon-60-vegetarische-capsules',
        priority: 4,
        tagline: 'L-Theanine — Hoofd stil',
        productName: 'Mattisson L-Theanine 200mg Sunphenon 60 caps',
        price: '€17,95',
        ingredient: 'L-Theanine',
        explanation: 'Bevordert rustiger hersenactiviteit tijdens de slaap, minder piekerend, dieper herstel.',
      },
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 5,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Chronische stress ondermijnt slaapkwaliteit; ashwagandha helpt het systeem \'s nachts echt te herstellen.',
      },
    ],
  },
  {
    id: 'energie_hele_dag',
    goals: ['energie'],
    answers: { energie: 'hele_dag' },
    summary: 'Structurele vermoeidheid heeft meestal meerdere oorzaken — vaak een combinatie van vitamine- en mineraaltekorten op celniveau. Deze selectie richt zich op de fundamenten: energieaanmaak, zuurstoftransport en mitochondriële functie.',
    products: [
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 1,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'B-vitamines zijn essentieel voor energieaanmaak op celniveau; bij tekort voel je je de hele dag futloos.',
      },
      {
        handle: 'mattisson-vegan-ijzer-bisglycinaat-28mg-90-vegetarische-capsules',
        priority: 2,
        tagline: 'IJzer — Zuurstof door',
        productName: 'Mattisson Vegan IJzer Bisglycinaat 28mg 90 caps',
        price: '€15,95',
        ingredient: 'IJzer',
        explanation: 'IJzertekort is een veelvoorkomende oorzaak van chronische vermoeidheid, zeker bij vrouwen.',
      },
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 3,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Ondersteunt de mitochondriën, de energiecentrales van je cellen, bij structurele diepe vermoeidheid.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 4,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Adaptogeen dat het lichaam helpt beter om te gaan met aanhoudende fysieke en mentale belasting.',
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 5,
        tagline: 'Vitamine D3 — Zon in tablet',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Tekort aan vitamine D is sterk gelinkt aan aanhoudende vermoeidheid, zeker in Nederland.',
      },
    ],
  },
  {
    id: 'energie_middag_na_werk',
    goals: ['energie'],
    answers: { energie: 'middag_na_werk' },
    summary: 'Een middag- of na-werk-dip wijst meestal op schommelende bloedsuiker, stress-uitputting of een trage mitochondriële respons. Deze combinatie geeft stabiele energie zonder de crash die je van koffie of suiker krijgt.',
    products: [
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 1,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt stabiele energieniveaus gedurende de dag en voorkomt de bekende middagdip.',
      },
      {
        handle: 'mattisson-l-theanine-200mg-sunphenon-60-vegetarische-capsules',
        priority: 2,
        tagline: 'L-Theanine + Cafeïne — Scherp & rustig',
        productName: 'Mattisson L-Theanine 200mg Sunphenon 60 caps',
        price: '€17,95',
        ingredient: 'L-Theanine + Cafeïne',
        explanation: 'Geeft een heldere, stabiele energieboost in de middag zonder zenuwachtigheid of crash. Combineer met koffie of thee.',
      },
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 3,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Helpt mentale en fysieke vermoeidheid na een werkdag te verminderen.',
      },
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 4,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Ondersteunt energieproductie op celniveau, waardoor het energieniveau stabieler blijft gedurende de dag.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 5,
        tagline: 'Magnesium — Spieren los',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Vermoeidheid en spierspanning na werk worden mede veroorzaakt door magnesiumtekort.',
      },
    ],
  },
  {
    id: 'energie_mentale_inspanning',
    goals: ['energie'],
    answers: { energie: 'mentale_inspanning' },
    summary: 'Mentale vermoeidheid heeft een andere oorzaak dan fysieke — hier gaat het om brandstof en neurotransmitterproductie in de hersenen. Deze producten voeden specifiek de cognitieve energiehuishouding.',
    products: [
      {
        handle: 'mattisson-l-theanine-200mg-sunphenon-60-vegetarische-capsules',
        priority: 1,
        tagline: 'L-Theanine + Cafeïne — Scherp & rustig',
        productName: 'Mattisson L-Theanine 200mg Sunphenon 60 caps',
        price: '€17,95',
        ingredient: 'L-Theanine + Cafeïne',
        explanation: 'Geeft heldere, stabiele mentale energie zonder de onrust van cafeïne alleen. Combineer met koffie of thee.',
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 2,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt de aanmaak van neurotransmitters en cognitieve energiehuishouding.',
      },
      {
        handle: 'arctic-blue-algenolie-dha-en-epa-90-softgels',
        priority: 3,
        tagline: 'Omega-3 (DHA) — Hersenbrandstof',
        productName: 'Arctic Blue Algenolie DHA en EPA 90 Softgels',
        price: '€29,90',
        ingredient: 'Omega-3 (DHA)',
        explanation: 'DHA ondersteunt hersenfunctie en houdt de mentale energie op peil bij intensief denkwerk.',
      },
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 4,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Vermindert mentale vermoeidheid en helpt focus en energie vasthouden bij cognitieve belasting.',
      },
      {
        handle: 'mattisson-vegan-ijzer-bisglycinaat-28mg-90-vegetarische-capsules',
        priority: 5,
        tagline: 'IJzer — Zuurstof door',
        productName: 'Mattisson Vegan IJzer Bisglycinaat 28mg 90 caps',
        price: '€15,95',
        ingredient: 'IJzer',
        explanation: 'IJzertekort treft het brein als eerste; zelfs lichte tekorten verlagen concentratie en mentale energie merkbaar.',
      },
    ],
  },
  {
    id: 'spieren_spiermassa',
    goals: ['spieren'],
    answers: { spieren: 'spiermassa' },
    summary: 'Spiermassa opbouwen vraagt drie dingen tegelijk: voldoende eiwit, een trigger voor spiergroei en hormonale ondersteuning. Deze stack levert de bouwstenen én de hormonale basis voor zichtbare progressie.',
    products: [
      {
        handle: 'vitakruid-creatine-monohydraat-gemicroniseerd-tot-200-mesh-450-gram',
        priority: 1,
        tagline: 'Creatine — Meer kracht',
        productName: 'Vitakruid Creatine Monohydraat Gemicroniseerd 450g',
        price: '€24,90',
        ingredient: 'Creatine',
        explanation: 'Verhoogt explosieve kracht en helpt spieren harder werken tijdens training, wat directe groei stimuleert.',
      },
      {
        handle: 'esn-designer-whey-vanilla-milk-908-gram',
        priority: 2,
        tagline: 'Whey proteïne — Bouwstenen',
        productName: 'ESN Designer Whey 908g (keuze uit smaken)',
        price: '€38,99–€39,99',
        ingredient: 'Whey proteïne',
        explanation: 'Levert snel opneembare eiwitten voor spierherstel en -opbouw direct na de training.',
        flavorOptions: [{ label: 'Vanilla Milk', handle: 'esn-designer-whey-vanilla-milk-908-gram' }, { label: 'Milk Chocolate', handle: 'esn-designer-whey-milk-chocolate-908-gram' }, { label: 'Straciatella', handle: 'esn-designer-whey-straciatella-908-gram' }, { label: 'Almond Coconut', handle: 'esn-designer-whey-almond-coconut-908-gram' }, { label: 'Dark Cookies & Cream', handle: 'esn-designer-whey-protein-dark-cookies-cream-908-gram' }, { label: 'White Chocolate Pistache', handle: 'esn-designer-whey-protein-white-chocolate-pistache-908-gram' }],
        dietTags: ['whey', 'lactose'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-protein-erwten-rijst-vanille-bio-500-gram', tagline: 'Plantaardige proteïne — Bouwstenen', productName: 'Mattisson Vegan Protein Erwten & Rijst Vanille Bio 500g', price: '€23,95', ingredient: 'Plantaardige proteïne', explanation: 'Biologische erwten- en rijstproteïne met 23 g eiwit per portie — compleet aminozuurprofiel, zonder zuivel of lactose.' },
          lactosevrij: { handle: 'mattisson-vegan-protein-erwten-rijst-vanille-bio-500-gram', tagline: 'Plantaardige proteïne — Bouwstenen', productName: 'Mattisson Vegan Protein Erwten & Rijst Vanille Bio 500g', price: '€23,95', ingredient: 'Plantaardige proteïne', explanation: 'Biologische erwten- en rijstproteïne met 23 g eiwit per portie — compleet aminozuurprofiel, zonder zuivel of lactose.' },
        },
      },
      {
        handle: 'mattisson-gefermenteerde-l-leucine-500mg-60-vegetarische-capsules',
        priority: 3,
        tagline: 'L-Leucine — Groei aan',
        productName: 'Mattisson Gefermenteerde L-Leucine 500mg 60 caps',
        price: '€18,95',
        ingredient: 'L-Leucine',
        explanation: 'Essentieel aminozuur dat de spiereiwitaanmaak activeert, de directe trigger voor spiergroei.',
      },
      {
        handle: 'orthica-tri-zink-25-60-capsules',
        priority: 4,
        tagline: 'Zink — Testosteron steun',
        productName: 'Orthica Tri-Zink-25 60 Vegacapsules',
        price: '€12,95',
        ingredient: 'Zink',
        explanation: 'Ondersteunt de aanmaak van testosteron, het hormoon dat centraal staat bij spiermassa opbouwen.',
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 5,
        tagline: 'Vitamine D3 — Spierfunctie',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Tekort remt spierkracht en herstel; een goede D3-status is de stille basis onder elke opbouwfase.',
      },
    ],
  },
  {
    id: 'spieren_uithouding',
    goals: ['spieren'],
    answers: { spieren: 'uithouding' },
    summary: 'Uithoudingsvermogen en herstel vragen om bufferende mineralen, eiwitten en zuurstoftransport. Met deze combinatie verleng je je trainingsduur en versnel je het herstel ertussenin.',
    products: [
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 1,
        tagline: 'Magnesium — Spierherstel',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Vermindert spierkrampen en versnelt herstel na inspanning, essentieel bij herhaalde duurbelasting.',
      },
      {
        handle: 'esn-designer-whey-vanilla-milk-908-gram',
        priority: 2,
        tagline: 'Whey proteïne — Bouwstenen',
        productName: 'ESN Designer Whey 908g (keuze uit smaken)',
        price: '€38,99–€39,99',
        ingredient: 'Whey proteïne',
        explanation: 'Levert eiwitten voor spierherstel na langdurige inspanning.',
        flavorOptions: [{ label: 'Vanilla Milk', handle: 'esn-designer-whey-vanilla-milk-908-gram' }, { label: 'Milk Chocolate', handle: 'esn-designer-whey-milk-chocolate-908-gram' }, { label: 'Straciatella', handle: 'esn-designer-whey-straciatella-908-gram' }, { label: 'Almond Coconut', handle: 'esn-designer-whey-almond-coconut-908-gram' }, { label: 'Dark Cookies & Cream', handle: 'esn-designer-whey-protein-dark-cookies-cream-908-gram' }, { label: 'White Chocolate Pistache', handle: 'esn-designer-whey-protein-white-chocolate-pistache-908-gram' }],
        dietTags: ['whey', 'lactose'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-protein-erwten-rijst-vanille-bio-500-gram', tagline: 'Plantaardige proteïne — Bouwstenen', productName: 'Mattisson Vegan Protein Erwten & Rijst Vanille Bio 500g', price: '€23,95', ingredient: 'Plantaardige proteïne', explanation: 'Biologische erwten- en rijstproteïne met 23 g eiwit per portie — compleet aminozuurprofiel, zonder zuivel of lactose.' },
          lactosevrij: { handle: 'mattisson-vegan-protein-erwten-rijst-vanille-bio-500-gram', tagline: 'Plantaardige proteïne — Bouwstenen', productName: 'Mattisson Vegan Protein Erwten & Rijst Vanille Bio 500g', price: '€23,95', ingredient: 'Plantaardige proteïne', explanation: 'Biologische erwten- en rijstproteïne met 23 g eiwit per portie — compleet aminozuurprofiel, zonder zuivel of lactose.' },
        },
      },
      {
        handle: 'the-green-athlete-beta-alanine-600-gram',
        priority: 3,
        tagline: 'Beta-alanine — Langer door',
        productName: 'The Green Athlete Beta Alanine 600g',
        price: '€22,00',
        ingredient: 'Beta-alanine',
        explanation: 'Buffert melkzuur in de spieren zodat je langer op hoog niveau kunt presteren.',
      },
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 4,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Ondersteunt energieproductie in spiercellen bij langdurige inspanning en versnelt herstel.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
      {
        handle: 'mattisson-vegan-ijzer-bisglycinaat-28mg-90-vegetarische-capsules',
        priority: 5,
        tagline: 'IJzer — Zuurstof door',
        productName: 'Mattisson Vegan IJzer Bisglycinaat 28mg 90 caps',
        price: '€15,95',
        ingredient: 'IJzer',
        explanation: 'Cruciaal voor zuurstoftransport naar de spieren; tekort merk je direct in uithoudingsvermogen.',
      },
    ],
  },
  {
    id: 'spieren_algemeen',
    goals: ['spieren'],
    answers: { spieren: 'algemeen' },
    summary: 'Voor algemene fitheid bouw je op een brede basis — geen pieksuppletie maar consistente ondersteuning van spieren, herstel en energiemetabolisme. Deze selectie past bij iedereen die regelmatig beweegt en kwaliteit boven hype kiest.',
    products: [
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 1,
        tagline: 'Magnesium — Spierherstel',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Ondersteunt spierfunctie, herstel en energieaanmaak; de brede basis voor iedereen die actief beweegt.',
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 2,
        tagline: 'Vitamine D3 — Spierfunctie',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Ondersteunt spier- en botgezondheid, de stille basis onder algemene fysieke fitheid.',
      },
      {
        handle: 'esn-designer-whey-vanilla-milk-908-gram',
        priority: 3,
        tagline: 'Whey proteïne — Bouwstenen',
        productName: 'ESN Designer Whey 908g (keuze uit smaken)',
        price: '€38,99–€39,99',
        ingredient: 'Whey proteïne',
        explanation: 'Zorgt voor voldoende eiwitten voor herstel en behoud van spiermassa.',
        flavorOptions: [{ label: 'Vanilla Milk', handle: 'esn-designer-whey-vanilla-milk-908-gram' }, { label: 'Milk Chocolate', handle: 'esn-designer-whey-milk-chocolate-908-gram' }, { label: 'Straciatella', handle: 'esn-designer-whey-straciatella-908-gram' }, { label: 'Almond Coconut', handle: 'esn-designer-whey-almond-coconut-908-gram' }, { label: 'Dark Cookies & Cream', handle: 'esn-designer-whey-protein-dark-cookies-cream-908-gram' }, { label: 'White Chocolate Pistache', handle: 'esn-designer-whey-protein-white-chocolate-pistache-908-gram' }],
        dietTags: ['whey', 'lactose'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-protein-erwten-rijst-vanille-bio-500-gram', tagline: 'Plantaardige proteïne — Bouwstenen', productName: 'Mattisson Vegan Protein Erwten & Rijst Vanille Bio 500g', price: '€23,95', ingredient: 'Plantaardige proteïne', explanation: 'Biologische erwten- en rijstproteïne met 23 g eiwit per portie — compleet aminozuurprofiel, zonder zuivel of lactose.' },
          lactosevrij: { handle: 'mattisson-vegan-protein-erwten-rijst-vanille-bio-500-gram', tagline: 'Plantaardige proteïne — Bouwstenen', productName: 'Mattisson Vegan Protein Erwten & Rijst Vanille Bio 500g', price: '€23,95', ingredient: 'Plantaardige proteïne', explanation: 'Biologische erwten- en rijstproteïne met 23 g eiwit per portie — compleet aminozuurprofiel, zonder zuivel of lactose.' },
        },
      },
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 4,
        tagline: 'Omega-3 — Ontstekingsrem',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Vermindert lichte ontstekingen na inspanning en ondersteunt gewrichten en hart bij regelmatige activiteit.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 5,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt energiemetabolisme en spierfunctie; de functionele onderbouw van een actief leven.',
      },
    ],
  },
  {
    id: 'focus_werk_studie',
    goals: ['focus'],
    answers: { focus: 'werk_studie' },
    summary: 'Cognitieve prestaties bij langdurig denkwerk hangen af van hersenbrandstof, neurotransmitterbalans en stabiele energie. Deze combinatie ondersteunt geheugen, concentratie en informatieverwerking zonder zenuwachtigheid.',
    products: [
      {
        handle: 'mattisson-l-theanine-200mg-sunphenon-60-vegetarische-capsules',
        priority: 1,
        tagline: 'L-Theanine + Cafeïne — Scherp & rustig',
        productName: 'Mattisson L-Theanine 200mg Sunphenon 60 caps',
        price: '€17,95',
        ingredient: 'L-Theanine + Cafeïne',
        explanation: 'De combinatie geeft heldere, stabiele focus zonder de nerveuze piekerenergie van cafeïne alleen. Combineer met koffie of thee.',
      },
      {
        handle: 'arctic-blue-algenolie-dha-en-epa-90-softgels',
        priority: 2,
        tagline: 'Omega-3 (DHA) — Hersenbrandstof',
        productName: 'Arctic Blue Algenolie DHA en EPA 90 Softgels',
        price: '€29,90',
        ingredient: 'Omega-3 (DHA)',
        explanation: 'DHA ondersteunt concentratie en informatieverwerking bij langdurig denkwerk.',
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 3,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt de aanmaak van neurotransmitters die cognitieve prestaties reguleren.',
      },
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 4,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Ondersteunt geheugen en informatieverwerking bij langdurige cognitieve inspanning.',
      },
      {
        handle: 'vitakruid-magnesium-l-threonaat-magtein-90-vegetarische-capsules',
        priority: 5,
        tagline: 'Magnesium L-threönaat — Brein magnesium',
        productName: 'Vitakruid Magnesium L-threönaat met Magtein 90 caps',
        price: '€49,90',
        ingredient: 'Magnesium L-threönaat',
        explanation: 'Specifieke vorm die de bloed-hersenbarrière passeert en cognitieve functie direct ondersteunt.',
      },
    ],
  },
  {
    id: 'focus_onder_stress',
    goals: ['focus'],
    answers: { focus: 'onder_stress' },
    summary: 'Onder stress lekt focus weg via cortisol — daarom pakken we de stress aan in plaats van alleen de cognitieve symptomen te maskeren. Deze producten bufferen de impact van stress op je hersenfunctie en behouden mentale scherpte.',
    products: [
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 1,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Verlaagt cortisol zodat focus niet kan ondersneeuwen door stressreacties.',
      },
      {
        handle: 'mattisson-l-theanine-200mg-sunphenon-60-vegetarische-capsules',
        priority: 2,
        tagline: 'L-Theanine + Cafeïne — Scherp & rustig',
        productName: 'Mattisson L-Theanine 200mg Sunphenon 60 caps',
        price: '€17,95',
        ingredient: 'L-Theanine + Cafeïne',
        explanation: 'Geeft heldere focus terwijl het de scherpe kanten van stressopwinding afvlakt. Combineer met koffie of thee.',
      },
      {
        handle: 'arctic-blue-algenolie-dha-en-epa-90-softgels',
        priority: 3,
        tagline: 'Omega-3 (DHA) — Hersenbrandstof',
        productName: 'Arctic Blue Algenolie DHA en EPA 90 Softgels',
        price: '€29,90',
        ingredient: 'Omega-3 (DHA)',
        explanation: 'Helpt de negatieve effecten van chronische stress op cognitie te bufferen.',
      },
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 4,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Tegengaat mentale vermoeidheid door stress en helpt focus onder druk bewaren.',
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 5,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Stress verbruikt B-vitamines snel; aanvullen ondersteunt zowel energieniveau als zenuwstelsel.',
      },
    ],
  },
  {
    id: 'focus_algemeen_moe',
    goals: ['focus'],
    answers: { focus: 'algemeen_moe' },
    summary: 'Mentale vermoeidheid en wazig denken hebben meestal te maken met uitgeputte neurotransmittervoorraden en lichte tekorten. Deze stack richt zich op de stille onderbouw van cognitieve prestaties.',
    products: [
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 1,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt energieaanmaak in hersencellen en neurotransmitterproductie bij mentale uitputting.',
      },
      {
        handle: 'arctic-blue-algenolie-dha-en-epa-90-softgels',
        priority: 2,
        tagline: 'Omega-3 (DHA) — Hersenbrandstof',
        productName: 'Arctic Blue Algenolie DHA en EPA 90 Softgels',
        price: '€29,90',
        ingredient: 'Omega-3 (DHA)',
        explanation: 'Houdt hersenfunctie op peil en vermindert het gevoel van mentale mist.',
      },
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 3,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Vermindert mentale vermoeidheid en helpt cognitieve prestaties stabieler te houden.',
      },
      {
        handle: 'mattisson-vegan-ijzer-bisglycinaat-28mg-90-vegetarische-capsules',
        priority: 4,
        tagline: 'IJzer — Zuurstof door',
        productName: 'Mattisson Vegan IJzer Bisglycinaat 28mg 90 caps',
        price: '€15,95',
        ingredient: 'IJzer',
        explanation: 'Zelfs lichte ijzerarmoede treft het brein als eerste en veroorzaakt mentale traagheid en wazig denken.',
      },
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 5,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Ondersteunt de energieproductie in hersencellen, met name bij aanhoudende mentale vermoeidheid.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
    ],
  },
  {
    id: 'weerstand_algemeen',
    goals: ['weerstand'],
    answers: { weerstand: 'algemeen' },
    summary: 'Algemene weerstand opbouwen draait om de basis op orde houden: vitamine D, vitamine C, zink en een gezonde darmflora. Geen wondermiddelen, wel de pijlers die je immuunsysteem optimaal laten functioneren.',
    products: [
      {
        handle: 'orthica-vitamine-c-1000-90-tabletten',
        priority: 1,
        tagline: 'Vitamine C — Afweer basis',
        productName: 'Orthica Vitamine C-1000 90 Tabletten',
        price: '€23,50',
        ingredient: 'Vitamine C',
        explanation: 'Essentieel voor de werking van immuuncellen en de eerste verdedigingslinie van het lichaam.',
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 2,
        tagline: 'Vitamine D3 — Immuun regisseur',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Stuurt het immuunsysteem aan; tekort vergroot de kans op infecties en een trage afweerreactie.',
      },
      {
        handle: 'orthica-tri-zink-25-60-capsules',
        priority: 3,
        tagline: 'Zink — Afweer activator',
        productName: 'Orthica Tri-Zink-25 60 Vegacapsules',
        price: '€12,95',
        ingredient: 'Zink',
        explanation: 'Cruciaal voor de aanmaak en activatie van immuuncellen, bij tekort functioneert de afweer suboptimaal.',
      },
      {
        handle: 'mattisson-probisson-30-miljard-cfu-met-prebiotica-60-capsules',
        priority: 4,
        tagline: 'Probiotica — Darm & afweer',
        productName: 'Mattisson Probisson 30 Miljard CFU met Prebiotica 60 caps',
        price: '€34,95',
        ingredient: 'Probiotica',
        explanation: '70% van het immuunsysteem zit in de darm; een gezonde darmflora is de basis van goede weerstand.',
      },
      {
        handle: 'natures-answer-sambucus-vlierbessen-extract-alcoholvrij-120-milliliter',
        priority: 5,
        tagline: 'Elderberry — Natuur schild',
        productName: 'Natures Answer Sambucus Vlierbessen Extract Alcoholvrij 120ml',
        price: '€24,95',
        ingredient: 'Elderberry',
        explanation: 'Kruidenextract dat antivirale eigenschappen heeft en de immuunrespons ondersteunt.',
      },
    ],
  },
  {
    id: 'weerstand_vaak_verkouden',
    goals: ['weerstand'],
    answers: { weerstand: 'vaak_verkouden' },
    summary: 'Frequent verkouden zijn wijst op een immuunsysteem dat structurele ondersteuning kan gebruiken — geen acute brandblusser. Deze selectie verkort de duur van infecties én versterkt je weerstand voor de langere termijn.',
    products: [
      {
        handle: 'orthica-vitamine-c-1000-90-tabletten',
        priority: 1,
        tagline: 'Vitamine C — Afweer basis',
        productName: 'Orthica Vitamine C-1000 90 Tabletten',
        price: '€23,50',
        ingredient: 'Vitamine C',
        explanation: 'Verkort de duur van verkoudheid en ondersteunt de snelle activatie van immuuncellen.',
      },
      {
        handle: 'orthica-tri-zink-25-60-capsules',
        priority: 2,
        tagline: 'Zink — Afweer activator',
        productName: 'Orthica Tri-Zink-25 60 Vegacapsules',
        price: '€12,95',
        ingredient: 'Zink',
        explanation: 'Zink bij de eerste tekenen van verkoudheid remt virusreplicatie en verkort de ziekteduur aantoonbaar.',
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 3,
        tagline: 'Vitamine D3 — Immuun regisseur',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Tekort vergroot de gevoeligheid voor luchtweginfecties significant, zeker in de wintermaanden.',
      },
      {
        handle: 'natures-answer-sambucus-vlierbessen-extract-alcoholvrij-120-milliliter',
        priority: 4,
        tagline: 'Elderberry — Natuur schild',
        productName: 'Natures Answer Sambucus Vlierbessen Extract Alcoholvrij 120ml',
        price: '€24,95',
        ingredient: 'Elderberry',
        explanation: 'Ondersteunt de afweer actief bij frequente verkoudheid en luchtwegklachten.',
      },
      {
        handle: 'mattisson-probisson-30-miljard-cfu-met-prebiotica-60-capsules',
        priority: 5,
        tagline: 'Probiotica — Darm & afweer',
        productName: 'Mattisson Probisson 30 Miljard CFU met Prebiotica 60 caps',
        price: '€34,95',
        ingredient: 'Probiotica',
        explanation: 'Verbetert de darmflora, wat de weerstand tegen terugkerende infecties structureel verhoogt.',
      },
    ],
  },
  {
    id: 'weerstand_seizoen',
    goals: ['weerstand'],
    answers: { weerstand: 'seizoen' },
    summary: 'In herfst en winter krijgt het immuunsysteem extra te verduren door minder zonlicht, drogere lucht en meer circulerende virussen. Deze producten dekken de seizoensgebonden kwetsbaarheden die je voeding alleen niet meer opvangt.',
    products: [
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 1,
        tagline: 'Vitamine D3 — Immuun regisseur',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'In herfst en winter daalt de D3-aanmaak drastisch; suppletie is de meest effectieve seizoensinterventie.',
      },
      {
        handle: 'orthica-vitamine-c-1000-90-tabletten',
        priority: 2,
        tagline: 'Vitamine C — Afweer basis',
        productName: 'Orthica Vitamine C-1000 90 Tabletten',
        price: '€23,50',
        ingredient: 'Vitamine C',
        explanation: 'Ondersteunt de afweer tijdens de piekmomenten van griep- en verkoudheidsseizoen.',
      },
      {
        handle: 'orthica-tri-zink-25-60-capsules',
        priority: 3,
        tagline: 'Zink — Afweer activator',
        productName: 'Orthica Tri-Zink-25 60 Vegacapsules',
        price: '€12,95',
        ingredient: 'Zink',
        explanation: 'Seizoensgebonden suppletie houdt de immuunfunctie op peil tijdens koude, natte periodes.',
      },
      {
        handle: 'natures-answer-sambucus-vlierbessen-extract-alcoholvrij-120-milliliter',
        priority: 4,
        tagline: 'Elderberry — Natuur schild',
        productName: 'Natures Answer Sambucus Vlierbessen Extract Alcoholvrij 120ml',
        price: '€24,95',
        ingredient: 'Elderberry',
        explanation: 'Klassiek seizoenssupplement dat de afweer ondersteunt in de maanden dat virussen het meest circuleren.',
      },
      {
        handle: 'mattisson-probisson-30-miljard-cfu-met-prebiotica-60-capsules',
        priority: 5,
        tagline: 'Probiotica — Darm & afweer',
        productName: 'Mattisson Probisson 30 Miljard CFU met Prebiotica 60 caps',
        price: '€34,95',
        ingredient: 'Probiotica',
        explanation: 'Ondersteunt de darmflora die onder druk staat in seizoenen met meer infecties en minder verse voeding.',
      },
    ],
  },
  {
    id: 'gewricht_knieen',
    goals: ['gewricht'],
    answers: { gewricht: 'knieen' },
    summary: 'Klachten aan de knieën hebben vaak te maken met afbraak van kraakbeen, ontstekingen of een verzwakt botomliggend weefsel. Deze combinatie ondersteunt herstel en behoud van het gewricht — werkt aanvullend op beweging en belasting opbouwen.',
    products: [
      {
        handle: 'mattisson-glucosamine-chondroitine-met-msm-vitamine-c-d3-60-tabletten',
        priority: 1,
        tagline: 'Glucosamine — Kraakbeen steun',
        productName: 'Mattisson Glucosamine Chondroïtine met MSM 60 tabs',
        price: '€16,95',
        ingredient: 'Glucosamine',
        explanation: 'Bouwstof voor kraakbeen, ondersteunt het behoud en herstel van het kniegewricht bij slijtage.',
        dietTags: ['vis', 'schaaldier'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-msm-poeder-pure-550-gram', tagline: 'MSM — Soepel weefsel', productName: 'Mattisson Vegan MSM Poeder Pure 550g', price: '€16,95', ingredient: 'MSM', explanation: 'Plantaardige zwavelbron die bindweefsel en gewrichten soepel houdt — vegan vervanger voor glucosamine met chondroïtine.' },
          vegetarisch: { handle: 'mattisson-vegan-msm-poeder-pure-550-gram', tagline: 'MSM — Soepel weefsel', productName: 'Mattisson Vegan MSM Poeder Pure 550g', price: '€16,95', ingredient: 'MSM', explanation: 'Plantaardige zwavelbron die bindweefsel en gewrichten soepel houdt — vegan vervanger voor glucosamine met chondroïtine.' },
        },
      },
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 2,
        tagline: 'Omega-3 — Ontstekingsrem',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Vermindert gewrichtsontstekingen die pijn en stijfheid in de knie veroorzaken.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'arctic-blue-viscollageen-poeder-msc-aardbei-150-gram',
        priority: 3,
        tagline: 'Collageen — Structuur basis',
        productName: 'Arctic Blue Viscollageen Poeder MSC Aardbei 150g',
        price: '€24,90',
        ingredient: 'Collageen',
        explanation: 'Levert bouwstenen voor gewrichtskraakbeen en ondersteunt de structurele integriteit van het kniegewricht.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-collagen-alternative-vegan-60-vegetarische-capsules', tagline: 'Collageen-support — Plantaardig', productName: 'Mattisson Collagen Alternative Vegan 60 caps', price: '€20,95', ingredient: 'Collageen-ondersteuning', explanation: 'Plantaardige blend met vitamine C en hyaluronzuur die de lichaamseigen collageenaanmaak ondersteunt — zonder dierlijk collageen.' },
          vegetarisch: { handle: 'mattisson-collagen-alternative-vegan-60-vegetarische-capsules', tagline: 'Collageen-support — Plantaardig', productName: 'Mattisson Collagen Alternative Vegan 60 caps', price: '€20,95', ingredient: 'Collageen-ondersteuning', explanation: 'Plantaardige blend met vitamine C en hyaluronzuur die de lichaamseigen collageenaanmaak ondersteunt — zonder dierlijk collageen.' },
        },
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 4,
        tagline: 'Vitamine D3 — Botsterkte',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Ondersteunt de botdichtheid rondom het gewricht en vermindert het risico op verdere knieklachten. 📦 Het Mattisson Glucosamine-product dekt glucosamine én chondroïtine in één tablet.',
      },
    ],
  },
  {
    id: 'gewricht_rug_nek',
    goals: ['gewricht'],
    answers: { gewricht: 'rug_nek' },
    summary: 'Rug- en nekklachten ontstaan vaak door spierspanning, ontstekingsprocessen of zwakte in het bindweefsel rondom de wervelkolom. Deze producten ondersteunen zowel ontspanning als herstel van de omliggende structuren.',
    products: [
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 1,
        tagline: 'Magnesium — Spieren los',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Verlicht spierspanning rondom de wervelkolom, een veelvoorkomende oorzaak van rug- en nekklachten.',
      },
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 2,
        tagline: 'Omega-3 — Ontstekingsrem',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Vermindert ontstekingsprocessen die druk op zenuwen en gewrichten in rug en nek veroorzaken.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'arctic-blue-viscollageen-poeder-msc-aardbei-150-gram',
        priority: 3,
        tagline: 'Collageen — Structuur basis',
        productName: 'Arctic Blue Viscollageen Poeder MSC Aardbei 150g',
        price: '€24,90',
        ingredient: 'Collageen',
        explanation: 'Ondersteunt bindweefsel en tussenwervelschijven in de wervelkolom bij rug- en nekklachten.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-collagen-alternative-vegan-60-vegetarische-capsules', tagline: 'Collageen-support — Plantaardig', productName: 'Mattisson Collagen Alternative Vegan 60 caps', price: '€20,95', ingredient: 'Collageen-ondersteuning', explanation: 'Plantaardige blend met vitamine C en hyaluronzuur die de lichaamseigen collageenaanmaak ondersteunt — zonder dierlijk collageen.' },
          vegetarisch: { handle: 'mattisson-collagen-alternative-vegan-60-vegetarische-capsules', tagline: 'Collageen-support — Plantaardig', productName: 'Mattisson Collagen Alternative Vegan 60 caps', price: '€20,95', ingredient: 'Collageen-ondersteuning', explanation: 'Plantaardige blend met vitamine C en hyaluronzuur die de lichaamseigen collageenaanmaak ondersteunt — zonder dierlijk collageen.' },
        },
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 4,
        tagline: 'Vitamine D3 — Botsterkte',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Essentieel voor botdichtheid en spierfunctie; tekort vergroot de kans op rugklachten aanzienlijk.',
      },
      {
        handle: 'mattisson-vegan-msm-poeder-pure-550-gram',
        priority: 5,
        tagline: 'MSM — Soepel weefsel',
        productName: 'Mattisson Vegan MSM Poeder Pure 550g',
        price: '€16,95',
        ingredient: 'MSM',
        explanation: 'Zwavelbron die bindweefsel soepel houdt en ontstekingsgerelateerde pijn in rug en nek vermindert.',
      },
    ],
  },
  {
    id: 'gewricht_schouders_meerdere',
    goals: ['gewricht'],
    answers: { gewricht: 'schouders_meerdere' },
    summary: 'Klachten op meerdere gewrichten tegelijk wijzen vaak op een systemische ontstekingscomponent of een tekort dat alle gewrichten raakt. Deze combinatie pakt het breed aan — kraakbeenherstel, ontstekingsremming en bindweefselondersteuning.',
    products: [
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 1,
        tagline: 'Omega-3 — Ontstekingsrem',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Systemische ontstekingsremmer die bij klachten op meerdere plekken de meest brede werking biedt. 📦',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'mattisson-glucosamine-chondroitine-met-msm-vitamine-c-d3-60-tabletten',
        priority: 2,
        tagline: 'Glucosamine — Kraakbeen steun',
        productName: 'Mattisson Glucosamine Chondroïtine met MSM 60 tabs',
        price: '€16,95',
        ingredient: 'Glucosamine',
        explanation: 'Ondersteunt het herstel en behoud van kraakbeen in meerdere gewrichten tegelijk.',
        dietTags: ['vis', 'schaaldier'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-msm-poeder-pure-550-gram', tagline: 'MSM — Soepel weefsel', productName: 'Mattisson Vegan MSM Poeder Pure 550g', price: '€16,95', ingredient: 'MSM', explanation: 'Plantaardige zwavelbron die bindweefsel en gewrichten soepel houdt — vegan vervanger voor glucosamine met chondroïtine.' },
          vegetarisch: { handle: 'mattisson-vegan-msm-poeder-pure-550-gram', tagline: 'MSM — Soepel weefsel', productName: 'Mattisson Vegan MSM Poeder Pure 550g', price: '€16,95', ingredient: 'MSM', explanation: 'Plantaardige zwavelbron die bindweefsel en gewrichten soepel houdt — vegan vervanger voor glucosamine met chondroïtine.' },
        },
      },
      {
        handle: 'arctic-blue-viscollageen-poeder-msc-aardbei-150-gram',
        priority: 3,
        tagline: 'Collageen — Structuur basis',
        productName: 'Arctic Blue Viscollageen Poeder MSC Aardbei 150g',
        price: '€24,90',
        ingredient: 'Collageen',
        explanation: 'Ondersteunt bindweefsel en kraakbeen in alle grote gewrichten, inclusief schouders.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-collagen-alternative-vegan-60-vegetarische-capsules', tagline: 'Collageen-support — Plantaardig', productName: 'Mattisson Collagen Alternative Vegan 60 caps', price: '€20,95', ingredient: 'Collageen-ondersteuning', explanation: 'Plantaardige blend met vitamine C en hyaluronzuur die de lichaamseigen collageenaanmaak ondersteunt — zonder dierlijk collageen.' },
          vegetarisch: { handle: 'mattisson-collagen-alternative-vegan-60-vegetarische-capsules', tagline: 'Collageen-support — Plantaardig', productName: 'Mattisson Collagen Alternative Vegan 60 caps', price: '€20,95', ingredient: 'Collageen-ondersteuning', explanation: 'Plantaardige blend met vitamine C en hyaluronzuur die de lichaamseigen collageenaanmaak ondersteunt — zonder dierlijk collageen.' },
        },
      },
      {
        handle: 'orthica-vitamine-c-1000-90-tabletten',
        priority: 4,
        tagline: 'Vitamine C — Collageen aanmaak',
        productName: 'Orthica Vitamine C-1000 90 Tabletten',
        price: '€23,50',
        ingredient: 'Vitamine C',
        explanation: 'Essentieel voor de lichaamseigen productie van collageen, de bouwstof van al het bindweefsel. 📦 Het Mattisson Glucosamine-product dekt glucosamine én MSM in één tablet.',
      },
    ],
    medicalDisclaimer: 'Klachten op meerdere gewrichten tegelijk kunnen wijzen op een onderliggende systemische oorzaak die niet met supplementen alleen is op te lossen. Raadpleeg een fysiotherapeut of huisarts voor gericht onderzoek voordat je langdurig suppleert.',
  },
  {
    id: 'hart_preventie',
    goals: ['hart'],
    answers: { hart: 'preventie' },
    summary: 'Hart- en vaatpreventie draait om vier pijlers: vetzuurprofiel, bloeddruk, vaatwand-elasticiteit en ritme. Deze producten ondersteunen alle vier, gebaseerd op de best onderzochte cardiovasculaire suppletie.',
    products: [
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 1,
        tagline: 'Omega-3 — Hartbeschermer',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Verlaagt triglyceriden, ondersteunt hartritme en remt ontstekingen in de vaatwanden.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 2,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Ondersteunt de energieproductie in hartspierweefsel en beschermt tegen oxidatieve schade.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 3,
        tagline: 'Magnesium — Hartritme steun',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Essentieel voor een regelmatig hartritme en gezonde bloeddruk. 📦',
      },
      {
        handle: 'mattisson-vitamine-d3-k2-75mcg-36mcg-vegan-druppels-25-milliliter',
        priority: 4,
        tagline: 'Vitamine K2 — Kalk dirigent',
        productName: 'Mattisson D3/K2 75mcg/36mcg Vegan Druppels 25ml',
        price: '€24,95',
        ingredient: 'Vitamine K2',
        explanation: 'Zorgt dat calcium in botten terechtkomt in plaats van in de vaatwanden, cruciaal voor vasculaire gezondheid.',
      },
    ],
  },
  {
    id: 'hart_verhoogd_risico',
    goals: ['hart'],
    answers: { hart: 'verhoogd_risico' },
    summary: 'Bij verhoogd risico (familieanamnese, leeftijd, leefstijl) bouw je een sterkere preventieve basis met bewezen werkzame ingrediënten. Deze stack richt zich specifiek op factoren die het cardiovasculaire risico aantoonbaar verlagen.',
    products: [
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 1,
        tagline: 'Omega-3 — Hartbeschermer',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Bij verhoogd risico de best onderzochte suppletie voor het verlagen van cardiovasculaire incidenten.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 2,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Bij gebruik van statines daalt Q10 sterk; suppletie ondersteunt hartfunctie en vermindert spierklachten.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 3,
        tagline: 'Magnesium — Hartritme steun',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Tekort is gelinkt aan hypertensie en hartritmestoornissen, suppletie verlaagt het risico aantoonbaar. 📦',
      },
      {
        handle: 'mattisson-vitamine-d3-k2-75mcg-36mcg-vegan-druppels-25-milliliter',
        priority: 4,
        tagline: 'Vitamine K2 — Kalk dirigent',
        productName: 'Mattisson D3/K2 75mcg/36mcg Vegan Druppels 25ml',
        price: '€24,95',
        ingredient: 'Vitamine K2',
        explanation: 'Voorkomt calcificatie van slagaders, essentieel bij verhoogd cardiovasculair risico.',
      },
      {
        handle: 'orthica-vitamine-c-1000-90-tabletten',
        priority: 5,
        tagline: 'Vitamine C — Vaatwand steun',
        productName: 'Orthica Vitamine C-1000 90 Tabletten',
        price: '€23,50',
        ingredient: 'Vitamine C',
        explanation: 'Beschermt vaatwanden via antioxidantwerking en remt LDL-oxidatie, relevant bij een verhoogd cardiovasculair risico. 📦 De Mattisson D3/K2 druppels dekt zowel K2 als D3 in één product.',
      },
    ],
    medicalDisclaimer: 'Bij verhoogd cardiovasculair risico is suppletie aanvullend, nooit vervangend. Bespreek je situatie met je huisarts of cardioloog voordat je start, en deel mee wat je gebruikt.',
  },
  {
    id: 'hart_op_advies_arts',
    goals: ['hart'],
    answers: { hart: 'op_advies_arts' },
    summary: 'Bij medisch begeleide trajecten is suppletie ondersteunend — geen vervanging van medicatie. Deze selectie zijn de meest onderzochte en veiligste aanvullingen naast hartmedicatie.',
    products: [
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 1,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Vaak aanbevolen naast hartmedicatie; ondersteunt hartfunctie en compenseert Q10-verlies door statines.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 2,
        tagline: 'Omega-3 — Hartbeschermer',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'In medisch begeleide trajecten een van de best gedocumenteerde supplementen voor hart en vaten.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 3,
        tagline: 'Magnesium — Hartritme steun',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Wordt door artsen ingezet bij bloeddrukproblemen en ritmestoornissen, veilig als aanvulling. 📦',
      },
      {
        handle: 'mattisson-vitamine-d3-k2-75mcg-36mcg-vegan-druppels-25-milliliter',
        priority: 4,
        tagline: 'Vitamine K2 — Kalk dirigent',
        productName: 'Mattisson D3/K2 75mcg/36mcg Vegan Druppels 25ml',
        price: '€24,95',
        ingredient: 'Vitamine K2',
        explanation: 'Relevant bij gebruik van bloedverdunners of calcium-suppletie op medisch advies.',
      },
    ],
    medicalDisclaimer: 'Stem deze supplementen altijd af met je behandelend arts — enkele kunnen interfereren met statines, bloedverdunners of bloeddrukmedicatie. Stop nooit zelfstandig met voorgeschreven medicatie.',
  },
  {
    id: 'stress_mentale_onrust',
    goals: ['stress'],
    answers: { stress: 'mentale_onrust' },
    summary: 'Mentale onrust en piekeren wijzen op een overactief stresssysteem en verlaagde GABA-activiteit in de hersenen. Deze combinatie kalmeert het zenuwstelsel zonder je sloom of suf te maken.',
    products: [
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 1,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Verlaagt cortisolniveaus en kalmeert het overactieve stresssysteem bij mentale onrust.',
      },
      {
        handle: 'mattisson-l-theanine-200mg-sunphenon-60-vegetarische-capsules',
        priority: 2,
        tagline: 'L-Theanine — Hoofd stil',
        productName: 'Mattisson L-Theanine 200mg Sunphenon 60 caps',
        price: '€17,95',
        ingredient: 'L-Theanine',
        explanation: 'Bevordert alfa-hersengolven die zorgen voor een rustige, heldere mentale toestand zonder slaperigheid.',
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 3,
        tagline: 'Magnesium — Spieren los',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Tekort vergroot prikkelbaarheid en angstgevoelens; suppletie kalmeert het zenuwstelsel.',
      },
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 4,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Helpt het lichaam omgaan met mentale stress zonder de energiereserves uit te putten.',
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 5,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt de aanmaak van kalmerende neurotransmitters zoals serotonine en GABA.',
      },
    ],
  },
  {
    id: 'stress_lichamelijke_spanning',
    goals: ['stress'],
    answers: { stress: 'lichamelijke_spanning' },
    summary: 'Stress wordt fysiek opgeslagen — meestal in nek, schouders en kaken, met spanning die spierontspanning belemmert. Deze producten verlichten lichamelijke spanning én pakken het achterliggende cortisol aan.',
    products: [
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 1,
        tagline: 'Magnesium — Spieren los',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Verlicht spierspanning die door chronische stress in nek, schouders en rug wordt opgeslagen.',
      },
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 2,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Verlaagt het stresshormoon dat de spieren in een permanente staat van paraatheid houdt.',
      },
      {
        handle: 'mattisson-valeriaan-relax-complex-60-capsules',
        priority: 3,
        tagline: 'Valeriaan — Oud betrouwbaar',
        productName: 'Mattisson Valeriaan Relax Complex 60 caps',
        price: '€19,95',
        ingredient: 'Valeriaan',
        explanation: 'Werkt spasmolytisch en kalmerend op het zenuwstelsel, vermindert lichamelijke gespannenheid.',
      },
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 4,
        tagline: 'Omega-3 — Ontstekingsrem',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Chronische stress veroorzaakt laaggradige ontstekingen die lichamelijke klachten verergeren.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'orthica-vitamine-c-1000-90-tabletten',
        priority: 5,
        tagline: 'Vitamine C — Cortisol buffer',
        productName: 'Orthica Vitamine C-1000 90 Tabletten',
        price: '€23,50',
        ingredient: 'Vitamine C',
        explanation: 'Hoge vitamine C-inname is gelinkt aan lagere cortisolrespons en minder fysieke stresssymptomen.',
      },
    ],
  },
  {
    id: 'stress_slecht_slapen',
    goals: ['stress'],
    answers: { stress: 'slecht_slapen' },
    summary: 'Slecht slapen door stress vormt een vicieuze cirkel: stress verhoogt cortisol, hoog cortisol verstoort slaap, weinig slaap verhoogt stress. Deze stack doorbreekt de cirkel op meerdere punten tegelijk.',
    products: [
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 1,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Pakt de worteloorzaak aan: verlaagt cortisol zodat het lichaam \'s avonds echt tot rust kan komen.',
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 2,
        tagline: 'Magnesium — Spieren los',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Ontspant het zenuwstelsel en de spieren, essentieel als stress de lichaamsspanning \'s nachts hoog houdt.',
      },
      {
        handle: 'mattisson-l-theanine-200mg-sunphenon-60-vegetarische-capsules',
        priority: 3,
        tagline: 'L-Theanine — Hoofd stil',
        productName: 'Mattisson L-Theanine 200mg Sunphenon 60 caps',
        price: '€17,95',
        ingredient: 'L-Theanine',
        explanation: 'Kalmeert piekerende gedachten die door stress \'s nachts de kop opsteken.',
      },
      {
        handle: 'mattisson-valeriaan-relax-complex-60-capsules',
        priority: 4,
        tagline: 'Valeriaan — Oud betrouwbaar',
        productName: 'Mattisson Valeriaan Relax Complex 60 caps',
        price: '€19,95',
        ingredient: 'Valeriaan',
        explanation: 'Ondersteunt het inslapen en doorslapen wanneer een overactief stresssysteem de slaap verstoort.',
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 5,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt de aanmaak van melatonine en serotonine die door chronische stress uitgeput raken.',
      },
    ],
    medicalDisclaimer: 'Als slecht slapen door stress langer dan 4 weken aanhoudt, raadpleeg een huisarts of psycholoog. Supplementen ondersteunen herstel, maar pakken structurele oorzaken niet aan.',
  },
  {
    id: 'hormonen_balans',
    goals: ['hormonen'],
    answers: { hormonen: 'balans' },
    summary: 'Hormonale balans is een complex samenspel — cortisol, geslachtshormonen en schildklier beïnvloeden elkaar wederzijds. Deze selectie ondersteunt de basis-bouwstoffen en regulerende mineralen voor het hele systeem.',
    products: [
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 1,
        tagline: 'Vitamine D3 — Hormoon basis',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Fungeert zelf als hormoon en is betrokken bij de regulatie van tientallen hormonale processen in het lichaam.',
      },
      {
        handle: 'orthica-tri-zink-25-60-capsules',
        priority: 2,
        tagline: 'Zink — Testosteron steun',
        productName: 'Orthica Tri-Zink-25 60 Vegacapsules',
        price: '€12,95',
        ingredient: 'Zink',
        explanation: 'Essentieel voor de aanmaak van geslachtshormonen bij zowel mannen als vrouwen.',
      },
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 3,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Normaliseert het cortisolprofiel, waardoor andere hormonen zoals schildklier- en geslachtshormonen beter in balans komen.',
      },
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 4,
        tagline: 'Omega-3 — Hormoon bouwstof',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Vetzuren zijn directe bouwstoffen voor hormoonproductie en ondersteunen hormoonreceptorgevoeligheid.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 5,
        tagline: 'Magnesium — Regulator',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Betrokken bij meer dan 300 enzymatische processen inclusief hormoonregulatie en insulinegevoeligheid.',
      },
    ],
  },
  {
    id: 'hormonen_energie_vitaliteit',
    goals: ['hormonen'],
    answers: { hormonen: 'energie_vitaliteit' },
    summary: 'Hormoongerelateerde vermoeidheid komt vaak voort uit uitgeputte bijnieren, schildklierfunctie of cyclische schommelingen. Deze producten ondersteunen energieproductie én de hormonale processen die vitaliteit bepalen.',
    products: [
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 1,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Ondersteunt de bijnierfunctie en hormoonbalans die ten grondslag liggen aan vitaliteit en veerkracht.',
      },
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 2,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels ⚠️',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Ondersteunt de mitochondriën die energie leveren voor alle hormonaal gestuurde processen.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 3,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Essentieel voor de productie van bijnierhoormonen en de omzetting van voedingsstoffen naar energie.',
      },
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 4,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Verlaagt cortisol en ondersteunt testosteron en schildklierhormonen die vitaliteit direct bepalen.',
      },
      {
        handle: 'mattisson-vegan-ijzer-bisglycinaat-28mg-90-vegetarische-capsules',
        priority: 5,
        tagline: 'IJzer — Zuurstof door',
        productName: 'Mattisson Vegan IJzer Bisglycinaat 28mg 90 caps',
        price: '€15,95',
        ingredient: 'IJzer',
        explanation: 'Bij vrouwen een veelgeziene oorzaak van uitputting en hormonale ontregeling die energie en vitaliteit ondermijnt.',
      },
    ],
  },
  {
    id: 'hormonen_levensfase',
    goals: ['hormonen'],
    answers: { hormonen: 'levensfase' },
    summary: 'Specifieke levensfases (perimenopauze, postpartum, andropauze) vragen om gerichte ondersteuning van transitie-processen. Deze stack helpt het lichaam adapteren aan hormonale verschuivingen die in deze periodes optreden.',
    products: [
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 1,
        tagline: 'Vitamine D3 — Hormoon basis',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Bij elke levensfase — puberteit, zwangerschap, overgang, ouder worden — is D3 een kernhormoon.',
      },
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 2,
        tagline: 'Omega-3 — Hormoon bouwstof',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Ondersteunt hormonale overgangen en vermindert klachten bij PMS, perimenopauze en androgeendaling.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 3,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Helpt het lichaam adapteren aan hormonale verschuivingen die gepaard gaan met levensfaseovergangen.',
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 4,
        tagline: 'Magnesium — Regulator',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Vermindert aantoonbaar PMS-klachten, stemmingswisselingen en overgangsklachten door hormonale regulatie.',
      },
      {
        handle: 'orthica-b6-10-co-enzym-60-vegetarische-capsules',
        priority: 5,
        tagline: 'Vitamine B6 — Hormoon schakel',
        productName: 'Orthica B6-10 Co-enzym 60 Vegetarische caps',
        price: '€11,95',
        ingredient: 'Vitamine B6',
        explanation: 'Cruciaal bij hormonale levensfases; ondersteunt oestrogeenmetabolisme, PMS-reductie en neurotransmitterbalans.',
      },
    ],
    medicalDisclaimer: 'Hormonale klachten in specifieke levensfases verdienen begeleiding van een arts of orthomoleculair therapeut. Bloedwaarden geven veel beter inzicht dan symptomen alleen — vraag naar een uitgebreid hormoonprofiel.',
  },
];

// ============================================================================
// DEEL 2 — 10 dubbele-doel mappings (logische paren)
// ============================================================================

export const DOUBLE_GOAL_RULES: MappingRule[] = [
  {
    id: 'slaap_energie',
    goals: ['slaap', 'energie'],
    answers: {},
    summary: 'Slechte slaap voedt overdag-vermoeidheid, en vermoeidheid maakt het lastiger om goed te slapen — dit pakken we tegelijk aan. Deze combinatie ondersteunt zowel de nachtelijke herstelfase als de cellulaire energieproductie overdag.',
    products: [
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 1,
        tagline: 'Magnesium — Slapen & laden',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Verbetert slaapkwaliteit én ondersteunt energieaanmaak op celniveau; pakt beide kanten tegelijk aan.',
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 2,
        tagline: 'Vitamine D3 — Zon in tablet',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Tekort verslechtert zowel slaapkwaliteit als energieniveau, suppletie heeft dubbel effect.',
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 3,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt energiemetabolisme overdag en de aanmaak van melatonine \'s nachts.',
      },
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 4,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Verlaagt cortisol waardoor je beter slaapt én overdag meer veerkracht en energie ervaart.',
      },
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 5,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Ondersteunt cellulaire energieproductie overdag en draagt bij aan dieper, herstellend slapen.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
    ],
  },
  {
    id: 'slaap_stress',
    goals: ['slaap', 'stress'],
    answers: {},
    summary: 'Stress en slaapproblemen zijn vaak één probleem dat zich op twee momenten van de dag uit. Door cortisol te verlagen én het zenuwstelsel te kalmeren werk je aan de gezamenlijke wortel.',
    products: [
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 1,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'De meest directe brug: verlaagt cortisol, kalmeert het stresssysteem én verbetert daardoor de slaap.',
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 2,
        tagline: 'Magnesium — Spieren los',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Ontspant spieren en zenuwstelsel, effectief tegen zowel lichamelijke spanning als slaapproblemen.',
      },
      {
        handle: 'mattisson-l-theanine-200mg-sunphenon-60-vegetarische-capsules',
        priority: 3,
        tagline: 'L-Theanine — Hoofd stil',
        productName: 'Mattisson L-Theanine 200mg Sunphenon 60 caps',
        price: '€17,95',
        ingredient: 'L-Theanine',
        explanation: 'Kalmeert piekerende gedachten en bevordert rustige hersengolven, gunstig voor stress én inslapen.',
      },
      {
        handle: 'mattisson-valeriaan-relax-complex-60-capsules',
        priority: 4,
        tagline: 'Valeriaan — Oud betrouwbaar',
        productName: 'Mattisson Valeriaan Relax Complex 60 caps',
        price: '€19,95',
        ingredient: 'Valeriaan',
        explanation: 'Kalmerend kruidenextract dat zowel stressreactiviteit als slaapkwaliteit ondersteunt.',
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 5,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt neurotransmitters die stress reguleren en de omzetting naar melatonine \'s avonds.',
      },
    ],
  },
  {
    id: 'slaap_hormonen',
    goals: ['slaap', 'hormonen'],
    answers: {},
    summary: 'Hormonale schommelingen — vooral rondom de cyclus, overgang of bijnieruitputting — verstoren de slaap structureel. Deze producten ondersteunen zowel hormonale balans als slaapkwaliteit.',
    products: [
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 1,
        tagline: 'Magnesium — Regulator',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Ondersteunt hormonale balans en verbetert direct de slaapkwaliteit, met name relevant bij PMS en overgang.',
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 2,
        tagline: 'Vitamine D3 — Hormoon basis',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Fungeert zelf als hormoon en is betrokken bij zowel slaapregulatie als hormonale processen.',
      },
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 3,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Normaliseert cortisol en ondersteunt hormonale balans, waardoor de slaap stabieler wordt.',
      },
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 4,
        tagline: 'Omega-3 — Hormoon bouwstof',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Ondersteunt hormoonproductie en vermindert hormonaal gerelateerde slaapverstoringen.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'orthica-b6-10-co-enzym-60-vegetarische-capsules',
        priority: 5,
        tagline: 'Vitamine B6 — Hormoon schakel',
        productName: 'Orthica B6-10 Co-enzym 60 Vegetarische caps',
        price: '€11,95',
        ingredient: 'Vitamine B6',
        explanation: 'Cruciaal voor oestrogeenmetabolisme en de aanmaak van melatonine, directe schakel tussen hormonen en slaap.',
      },
    ],
  },
  {
    id: 'energie_focus',
    goals: ['energie', 'focus'],
    answers: {},
    summary: 'Mentale en fysieke energie zijn nauw verweven: beide vragen om cellulaire brandstof, neurotransmitters en stabiele bloedsuiker. Deze stack geeft een dubbel effect zonder zenuwachtigheid of crash.',
    products: [
      {
        handle: 'mattisson-l-theanine-200mg-sunphenon-60-vegetarische-capsules',
        priority: 1,
        tagline: 'L-Theanine + Cafeïne — Scherp & rustig',
        productName: 'Mattisson L-Theanine 200mg Sunphenon 60 caps',
        price: '€17,95',
        ingredient: 'L-Theanine + Cafeïne',
        explanation: 'Geeft zowel fysieke energie als mentale scherpte zonder crash of nervositeit. Combineer met koffie of thee.',
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 2,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt energieaanmaak én neurotransmitterproductie voor focus en alertheid.',
      },
      {
        handle: 'arctic-blue-algenolie-dha-en-epa-90-softgels',
        priority: 3,
        tagline: 'Omega-3 (DHA) — Hersenbrandstof',
        productName: 'Arctic Blue Algenolie DHA en EPA 90 Softgels',
        price: '€29,90',
        ingredient: 'Omega-3 (DHA)',
        explanation: 'Voedt hersencellen direct en ondersteunt zowel cognitieve energie als concentratievermogen.',
      },
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 4,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Vermindert mentale én fysieke vermoeidheid tegelijk, ideaal bij gecombineerde belasting.',
      },
      {
        handle: 'mattisson-vegan-ijzer-bisglycinaat-28mg-90-vegetarische-capsules',
        priority: 5,
        tagline: 'IJzer — Zuurstof door',
        productName: 'Mattisson Vegan IJzer Bisglycinaat 28mg 90 caps',
        price: '€15,95',
        ingredient: 'IJzer',
        explanation: 'Tekort raakt zowel fysieke energie als cognitieve scherpte; aanvullen heeft direct dubbel effect.',
      },
    ],
  },
  {
    id: 'energie_stress',
    goals: ['energie', 'stress'],
    answers: {},
    summary: 'Stress is een van de grootste energierovers — verhoogd cortisol put je reserves uit en verstoort de mitochondriële functie. Deze combinatie ondersteunt herstel én voorkomt verdere uitputting.',
    products: [
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 1,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Verlaagt cortisol dat energie opslokt én geeft het lichaam ruimte om energiereserves te herstellen.',
      },
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 2,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Adaptogeen dat zowel stressbestendigheid verhoogt als vermoeidheid door stress vermindert.',
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 3,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Stress verbruikt B-vitamines snel; aanvullen ondersteunt zowel energieniveau als zenuwstelsel.',
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 4,
        tagline: 'Magnesium — Spieren los',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Vermindert lichamelijke stressspanning én ondersteunt energieproductie in de cellen.',
      },
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 5,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Chronische stress tast mitochondriale functie aan; Q10 ondersteunt cellulaire energie onder belasting.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
    ],
  },
  {
    id: 'focus_stress',
    goals: ['focus', 'stress'],
    answers: {},
    summary: 'Stress vermindert focus direct via cortisol — adaptogenen pakken de oorzaak aan terwijl andere ingrediënten de mentale scherpte ondersteunen. Het resultaat: heldere focus zonder de scherpe randjes van stress.',
    products: [
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 1,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Pakt de bron aan: minder cortisol betekent direct meer mentale ruimte voor focus.',
      },
      {
        handle: 'mattisson-l-theanine-200mg-sunphenon-60-vegetarische-capsules',
        priority: 2,
        tagline: 'L-Theanine — Hoofd stil',
        productName: 'Mattisson L-Theanine 200mg Sunphenon 60 caps',
        price: '€17,95',
        ingredient: 'L-Theanine',
        explanation: 'Kalmeert stressreactiviteit en bevordert tegelijk een heldere, geconcentreerde gemoedstoestand.',
      },
      {
        handle: 'arctic-blue-algenolie-dha-en-epa-90-softgels',
        priority: 3,
        tagline: 'Omega-3 (DHA) — Hersenbrandstof',
        productName: 'Arctic Blue Algenolie DHA en EPA 90 Softgels',
        price: '€29,90',
        ingredient: 'Omega-3 (DHA)',
        explanation: 'Beschermt hersenfunctie tegen de negatieve effecten van chronische stress op concentratie.',
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 4,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt zowel stressregulatie als cognitieve neurotransmitterbalans.',
      },
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 5,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Verhoogt stressbestendigheid én mentale prestaties onder druk tegelijkertijd.',
      },
    ],
  },
  {
    id: 'spieren_gewricht',
    goals: ['spieren', 'gewricht'],
    answers: {},
    summary: 'Sporters en actieve mensen hebben vaak beide nodig: spierherstel én bescherming van de belaste gewrichten. Deze selectie ondersteunt spiergroei en kraakbeenherstel tegelijk, ideaal bij regelmatige belasting.',
    products: [
      {
        handle: 'arctic-blue-viscollageen-poeder-msc-aardbei-150-gram',
        priority: 1,
        tagline: 'Collageen — Structuur basis',
        productName: 'Arctic Blue Viscollageen Poeder MSC Aardbei 150g',
        price: '€24,90',
        ingredient: 'Collageen',
        explanation: 'Levert bouwstenen voor kraakbeen in gewrichten en bindweefsel rondom spieren bij actieve belasting.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-collagen-alternative-vegan-60-vegetarische-capsules', tagline: 'Collageen-support — Plantaardig', productName: 'Mattisson Collagen Alternative Vegan 60 caps', price: '€20,95', ingredient: 'Collageen-ondersteuning', explanation: 'Plantaardige blend met vitamine C en hyaluronzuur die de lichaamseigen collageenaanmaak ondersteunt — zonder dierlijk collageen.' },
          vegetarisch: { handle: 'mattisson-collagen-alternative-vegan-60-vegetarische-capsules', tagline: 'Collageen-support — Plantaardig', productName: 'Mattisson Collagen Alternative Vegan 60 caps', price: '€20,95', ingredient: 'Collageen-ondersteuning', explanation: 'Plantaardige blend met vitamine C en hyaluronzuur die de lichaamseigen collageenaanmaak ondersteunt — zonder dierlijk collageen.' },
        },
      },
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 2,
        tagline: 'Omega-3 — Ontstekingsrem',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Vermindert ontstekingen na training én in gewrichten, de meest brede herstelondersteuning.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 3,
        tagline: 'Magnesium — Spierherstel',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Ondersteunt spierherstel na inspanning én vermindert spierspanning rondom belaste gewrichten.',
      },
      {
        handle: 'mattisson-glucosamine-chondroitine-met-msm-vitamine-c-d3-60-tabletten',
        priority: 4,
        tagline: 'Glucosamine — Kraakbeen steun',
        productName: 'Mattisson Glucosamine Chondroïtine met MSM 60 tabs',
        price: '€16,95',
        ingredient: 'Glucosamine',
        explanation: 'Beschermt kraakbeen bij sporters die gewrichten herhaaldelijk belasten.',
        dietTags: ['vis', 'schaaldier'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-msm-poeder-pure-550-gram', tagline: 'MSM — Soepel weefsel', productName: 'Mattisson Vegan MSM Poeder Pure 550g', price: '€16,95', ingredient: 'MSM', explanation: 'Plantaardige zwavelbron die bindweefsel en gewrichten soepel houdt — vegan vervanger voor glucosamine met chondroïtine.' },
          vegetarisch: { handle: 'mattisson-vegan-msm-poeder-pure-550-gram', tagline: 'MSM — Soepel weefsel', productName: 'Mattisson Vegan MSM Poeder Pure 550g', price: '€16,95', ingredient: 'MSM', explanation: 'Plantaardige zwavelbron die bindweefsel en gewrichten soepel houdt — vegan vervanger voor glucosamine met chondroïtine.' },
        },
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 5,
        tagline: 'Vitamine D3 — Spierfunctie',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Ondersteunt zowel spierkracht als botdichtheid en gewrichtsgezondheid bij actieve mensen.',
      },
    ],
  },
  {
    id: 'weerstand_stress',
    goals: ['weerstand', 'stress'],
    answers: {},
    summary: 'Chronische stress onderdrukt het immuunsysteem aantoonbaar — door beide aan te pakken werk je aan de bron van verlaagde weerstand. Deze producten ondersteunen afweer én stressregulatie via overlappende mechanismen.',
    products: [
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 1,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Chronische stress onderdrukt het immuunsysteem direct; minder cortisol betekent betere weerstand.',
      },
      {
        handle: 'orthica-vitamine-c-1000-90-tabletten',
        priority: 2,
        tagline: 'Vitamine C — Cortisol buffer',
        productName: 'Orthica Vitamine C-1000 90 Tabletten',
        price: '€23,50',
        ingredient: 'Vitamine C',
        explanation: 'Ondersteunt zowel de immuunfunctie als de cortisolrespons bij stress.',
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 3,
        tagline: 'Vitamine D3 — Immuun regisseur',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Stuurt immuunsysteem aan én ondersteunt de stressregulatie via hormonale werking.',
      },
      {
        handle: 'mattisson-probisson-30-miljard-cfu-met-prebiotica-60-capsules',
        priority: 4,
        tagline: 'Probiotica — Darm & afweer',
        productName: 'Mattisson Probisson 30 Miljard CFU met Prebiotica 60 caps',
        price: '€34,95',
        ingredient: 'Probiotica',
        explanation: 'Gezonde darmflora ondersteunt weerstand én produceert neurotransmitters die stemming en stress beïnvloeden.',
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 5,
        tagline: 'Magnesium — Regulator',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Kalmeert het zenuwstelsel én ondersteunt immuuncelactiviteit, effectief op beide fronten.',
      },
    ],
  },
  {
    id: 'hormonen_energie',
    goals: ['hormonen', 'energie'],
    answers: {},
    summary: 'Hormoonschommelingen leiden bij veel mensen — vooral vrouwen in de levensfase rond menstruatie, zwangerschap of overgang — tot energietekorten. Deze stack ondersteunt de bijnier- en schildklierfunctie die vitaliteit direct bepalen.',
    products: [
      {
        handle: 'mattisson-ashwagandha-ksm-66-bio-60-capsules',
        priority: 1,
        tagline: 'Ashwagandha — Stress weg',
        productName: 'Mattisson Ashwagandha KSM-66 Bio 60 caps',
        price: '€19,95',
        ingredient: 'Ashwagandha',
        explanation: 'Ondersteunt bijnier- en schildklierfunctie én verlaagt cortisol dat energie wegtrekt.',
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 2,
        tagline: 'Vitamine D3 — Hormoon basis',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Essentieel voor hormonale processen die direct energieniveau en vitaliteit bepalen.',
      },
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 3,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Ondersteunt de energieproductie in cellen die onder hormonale invloed staan.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
      {
        handle: 'mattisson-vegan-ijzer-bisglycinaat-28mg-90-vegetarische-capsules',
        priority: 4,
        tagline: 'IJzer — Zuurstof door',
        productName: 'Mattisson Vegan IJzer Bisglycinaat 28mg 90 caps',
        price: '€15,95',
        ingredient: 'IJzer',
        explanation: 'Hormonale schommelingen, met name bij vrouwen, leiden vaak tot ijzertekort en daarmee energieverlies.',
      },
      {
        handle: 'fittergy-rhodiola-500mg-60-vegetarische-capsules',
        priority: 5,
        tagline: 'Rhodiola rosea — Energie adaptogeen',
        productName: 'Fittergy Rhodiola 500mg 60 Vegetarische caps',
        price: '€39,59',
        ingredient: 'Rhodiola rosea',
        explanation: 'Ondersteunt de bijnierfunctie en hormonale veerkracht die vitaliteit en energie bepalen.',
      },
    ],
  },
  {
    id: 'hart_energie',
    goals: ['hart', 'energie'],
    answers: {},
    summary: 'Vermoeidheid in combinatie met cardiovasculaire bezorgdheid verdient extra aandacht — beide systemen delen veel onderliggende mechanismen. Deze producten ondersteunen hartfunctie én cellulaire energieproductie tegelijk.',
    products: [
      {
        handle: 'orthica-co-enzym-q10-100-30-softgels',
        priority: 1,
        tagline: 'Co-enzym Q10 — Cellen aan',
        productName: 'Orthica Co-enzym Q10 100mg 30 Softgels',
        price: '€33,50',
        ingredient: 'Co-enzym Q10',
        explanation: 'Ondersteunt hartspierenergie én algemene cellulaire energieproductie; cruciaal bij beide doelen.',
        dietTags: ['vis', 'gelatine'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
          vegetarisch: { handle: 'mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules', tagline: 'Magnesium malaat — Cel-energie', productName: 'Mattisson Magnesium Citraat Malaat met vit. B6 120 caps', price: '€19,95', ingredient: 'Magnesium malaat', explanation: 'Magnesiummalaat levert malaat, een schakel in de cellulaire energieproductie waar Q10 normaal aan bijdraagt — plantaardig en zonder vis of gelatine.' },
        },
      },
      {
        handle: 'arctic-blue-pure-visolie-300-milliliter',
        priority: 2,
        tagline: 'Omega-3 — Hartbeschermer',
        productName: 'Arctic Blue Pure visolie 300ml',
        price: '€27,90',
        ingredient: 'Omega-3',
        explanation: 'Beschermt hart en vaten én vermindert ontstekingsgerelateerde vermoeidheid.',
        dietTags: ['vis'],
        dietAlternatives: {
          vegan: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
          vegetarisch: { handle: 'mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules', tagline: 'Omega-3 algenolie — Plantaardig', productName: 'Mattisson Vegan Omega-3 Algenolie DHA 150mg EPA 75mg 60 caps', price: '€19,95', ingredient: 'Omega-3 (DHA/EPA)', explanation: 'Plantaardige omega-3 uit gekweekte algen — dezelfde DHA en EPA als visolie, zonder vis. Vegan-gecertificeerd.' },
        },
      },
      {
        handle: 'orthica-magnesium-400-120-tabletten',
        priority: 3,
        tagline: 'Magnesium — Hartritme steun',
        productName: 'Orthica Magnesium-400 120 Tabletten',
        price: '€33,95',
        ingredient: 'Magnesium',
        explanation: 'Essentieel voor hartritme én energieaanmaak; tekort raakt beide systemen tegelijk.',
      },
      {
        handle: 'orthica-stress-b-complex-180-tabletten',
        priority: 4,
        tagline: 'Vitamine B-complex — Energie fabriek',
        productName: 'Orthica Stress B Complex 180 Tabletten',
        price: '€40,95',
        ingredient: 'Vitamine B-complex',
        explanation: 'Ondersteunt energiemetabolisme én het cardiovasculaire systeem via homocysteïneregulatie.',
      },
      {
        handle: 'mattisson-vegan-vitamine-d3-75mcg-60-capsules',
        priority: 5,
        tagline: 'Vitamine D3 — Vaat gezondheid',
        productName: 'Mattisson Vegan Vitamine D3 75mcg 60 caps',
        price: '€13,95',
        ingredient: 'Vitamine D3',
        explanation: 'Ondersteunt bloeddrukregulatie én energieniveau; tekort verzwakt beide tegelijk.',
      },
    ],
    medicalDisclaimer: 'Onverklaarbare vermoeidheid in combinatie met cardiovasculaire klachten is altijd reden voor medisch onderzoek. Bespreek dit eerst met je huisarts voordat je supplementeert — symptomen kunnen op iets onderliggends wijzen.',
  },
];

// ============================================================================
// Mapping lookup helpers — gebruikt door consultation-engine.ts
// ============================================================================

/** Vind de mapping die bij een enkele-doel keuze hoort. */
export function findSingleGoalRule(
  goal: GoalKey,
  answer: string,
): MappingRule | undefined {
  return SINGLE_GOAL_RULES.find(
    (r) => r.goals.length === 1 && r.goals[0] === goal && r.answers[goal] === answer,
  );
}

/** Vind de mapping die bij een dubbele-doel paar hoort, ongeacht antwoorden. */
export function findDoubleGoalRule(
  goalA: GoalKey,
  goalB: GoalKey,
): MappingRule | undefined {
  return DOUBLE_GOAL_RULES.find((r) => {
    if (r.goals.length !== 2) return false;
    return (r.goals.includes(goalA) && r.goals.includes(goalB));
  });
}

/**
 * Voor dubbele-doel keuzes waarvoor géén unieke mapping bestaat (de 26 niet-
 * gecureerde paren): gebruik de individuele enkele-doel mappings en laat de
 * engine ze algoritmisch combineren.
 */
export function findFallbackPair(
  goalA: GoalKey, answerA: string,
  goalB: GoalKey, answerB: string,
): { ruleA?: MappingRule; ruleB?: MappingRule } {
  return {
    ruleA: findSingleGoalRule(goalA, answerA),
    ruleB: findSingleGoalRule(goalB, answerB),
  };
}
