import type { LucideIcon } from 'lucide-react';
import {
  Accessibility,
  Activity,
  Apple,
  Award,
  BadgeCheck,
  Bandage,
  BookOpen,
  Calendar,
  CheckCircle2,
  Cross,
  Droplet,
  Dumbbell,
  FlaskConical,
  Flame,
  Flower,
  Footprints,
  Globe,
  Hand,
  Heart,
  HeartPulse,
  HelpingHand,
  Leaf,
  Lock,
  Microscope,
  Pill,
  Recycle,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Sprout,
  Stethoscope,
  Thermometer,
  ThumbsUp,
  Zap,
} from 'lucide-react';

export interface BrandPillar {
  icon: LucideIcon;
  label: string;
}

export interface Brand {
  /** Lowercase slug matching brandSlug(vendor) output */
  handle: string;
  /** Display name */
  name: string;
  /** One-line tagline shown under the wordmark on the hero side */
  tagline?: string;
  /** Optional hero image. If omitted a typographic placeholder is rendered. */
  heroImage?: string;
  /** 2-3 sentence brand story — what the brand stands for */
  story: string;
  /** 1-2 sentence reasoning why HLTY carries this brand */
  whyHlty: string;
  /** 3-5 scannable trust signals */
  pillars: BrandPillar[];
}

/**
 * Brand records — keyed by slug. To add a hero image for a brand:
 * 1. Drop a 1200×900 PNG (transparent bg) in /public/brands/<handle>.png
 * 2. Add `heroImage: '/brands/<handle>.png'` to that brand's entry
 */
