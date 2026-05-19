# Fase 7 — Productadvisor: fundamenteel herontwerp

**Datum gestart:** 15 mei 2026
**Status:** 🟡 Lopend — code-fundament staat, wachten op invulling van 37 curated mappings door Stefan + fysio

---

## 1. Doel & scope

De originele AI-Productadvisor (rapport-punten #3, #5 + extra
observaties van Stefan) bleek in de praktijk niet te leveren wat hij
beloofde. Twee uitvoerige browser-tests gaven **identieke producten**
voor compleet verschillende klachten (vermoeidheid vs. slecht slapen).
Stefan benoemde een fundamentelere kwestie: de tool moet klanten *bij
de juiste producten brengen*, niet *bij dezelfde best-sellers met een
ander praatje eronder*.

**Beslissing:** geen patches op de oude AIAdvisor — een **fundamenteel
herontwerp** zowel qua UX (conversational chat → gestructureerde
5-stappen-consultation) als architectuur (AI-driven selectie →
deterministische regels met AI alleen bij vrije tekst).

---

## 2. Initial state — diagnose van de oude tool

### Browser-runs (Run 1 + Run 2)

| Run | Input | Resultaten |
|-----|-------|-----------|
| 1 | *"Ik ben vaak moe na het werk"* + *"lange werkdagen"* | Orthica Cal mag zink, Fittergy K2+D3, Mattisson Whey, Orthica Magnesium 400, Orthica Magnesium plus |
| 2 | *"Ik slaap slecht"* + *"piekeren in bed"* | **IDENTIEKE 5 producten, zelfde volgorde** — alleen motivaties herschreven naar slaap-thema |

K2/D3 (botten) en Whey protein (sport) verschijnen prominent in beide
adviezen, met vergezochte rationalisaties.

### Code-review (root cause)

Drie samenwerkende factoren in `src/components/AIAdvisor.tsx`:

1. **`BEST_SELLING` sort** in Shopify search (regel 197) — alle queries
   ranken op populariteit, niet op klacht-relevantie
2. **AI geeft overlappende queries** voor brede klachten — "magnesium"
   verschijnt zowel bij energie als slaap, dus zelfde top-resultaten
3. **PROMPT_PITCH rationaliseert achteraf** — AI moet uitleggen waarom
   gegeven producten passen, niet kiezen welke passen. Verklaart
   absurde redenen zoals *"K2 voor kalmere gemoedstoestand in de nacht"*.

### Stefan's observaties (3 eigen tests)

- *"Hij geeft bij de resultaten aan dat vitamine B een goede oplossing
  zal zijn. Maar hij laat bij geen een van de adviseerde producten iets
  met vitamine B zien."* — mismatch samenvatting/producten
- *"AI praat tegen zichzelf"* — samenvatting noemt lactosevrije opties
  zonder dat klant dat had aangevinkt
- *"Bij vegan + spiermassa: 1 Whey product in resultaten"* — dieet-
  filter werkt niet betrouwbaar
- *"Bij slecht slapen: 3 keer magnesium"* — mono-thematisch, beperkte
  diversiteit

---

## 3. Conceptuele herontwerp

### Webresearch (15 mei 2026)

Kort onderzoek naar wat in de markt het beste werkt voor supplement-
recommendation tools (Care/of, Persona, Vitl, HUM, Heyflow, Digioh):

- **Pure open textarea verlaagt conversie** — klanten weten niet wat ze
  moeten typen, hebben geen vocabulaire
- **5–9 vragen quiz is sweet spot** — boven 10 keldert completion
- **AI-versterkte quizzes** geven +15–35% lift bovenop standaard quiz
- **Alle top supplement-tools** gebruiken gestructureerde meertraps
  quizzes, geen open chat
- **Quiz heeft voortgangsbelofte** ("5 van 5") die chat niet heeft —
  betere completion

### Nieuwe concept: HLTY Health Consultation

Een **6-staps tool met AI onderhuids**: visueel oogt het als quiz
(klikbaar, snel), maar de selectie-engine onderwater is volledig
deterministisch:

```
Stap 1 — Doel    (9 visuele tegels, max 2)
Stap 2 — Vraag   (per doel een specifieke vraag met 3 opties)
Stap 3 — Dieet   (6 opties multi-select)
Stap 4 — Leefstijl (3 ja/nee vragen)
Stap 5 — Detail  (optionele vrije tekst — alleen hier komt AI in actie)
       ↓
Resultaat: top 3 producten met
  - Samenvatting
  - Per product: Waarom voor jou / Hoe het werkt / Doseringstip
  - Optionele medische disclaimer
  - Optionele leefstijl-tip
```

Geen e-mail-capture op verzoek van Stefan (drempelverhoging).

---

## 4. Architectuur-beslissing — Optie C hybride

Drie strategieën gewogen, Stefan koos **Optie C**:

