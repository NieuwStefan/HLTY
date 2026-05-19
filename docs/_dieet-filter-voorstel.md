# Dieet-filter — definitief voorstel (na onderzoek per product)

**Status:** ✅ GEÏMPLEMENTEERD (18 mei 2026). Alle dieet-info geverifieerd via
productpagina's op HLTY.shop. Akkoord van Stefan op de aanpak (1-op-1
alternatieven per product per dieet). Verwerkt in `consultation-rules.ts`
(35 product-voorkomens getagd) + `consultation-engine.ts` (substitutie-engine).
Live getest in browser: whey→Vegan Protein en Q10→Magnesium malaat
substituties bevestigd werkend.

**Slotnoten bij implementatie:**
- 5 alternatieven gekozen, allemaal reeds actief op de site (geen Shopify-
  toevoeging nodig, dus geen HLTY-tag-actie vereist deze keer):
  - visolie → `mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules` (€19,95)
  - vis-collageen → `mattisson-collagen-alternative-vegan-60-vegetarische-capsules` (€20,95)
  - whey → `mattisson-vegan-protein-erwten-rijst-vanille-bio-500-gram` (€23,95)
  - glucosamine → `mattisson-vegan-msm-poeder-pure-550-gram` (€16,95)
  - Q10 → `mattisson-magnesium-citraat-malaat-met-actieve-vorm-vit-b6-120-vegetarische-capsules` (€19,95)
