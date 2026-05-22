# Prompt voor de volgende chat-sessie

Kopieer onderstaande tekst en plak hem als eerste bericht in een nieuwe
Claude Code-sessie.

---

```
Hoi! We gaan verder met HLTY.shop, een Shopify-headless React-app
(Vite/React 19, Vercel) in /Users/stefanritsema/Documents/VibeCode/HLTY.

**Status op 20 mei 2026, einde sessie:**

Fase 8 (SEO & GEO) is **volledig lokaal afgerond** en wacht op een
Vercel-deploy. Er is een commit aangemaakt op `main` — nog NIET gepusht.

**LEES ALS EERSTE voordat je iets doet:**

1. `docs/README.md` — overzicht van alle fasen + status
2. `docs/08-fase-8-seo-geo.md` — leidend; daarin staat wat klaar is +
   wat na deploy nog moet
3. Projectmemory `MEMORY.md` (auto-loaded)

**Wat er deze sessie gebeurd is:**

- Oude `AIAdvisor.tsx` verwijderd (dead code, geen imports)
- Roadmap hernummerd: Fase 8 = SEO/GEO, 9 = Assortiment, 10 = SEO-content-
  pass, 11 = Productadvisor-optimalisaties (geparkeerd)
- Volledige SEO/GEO-laag gebouwd:
  - `public/robots.txt` met AI-bot allowlist
  - `api/sitemap.ts` (dynamische sitemap via Shopify Storefront API)
  - `public/llms.txt` (AI-discovery)
  - `src/components/SEO.tsx` + per-pagina meta-tags op alle 12 routes
  - `src/components/JsonLd.tsx` + `SiteSchema.tsx` (Organization + WebSite)
  - Product/BreadcrumbList/ItemList JSON-LD per relevante pagina
  - `vercel.json` met 301-redirects + sitemap-rewrite
  - Nieuwe pagina `/veelgestelde-vragen` met 8 vragen + FAQPage JSON-LD

**Wat er morgen moet gebeuren (in deze volgorde):**

1. **Pushen naar Vercel** (`git push origin main`) — Stefan beslist
   wanneer.
2. **Live-validatie** na deploy:
   - `https://www.hlty.shop/robots.txt` → 200
   - `https://www.hlty.shop/sitemap.xml` → valid XML
     (alle producten + collecties + brands + 10 static)
   - `https://www.hlty.shop/llms.txt` → 200
   - `curl -I https://www.hlty.shop/account/login` → 301 → /account
   - `https://www.hlty.shop/veelgestelde-vragen` → rendert, FAQ-schema
     zichtbaar in source
3. **Google Rich Results Test** per type:
   https://search.google.com/test/rich-results
   - Test: home (Organization + WebSite + SearchAction)
   - Test: een productpagina (Product + BreadcrumbList)
   - Test: een collectiepagina (BreadcrumbList + ItemList)
   - Test: /veelgestelde-vragen (FAQPage + BreadcrumbList)
4. **Google Search Console**:
   - Sitemap aanbieden: `https://www.hlty.shop/sitemap.xml`
   - Indexering aanvragen voor home + FAQ
5. **Lighthouse SEO-baseline** meten (mobiel + desktop) — schrijf
   scores in `docs/08-fase-8-seo-geo.md`

**Niet-blokkerend, kan elk moment:**

- Stefan levert KvK, fysiek adres, social-URLs → opnemen in
  Organization JSON-LD in `src/components/SiteSchema.tsx` (zit nu
  uitgecommentarieerd onderin)
- Dedicated 1200×630 OG-image als `public/og-image.jpg` — vervang dan
  `DEFAULT_OG_IMAGE` in `src/components/SEO.tsx`
- Content-review bestaande pagina's op AI-citeerbaarheid (snelle scan
  liet geen problemen zien, dus laag-prio)

**Werkwijze (vasthouden):**

- Stap voor stap, lange-termijn oplossingen, geen quick fixes
- Per onderdeel meerdere opties, Stefan kiest bij richtinggevende keuzes
- Shopify-admin-acties: vraag akkoord. Nieuw product activeren? ALTIJD
  ook de tag `HLTY` zetten (zie `_shopify-tag-werkwijze.md`)
- Content-issues niet-HLTY producten → presentatie-laag-fix in React
- Per fase een verslag in `docs/0X-fase-X-onderwerp.md`

**Productie-URL:** https://www.hlty.shop
**Localhost-dev:** `cd /Users/stefanritsema/Documents/VibeCode/HLTY && npm run dev`
**Repo:** github.com/NieuwStefan/HLTY (main), Vercel auto-deploy op push

Begin met `docs/08-fase-8-seo-geo.md` lezen, daarna vraag mij of we
gaan pushen of nog iets willen aanpassen.
```

---

## Korte mentale-load-cheatsheet voor jou (Stefan)

| Wat | Antwoord |
|-----|----------|
| Welke fase nu? | 🚧 Fase 8 — SEO & GEO, klaar voor deploy |
| Commit gemaakt? | Ja — op `main`, NIET gepusht |
| Eerste actie morgen? | `git push origin main` → Vercel deployt automatisch |
| Daarna? | 5 live-validaties + Search Console (zie prompt hierboven) |
| Wat blokkeert nu? | Niets — Stefan kiest wanneer hij pusht |

## Wat je doet als je verder wilt

1. Start een nieuwe Claude-sessie met bovenstaande prompt
2. Geef akkoord voor de push, of geef aan dat je eerst iets wilt
   aanpassen (bv. KvK toevoegen aan SiteSchema)
3. Claude valideert na deploy de live-URLs en update het Fase 8-verslag
