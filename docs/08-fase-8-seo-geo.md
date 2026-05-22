# Fase 8 — SEO & GEO

**Datum gestart:** 20 mei 2026
**Status:** ✅ Lokaal afgerond, **wacht op Vercel-deploy + live-validatie**
(commit op `main`, nog niet gepusht). Zie [§ 6 Hand-over](#6-hand-over-voor-volgende-sessie) onderaan voor de actie-volgorde
van morgen.

---

## 0. Doel & scope

Vóór Fase 8 had hlty.shop praktisch geen SEO-infrastructuur: één
statische `index.html` met dezelfde meta-tags voor alle pagina's, geen
sitemap, geen structured data, geen GEO-laag.

Deze fase legt de fundering voor twee soorten zoek-ontdekbaarheid:

- **SEO (klassiek)** — Google, Bing: meta-tags, structured data,
  sitemap, redirects. Doel: rich results en betere rankings voor
  relevante zoekopdrachten.
- **GEO (Generative Engine Optimization)** — ChatGPT, Perplexity,
  Claude, Gemini: content zo opgebouwd dat AI-assistenten HLTY
  herkennen en kunnen citeren. Doel: zichtbaarheid in AI-antwoorden.

Het werk is **template-gedreven**: zodra de basis staat, krijgen nieuwe
producten automatisch correcte SEO-tags. Daarom past dit logisch vóór
Fase 9 (assortiment-onderzoek) — de tweede content-pass in Fase 10
wordt licht onderhoud i.p.v. herbouw.

---

## 1. Initial state (audit 20 mei 2026)

| Element | Huidige staat |
|---|---|
| `index.html` | Eén globale title + description voor *alle* pagina's |
| `robots.txt` | Bestaat niet |
| `sitemap.xml` | Bestaat niet |
| Head-management library | Geen |
| JSON-LD / structured data | Geen |
| Per-pagina meta-tags | Geen — alle 12 page-types delen dezelfde tags |
| Open Graph / Twitter cards | Geen |
| Canonical URLs | Geen |
| `vercel.json` | Alleen SPA-rewrite, geen 301-redirects |
| Rendering | Vite SPA, client-side rendering |

**12 page-types die SEO-werk nodig hebben:** Home, Product, Collection
(categorie), Brand (merk), AllProducts, Search, Contact, Policy,
Account, NotFound, AuthCallback, Welcome.

---

## 2. Technische beslissingen (vastgelegd 20 mei 2026)

### 2.1 Crawlability — JS-rendering accepteren

**Keuze:** geen prerendering of SSR-migratie. Google crawlt de SPA via
zijn eigen JS-renderer. Met correcte sitemap, interne linking en
duidelijke meta-tags is dit voor ~1000 producten ruimschoots
voldoende.

**Trade-off:** indexering kan iets trager zijn dan bij static HTML, en
sommige minder krachtige crawlers (sommige social platforms) zien de
content mogelijk niet meteen. Dit is acceptabel voor de huidige
schaal en wordt heroverwogen als groei dat eist.

### 2.2 Head-management — React 19 native

**Keuze:** geen externe library (geen `react-helmet-async`). React 19
ondersteunt `<title>`, `<meta>`, `<link>` direct in components — die
worden automatisch naar `<head>` gehoist. Lichter, modern, past bij de
stack.

**Implementatie:** per pagina-component een `<SEO>`-helper die de set
voor die pagina rendert (title, description, canonical, OG, Twitter).

### 2.3 AI-bots — toelaten

**Keuze:** GPTBot, PerplexityBot, ClaudeBot, Google-Extended (Gemini),
Bingbot expliciet `Allow` in `robots.txt`.

**Waarom:** GEO werkt alleen als AI-assistenten mogen crawlen. Wanneer
ChatGPT/Perplexity HLTY noemt in een antwoord op *"welke supplementen
helpen bij slecht slapen"*, levert dat directe traffic. Zonder
toegang zou de GEO-laag van Fase 8 inhoudsloos zijn.

---

## 3. Plan van aanpak — 5 stappen

> Per stap: korte audit + opties → Stefan kiest waar nodig →
> implementeren in browser-testbare batches → live na akkoord per
> substantiële wijziging. Iedere stap eindigt met een update aan dit
> verslag.

### Stap 1 — Fundamenten ✅ (lokaal klaar, deploy nog te doen)

- [x] **`public/robots.txt`** — wildcard allow + expliciete AI-bot
      allowlist (GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot,
      Perplexity-User, ClaudeBot, Claude-User, Claude-SearchBot,
      Google-Extended, Applebot-Extended, Bingbot). Disallow op
      `/account`, `/auth/`, `/welkom`. Sitemap-pointer naar
      `https://www.hlty.shop/sitemap.xml`. Geverifieerd: dev-server
      serveert hem op `/robots.txt` met `Content-Type: text/plain`.
- [x] **`api/sitemap.ts`** — Vercel serverless function, fetcht alle
      producten + collecties via Shopify Storefront API (paginated,
      250 per call), dedupeert vendors → brand-handles, voegt 9
      static pages toe. Output: well-formed XML. Cache:
      `s-maxage=3600, stale-while-revalidate=86400` op edge.
      Niet lokaal testbaar (vereist Vercel runtime) — wordt
      gevalideerd na deploy.
- [x] **`vercel.json`** — server-side 301-redirects voor
      `/account/login`, `/account/register`, `/account/orders`,
      `/pages/contact`. Rewrite `/sitemap.xml` → `/api/sitemap`.
      SPA-catch-all behouden.
- [x] **`src/App.tsx`** — 4 client-side `<Navigate>` redirects
      verwijderd (vervangen door server-side 301's hierboven).
      `Navigate`-import opgeruimd.
- [x] **Sitemap-scope vastgelegd**: alle actieve producten +
      alle collecties + alle merk-vendor pagina's + 9 static pages
      (home, alle-producten, contact, 6 beleid-slugs). Volledig — als
      Stefan iets eruit wil, gemakkelijk in `STATIC_PAGES` of de
      query aan te passen.

**Te valideren na deploy:**
- `https://www.hlty.shop/robots.txt` rendert
- `https://www.hlty.shop/sitemap.xml` rendert valid XML met alle
  producten/collecties/brands (Google Search Console kan checken)
- `https://www.hlty.shop/account/login` geeft 301 → `/account`
  (inspect via curl `-I` of devtools Network tab)
- Stap 5 zal de echte indexering verifiëren via Search Console.

### Stap 2 — Per-pagina head management ✅

- [x] **`src/components/SEO.tsx`** — herbruikbare helper op React 19's
      native head-hoisting. Props: `title`, `description`, `path`,
      `image?`, `type?` (`website` / `product`), `noindex?`. Title
      krijgt automatisch ` | HLTY`-suffix tenzij de merknaam al
      voorkomt. Canonical, og:* en twitter:* worden uit één set props
      afgeleid.
- [x] **Index.html opgeschoond** — alle meta-tags die de SEO-component
      beheert zijn verwijderd (description, og:*, twitter:*). React 19
      kan tags niet dedupliceren tegen statische HTML; door ze weg te
      halen blijft er één set tags over per pagina. Static `<title>`
      blijft als fallback voor de fractie vóór hydration.
- [x] **Dynamische pagina's** met template-meta:
  - Product: titel = `formatProductTitle(...)`, description = eerste
    160 char van Shopify-description, image = eerste product-image,
    type = `product`.
  - Collection: titel + Shopify-collection-description met fallback.
  - Brand: titel + brand-USP zin.
  - AllProducts: vaste handmatige meta voor het volledige assortiment.
  - Search: titel met query, `noindex` (zoekresultaten horen niet
    in de SERPs).
- [x] **Statische pagina's** handmatig: Home, Contact, Policy (per
      slug eigen description via `POLICY_DESCRIPTIONS` map), Welcome
      (noindex), NotFound (noindex), AuthCallback (noindex), Account
      (noindex).
- [x] **`src/App.tsx`** geverifieerd: SEO-component werkt door
      animatie-mount cycles van AnimatePresence heen.

**Browser-verificatie (lokaal, alle 6 paden getest):**

| Pagina | Title | Canonical | Robots |
|---|---|---|---|
| `/` | HLTY — Duidelijkheid in zelfzorg | / | (default) |
| `/product/{handle}` | `{productnaam}` | /product/{handle} | (default) |
| `/collectie/vitamines-1` | Vitamines \| HLTY | /collectie/vitamines-1 | (default) |
| `/contact` | Contact \| HLTY | /contact | (default) |
| `/beleid/verzending` | Verzendbeleid \| HLTY | /beleid/verzending | (default) |
| `/zoeken?q=magnesium` | Zoekresultaten voor "magnesium" \| HLTY | /zoeken?q=magnesium | noindex,nofollow |
| `/account` | Mijn account \| HLTY | /account | noindex,nofollow |
| `/niet-bestaande-pagina` | Pagina niet gevonden \| HLTY | /...-pagina | noindex,nofollow |

Per pagina exact één meta-tag per type. Geen console-errors, geen
failed requests. Productpagina kreeg correct `og:type=product` +
Shopify CDN product-image als `og:image`.

**Trade-off opgemerkt:** social-share-bots (Facebook, Slack,
LinkedIn) renderen vaak géén JS, dus zien voor àlle pagina's de
fallback uit `index.html` (HLTY-homepage-titel). Acceptabel binnen
de gekozen JS-rendering-strategie. Volledige fix vereist
prerendering — buiten scope van Fase 8.

### Stap 3 — Structured data (JSON-LD) ✅ (basis klaar, Organization wacht op data)

- [x] **`src/components/JsonLd.tsx`** — herbruikbare wrapper voor
      `<script type="application/ld+json">`. Escape `<` om XSS in
      stringified payload te voorkomen.
- [x] **`src/components/SiteSchema.tsx`** — Organization
      (`@type: OnlineStore`) + WebSite (met `SearchAction` zodat
      Google sitelinks-zoekvak kan tonen). Gemount in `App.tsx`,
      dus aanwezig op elke route. **Placeholder-velden** voor KvK,
      adres, contactPoint en sameAs — Stefan moet aanvullen (zie
      Open beslissing #3).
- [x] **Product schema** op `/product/{handle}`:
      naam, beschrijving, images, sku (variant-id), brand, offer met
      prijs/currency/availability. Bij meerdere varianten:
      `AggregateOffer` met low/highPrice + offerCount.
- [x] **BreadcrumbList** op Product, Collection, Brand, AllProducts —
      respecteert herkomst-state (van-collectie of van-brand) bij
      Product.
- [x] **ItemList** op Collection (`numberOfItems` = totaal, eerste 30
      URLs), Brand, AllProducts. Search overgeslagen (heeft noindex).

**Browser-verificatie (lokaal):**

| Pagina | JSON-LD types | Validatie |
|---|---|---|
| `/` | OnlineStore, WebSite | ✅ valid |
| `/product/...` | OnlineStore, WebSite, **Product**, **BreadcrumbList** | ✅ valid, prijs €13,50 EUR, InStock |
| `/collectie/vitamines-1` | OnlineStore, WebSite, **BreadcrumbList**, **ItemList** | ✅ valid, 49 items |

**Na live-deploy nog te valideren:**
- [Google Rich Results Test](https://search.google.com/test/rich-results)
  per pagina-type (Product, BreadcrumbList, Organization)
- Schema Markup Validator (schema.org/validator) — strict validatie

### Stap 4 — GEO-laag ✅

- [x] AI-bots in `robots.txt` expliciet toelaten — gedaan in Stap 1
- [x] **`public/llms.txt`** — emerging discovery-standaard
- [x] Snelle content-scan: geen problematische marketingclaims
      gevonden in Home, Contact, HealthConsultation. "100%
      Physio-expertise" is acceptabele trust-stat over het
      selectie-proces, niet een claim over productwerking.
- [x] **FAQ-pagina** `/veelgestelde-vragen` — 8 vragen met
      gecureerde antwoorden:
  1. Hoe selecteert HLTY producten?
  2. Wat is het verschil tussen HLTY en een drogist?
  3. Hoe weet ik welke supplementen ik nodig heb?
  4. Wanneer is een supplement zinvol — en wanneer niet?
  5. Wat betekent "geselecteerd door fysiotherapeuten"?
  6. Maakt HLTY eigen supplementen of verkopen jullie alleen andere
     merken?
  7. Zijn jullie producten medisch onderbouwd?
  8. Hoe vergelijken jullie producten zich met goedkopere supplementen
     elders?
  - Accordion-UI met framer-motion, eerste vraag default open
  - `FAQPage` + `BreadcrumbList` JSON-LD voor rich results
  - Toegevoegd aan footer (Klantenservice-sectie) + sitemap
  - Antwoorden zijn feitelijk, citation-ready, en houden de medische
    disclaimers van de Health Consultation aan

### Stap 5 — Validatie + Search Console

Pre-deploy (lokaal) klaar; live-validatie kan pas na Vercel-deploy.

- [x] tsc + `npm run build` groen
- [x] Browser-test: per route correcte title/meta/JSON-LD, geen
      console-errors, geen failed requests
- [ ] Live deploy
- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results)
      per pagina-type (Product, BreadcrumbList, Organization, FAQPage)
- [ ] Lighthouse SEO-score (mobiel + desktop) — baseline meten
- [ ] Mobile-friendly test
- [ ] Sitemap aanbieden in Google Search Console
- [ ] Optioneel: Bing Webmaster Tools
- [ ] Verslag bijwerken met live-validatie-bevindingen

---

## 4. Open beslissingen (verzamelen tijdens uitvoering)

| # | Beslissing | Status |
|---|---|---|
| 1 | Sitemap-scope | ✅ Vastgelegd: alle producten + collecties + brand-vendors + 9 static pages |
| 2 | OG-image-strategie (vast vs dynamisch) | ✅ Opgelost (22 mei): dedicated 1200×628 banner van Stefan als `public/og-image.jpg`, ingesteld als `DEFAULT_OG_IMAGE` in `SEO.tsx` (og + twitter) + Organization `image`. Shopify CDN-image blijft per product de override. |
| 3 | Organization-gegevens (KvK, contact, social) | ✅ Grotendeels gedaan (22 mei): KvK 98276441, RSIN/taxID, BTW/vatID, PostalAddress, legalName "HLTY VOF", telefoon + e-mail nu in `SiteSchema.tsx`. **Resteert:** `sameAs` social-URLs zodra Stefan Instagram/Facebook/LinkedIn heeft aangemaakt (laag-prio, niet blokkerend). |
| 4 | Dedicated FAQ-pagina maken? | ✅ Gekozen voor JA — 8 vragen op `/veelgestelde-vragen` met FAQPage JSON-LD |

---

## 5. Status

| Stap | Status |
|---|---|
| 1 — Fundamenten | ✅ Code klaar, wacht op Vercel deploy + validatie van live sitemap |
| 2 — Per-pagina head | ✅ Code klaar + browser-getest (lokaal) |
| 3 — Structured data | ✅ Code klaar (contactPoint nu ingevuld; KvK/adres/social optioneel later) |
| 4 — GEO-laag | ✅ robots.txt + llms.txt + FAQ-pagina klaar |
| 5 — Validatie | ✅ Lokaal alles getest, **klaar voor live deploy** |

---

## 6. Hand-over voor volgende sessie

**Punt waarop deze sessie eindigt (20 mei 2026, einde dag):** Alle code
voor Fase 8 is geschreven, lokaal getest (tsc + build groen, geen
console-errors, JSON-LD valid, meta-tags correct per route). Er is een
**commit aangemaakt op `main`** met al het werk hieronder, maar nog
**NIET gepusht** naar GitHub. Stefan kiest het deploy-moment.

### Wat klaarstaat in de commit

- 3 nieuwe public-bestanden: `robots.txt`, `llms.txt` (sitemap.xml komt
  via serverless function)
- 1 nieuwe serverless function: `api/sitemap.ts`
- 4 nieuwe React-componenten: `SEO`, `JsonLd`, `SiteSchema`, `Faq`-pagina
- 1 nieuwe route: `/veelgestelde-vragen`
- `vercel.json` uitgebreid met 4 server-side 301-redirects + sitemap-rewrite
- `index.html` opgeschoond (per-pagina meta wordt nu door React beheerd)
- 12 pagina's voorzien van SEO-component
- 4 pagina's voorzien van extra JSON-LD (Product/Collection/Brand/AllProducts/FAQ)
- Footer-link naar FAQ
- Verwijderd: dode `<Navigate>`-redirects in `App.tsx`,
  `src/components/AIAdvisor.tsx` (was dead code, geen imports)
- Documentatie: dit verslag + roadmap-update in Fase 6-verslag +
  README-index + `_next-session.md`

### Acties voor morgen (in volgorde)

1. **Pushen**: `git push origin main` → Vercel deployt automatisch.
2. **Live-URL-validatie** (5 checks):
   - `https://www.hlty.shop/robots.txt` → 200, met AI-bot allowlist
   - `https://www.hlty.shop/sitemap.xml` → valid XML met alle producten
     + collecties + brands + 10 static pages
   - `https://www.hlty.shop/llms.txt` → 200
   - `curl -I https://www.hlty.shop/account/login` → `301 → /account`
   - `https://www.hlty.shop/veelgestelde-vragen` → rendert + FAQ-schema
     zichtbaar in page source
3. **[Google Rich Results Test](https://search.google.com/test/rich-results)**
   per type:
   - Home: Organization + WebSite + SearchAction
   - Een productpagina: Product + BreadcrumbList
   - Een collectiepagina: BreadcrumbList + ItemList
   - `/veelgestelde-vragen`: FAQPage + BreadcrumbList
4. **Google Search Console**:
   - Sitemap aanbieden: `https://www.hlty.shop/sitemap.xml`
   - Indexering aanvragen voor home + FAQ + een paar producten
5. **Lighthouse SEO-baseline** (mobiel + desktop) — scores noteren
   hieronder in een nieuwe sectie.

### Niet-blokkerend, kan tussendoor

- Stefan levert KvK + fysiek adres + social-URLs → opnemen in
  `src/components/SiteSchema.tsx` (TODO-comments staan klaar)
- Dedicated 1200×630 OG-image als `public/og-image.jpg` →
  vervang dan `DEFAULT_OG_IMAGE` in `src/components/SEO.tsx`
- Bing Webmaster Tools (optioneel)
