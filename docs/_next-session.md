# Prompt voor de volgende chat-sessie

Kopieer onderstaande tekst en plak hem als eerste bericht in een nieuwe
Claude Code-sessie.

---

```
Hoi! We gaan verder met HLTY.shop, een Shopify-headless React-app
(Vite/React 19, Vercel) in /Users/stefanritsema/Documents/VibeCode/HLTY.

**Fase 7 — Productadvisor is AFGEROND en LIVE** op
https://www.hlty.shop (commit ad55cad). De oude AIAdvisor is vervangen
door HLTY Health Consultation: een deterministische 4-stappen quiz
(doel → per-doel-vraag → dieet → leefstijl → resultaat) met 37
gecureerde mappings. We zitten nu in de **feedback-ronde** — collega's
en medisch professionals kijken naar de tool.

**LEES ALS EERSTE voordat je iets doet:**

1. `docs/07-fase-7-productadvisor.md` § 0 "Actuele status" — dit blok is
   leidend; secties 5/6/8 zijn historische tussenstand (15 mei) en
   ACHTERHAALD
2. Projectmemory `MEMORY.md` (auto-loaded) — vooral
   `project_hlty_productadvisor.md` en `project_hlty_shopify_tag.md`
3. `docs/_productadvisor-wishlist.md` — Fase 4 AI-fallback +
   doserings-/grootte-keuze, volledig uitgewerkt hoe te heractiveren
4. `docs/_dieet-filter-voorstel.md` — dieet-onderzoek (geïmplementeerd)

**Code-bestanden:**

- `src/lib/consultation-rules.ts` — 37 mappings + types
  (MappingProduct met dietTags/dietAlternatives/flavorOptions) +
  per-doel stap-2-vragen
- `src/lib/consultation-engine.ts` — engine: rule-lookup →
  dieet-substitutie → leefstijl-modifier (boost 1,5/conditie) →
  top 3; samenvatting-addendum; suikervrij/glutenvrij-notitie.
  `runConsultationWithAI` + `freeText` staan klaar maar worden NIET
  aangeroepen (Fase 4)
- `src/lib/consultation-lifestyle-tips.ts` — 25 contextuele tips
- `src/components/HealthConsultation.tsx` — UI, 4 stappen, smaak-kiezer

**Werkwijze (vasthouden):**

- Stap voor stap, lange-termijn oplossingen, geen quick fixes
- Per onderdeel meerdere opties, Stefan kiest bij richtinggevende keuzes
- Shopify-admin-acties: vraag akkoord. Nieuw product activeren? ALTIJD
  ook de tag `HLTY` zetten, anders zet de Holland Pharma-sync 'm terug
  naar Concept (zie `_shopify-tag-werkwijze.md`)
- Content-issues niet-HLTY producten → presentatie-laag-fix in React
- Per fase een verslag in `docs/0X-fase-X-onderwerp.md`

**Mogelijke eerstvolgende acties (Stefan bepaalt):**

1. **Feedback verwerken** uit de ronde met professionals
2. **Fase 4 — AI-fallback + stap 5 terug** — zie wishlist voor het
   complete heractivatie-plan (UI-stap terug, /api/openai, prompt,
   fallback-strategie)
3. **Doserings-/grootte-keuze** — generiek mechanisme staat al
   (flavorOptions-patroon), is vooral data- + curatie-werk
4. Opruimen: oude `AIAdvisor.tsx` verwijderen (nu dead code)

**Productie-URL:** https://www.hlty.shop
**Localhost-dev:** `cd /Users/stefanritsema/Documents/VibeCode/HLTY && npm run dev`
**Laatste commit:** `ad55cad` (Fase 7 live)
**Repo:** github.com/NieuwStefan/HLTY (main), Vercel auto-deploy op push

Begin met `docs/07-fase-7-productadvisor.md` § 0 lezen, daarna vraag
mij wat de feedback was / waar we mee verder gaan.
```

---

## Korte mentale-load-cheatsheet voor jou (Stefan)

| Wat | Antwoord |
|-----|----------|
| Status fase 7? | ✅ Afgerond & live op hlty.shop, in feedback-ronde |
| Hoe heet de tool? | HLTY Health Consultation |
| Hoeveel stappen? | 4 (stap 5 vrije tekst + AI bewust eruit, parkeer Fase 4) |
| Architectuur? | Deterministisch: 37 mappings + dieet-substitutie + leefstijl-modifier |
| Mappings ingevuld via? | Stefan's PDF `HLTY_scenario_producten` (niet het fysio-template) |
| Wat is geparkeerd? | Fase 4 AI-fallback, doserings-keuze, bundle (zie wishlist) |
| Welke file vat alles samen? | `docs/07-fase-7-productadvisor.md` § 0 |
| Belangrijk Shopify-detail? | Nieuw product = status Actief **én** tag `HLTY` |
| Laatste commit? | `ad55cad` — fase 7 live |

## Wat je doet als je verder wilt

1. Verzamel de feedback van collega's/medisch professionals
2. Start een nieuwe Claude-sessie met bovenstaande prompt
3. Geef Claude de feedback; samen prioriteren wat eerst opgepakt wordt
4. Of: geef aan dat je Fase 4 (AI-fallback) of de doserings-keuze wilt
   oppakken — de heractivatie-plannen staan klaar in de wishlist