- Q10-keuze: geen vegan Q10 in assortiment → uit bestaand merk (Mattisson)
  een functioneel alternatief gekozen: magnesiummalaat (malaat = schakel in
  mitochondriale energieproductie, Q10's rol). Eén universele vervanger voor
  alle 11 Q10-scenario's.
- Verificatie-vondsten tijdens onderzoek: Arctic Blue Algenolie bleek 100%
  vegan (geen tag nodig); Royal Green Q10 én Whey Isolate bevatten beide
  dierlijke ingrediënten (visgelatine resp. lactose) → niet bruikbaar als
  alternatief.

---

---

## Hoe werkt het straks?

1. Elk product krijgt een `dietTags`-lijst, bv. `['whey', 'lactose']` of `['vis']`. **Deze tags zijn intern aan deze tool** — niet uit Shopify, volledig onder onze controle in [consultation-rules.ts](../src/lib/consultation-rules.ts).
2. Producten die aan een dieet-conflict voldoen krijgen óók een `dietAlternatives`-veld: per dieet een aangewezen vervangend product (Shopify-handle).
3. **Engine-werking:** als klant een dieet kiest dat dit product uitsluit → engine ruilt het product om voor het aangewezen alternatief, of laat het weg als er geen alternatief is.

---

## Dieet-uitsluit configuratie

| Dieet | Sluit producten uit met deze tags |
|---|---|
| Vegan | `whey`, `vis`, `gelatine`, `lactose`, `schaaldier` |
| Vegetarisch | `vis`, `gelatine`, `schaaldier` |
| Lactosevrij | `whey`, `lactose` |
| Glutenvrij | `gluten` (geen producten op de huidige lijst met deze tag) |
| Suikervrij | `toegevoegde-suiker` (geen producten op de huidige lijst met deze tag) |
| Geen specifieke wensen | (geen filtering) |

**Nieuwe tag-namen** ten opzichte van de oude config:
- `vis` (preciezer dan `visolie` — dekt visolie + vis-collageen + visgelatine)
- `schaaldier` (voor glucosamine — vegan + vegetarisch uit)

---

## De 27 producten — classificatie

### 21 producten zonder restricties (vegan-OK, geverifieerd)

Allemaal expliciet vegan of vegetarisch geschikt op productpagina HLTY.shop. Geen tags nodig.

| # | Product | Bewijs |
|---|---|---|
| 1 | Arctic Blue Algenolie DHA en EPA 90 Softgels | **"100% Vegan-gecertificeerd"** — softgel van glycerol + erwtenzetmeel + carrageen |
| 5 | Fittergy 5-HTP 100mg Griffonia Extract | HPMC vegetarische capsule |
| 6 | Fittergy Rhodiola 500mg | "Vegetarische caps" |
| 7 | Mattisson Ashwagandha KSM-66 Bio | HPMC vegetarische capsule |
| 8 | Mattisson D3/K2 Vegan Druppels | Expliciet "Vegan" |
| 9 | Mattisson Gefermenteerde L-Leucine | "vegan MCT poeder" + HPMC vegetarisch |
| 11 | Mattisson L-Theanine Sunphenon | HPMC vegetarisch |
| 12 | Mattisson Probisson 30 mld CFU | HPMC vegetarische capsule |
| 13 | Mattisson Valeriaan Relax Complex | HMPC capsule |
| 14 | Mattisson Vegan IJzer Bisglycinaat | Expliciet "Vegan" |
| 15 | Mattisson Vegan MSM Poeder Pure | Expliciet "Vegan" |
| 16 | Mattisson Vegan Vitamine D3 | Expliciet "Vegan" |
| 17 | Natures Answer Sambucus Vlierbessen | "Veganistisch" + plantaardige glycerine |
| 18 | Orthica B6-10 Co-enzym | "Vegetarische caps" |
| 20 | Orthica Magnesium-400 | "Geschikt voor vegetariërs en veganisten" |
| 21 | Orthica Stress B Complex | "Geschikt voor vegetariërs en veganisten" |
| 22 | Orthica Tri-Zink-25 | "Vegacapsules" |
| 23 | Orthica Vitamine C-1000 | "Geschikt voor vegetariërs en veganisten" |
| 24 | The Green Athlete Beta Alanine | Expliciet "Veganistisch" + glutenvrij |
| 25 | Vitakruid Creatine Monohydraat | Synthetisch creatine (geen dier-ingrediënten) |
| 26 | Vitakruid Magnesium L-threönaat | "Vegetarische capsules" |

### 6 producten met dieet-restricties — voorstel + alternatief

#### Product 2: Arctic Blue Pure visolie 300ml

- **Bevat:** Kabeljauwolie (VIS)
- **dietTags:** `['vis']`
- **Wegvalt bij:** Vegan, Vegetarisch
- **Alternatief (beide dieten):** [`mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules`](https://www.hlty.shop/product/mattisson-vegan-omega-3-algenolie-dha-150mg-epa-75mg-60-vegetarische-capsules) — Mattisson Vegan Omega-3 Algenolie (DHA 150mg + EPA 75mg, vegetarische caps) — €19,95

#### Product 3: Arctic Blue Viscollageen Poeder MSC Aardbei 150g

- **Bevat:** VIScollageen hydrolysaat
- **dietTags:** `['vis']`
- **Wegvalt bij:** Vegan, Vegetarisch
- **Alternatief (beide dieten):** [`mattisson-collagen-alternative-vegan-60-vegetarische-capsules`](https://www.hlty.shop/product/mattisson-collagen-alternative-vegan-60-vegetarische-capsules) — Mattisson Collagen Alternative Vegan (groente/fruit/hyaluronzuur blend, HMPC caps) — €20,95

#### Product 4: ESN Designer Whey 908g

- **Bevat:** Wei-eiwit concentraat + isolaat (MELK)
- **dietTags:** `['whey', 'lactose']`
- **Wegvalt bij:** Vegan, Lactosevrij
- **Alternatief (beide dieten):** [`mattisson-vegan-protein-erwten-rijst-vanille-bio-500-gram`](https://www.hlty.shop/product/mattisson-vegan-protein-erwten-rijst-vanille-bio-500-gram) — Mattisson Vegan Protein Erwten & Rijst (23g eiwit/scoop, bio) — €23,95
- ⚠️ **Belangrijke vondst:** Royal Green Whey Isolate die ik eerder als optie noemde, bevat ook lactose ("wei-eiwit isolaat 99,5% (van MELK, bevat LACTOSE)"). Voor lactosevrij gebruiken we daarom hetzelfde plantaardige alternatief als voor vegan.

#### Product 10: Mattisson Glucosamine Chondroïtine met MSM

- **Bevat:** Glucosamine sulfaat (standaard uit schaaldier) + **Chondroïtine Sulfaat haai (VIS)**
- **dietTags:** `['vis', 'schaaldier']`
- **Wegvalt bij:** Vegan, Vegetarisch
- **Alternatief (beide dieten):** [`mattisson-vegan-msm-poeder-pure-550-gram`](https://www.hlty.shop/product/mattisson-vegan-msm-poeder-pure-550-gram) — Mattisson Vegan MSM Poeder Pure — €16,95
- **Opmerking:** MSM dekt het gewricht-onderhoud-aspect maar niet de specifieke glucosamine/chondroïtine werking. Voor strikt vegan dieet bestaat er geen 1-op-1 vervanger in het HLTY-assortiment. Mogelijk later toevoegen aan Shopify: vegan glucosamine uit gefermenteerde mais (zoals Solgar).

#### Product 19: Orthica Co-enzym Q10 100mg 30 Softgels

- **Bevat:** VISolie + rundergelatine
- **dietTags:** `['vis', 'gelatine']`
- **Wegvalt bij:** Vegan, Vegetarisch
- **Alternatief:** ❌ **Geen vegan Q10 in HLTY-assortiment.** Royal Green Q10 Ubiquinol bevat ook visgelatine.
- **Voorstel:** Geen alternatief — bij vegan/vegetarisch klant valt Q10 weg, top 3 wordt opgevuld door overige mapping-producten. Mappings waar Q10 voorkomt hebben 4-5 andere producten, dus top 3 blijft mogelijk.
- **Open punt voor jou:** Vegan Q10 via Holland Pharma toevoegen aan assortiment? Bv. Solgar Vegetarian Q-Gel.

---

## Resultaat — wat ziet de klant bij verschillende dieet-keuzes?

### Voorbeeld: scenario 4 (Meer energie / Hele dag, structureel)
Mapping bevat: B Complex, Vegan IJzer, **Orthica Q10 Softgels**, Rhodiola, Vegan D3.

| Dieet | Top 3 producten |
|---|---|
| Geen | B Complex, Vegan IJzer, Q10 |
| Vegan | B Complex, Vegan IJzer, **Rhodiola** *(Q10 weg, Rhodiola schuift door)* |
| Vegetarisch | B Complex, Vegan IJzer, **Rhodiola** |

### Voorbeeld: scenario 7 (Spiermassa opbouwen)
Mapping bevat: Creatine, **ESN Whey**, L-Leucine, Tri-Zink, Vegan D3.

| Dieet | Top 3 producten |
|---|---|
| Geen | Creatine, ESN Whey, L-Leucine |
| Vegan | Creatine, **Mattisson Vegan Protein** (vervangt Whey), L-Leucine |
| Lactosevrij | Creatine, **Mattisson Vegan Protein** (vervangt Whey), L-Leucine |

### Voorbeeld: scenario 19 (Hart & vaten / Algemene preventie)
Mapping bevat: **Arctic Blue Visolie**, Q10, Magnesium-400, D3/K2, (combi-D3 in K2).

| Dieet | Top 3 producten |
|---|---|
| Geen | Visolie, Q10, Magnesium-400 |
| Vegan | **Mattisson Vegan Algenolie** (vervangt Visolie), Magnesium-400, D3/K2 *(Q10 weg)* |
| Vegetarisch | **Mattisson Vegan Algenolie** (vervangt Visolie), Magnesium-400, D3/K2 |

---

## Marges / kostenoverzicht (open punt)

Ik heb op Holland Pharma de margevergelijking nog niet kunnen doen — de zoekfunctie daar is niet zo vlot via de browser-automatisering. Wil je dat ik een aparte ronde maak waarin ik specifiek de niet-vegan-producten en hun vegan-alternatieven naast elkaar leg op kostprijs? Dan kan dat in een aparte sessie.

---

## Wat ik te doen heb na jouw akkoord

1. In [consultation-rules.ts](../src/lib/consultation-rules.ts):
   - `MappingProduct` interface uitbreiden met `dietTags?: string[]` (al aanwezig) en `dietAlternatives?: Partial<Record<DietKey, string>>`
   - Tag-comment toevoegen: *"// INTERNE TAGS — niet uit Shopify, alleen voor deze adviseur"*
   - 6 producten taggen + alternatieven koppelen
2. In [consultation-engine.ts](../src/lib/consultation-engine.ts):
   - `DIET_EXCLUDES` aanpassen (nieuwe tags `vis`, `schaaldier`)
   - `applyDietFilter` herschrijven: niet filteren maar **vervangen** door dietAlternatives (of weglaten als geen alternatief)
3. Live test in browser met vegan-flow om verschil te zien

---

## Aktiepunten voor jou (Stefan)

1. ✅ Voorstel goedkeuren (of aanpassingen aangeven)
2. ❓ Wil je vegan Q10 toevoegen aan het assortiment via Holland Pharma? Zo ja: ik kan dat na implementatie als alternatief koppelen.
3. ❓ Wil je dat ik een aparte ronde doe op Holland Pharma voor de marges van de alternatieven vs originelen?
