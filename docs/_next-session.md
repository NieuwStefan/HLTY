# Prompt voor de volgende chat-sessie

Kopieer onderstaande tekst en plak hem als eerste bericht in een nieuwe
Claude Code-sessie.

---

```
Hoi! We gaan verder met HLTY.shop, een Shopify-headless React-app
(Vite/React 19, Vercel) in /Users/stefanritsema/Documents/VibeCode/HLTY.

We zitten in **Fase 7 — Productadvisor herontwerp** (gestart 15 mei
2026). De oude AIAdvisor.tsx is grondig geanalyseerd en herontworpen als
**HLTY Health Consultation** — een 5-stappen quiz met een hybride
architectuur:

- Stappen 1–4 zijn klikkeuzes (doelen / per-doel-vraag / dieet / leefstijl)
- Stap 5 is optionele vrije tekst
- Bij lege stap 5 → **deterministische rule-engine** kiest producten
- Bij gevulde stap 5 → AI personaliseert (fase 4 — nog te implementeren)

**LEES ALS EERSTE deze bestanden voordat je iets anders doet:**

1. `docs/07-fase-7-productadvisor.md` — volledige beschrijving van fase 7
   (status, architectuur, wat is gedaan, wat resteert)
2. `docs/06-fase-6-rapport-websitetest.md` § 9 en § 10 — afsluiting van
   Solo #13 (Checkout indicator) en de betaalmethoden-cleanup
3. Mijn projectmemory `MEMORY.md` (auto-loaded) — vooral
   `project_hlty_productadvisor.md` voor de architectuur-keuzes
4. `docs/_productadvisor-mappings-template.md` — het invul-template dat
   ik samen met de fysio ga doorlopen

**Code-bestanden om te weten:**

- `src/lib/consultation-rules.ts` — 37 placeholder mappings + types +
  per-doel stap-2-vragen
- `src/lib/consultation-engine.ts` — selectie-engine (rule-lookup +
  dieet-filter + leefstijl-modifier). Modifiers hebben TODO-markers
  bedoeld om SAMEN met Stefan in te vullen.
- `src/components/HealthConsultation.tsx` — UI (live op localhost)

**Werkwijze (vasthouden):**

- Stap voor stap, geen quick fixes — lange-termijn oplossingen
- Per onderdeel meerdere oplossingen, ik kies
- Voorzichtig met Shopify-wijzigingen — vraag akkoord per admin-actie
- Voor content-issues op niet-HLTY producten: presentatie-laag-fix in
  React-code (Holland Pharma overschrijft Shopify admin-edits)
- Per fase een verslag in `docs/0X-fase-X-onderwerp.md`

**Eerstvolgende actie hangt af van waar ik (Stefan) ben:**

1. **Mappings nog niet ingevuld:** Claude staat in de wacht. Eventueel
   vragen over het template-invullen beantwoorden.
2. **Mappings ingevuld:** Claude converteert ze naar code in
   `consultation-rules.ts`. Daarna samen fase 3 (modifiers) uitwerken.
3. **Bij twijfel of vragen:** klop aan bij Claude voor advies tijdens
   het uitwerken van de mappings.

**Productie-URL:** https://www.hlty.shop
**Localhost-dev:** `cd /Users/stefanritsema/Documents/VibeCode/HLTY && npm run dev`
**Laatste relevante commit:** `aa05e21` (fase 6 batches live)
**NOG NIET gecommit:** alle fase 7-code (HealthConsultation,
consultation-rules, consultation-engine) + alle fase 7-documentatie

**Begin met `cat docs/07-fase-7-productadvisor.md | head -100`**, lees de
huidige status, en vraag mij waar we staan met de mapping-invulling.
Begin niet met code-werk voordat je weet of de mappings er al zijn.
```

---

## Korte mentale-load-cheatsheet voor jou (Stefan)

Mocht je tussendoor de context kwijt zijn:

| Wat | Antwoord |
|-----|----------|
| Welke fase zijn we mee bezig? | Fase 7 — Productadvisor herontwerp |
| Hoe heet de nieuwe tool? | HLTY Health Consultation |
| Architectuur kort? | Regels eerst (37 curated mappings), AI alleen bij vrije tekst |
| Hoeveel mappings invullen? | 27 enkele-doel + 10 dubbele-doel = 37 |
| Waar staat het invul-template? | `docs/_productadvisor-mappings-template.md` |
| Waar staat de quick-ref? | `docs/_productadvisor-mappings-quickref.md` |
| Welke ene file vat alles samen? | `docs/07-fase-7-productadvisor.md` |
| Hoe weet de volgende Claude dit? | Via `MEMORY.md` + bovenstaande prompt |
| Wat komt na fase 7? | Fase 8 (assortiment-onderzoek) → Fase 9 (SEO/GEO) |

## Wat je doet als je verder wilt

1. Plan een fysio-sessie van ~4 uur voor de 27 enkele-doel mappings
2. Plan een tweede fysio-sessie van ~3 uur voor de 10 dubbele-doel mappings
3. Vul de mappings in via het template
4. Start een nieuwe Claude-sessie met bovenstaande prompt
5. Geef Claude het ingevulde template, hij verwerkt het in code
6. Daarna samen fase 3 (dieet/leefstijl modifiers) uitwerken
