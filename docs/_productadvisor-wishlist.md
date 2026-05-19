# Productadvisor — Wishlist voor latere fases

Ideeën en features die we **niet** in de eerste oplevering van fase 7
opnemen, maar wel willen onthouden voor latere iteraties.

---

## Bundle-suggestie ("Vaak samen gekozen")

**Wat**: aan het einde van de consultation, naast de 3 individuele
productaanbevelingen, een vierde block met *"Bestel deze 3 producten
samen en bespaar €X"* — één klik om alle 3 producten samen in de
winkelwagen te plaatsen met een kortings-incentive.

**Status**: ✋ Bewust uitgesteld — Stefan heeft hier zelf eerder ook
over nagedacht. Pakken we in een latere iteratie op, niet bij de
eerste live-versie.

**Waarom interessant**:
- Bewezen AOV-booster bij vergelijkbare supplement-quizzes
  (Care/of, Persona, HUM): typisch 15–30% hogere gemiddelde
  bestelwaarde vs single-product checkouts
- Voelt natuurlijk in een "advies"-context — de drie producten zijn
  immers al samen aanbevolen op basis van dezelfde antwoorden
- Lage technische drempel: cart-context kan meerdere variants
  tegelijk toevoegen (zie `CartContext.addItem`)

**Wat moet er voor opgelost zijn**:
1. **Kortings-mechanisme** in Shopify of via Storefront-discount-API
   (bundle-discount kan via Shopify Functions of via een handmatige
   discount-code die op-the-fly wordt aangemaakt)
2. **Kortingsstrategie bepalen**: vast bedrag (€8,50), percentage
   (10%), of voorbij-een-drempel ("bij €60 totaal: €8 korting")
3. **Visuele behandeling**: hoeveel ruimte krijgt de bundle vs de
   individuele producten? Bovenaan, onderaan, of als overlay?
4. **Conversie-tracking**: hoeveel klanten kiezen bundle vs individuele
   producten? GA4-event nodig

**Mogelijke uitbreidingen**:
- *Smart bundling* — niet altijd alle 3, soms de 2 meest gerelateerde
  producten (bv. 1 voor je doel + 1 ondersteunend)