export const BRANDS: Record<string, Brand> = {
  orthica: {
    handle: 'orthica',
    name: 'Orthica',
    tagline: 'Nederlands kwaliteitsmerk — ruim 40 jaar onderbouwd door wetenschap',
    heroImage: '/brands/orthica.png',
    story:
      'Orthica ontwikkelt formules op basis van onderzoek, niet op trends. Supplementen vullen aan — méér is niet beter. Daarom zijn de producten afgestemd op levensfase en getoetst door gezondheidsprofessionals.',
    whyHlty:
      'Geen concessies van grondstof tot eindproduct. Heldere formules, eigen kwaliteitscontrole — precies de zorgvuldigheid die wij van een supplement verwachten.',
    pillars: [
      { icon: ShieldCheck, label: 'HACCP-gecertificeerd' },
      { icon: Microscope, label: 'Eigen kwaliteitscontrole' },
      { icon: Leaf, label: 'GMO-vrij & niet doorstraald' },
      { icon: Sparkles, label: 'Zonder onnodige hulpstoffen' },
      { icon: BookOpen, label: 'Heldere formules' },
    ],
  },

  // ─── Supplementen & superfoods ───────────────────────────────

  mattisson: {
    handle: 'mattisson',
    name: 'Mattisson',
    tagline: 'Biologische superfoods en plantaardige basics — puur, onbewerkt',
    story:
      'Mattisson Healthstyle werkt met onbewerkte, biologische ingrediënten — van rauwe cacao tot lucuma en spirulina. De keuzes zijn plantaardig en de verwerking blijft minimaal, zodat de grondstof zelf het werk doet. Geen smaakmakers, geen vulstoffen.',
    whyHlty:
      'Geen marketing rond "superfoods" — alleen herkenbare grondstoffen met een eerlijk etiket. Precies de helderheid die wij van een biologisch basisproduct verwachten.',
    pillars: [
      { icon: Leaf, label: 'Biologisch gecertificeerd' },
      { icon: Sprout, label: 'Plantaardig assortiment' },
      { icon: Sparkles, label: 'Minimaal bewerkt' },
      { icon: CheckCircle2, label: 'Schoon etiket' },
      { icon: Globe, label: 'Transparante herkomst' },
    ],
  },

  'royal-green': {
    handle: 'royal-green',
    name: 'Royal Green',
    tagline: '100% biologische multivitamines uit hele voedingsbronnen',
    story:
      'Royal Green werkt uitsluitend met whole food-ingrediënten — vitamines en mineralen worden gehaald uit echte planten, kruiden en groenten. Geen synthetische isolaten, geen chemische bindmiddelen. De formules zijn vegan en biologisch gecertificeerd.',
    whyHlty:
      'Geen geïsoleerde poeders in een capsule — alleen voedingsstoffen zoals ze in de natuur voorkomen. Precies de aanpak die wij van een multivitamine verwachten.',
    pillars: [
      { icon: Leaf, label: '100% biologisch' },
      { icon: Apple, label: 'Whole food formules' },
      { icon: Sprout, label: 'Vegan' },
      { icon: Sparkles, label: 'Geen synthetische vitamines' },
      { icon: ShieldCheck, label: 'EU-organic gecertificeerd' },
    ],
  },

  vitakruid: {
    handle: 'vitakruid',
    name: 'Vitakruid',
    tagline: 'Kruiden en supplementen op orthomoleculaire basis',
    story:
      'Vitakruid bouwt formules rond bewezen werkzame doseringen — van curcuma tot magnesium en ashwagandha. Het uitgangspunt is orthomoleculair: voldoende dosering, goed opneembare vormen, geen onnodige toevoegingen. Vrijwel het volledige assortiment is vegan.',
    whyHlty:
      'Geen onderdoseerde formules — alleen hoeveelheden die in studies een verschil maken. Precies de zorgvuldigheid die wij van een supplement verwachten.',
    pillars: [
      { icon: FlaskConical, label: 'Orthomoleculaire dosering' },
      { icon: Sprout, label: 'Overwegend vegan' },
      { icon: BadgeCheck, label: 'Goed opneembare vormen' },
      { icon: Leaf, label: 'Plant- en kruidenbasis' },
      { icon: Sparkles, label: 'Geen onnodige hulpstoffen' },
    ],
  },

  biotona: {
    handle: 'biotona',
    name: 'Biotona',
    tagline: 'Raw, biologische superfoods uit de oorsprong',
    story:
      'Biotona haalt grondstoffen direct uit het land van herkomst — Peruviaanse maca, Indiase moringa, Ecuadoriaanse cacao. De producten worden raw verwerkt onder de 42°C, zodat enzymen en voedingsstoffen behouden blijven. Biologisch, vegan, zonder additieven.',
    whyHlty:
      'Geen "superfood"-marketing zonder onderbouwing — alleen rauwe, biologische grondstoffen met een controleerbare oorsprong. Dat is voor ons de basis.',
    pillars: [
      { icon: Leaf, label: 'Biologisch gecertificeerd' },
      { icon: Snowflake, label: 'Raw verwerkt onder 42°C' },
      { icon: Globe, label: 'Bekende herkomst' },
      { icon: Sprout, label: 'Vegan' },
      { icon: Sparkles, label: 'Zonder additieven' },
    ],
  },

  vitals: {
    handle: 'vitals',
    name: 'Vitals',
    tagline: 'Orthomoleculair, ontwikkeld in samenwerking met therapeuten',
    story:
      'Vitals ontwikkelt formules samen met orthomoleculair therapeuten en artsen — onderbouwd, hoog gedoseerd, met goed opneembare grondstofvormen. Het assortiment is opgebouwd rond toepassingen, niet rond trends. Veel formules zijn de standaard binnen de Nederlandse therapeutenpraktijk.',
    whyHlty:
      'Ontwikkeld voor therapeuten, beschikbaar voor consumenten — precies de onderbouwing die wij van een supplement verwachten. Geen onderdosering, geen overbodige ingrediënten.',
    pillars: [
      { icon: Microscope, label: 'Orthomoleculair onderbouwd' },
      { icon: ThumbsUp, label: 'Gebruikt door therapeuten' },
      { icon: BadgeCheck, label: 'Actieve grondstofvormen' },
      { icon: ShieldCheck, label: 'Eigen kwaliteitscontrole' },
      { icon: Sparkles, label: 'Geen onnodige hulpstoffen' },
    ],
  },

  aromed: {
    handle: 'aromed',
    name: 'Aromed',
    tagline: 'Pure etherische oliën en aromatherapie van therapeutische kwaliteit',
    story:
      'Aromed werkt met 100% pure etherische oliën — onverdund, op botanische soort gespecificeerd, met chargecontrole per partij. Naast losse oliën levert het merk diffusers en aromatherapie-blends gericht op concrete toepassingen zoals slaap, focus en ontspanning.',
    whyHlty:
      'Geen geparfumeerde olie onder de noemer "essentieel" — alleen pure, te traceren botanische oliën. Dat hoort bij echte aromatherapie.',
    pillars: [
      { icon: Droplet, label: '100% pure etherische olie' },
      { icon: Leaf, label: 'Botanisch gespecificeerd' },
      { icon: BadgeCheck, label: 'Therapeutische kwaliteit' },
      { icon: FlaskConical, label: 'Chargecontrole per partij' },
      { icon: Sparkles, label: 'Geen synthetische geur' },
    ],
  },

  yoko: {
    handle: 'yoko',
    name: 'Yoko',
    tagline: 'Functionele formules voor dagelijkse balans',
    story:
      'Yoko richt zich op heldere, toepassingsgerichte supplementen — geen enorm assortiment, wel doordachte combinaties rond energie, herstel en ontspanning. De formules zijn opgezet rond een beperkt aantal werkzame ingrediënten, in herkenbare doseringen.',
    whyHlty:
      'Geen overvolle ingrediëntenlijsten — alleen wat het etiket waarmaakt. Precies de eenvoud die wij van een dagelijks supplement verwachten.',
    pillars: [
      { icon: CheckCircle2, label: 'Heldere formules' },
      { icon: Activity, label: 'Functioneel toepassingsgericht' },
      { icon: Sparkles, label: 'Geen onnodige hulpstoffen' },
      { icon: BadgeCheck, label: 'Herkenbare doseringen' },
    ],
  },

  'natures-answer': {
    handle: 'natures-answer',
    name: "Nature's Answer",
    tagline: 'Plantaardige extracten volgens traditionele kruidengeneeskunde — sinds 1972',
    story:
      "Nature's Answer is een Amerikaans familiebedrijf dat al meer dan vijftig jaar plantaardige extracten produceert. Eigen kweek, eigen extractielab, eigen kwaliteitscontrole — van blad tot fles in één keten. De Holistically Balanced-methode behoudt de natuurlijke verhouding van actieve stoffen in de plant, niet alleen één geïsoleerde component.",
    whyHlty:
      'Geen marketing rond exotische superfoods — alleen kruidenextracten met traceable herkomst en een gecontroleerde productieketen. Precies de zorgvuldigheid die wij van een botanisch supplement verwachten.',
    pillars: [
      { icon: Leaf, label: 'Plantaardige extracten' },
      { icon: FlaskConical, label: 'Eigen extractielab' },
      { icon: ShieldCheck, label: 'GMP-gecertificeerd' },
      { icon: BookOpen, label: 'Sinds 1972' },
      { icon: Sparkles, label: 'Alcoholvrije tincturen' },
    ],
  },

  // ─── Sport & performance ───────────────────────────────

  esn: {
    handle: 'esn',
    name: 'ESN',
    tagline: 'Duitse sportvoeding — laboratorium-getest, transparant gedoseerd',
    story:
      'ESN (Elite Sports Nutrition) ontwikkelt en produceert sportvoeding in Duitsland, met strikte controle op grondstoffen en eindproduct. Doseringen op het etiket zijn de doseringen in het product — geen proprietary blends, geen verstopte ingrediënten. Whey, creatine en pre-workouts volgens formules die het werk doen, niet de marketing.',
    whyHlty:
      'Geen fancy smaakjes als verkooptruc — alleen sportvoeding met heldere etiketten en onafhankelijke laboratoriumcontrole. Het type transparantie waar wij in een sportcategorie op blijven hameren.',
    pillars: [
      { icon: Dumbbell, label: 'Voor sport & herstel' },
      { icon: Microscope, label: 'Lab-getest per batch' },
      { icon: BadgeCheck, label: 'Made in Germany' },
      { icon: CheckCircle2, label: 'Transparante etiketten' },
      { icon: Flame, label: 'Pre-workout & whey' },
    ],
  },

  fittergy: {
    handle: 'fittergy',
    name: 'Fittergy',
    tagline: 'Nederlandse supplementen — wat erop staat, zit erin',
    story:
      'Fittergy is een Nederlands supplementenmerk dat zich richt op zuivere, enkelvoudige formules. Geen overbodige vulstoffen, geen onnodige toevoegingen — vitaminen en mineralen in goed opneembare vormen. De vegetarische capsules en heldere doseringen maken het bruikbaar in een doordacht supplementenschema.',
    whyHlty:
      'Geen multivitamine-bommen met dertig stoffen tegelijk — alleen losse, gerichte aanvullingen. Zo bouw je een schema op basis van wat jouw lichaam mist, niet op basis van wat het etiket belooft.',
    pillars: [
      { icon: ShieldCheck, label: 'Zuivere formules' },
      { icon: Leaf, label: 'Vegetarische capsules' },
      { icon: CheckCircle2, label: 'Zonder onnodige vulstoffen' },
      { icon: BadgeCheck, label: 'Nederlandse productie' },
      { icon: Heart, label: 'Dagelijkse aanvulling' },
    ],
  },

  'max-sport': {
    handle: 'max-sport',
    name: 'Max Sport',
    tagline: 'Eiwitrepen en sportvoeding — eenvoudige ingrediëntenlijst, doseringen die kloppen',
    story:
      "Max Sport maakt eiwitrepen en sportvoeding zonder de gebruikelijke ballast. Korte ingrediëntenlijsten, herkenbare bestanddelen, eiwitgehaltes die overeenkomen met wat op de verpakking staat. Geschikt voor sporters die hun macro's in de gaten houden, en voor wie tussen trainingen door iets bruikbaars zoekt.",
    whyHlty:
      'Geen reep die meer suiker dan eiwit bevat — alleen sportvoeding waarvan de voedingswaarde standhoudt bij kritisch lezen. Dat is de minimumgrens die wij voor deze categorie hanteren.',
    pillars: [
      { icon: Dumbbell, label: 'Voor sport & herstel' },
      { icon: Zap, label: 'Hoog eiwitgehalte' },
      { icon: CheckCircle2, label: 'Korte ingrediëntenlijst' },
      { icon: Activity, label: 'Voor en na training' },
    ],
  },

  'the-green-athlete': {
    handle: 'the-green-athlete',
    name: 'The Green Athlete',
    tagline: 'Plantaardige sportvoeding — voor prestatie zonder dierlijke ingrediënten',
    story:
      'The Green Athlete is een Nederlands merk dat sportvoeding maakt op puur plantaardige basis. Eiwitten uit erwt, rijst en hennep — gecombineerd in verhoudingen die het volledige aminozuurprofiel dekken. Geen lactose, geen dierlijke ingrediënten, geen onnodige zoetstoffen.',
    whyHlty:
      'Geen "plantaardig" als marketinglabel op een product dat verder hetzelfde is — alleen sportvoeding die vanaf de formule is opgebouwd rond plantaardige bronnen. Voor sporters die de eiwitinname willen halen zonder zuivel.',
    pillars: [
      { icon: Sprout, label: 'Volledig plantaardig' },
      { icon: Dumbbell, label: 'Voor sport & herstel' },
      { icon: Leaf, label: 'Geen lactose of zuivel' },
      { icon: BadgeCheck, label: 'Made in NL' },
      { icon: Recycle, label: 'Duurzame keten' },
    ],
  },

  vitility: {
    handle: 'vitility',
    name: 'Vitility',
    tagline: 'Hulpmiddelen voor zelfredzaamheid — ontworpen voor dagelijks gebruik',
    story:
      'Vitility is een Nederlands merk dat hulpmiddelen ontwerpt voor mensen die hun zelfstandigheid willen behouden. Van grijpers en pillendoosjes tot aankleedhulpjes en keukenhulpen — producten met aandacht voor ergonomie en houdbaarheid. Ontwikkeld in samenwerking met therapeuten en eindgebruikers.',
    whyHlty:
      'Geen medische uitstraling waar het niet hoeft — alleen praktische hulpmiddelen die het verschil maken in een gewone dag. Past bij hoe wij naar fysieke zelfredzaamheid kijken: klein in opzet, groot in effect.',
    pillars: [
      { icon: HelpingHand, label: 'Voor zelfredzaamheid' },
      { icon: Accessibility, label: 'Ergonomisch ontwerp' },
      { icon: ShieldCheck, label: 'Veilig in dagelijks gebruik' },
      { icon: BadgeCheck, label: 'Nederlandse ontwikkeling' },
      { icon: Hand, label: 'Praktisch toepasbaar' },
    ],
  },

  activo: {
    handle: 'activo',
    name: 'Activo',
    tagline: 'Functionele supplementen voor een actief leven',
    story:
      'Activo richt zich op supplementen die ondersteunen wat een actief lichaam vraagt — gewrichten, spierherstel, dagelijkse energie. Formules op basis van bewezen ingrediënten in werkbare doseringen, zonder de overkill van een complete sportvoedingslijn. Bedoeld voor mensen die bewegen, niet per se voor wie traint voor wedstrijden.',
    whyHlty:
      'Geen "performance"-claims voor een breed publiek — alleen ondersteuning waar een gewoon-actief lichaam baat bij heeft. Dat is precies de positie tussen sport en dagelijkse aanvulling die wij binnen onze selectie willen dekken.',
    pillars: [
      { icon: Activity, label: 'Voor een actief leven' },
      { icon: HeartPulse, label: 'Gewrichten & herstel' },
      { icon: CheckCircle2, label: 'Bewezen ingrediënten' },
      { icon: ShieldCheck, label: 'Werkbare doseringen' },
    ],
  },

  // ─── Orthopedie & physio recovery ───────────────────────────────

  cellacare: {
    handle: 'cellacare',
    name: 'Cellacare',
    tagline: 'Duitse medische orthesen — ontwikkeld met orthopeden',
    story:
      'Cellacare is het orthese-merk van L&R (Lohmann & Rauscher) — een Duitse medische groep met meer dan honderd jaar ervaring in wondzorg en compressietherapie. De braces en bandages worden ontwikkeld in samenwerking met orthopedisch chirurgen en fysiotherapeuten. Geen sport-accessoires — medische hulpmiddelen.',
    whyHlty:
      'Geen modieuze sleeves — alleen medisch geclassificeerde orthesen met bewezen pasvorm en stabilisatie. Precies wat fysiotherapeuten van een knie- of polsbrace verwachten.',
    pillars: [
      { icon: Stethoscope, label: 'Medisch hulpmiddel (CE)' },
      { icon: Award, label: 'Duits ontwikkeld en geproduceerd' },
      { icon: ShieldCheck, label: 'Stabilisatie en herstel' },
      { icon: BadgeCheck, label: 'Gebruikt in klinieken' },
    ],
  },

  'toco-tholin': {
    handle: 'toco-tholin',
    name: 'Toco Tholin',
    tagline: 'Sinds 1932 — Nederlandse spierbalsem met menthol en kamfer',
    story:
      'Toco Tholin werd in 1932 ontwikkeld in Rotterdam door drogist Tholen. De formule — een mix van menthol, kamfer en etherische oliën — is sindsdien nagenoeg ongewijzigd. Een Nederlands huishoud-staple voor spieren, gewrichten en verkoudheid.',
    whyHlty:
      'Geen trendy CBD-balsem — een formule die al bijna een eeuw in dezelfde flesjes verkocht wordt. Toco Tholin werkt omdat het werkt, niet omdat het marketing heeft.',
    pillars: [
      { icon: Calendar, label: 'Nederlands erfgoed sinds 1932' },
      { icon: Flame, label: 'Verwarmend bij spierpijn' },
      { icon: Snowflake, label: 'Verkoelende menthol-kamferformule' },
      { icon: BookOpen, label: 'Ongewijzigd recept' },
    ],
  },

  futuro: {
    handle: 'futuro',
    name: 'Futuro',
    tagline: 'Orthopedische supports van 3M — gebouwd op meet-en-meetbaar',
    story:
      "Futuro is sinds 1955 onderdeel van 3M, het Amerikaanse industriële concern dat ook achter medische pleisters en wondzorg zit. De braces, bandages en compressiekousen worden ontwikkeld volgens dezelfde materiaalstandaarden als 3M's klinische lijn. Compact, herhaalbaar, klinisch onderbouwd.",
    whyHlty:
      'Geen drogisterij-elastiek — 3M-engineering vertaald naar dagelijkse ondersteuning bij blessures en preventie. Precies wat je van een polsbrace of compressiekous mag verwachten.',
    pillars: [
      { icon: ShieldCheck, label: 'Onderdeel van 3M Health Care' },
      { icon: Activity, label: 'Voor sport en dagelijks gebruik' },
      { icon: BadgeCheck, label: 'Klinisch gevalideerd materiaal' },
      { icon: CheckCircle2, label: 'Consistent in maat en pasvorm' },
    ],
  },

  'kt-tape': {
    handle: 'kt-tape',
    name: 'KT Tape',
    tagline: 'Kinesiologische tape — gebruikt door olympische fysiotherapeuten',
    story:
      'KT Tape is in 2008 opgericht in Utah door fysiotherapeut Jim Jones, die zijn eigen versie ontwikkelde van de kinesiologie-tape die hij in zijn praktijk gebruikte. Synthetische vezels, sterker elastiek en een lijmlaag die meerdere dagen blijft zitten — ook onder de douche. Officieel sponsor van talloze Olympische teams.',
    whyHlty:
      'Geen decoratieve sport-tape — een tape die door fysiotherapeuten gebruikt wordt voor pijnverlichting, ondersteuning en proprioceptie. Bewezen tijdens trainingen, niet alleen in advertenties.',
    pillars: [
      { icon: Dumbbell, label: 'Officiële tape Olympische teams' },
      { icon: Droplet, label: 'Waterbestendig — dagen draagbaar' },
      { icon: Activity, label: 'Ondersteunt zonder te blokkeren' },
      { icon: Zap, label: 'Synthetische vezels voor extra rek' },
    ],
  },

  epitact: {
    handle: 'epitact',
    name: 'Epitact',
    tagline: 'Franse voet- en handorthesen — siliconen-gel die meebeweegt',
    story:
      'Epitact is een Frans medical-device merk, opgericht in 2003 door ingenieurs en podologen. Het kernpatent: Epithelium-gel, een dunne siliconen-laag die druk verdeelt zonder volume toe te voegen. Hallux valgus-spalken, teen-beschermers en handorthesen — ontwikkeld in samenwerking met Franse ziekenhuizen.',
    whyHlty:
      'Geen plakkertjes uit het schap — gepatenteerde orthesen die door podologen worden voorgeschreven bij hallux valgus, hamertenen en CMC-artrose. Precisie voor de voet, niet vulling.',
    pillars: [
      { icon: Footprints, label: 'Specialist in voet- en handorthesen' },
      { icon: Sparkles, label: 'Gepatenteerde Epithelium-gel' },
      { icon: Stethoscope, label: 'Ontwikkeld met podologen' },
      { icon: BadgeCheck, label: 'Frans medical-device merk' },
    ],
  },

  aquashield: {
    handle: 'aquashield',
    name: 'Aquashield',
    tagline: 'Waterdichte beschermers voor gips, wonden en infusen',
    story:
      'Aquashield maakt herbruikbare, waterdichte hoezen voor armen, benen, voeten en wondverbanden. Een latexvrije manchet sluit volledig af — patiënten kunnen douchen, baden of zwemmen zonder dat het verband, gips of de pleisterhechting nat wordt. Wordt voorgeschreven in ziekenhuizen en thuiszorg.',
    whyHlty:
      'Geen plastic zakken met elastiek — een gepatenteerde afsluiting die door zorgprofessionals wordt aanbevolen na operatie of bij langdurig verband. Eenvoudig probleem, klinisch opgelost.',
    pillars: [
      { icon: Droplet, label: '100% waterdicht — getest in douche en bad' },
      { icon: Lock, label: 'Latexvrije sluitmanchet' },
      { icon: Cross, label: 'Voor gips, verband en infusen' },
      { icon: CheckCircle2, label: 'Herbruikbaar' },
    ],
  },

  'able-2': {
    handle: 'able-2',
    name: 'Able 2',
    tagline: 'Nederlandse hulpmiddelen voor dagelijks gebruik — sinds 1978',
    story:
      'Able 2 is een Nederlands familiebedrijf dat sinds 1978 hulpmiddelen ontwikkelt voor mensen met beperkte mobiliteit, kracht of fijne motoriek. Eet- en drinkhulpen, aankleedhulpen, badkamer-aanpassingen — geselecteerd in samenwerking met ergotherapeuten. Praktisch, niet stigmatiserend.',
    whyHlty:
      'Geen ouderwetse zorghulpmiddelen — doordachte producten die ergotherapeuten daadwerkelijk aanbevelen aan hun patiënten. Functioneel, betaalbaar, Nederlands geleverd.',
    pillars: [
      { icon: Accessibility, label: 'Voor zelfstandig dagelijks leven' },
      { icon: HelpingHand, label: 'Door ergotherapeuten geselecteerd' },
      { icon: Calendar, label: 'Nederlands familiebedrijf sinds 1978' },
      { icon: CheckCircle2, label: 'Compleet assortiment' },
    ],
  },

  // ─── Medische apparatuur, EHBO & overig ───────────────────────────────

  medisana: {
    handle: 'medisana',
    name: 'Medisana',
    tagline: 'Duitse meettechniek voor thuis — al sinds 1981',
    story:
      'Medisana ontwikkelt medische apparatuur voor thuisgebruik sinds 1981 — bloeddrukmeters, thermometers, weegschalen en TENS-apparaten. Engineering uit Neuss, met focus op klinisch correcte metingen in plaats van gadgets. Wereldwijd actief in meer dan 60 landen.',
    whyHlty:
      'Geen consumenten-elektronica met een meet-functie — alleen medisch gecertificeerde apparatuur die doet wat ze belooft. Precies wat wij van een meetinstrument verwachten.',
    pillars: [
      { icon: ShieldCheck, label: 'Medisch CE-gecertificeerd' },
      { icon: Activity, label: 'Klinisch gevalideerde metingen' },
      { icon: Award, label: 'Duitse engineering sinds 1981' },
      { icon: HeartPulse, label: 'Voor thuisgebruik ontwikkeld' },
    ],
  },

  geratherm: {
    handle: 'geratherm',
    name: 'Geratherm',
    tagline: 'De pioniers van de kwikvrije glasthermometer',
    story:
      'Geratherm Medical AG bouwt sinds 1979 in Thüringen medische meetinstrumenten — bekend van de kwikvrije Geratherm Classic-thermometer met Galinstan-vulling. Een Duits beursgenoteerd medtech-bedrijf dat zijn naam maakte met een eerlijke oplossing voor het kwik-probleem.',
    whyHlty:
      'Geen plastic wegwerp-elektronica — een glasthermometer die meegaat, exact meet en zonder batterij werkt. De rustige keuze.',
    pillars: [
      { icon: Thermometer, label: 'Kwikvrij sinds 1997' },
      { icon: ShieldCheck, label: 'Medisch hulpmiddel klasse IIa' },
      { icon: Award, label: 'Made in Germany' },
      { icon: Recycle, label: 'Herbruikbaar, geen batterijen' },
    ],
  },

  emdee: {
    handle: 'emdee',
    name: 'Emdee',
    tagline: 'Eenvoudige verzorging voor droge, gevoelige huid',
    story:
      'Emdee is een Nederlands huidverzorgingsmerk met een korte ingrediëntenlijst — bekend van het Wondermiddeltje, een verzachtende crème voor geïrriteerde huid. Geen parfum, geen onnodige toevoegingen, betaalbaar verkrijgbaar bij drogist en apotheek.',
    whyHlty:
      'Geen routine met tien stappen — één pot voor de momenten dat de huid rust nodig heeft. Werkt, dus daarom staat het erin.',
    pillars: [
      { icon: Droplet, label: 'Parfum- en kleurstofvrij' },
      { icon: CheckCircle2, label: 'Korte ingrediëntenlijst' },
      { icon: Leaf, label: 'Voor de gevoelige huid' },
      { icon: Sparkles, label: 'Nederlandse formulering' },
    ],
  },

  nexcare: {
    handle: 'nexcare',
    name: 'Nexcare',
    tagline: 'Wondverzorging op basis van 3M-pleistertechnologie',
    story:
      'Nexcare is het wondverzorgingsmerk van 3M — pleisters, blarenpleisters en tapes die voortbouwen op decennia aan kleeftechnologie uit de medische wereld. De pleister die je in het ziekenhuis krijgt, voor thuis.',
    whyHlty:
      'Geen pleisters die loslaten bij het eerste contact met water — alleen kleefkracht en huidvriendelijkheid die zich in de zorg bewezen hebben.',
    pillars: [
      { icon: Bandage, label: 'Medische kleeftechnologie' },
      { icon: ShieldCheck, label: 'Hypoallergene varianten' },
      { icon: Droplet, label: 'Waterbestendig' },
      { icon: Award, label: '3M-kwaliteit' },
    ],
  },

  chemodis: {
    handle: 'chemodis',
    name: 'Chemodis',
    tagline: 'Nederlandse leverancier van klinische verbruiksartikelen',
    story:
      'Chemodis levert sinds decennia farmaceutische generica, verbandmiddelen en EHBO-producten aan apotheken, zorginstellingen en groothandel in Nederland. Geen merknaam die op tv komt — een leverancier die de basis levert die in elke verbandtrommel hoort.',
    whyHlty:
      'Geen merkpremie voor wat in elke EHBO-kit hoort — alleen producten die voldoen aan de Nederlandse apothekersnormen. Functioneel, betrouwbaar, zonder opsmuk.',
    pillars: [
      { icon: Cross, label: 'EHBO en verbandmiddelen' },
      { icon: ShieldCheck, label: 'Apotheekkwaliteit' },
      { icon: BadgeCheck, label: 'Nederlandse distributie' },
      { icon: CheckCircle2, label: 'Functioneel zonder opsmuk' },
    ],
  },

  heka: {
    handle: 'heka',
    name: 'Heka',
    tagline: 'Praktijkmateriaal voor de zorgprofessional',
    story:
      'Heka levert medische verbruiksartikelen en praktijkbenodigdheden — denk aan onderzoektafelpapier, handschoenen, depressors en eenvoudige diagnostische instrumenten. Een merk dat je tegenkomt in elke huisartsen- en fysiopraktijk.',
    whyHlty:
      'Geen consumentenversie van praktijkmateriaal — exact wat onze fysiotherapeuten zelf in de praktijk gebruiken.',
    pillars: [
      { icon: Stethoscope, label: 'Voor de zorgpraktijk' },
      { icon: CheckCircle2, label: 'Praktijkbewezen' },
      { icon: BadgeCheck, label: 'Professionele kwaliteit' },
      { icon: ShieldCheck, label: 'Voldoet aan zorgnormen' },
    ],
  },

  '3m': {
    handle: '3m',
    name: '3M',
    tagline: 'Materiaalkunde toegepast op gezondheid en veiligheid',
    story:
      '3M is een Amerikaanse industriële groep waarvan de medische divisie kleef-, wond- en beschermingstechnologie levert aan ziekenhuizen wereldwijd. Bekend van Micropore-tape, Tegaderm-folie en mondkappen die in elke zorgsetting standaard zijn.',
    whyHlty:
      'Geen no-name alternatief voor iets dat door de hele zorg gebruikt wordt — de originele oplossing, niet de imitatie.',
    pillars: [
      { icon: FlaskConical, label: 'Industriële R&D' },
      { icon: ShieldCheck, label: 'Standaard in de zorg' },
      { icon: BadgeCheck, label: 'Wereldwijd vertrouwd' },
    ],
  },

  brita: {
    handle: 'brita',
    name: 'Brita',
    tagline: 'Waterfilters voor dagelijks gebruik — sinds 1966',
    story:
      'Brita ontwikkelt sinds 1966 in Taunusstein actief-koolfilters die kraanwater verbeteren — minder kalk, minder chloor, minder zware metalen. Een Duits familiebedrijf dat van waterfiltratie een huishoudelijk gegeven heeft gemaakt.',
    whyHlty:
      'Geen flessenwater meer slepen — schoner water uit de eigen kraan, met cartridges die je gewoon vervangt. Praktisch, niet ideologisch.',
    pillars: [
      { icon: Droplet, label: 'Actief-koolfiltratie' },
      { icon: Recycle, label: 'Cartridges retour-recyclebaar' },
      { icon: Award, label: 'Duits familiebedrijf sinds 1966' },
      { icon: CheckCircle2, label: 'NSF/TÜV-getest' },
    ],
  },

  modifast: {
    handle: 'modifast',
    name: 'Modifast',
    tagline: 'Klinisch maaltijdvervangend programma voor gewichtsverlies',
    story:
      'Modifast is een medisch onderbouwd VLCD-programma (Very Low Calorie Diet) — shakes, soepen en repen met een afgewogen profiel aan eiwit, vitamines en mineralen. Ontwikkeld voor gestructureerd gewichtsverlies onder begeleiding, niet voor lifestyle-diëten.',
    whyHlty:
      'Geen detox-thee of vage afslank-belofte — een programma met voedingsprofiel dat voldoet aan de Europese norm voor maaltijdvervanging. Werkt op de manier zoals het bedoeld is.',
    pillars: [
      { icon: FlaskConical, label: 'Klinisch onderbouwde VLCD' },
      { icon: BadgeCheck, label: 'EU-norm 2017/1798' },
      { icon: Activity, label: 'Volledig voedingsprofiel' },
      { icon: HeartPulse, label: 'Begeleid gewichtsverlies' },
    ],
  },

  vsm: {
    handle: 'vsm',
    name: 'VSM',
    tagline: 'Nederlandse natuurgeneesmiddelen sinds 1923',
    story:
      'VSM — Vereenigde Specialiteiten Maatschappij — produceert sinds 1923 in Alkmaar homeopathische en fytotherapeutische geneesmiddelen. Iedere VSM-formule is geregistreerd als geneesmiddel bij het CBG, met een vaste samenstelling en bijsluiter.',
    whyHlty:
      'Geen supplement met een vage claim — een geregistreerd geneesmiddel met een dosering die getoetst is. De Nederlandse standaard voor natuurgeneeskunde.',
    pillars: [
      { icon: BookOpen, label: 'Sinds 1923' },
      { icon: BadgeCheck, label: 'CBG-geregistreerd geneesmiddel' },
      { icon: Leaf, label: 'Plantaardige werkstoffen' },
      { icon: Flower, label: 'Homeopathie en fytotherapie' },
      { icon: ShieldCheck, label: 'Vaste samenstelling per bijsluiter' },
    ],
  },

  nutritex: {
    handle: 'nutritex',
    name: 'Nutritex',
    tagline: 'Voedingssupplementen zonder onnodige toevoegingen',
    story:
      'Nutritex is een Nederlandse supplementenlijn met een rechte productfilosofie — vitamines, mineralen en kruidenextracten zonder kleurstoffen, suikers of overbodige hulpstoffen. Gemaakt voor wie de etiketten leest.',
    whyHlty:
      'Geen supplementen die marketing in plaats van milligrammen verkopen — alleen een schone formule met een leesbare bijsluiter.',
    pillars: [
      { icon: Pill, label: 'Schone formuleringen' },
      { icon: CheckCircle2, label: 'Zonder kleur- en zoetstoffen' },
      { icon: Leaf, label: 'Vitamines en kruidenextracten' },
      { icon: BadgeCheck, label: 'Nederlandse productie' },
    ],
  },

  primavera: {
    handle: 'primavera',
    name: 'Primavera',
    tagline: 'Biologische aromatherapie uit de Allgäu',
    story:
      'Primavera Life produceert sinds 1986 etherische oliën, plantenoliën en aromatherapie — in eigen biologische teelt en directe samenwerking met telers wereldwijd. Demeter- en bio-gecertificeerd, met een zichtbare keten van plant tot fles.',
    whyHlty:
      'Geen geurolie uit een chemiefabriek — 100% pure etherische oliën met biologische herkomst die je in een diffuser of carrier kunt gebruiken. Aromatherapie zoals het bedoeld is.',
    pillars: [
      { icon: Leaf, label: '100% biologisch' },
      { icon: Sprout, label: 'Demeter-gecertificeerd' },
      { icon: Flower, label: 'Etherische oliën sinds 1986' },
      { icon: Globe, label: 'Directe samenwerking met telers' },
      { icon: BadgeCheck, label: 'Voedingsmiddelenkwaliteit' },
    ],
  },

  'arctic-blue': {
    handle: 'arctic-blue',
    name: 'Arctic Blue',
    tagline: 'Wild Noord-Atlantische omega-3, koud geperst',
    story:
      'Arctic Blue is een Scandinavische omega-3 visolie uit wilde, duurzaam beviste Noord-Atlantische vis — koud verwerkt om de EPA- en DHA-structuur intact te houden. Friend of the Sea-gecertificeerd en getest op zware metalen.',
    whyHlty:
      'Geen oxidatieve visolie met een nasmaak — een verse, transparant gewonnen omega-3 met een meetbaar EPA/DHA-gehalte. De olie die we zelf zouden kopen.',
    pillars: [
      { icon: Snowflake, label: 'Koud verwerkt' },
      { icon: Globe, label: 'Friend of the Sea' },
      { icon: FlaskConical, label: 'Getest op zware metalen' },
      { icon: HeartPulse, label: 'EPA en DHA' },
    ],
  },
};

export function getBrand(handle: string): Brand | null {
  return BRANDS[handle.toLowerCase()] ?? null;
}
