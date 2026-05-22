# Waar staan we — handover voor de volgende sessie

Laatst bijgewerkt: **22 mei 2026**.

---

## Stand van zaken

**Fase 8 (SEO & GEO) is LIVE en gevalideerd** op
https://www.hlty.shop. Concreet afgerond deze sessie:

- Volledige SEO/GEO-laag live: per-pagina meta-tags, JSON-LD
  (Organization/Product/Breadcrumb/ItemList/FAQ), dynamische
  `sitemap.xml` (1088 URLs via `api/sitemap.ts`), `robots.txt` met
  AI-bot-allowlist, `llms.txt`, FAQ-pagina, 301/308-redirects.
- Dedicated OG-image (`public/og-image.jpg`, 1200×628).
- Organization-schema compleet met KvK/RSIN/BTW/adres (uit KvK-uittreksel).
- **Google Rich Results Test** groen voor home / product / FAQ.
- **Google Search Console**: property `https://www.hlty.shop` geverifieerd
  (HTML-tag in `index.html` — niet verwijderen!) + sitemap aangeboden.
  Indexering laten we via de sitemap door Google zelf doen (besloten).

Details: [`08-fase-8-seo-geo.md`](./08-fase-8-seo-geo.md).

---

## Volgende stap: Fase 9 — Assortiment-onderzoek

Stefan start (in Claude Cowork) een uitgebreid onderzoek naar
**categorieën en producten**: welke aanvullen, bijstellen of schrappen.

Relevante context om mee te nemen:
- Producten komen uit twee bronnen: HLTY eigen merk (direct in Shopify)
  + alle andere merken via de Holland Pharma groothandel-API. Zie
  projectmemory + `MEMORY.md`.
- HLTY-tag-mechanisme: een product blijft alleen actief met de tag
  `HLTY`, anders zet de Holland Pharma-sync het terug naar Concept. Zie
  [`_shopify-tag-werkwijze.md`](./_shopify-tag-werkwijze.md).
- De 9 doelen van de productadvisor (slaap, energie, spieren, focus,
  weerstand, gewricht, hart, stress, hormonen) zijn een logische bril
  voor assortiment-dekking.

Daarna **Fase 10 — SEO/GEO content-pass + Analytics & tracking-fundament**:
content bijwerken op de punten die Fase 9 raakt, plus GA4 + Meta Pixel +
evt. andere conversie-/tracking-pixels site-breed opzetten (consent-proof).

---

## Korte restpunten (niet-blokkerend)

- **Search Console-status checken** (~1 dag): sitemap van "Couldn't
  fetch" → "Success"; performance-data verschijnt na 1-2 dagen.
- **`sameAs` social-URLs** toevoegen aan `SiteSchema.tsx` zodra Stefan
  Instagram/Facebook/LinkedIn heeft aangemaakt.
- **Lighthouse/PageSpeed-baseline** meten (was geblokkeerd via de
  browser-extensie; handmatig of later).
- **Fase 7 feedback-ronde** loopt — verwerken hoort bij Fase 11.

---

## Werkwijze (vasthouden)

- Stap voor stap, lange-termijn oplossingen, geen quick fixes.
- Per onderdeel meerdere opties, Stefan kiest bij richtinggevende keuzes.
- Shopify-admin-acties: vraag akkoord. Nieuw product activeren? ALTIJD
  ook de tag `HLTY` zetten.
- Content-issues niet-HLTY producten → presentatie-laag-fix in React.
- Per fase een verslag in `docs/0X-fase-X-onderwerp.md`.

**Productie-URL:** https://www.hlty.shop
**Localhost-dev:** `cd /Users/stefanritsema/Documents/VibeCode/HLTY && npm run dev`
**Repo:** github.com/NieuwStefan/HLTY (main), Vercel auto-deploy op push.