- *Abonnement-bundle* — herhaalbestelling met extra korting (à la
  Care/of's maandelijkse pack)
- *"Starter pack" vs "Volledig pack"* — getrapte aanbeveling op
  basis van budget

---

## Doseringen & verpakkingsinhoud-keuze

**Wat**: voor producten die in meerdere doseringen of verpakkingsgroottes
bestaan (bv. een 60 caps vs 120 caps variant, of 250 mg vs 500 mg, of een
poeder in 200 g / 400 g / 550 g), de klant in de productkaart een keuze
geven — net zoals de smaak-kiezer voor ESN Whey (B1, geïmplementeerd
18 mei 2026).

**Status**: 🅿️ Geparkeerd op verzoek van Stefan (18 mei 2026). Voor nu
alleen genoteerd; mogelijk in een latere iteratie aanpakken.

**Waarom interessant**:
- Veel HLTY/Holland-Pharma-producten bestaan als losse Shopify-producten
  per dosering/grootte (zelfde patroon als de ESN-smaken: aparte products,
  geen varianten binnen één product)
- Klant kan kiezen wat bij zijn behoefte/budget past zonder de tool te
  verlaten
- Hoeveelheid-keuze beïnvloedt prijs-perceptie (grotere verpakking =
  vaak goedkoper per dosis → kan als waarde-argument dienen)

**Wat moet er voor opgelost worden**:
1. **Generiek keuze-mechanisme** — het `flavorOptions`-patroon (zie
   `MappingProduct` in `consultation-rules.ts`) is al generiek; een
   `variantOptions`/`sizeOptions`-veld zou exact hetzelfde werken. De
   smaak-kiezer-UI in `HealthConsultation.tsx` kan hergebruikt worden.
2. **Data verzamelen** — per product de bijbehorende dosering/grootte-
   handles + labels + prijzen ophalen uit Shopify (Storefront API),
   net als bij de ESN-smaken
3. **Curatie-keuze** — welke dosering is de "aanbevolen" default? En
   tonen we álle groottes of een selectie?
4. **Prijsweergave** — prijs moet meebewegen met de gekozen
   dosering/grootte (nu is `price` een statisch veld per product)

**Relatie tot bestaande code**: de B1-smaak-kiezer (ESN Whey) is in feite
de eerste toepassing van dit patroon. Uitbreiden naar doseringen/groottes
is grotendeels een data- en curatie-vraag, niet een nieuw mechanisme.

---

## Fase 4 — AI-fallback voor de vrije-tekst stap (stap 5)

**Wat**: een optionele 5e stap met een vrij tekstveld ("Iets specifieks
dat we moeten weten? — bv. een medicijn dat je gebruikt of een eerdere
ervaring met supplementen"). Als de klant dit invult, gaat de
rule-engine-uitkomst + de vrije tekst naar een AI-call die het advies
mág personaliseren (producten en/of uitleg bijstellen). Laat de klant
dit leeg → puur de deterministische regel-uitkomst (geen AI, geen kosten,
geen wachttijd).

**Status**: 🅿️ Geparkeerd (19 mei 2026). Stap 5 en de AI-fallback zijn
**uit de live flow gehaald** vóór de eerste feedback-ronde met
collega's/medisch professionals — een vrije-tekst-stap zonder werkende
verwerking zou verwarrend zijn. De quiz is nu een schone 4-stappen-flow
(doel → vervolgvraag → dieet → leefstijl → resultaat).

**Wat er nog staat in de code (klaar om te heractiveren)**:
- `runConsultationWithAI(input)` in `consultation-engine.ts` — bestaat
  nog, bevat de placeholder-logica (geeft nu de baseline terug). De UI
  roept deze niet meer aan; `submitConsultation` gebruikt `runConsultation`
  direct.
- `ConsultationInput.freeText` veld — blijft in het type bestaan, wordt
  nu altijd als lege string doorgegeven.
- Stap 5 UI (`'detail'` step + textarea) is **verwijderd** uit
  `HealthConsultation.tsx` (`Step`-type, `stepOrder`, render-blok,
  `detail`-state). Bij heractivatie moet dit terugkomen.

**Wat moet er voor opgelost worden bij heractivatie**:
1. **Stap 5 UI terugzetten** — `'detail'` toevoegen aan `Step` +
   `stepOrder`, het textarea-render-blok, `detail`-state, en
   `submitConsultation` weer `runConsultationWithAI` laten aanroepen met
   `freeText: detail`. Progress-teller weer "van 5".
2. **AI-endpoint** — er is een bestaand `/api/openai`-endpoint genoemd in
   het fase-7-plan; verifiëren of dat er is en werkt, anders opzetten.
3. **Prompt-ontwerp** — de rule-output (baseline `ConsultationResult`) +
   alle keuzes + de vrije tekst als context. AI mag producten/teksten
   bijstellen maar moet binnen het HLTY-assortiment + de tone blijven.
   Antwoord in JSON volgens het `ConsultationResult`-schema.
4. **Fallback bij API-fout** — bij elke fout (timeout, rate-limit,
   ongeldige JSON) gewoon de baseline tonen. De AI is verfijning, nooit
   een blocker.
5. **Veiligheid/aansprakelijkheid** — AI mag geen medische claims
   toevoegen; de bestaande disclaimer-logica blijft leidend. Mogelijk
   AI-output door een whitelist van assortiment-handles filteren.
6. **Kosten/caching** — alleen een AI-call wanneer stap 5 daadwerkelijk
   is ingevuld (≈10-20% van de klanten volgens het fase-7-onderzoek).

**Relatie tot bestaande code**: de hybride architectuur (Optie C) is
hier juist op ontworpen — het regel-pad is compleet en getest, de
AI-fallback is een additieve laag die er bovenop komt zonder de
deterministische basis te raken.

---

## Andere wishlist-items (toevoegen wanneer ze opkomen)

*(leeg — voeg toe wanneer Stefan of Claude een idee parkeert)*