| Optie | Curatie | Kwaliteit | Onderhoud |
|-------|---------|-----------|-----------|
| A. Volledig | 351 mappings handmatig | Maximaal (100%) | Hoog |
| B. Algoritme | 27 + auto-combine 2-doel | Goed (85%) | Laag |
| **C. Hybride** | **27 + 10 logische 2-doel paren** | **Bijna perfect (95%)** | **Middel** |

**Architectuurprincipe**: *regels eerst, AI alleen wanneer de klant
écht iets specifieks aanvult.*

```
Klant doorloopt stappen 1–4 (klikkeuzes)
    ↓
Stap 5 leeg?
    ├─ JA → Rule-engine: lookup → dieet-filter → leefstijl-prioritering → top 3
    │       Geen AI-call, geen wachttijd, geen kosten, consistent advies
    │
    └─ NEE → AI-fallback krijgt: alle keuzes + vrije tekst + baseline-output
            AI mag personaliseren of behouden
```

**Voordelen** vs. de oude AI-driven aanpak:

| Probleem oude advisor | Hoe Optie C het oplost |
|----------------------|------------------------|
| Inconsistente output | Verdwijnt: zelfde keuzes = zelfde output |
| 15s AI-wachttijd | Verdwijnt voor 80-90% klanten |
| AI-hallucinaties | Onmogelijk in regel-pad |
| API-kosten schalen met klanten | Schalen alleen met klanten die echt iets aanvullen |
| Aansprakelijkheid | Gecureerd advies > AI-gegenereerd advies |
| Vertrouwen | Stefan + fysio in volledige controle |

---

## 5. Wat is gedaan

### Documentatie

| Bestand | Inhoud |
|---------|--------|
| [`docs/_productadvisor-keuze-combinaties.md`](./_productadvisor-keuze-combinaties.md) | Enumeratie van alle 351 mogelijke keuze-combinaties; strategie-opties A/B/C met trade-offs |
| [`docs/_productadvisor-mappings-template.md`](./_productadvisor-mappings-template.md) | Invul-template voor de 37 mappings — met volledig voorbeeld, HLTY-tone-richtlijnen, sessie-checklist, instructies voor Shopify-handles |
| [`docs/_productadvisor-mappings-quickref.md`](./_productadvisor-mappings-quickref.md) | Quick-reference naslag — per mapping nummer + doel + vraag + antwoord, voor naast het template tijdens fysio-sessies |
| [`docs/_productadvisor-wishlist.md`](./_productadvisor-wishlist.md) | Geparkeerd voor later: bundle-suggestie (*"3 producten samen, €X korting"*) |

### Code-fundament

| Bestand | Wat erin zit |
|---------|--------------|
| [`src/lib/consultation-rules.ts`](../src/lib/consultation-rules.ts) | Types + 37 placeholder mapping-entries + STEP2_QUESTIONS (per doel een eigen vraag met 3 antwoorden) + lookup helpers |
| [`src/lib/consultation-engine.ts`](../src/lib/consultation-engine.ts) | Pure selectie-engine: rule lookup → dieet-filter → leefstijl-modifier → dedupe → top 3. Plus AI-fallback placeholder voor stap 5 |
| [`src/components/HealthConsultation.tsx`](../src/components/HealthConsultation.tsx) | Volledig herschreven UI. 2-koloms intro met klikbare tegels in stap 1. Per geselecteerd doel een eigen vraag in stap 2 (1 of 2 blokken). `min-h-[760px]` voor stabiele paneelhoogte. Result-pagina toont engine-output of "mapping nog niet ingevuld"-placeholder |
| [`src/components/AIAdvisor.tsx`](../src/components/AIAdvisor.tsx) | **Oude versie** — blijft staan ter referentie, wordt verwijderd nadat fase 7 live is |
| [`src/pages/Home.tsx`](../src/pages/Home.tsx) | `<AIAdvisor />` vervangen door `<HealthConsultation />` |

### De 9 doelen + stap-2-vragen

Vastgelegd in `STEP2_QUESTIONS` in `consultation-rules.ts`:

| Doel | Vraag | A1 / A2 / A3 |
|------|-------|--------------|
| Beter slapen | *Wat speelt voor jou het meest?* | Moeite met inslapen / Vaak 's nachts wakker / Niet uitgerust opstaan |
| Meer energie | *Wanneer ervaar je het meest vermoeidheid?* | Hele dag / 's Middags-na werk / Bij mentale inspanning |
| Spieren & herstel | *Wat is je hoofdfocus?* | Spiermassa opbouwen / Uithoudingsvermogen & herstel / Algemene fitheid |
| Focus & concentratie | *In welke situatie het meest?* | Werk of studie / Onder stress / Algemene mentale vermoeidheid |
| Weerstand | *Wat past het beste bij jou?* | Algemene ondersteuning / Vaak verkouden / Seizoens-ondersteuning |
| Gewrichten | *Waar zit de klacht voornamelijk?* | Knieën / Rug-nek / Schouders-meerdere |
| Hart & vaten | *Wat past het beste bij jouw situatie?* | Algemene preventie / Verhoogd risico / Op advies van arts |
| Stress & rust | *Wat ervaar je vooral?* | Mentale onrust / Lichamelijke spanning / Slecht slapen door stress |
| Hormonen | *Wat past het beste bij jou?* | Algemene balans / Energie & vitaliteit / Specifieke levensfase |

