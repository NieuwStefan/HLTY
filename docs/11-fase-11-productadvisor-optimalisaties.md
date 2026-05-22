# Fase 11 — Productadvisor: post-live optimalisaties (geparkeerd)

**Datum geopend:** 20 mei 2026
**Status:** 🅿️ Geparkeerd — pakken we op wanneer er tijd voor is (na de
feedback-ronde of wanneer Stefan een ander startmoment kiest). Geen
deadline, geen actieve werkstroom.

---

## 0. Doel & scope

Fase 7 (HLTY Health Consultation) is op 19 mei 2026 live gegaan op
[hlty.shop](https://www.hlty.shop) (commit `ad55cad`). Daarna is de
codebase opgeschoond: de oude `AIAdvisor.tsx` is op 20 mei 2026
verwijderd (was dead code, nergens meer geïmporteerd).

Wat resteert rond de productadvisor is een verzameling **optionele
verbeteringen** die we bewust niet bij de live-gang hebben meegenomen.
Sommige zijn al volledig uitgedacht (zie de wishlist), andere komen uit
de feedback-ronde die nu loopt. Deze fase bundelt ze in één coherent
pakket zodat we ze in één keer kunnen oppakken zodra Stefan dat besluit.

**Belangrijk principe:** Fase 7 is af en werkt zoals bedoeld. De punten
hieronder zijn verfijning, geen reparatie. Niets in deze fase blokkeert
ander werk.

---

## 1. Inhoud van het pakket

### 1.1 Feedback verwerken uit de ronde

**Wat:** de uitkomsten van de feedback-ronde met collega's en medisch
professionals doornemen, prioriteren, en omzetten in concrete
aanpassingen (mappings, taglines, disclaimers, UX-tweaks).

**Voorbereiding bij start:**
- Feedback verzamelen op één plek (notities, mail, gesprekken)
- Per punt vaststellen: tekst-fix / mapping-fix / UX-fix / engine-fix
- Per categorie samen met Stefan prioriteren

### 1.2 Fase 4 — AI-fallback + stap 5 (vrije tekst) terug

**Wat:** de oorspronkelijk geplande 5e stap met vrij tekstveld terugzetten
in de UI, gekoppeld aan een AI-call die de baseline-uitkomst van de
rule-engine mag personaliseren wanneer de klant iets invult.

**Status van het werk:**
- Engine-infrastructuur (`runConsultationWithAI`, `freeText`-veld in
  `ConsultationInput`) staat al in `consultation-engine.ts` — wordt nu
  niet aangeroepen
- UI-stap (`'detail'` step + textarea) is vóór live-gang uit
  `HealthConsultation.tsx` verwijderd
- Volledig heractivatie-plan staat in
  [`_productadvisor-wishlist.md`](./_productadvisor-wishlist.md) onder
  "Fase 4 — AI-fallback voor de vrije-tekst stap (stap 5)"

**Open vragen bij heractivatie:**
- `/api/openai` endpoint verifiëren of opzetten
- Prompt-ontwerp (rule-output + keuzes + vrije tekst als context)
- Veiligheid: AI mag geen medische claims toevoegen — filter via
  whitelist van assortiment-handles?
- Fallback bij API-fout (timeout, rate-limit, ongeldige JSON) →
  altijd baseline tonen

### 1.3 Doserings-/grootte-keuze

**Wat:** voor producten die in meerdere doseringen of
verpakkingsgroottes bestaan een keuze-dropdown in de productkaart,
hetzelfde patroon als de smaak-kiezer voor ESN Whey.

**Status van het werk:**
- Generiek mechanisme staat al (het `flavorOptions`-patroon in
  `MappingProduct`); een `variantOptions`/`sizeOptions`-veld kan exact
  hetzelfde werken
- UI in `HealthConsultation.tsx` is herbruikbaar
- Vooral data- en curatie-werk: per product de handles + labels +
  prijzen uit Shopify ophalen
- Detail in [`_productadvisor-wishlist.md`](./_productadvisor-wishlist.md)
  onder "Doseringen & verpakkingsinhoud-keuze"

### 1.4 Bundle-suggestie ("3 samen, €X korting")

**Wat:** aan het einde van de consultation een vierde block met
*"Bestel deze 3 producten samen en bespaar €X"* — één klik om alle drie
samen in de winkelwagen te plaatsen met een kortings-incentive.

**Status van het werk:**
- Bewuste keuze om dit pas later op te pakken (Stefan eerder al
  benoemd)
- Cart-context kan al meerdere variants tegelijk toevoegen
- Open vragen: kortings-mechanisme (Shopify Functions / discount-code),
  kortingsstrategie (vast bedrag / percentage / drempel), visuele
  hiërarchie t.o.v. de losse 3 producten
- Detail in [`_productadvisor-wishlist.md`](./_productadvisor-wishlist.md)
  onder "Bundle-suggestie"

### 1.5 Analytics-events

**Wat:** GA4-events op de consultation-flow zodat we kunnen meten wat de
tool écht oplevert.

**Minimale set:**
- `consultation_started` (stap 1 zichtbaar)
- `consultation_step_completed` (per stap, met goals/dieet als params)
- `consultation_completed` (resultaat getoond)
- `consultation_drop_off` (verlaat de tool zonder voltooien)
- `consultation_product_click` (klik op product in resultaat)
- `consultation_add_to_cart` (cart-toevoeging vanuit resultaat)

**Waarom:** zonder dit weten we niet of de tool converteert. Voor
prioritering van 1.1–1.4 is dit later ook houvast (welke
verbeteringen leveren echt iets op?).

---

## 2. Al opgeschoond bij opening van deze fase

- [x] **Oude `AIAdvisor.tsx` verwijderd** (20 mei 2026) — was nergens
      meer geïmporteerd. `tsc -b` en `vite build` blijven groen. Geen
      regressie verwacht op rendering of UX van Fase 7.

---

## 3. Volgorde wanneer we starten

Niet vastgelegd — afhankelijk van wat de feedback-ronde oplevert. Een
voor de hand liggende volgorde zou zijn:

1. Feedback verwerken (1.1) — direct waarde
2. Analytics events (1.5) — laag investering, geeft data voor de rest
3. Doserings-keuze (1.3) — relatief simpel, generiek mechanisme staat
4. Bundle-suggestie (1.4) — vereist kortings-keuze
5. AI-fallback (Fase 4 / 1.2) — grootste werk, hoogste complexiteit

Maar dit is suggestie, niet vastgelegd. Stefan kiest het startpunt.

---

## 4. Wat niet in deze fase hoort

- Bredere site-features die los staan van de productadvisor
- Refactors van de bestaande consultation-engine zolang die werkt zoals
  bedoeld
- Verwijdering van werkdocumenten (`_productadvisor-*.md`) — die zijn
  naslag, ook bij later werk