### De 10 logische dubbele-doel paren

1. Slaap + Energie *(slechte slaap voedt vermoeidheid)*
2. Slaap + Stress *(stress als oorzaak van slaap-issues)*
3. Slaap + Hormonen *(menopauze, cyclus → slaap)*
4. Energie + Focus *(mentale & fysieke energie)*
5. Energie + Stress *(stress put uit)*
6. Focus + Stress *(stress vermindert focus)*
7. Spieren + Gewrichten *(sporters met klachten)*
8. Weerstand + Stress *(chronische stress → immuun)*
9. Hormonen + Energie *(hormoon-schommelingen)*
10. Hart + Energie *(vermoeidheid bij hart-issues)*

---

## 6. Wat resteert

### Korte termijn (door Stefan + fysio)

- [ ] **Sessie 1** (~4 uur) — 27 enkele-doel mappings invullen via
      `_productadvisor-mappings-template.md`, met
      `_productadvisor-mappings-quickref.md` ernaast voor context
- [ ] **Sessie 2** (~3 uur) — 10 dubbele-doel mappings invullen
- [ ] Ingevuld template terug naar Claude

### Daarna (door Claude)

- [ ] Mappings converteren naar `SINGLE_GOAL_RULES` en `DOUBLE_GOAL_RULES`
      in `consultation-rules.ts`
- [ ] **Fase 3: dieet/leefstijl modifiers** samen met Stefan finaliseren —
      welke producten worden uitgesloten bij welk dieet, welke krijgen
      voorrang bij welke leefstijl-keuzes. Skeleton staat klaar in
      `consultation-engine.ts` met `TODO Stefan` markers.
- [ ] **Fase 4: AI-fallback** voor stap 5 — OpenAI-call via bestaand
      `/api/openai` endpoint, met baseline-output als context
- [ ] Old `AIAdvisor.tsx` verwijderen na akkoord live-gang
- [ ] Optioneel: analytics events (GA4) voor completion rate, drop-off
      per stap, klik-naar-cart per mapping

---

## 7. Architectuur-keuzes verantwoording

### Waarom 9 doelen en niet 10 (geen "Afvallen")

Stefan vroeg of afvallen een doel moet worden. Bewust **niet**
toegevoegd: HLTY's positionering is *"alleen wat werkt"*. Afslank-
supplementen (fatburners, Garcinia) hebben dunne wetenschappelijke
onderbouwing — past niet bij HLTY. Afvallen is bovendien een
dieet+leefstijl-probleem, niet een supplement-probleem. Wie afvalt en
energie tekort heeft kiest gewoon "Meer energie".

### Waarom 3 producten in resultaat

Research toont consistent: 3 producten voor *shopping-context* converteert
beter dan 5+. Care/of, Vitl etc. doen 4-6 maar dat zijn abonnement-
packs — andere use case. Voor advies-tool: 3 = decisive, premium, geen
choice paralysis.

### Waarom dieet als filter (niet als aparte mapping)

351 base × 6 diet × 8 leefstijl = 16.848 mappings. Onhaalbaar. Dieet als
filter bovenop de 351 base = haalbaar. Trade-off: minder fine-grained
control, maar genoeg granulariteit voor 95% van klanten.

### Waarom 5 stappen (geen e-mail-capture als stap 6)

Stefan koos bewust voor 5 zonder e-mail capture. Lagere drempel,
mogelijk hogere completion. E-mail capture kan later toegevoegd worden
als optionele stap als de tool live staat.

---

## 8. Volgende stap

**Voor Stefan + fysio:**

1. Open `_productadvisor-mappings-quickref.md` naast
   `_productadvisor-mappings-template.md`
2. Plan eerste fysio-sessie (~4 uur, voor de 27 enkele-doel mappings)
3. Plan tweede fysio-sessie (~3 uur, voor de 10 dubbele-doel mappings)
4. Bij twijfel of vragen tijdens invullen: klop bij Claude aan

**Voor Claude (volgende sessie):**

1. Wachten op ingevuld template
2. Converteren naar code
3. Samen met Stefan fase 3 modifiers uitwerken
4. Fase 4 AI-fallback implementeren

**Productie-deploy** komt aan bod als alle 37 mappings ingevuld zijn +
fase 3 modifiers samen met Stefan zijn geïmplementeerd.
