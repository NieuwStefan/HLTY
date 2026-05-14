# Fase 6 — AI-websitetest: bevindingen en oplossingen

**Datum:** 14 mei 2026
**Status:** 🟡 Lopend — punten worden één voor één doorgewerkt
**Doel:** Het AI-websitetest-rapport van 14 mei 2026 systematisch
afwerken. Per punt: analyseren waarom het optreedt, opties bespreken
met Stefan, oplossing bouwen, testen.

---

## 1. Doel & scope

Op 14 mei 2026 heeft een AI-testbot de hele HLTY-storefront
geautomatiseerd doorlopen en 26 bevindingen geregistreerd
(rapport: `HLTY_Websitetest_Rapport.docx`), verdeeld over zes
categorieën:

| Categorie | Aantal |
|-----------|--------|
| KRITIEK | 2 |
| BUG | 5 |
| UX | 7 |
| CONTENT | 7 |
| COPY | 3 |
| URL | 2 |
| **Totaal** | **26** |

Werkwijze afgesproken met Stefan:
- Stap voor stap door de lijst, **geen quick fixes**, lange-termijn
  oplossingen
- Per punt meerdere oplossingen voorleggen, Stefan kiest
- Voorzichtig met Shopify-wijzigingen (onomkeerbare fouten vermijden)
- Sommige bevindingen mogen blijven zoals ze zijn als dat de meest
  pragmatische keuze is

**Niet in deze fase:**
- Productadvisor (rapport-punt #3, #5) krijgt een eigen fase 7+
  omdat Stefan zelf nog extra issues heeft geconstateerd die niet in
  het rapport staan. De Productadvisor-problemen vragen een
  volledige eigen behandeling

---

## 2. Initial state

De Vercel-deploy van fase 5 stond live op `www.hlty.shop`. De
React-app werkte op storefront-niveau (producten, collecties, cart,
checkout, account-flow), maar:

- **Klantenservice-links in de footer** wezen naar lege Shopify-
  beleidspagina's op `checkout.hlty.shop/policies/*` — bezoekers
  vonden geen retour-, verzend- of privacyteksten
- **Onbekende URLs** (zoals `/account/login`) toonden alleen header
  en footer; `<main>` bleef leeg — er was geen catch-all 404-route
  in `src/App.tsx`

---

## 2b. Belangrijke context: Holland Pharma API

Alle producten in de webshop komen uit **twee bronnen**:

1. **HLTY (eigen merk)** — Stefan beheert deze rechtstreeks in Shopify admin.
2. **Alle andere merken** (Orthica, Royal Green, ESN, Fittergy, Toco Tholin,
   etc.) — productdata wordt **automatisch geïmporteerd vanuit groothandel
   Holland Pharma** via een API-koppeling.

**Waarom relevant voor deze fase:** veel content-bevindingen in dit rapport
komen niet uit Stefan's eigen werk maar uit Holland Pharma's feed:

- #6 Bewaarvoorschrift afgebroken
- #7 ESN voetnootmarkeringen zonder definities
- #16 "by fittergy" dubbel
- #17 "Ingredienten" zonder trema
- #18 Orthica spatie ontbreekt
- #19 "buiten bereik" kleine letter
- #20 ".00" in productnamen

**Consequentie voor aanpak:** wijzigingen die we in Shopify admin doorvoeren
worden bij de volgende API-sync **overschreven**. Daarom kiezen we voor deze
content-issues bewust voor **presentatie-laag-fixes** (in React-code) i.p.v.
handmatige correcties in Shopify. Voorbeeld: punt #17 wordt opgelost via een
`TITLE_OVERRIDE` in `ProductDescription.tsx` zodat álle producten — ook
toekomstige Holland Pharma imports — automatisch "Ingrediënten" tonen.

**Toekomstig project:** mogelijk een tussenlaag tussen Holland Pharma feed
en Shopify die data normaliseert (typografie, formatting) voor het in
Shopify komt. Genoteerd in projectmemory.

---

## 3. Beslissingen overkoepelend

### B6.1 — Statische policy-content i.p.v. live API

Eerst was het plan om de Shopify Storefront API te gebruiken voor de
4 standaard policies (Privacy, Retour, Verzend, Servicevoorwaarden).
Maar:

- De Shopify auto-genereerde Privacy-tekst bevatte ruwe Liquid-tags
  (`{{ shop_name }}` etc.) die wij in de admin-edit-view wél, en via
  de Storefront API niet geresolveerd kregen
- "Contact Informatie" en "Wettelijke kennisgeving" zijn nieuwere
  Shopify-policy-types die nog niet in de Storefront API (zelfs 2025-04)
  worden geëxposeerd

Stefan koos voor **alle 6 policies statisch in code**, om Liquid-tag-
gedoe te voorkomen en consistentie te bewaren. Trade-off: bij wijziging
in Shopify moet de tekst in code worden bijgewerkt. Acceptabel voor de
huidige update-frequentie van policies.

### B6.2 — Eigen privacy-tekst i.p.v. Shopify-template

De Shopify-auto-template was 17.211 tekens en generiek-wereldwijd
(CCPA, GDPR-EER, UK, EU, etc.). Niet passend bij een NL-MKB-webshop.
Stefan koos voor **een eigen beknopte privacyverklaring** (~1.700
tekens), specifiek voor HLTY's situatie:

- Genoemde verwerkers: Shopify, Mollie, PayPal, Shopify Payments,
  PostNL, Google Workspace, Vercel
- Bewaartermijnen: 7 jaar voor facturen, accountdata zolang actief,
  e-mailcontact max 2 jaar
- Geen tracking voor advertenties (huidige situatie)

### B6.3 — URL-stijl `/beleid/*` (Nederlands, genest)

Gekozen boven Shopify-mirror `/policies/*` omdat het Nederlands
leesbaarder is en past bij de overall site-stijl. SEO-impact beperkt
omdat Shopify-paden tot nu toe op een ander subdomein leefden
(`checkout.hlty.shop`).

### B6.4 — Footer hardcoded i.p.v. live Shopify-menu

De `getMenu('footer')`-call eruit, Klantenservice-links zijn nu een
hardcoded array in `Footer.tsx`. Eén bron van waarheid, geen
Shopify-config-afhankelijkheid voor de footer.

### B6.5 — Catch-all 404 + redirects voor Shopify-legacy URLs

Voor punt 2 koos Stefan voor **optie C**: een catch-all 404-pagina
in eigen styling én specifieke redirects voor de meest voorkomende
Shopify-legacy URLs (`/account/login`, `/account/register`,
`/account/orders`, `/pages/contact`) naar onze eigen routes. Lost
zowel het specifieke AI-rapport-punt op als alle toekomstige
"willekeurig onbekende URL"-gevallen.

---

## 4. Wat is gedaan per punt

### ✅ Punt 1 — KRITIEK Klantenservice-links + #26 URL-subdomein

**Bevinding:** Alle 7 Klantenservice-links in de footer wezen naar
`checkout.hlty.shop/policies/*` en toonden lege pagina's (Horizon-thema
zonder content). Bezoekers vonden geen retour-, verzend- of
privacyteksten.

**Oplossing:**
- Nieuwe React-routes voor 7 pagina's, alle statische content in
  [src/lib/policy-content.ts](../src/lib/policy-content.ts)
- Eén `Policy`-template ([src/pages/Policy.tsx](../src/pages/Policy.tsx))
  rendert de juiste content op basis van URL-slug, met witte
  `glass`-card en eigen `.prose-hlty` styling
- Eigen redesigned Contact-pagina ([src/pages/Contact.tsx](../src/pages/Contact.tsx))
  met `glass-dark` hero in Home-stijl
- Footer-links omgeleid naar interne routes; `getMenu('footer')`
  weggehaald
- 6 policies statisch:
  - Privacy: eigen HLTY-tekst (~1.700 tekens)
  - Wettelijke kennisgeving: opgehaald uit Shopify admin via JS
  - Contactgegevens: opgehaald uit Shopify admin via JS
  - Retour / Verzend / Servicevoorwaarden: uit Storefront API
    (zelf door Stefan eerder geschreven, schone HTML)
- Genummerde sub-secties allemaal H2 voor visuele consistentie
- Privacy-tekst noteert huidige situatie. **Wishlist:** updaten bij
  activatie van Meta pixel, analytische cookies, of marketing-mail.

**Routes:**
- `/beleid/verzending`
- `/beleid/retour`
- `/beleid/voorwaarden`
- `/beleid/privacy`
- `/beleid/contact-informatie`
- `/beleid/wettelijke-kennisgeving`
- `/contact`

**Lost ook op:** punt #26 (URL-inconsistentie naar
`checkout.hlty.shop`-subdomein) — alle Klantenservice-content staat
nu op `www.hlty.shop`.

**Status:** ✅ Gecommit en gepusht (`22777fa`), Vercel productie-deploy
live.

### ✅ Punt 2 — KRITIEK Account/login leeg

**Bevinding:** `hlty.shop/account/login` toonde alleen header + footer,
geen inlogformulier.

**Diagnose:**
- `/account/login` is een **standaard Shopify-conventie** voor klant-
  account-login op klassieke Liquid-thema's. De AI-testbot heeft die
  URL waarschijnlijk uit gewoonte geprobeerd; nergens op de site staat
  een link daarheen (header linkt naar `/account`)
- Probleem is breder dan alleen deze URL: **élke** onbekende URL op
  `www.hlty.shop` was leeg, omdat:
  1. Vercel's `vercel.json` rewrite (`/((?!api/).*)` → `/index.html`)
     serveert de SPA voor alle non-API-paden
  2. React-Router in `App.tsx` had geen catch-all route
  3. Geen match → leeg `<main>`, alleen header + footer
- Onze eigen `/account` route (uit fase 2) werkt prima — het AI-rapport
  testte simpelweg een legacy-URL die wij niet ondersteunden

**Oplossing (Optie C):**
- Nieuwe [src/pages/NotFound.tsx](../src/pages/NotFound.tsx) — 404 in
  HLTY-stijl met glass-dark hero, mint "404"-cijfer, "Terug naar
  home"-knop + suggested-links (Vitamines, Fysiotherapie & Herstel,
  Mijn Account, Contact)
- Vier specifieke redirects in [src/App.tsx](../src/App.tsx):
  - `/account/login` → `/account`
  - `/account/register` → `/account`
  - `/account/orders` → `/account`
  - `/pages/contact` → `/contact`
- Catch-all `<Route path="*" element={<NotFound />} />`

**Voordeel breder dan het rapport:**
- Oude bookmarks of Google-zoekresultaten naar Shopify-paden landen
  nu op onze eigen pagina's (UX + SEO winst)
- Elke onbekende URL krijgt een nette 404 i.p.v. een silent-leeg
  scherm (vertrouwen-wekkender)

**Status:** ✅ Lokaal getest (`/dit-bestaat-niet` → 404,
`/account/login` → `/account`, `/pages/contact` → `/contact`). Build
groen. **Nog niet gepusht** — wachten op bundeling met volgende punten.

### ✅ Batch D — Cart drawer (punten 12 + 15)

**Bevindingen:**
- #12 Productnamen werden afgekapt op één regel (Tailwind `truncate`)
- #15 "Merklabel" toonde de eerste 30 tekens van de producttitel ("FITTERG"
  voor een Fittergy-product), niet de echte vendor

**Oplossing:**
- [src/lib/shopify.ts](../src/lib/shopify.ts): `CART_FRAGMENT` haalt nu
  `product.vendor` op; `CartLine` type uitgebreid
- [src/components/CartDrawer.tsx](../src/components/CartDrawer.tsx) regel
  132-134: vervang `title.split(' | ')[0]?.slice(0, 30)` door
  `line.merchandise.product.vendor` (met fallback als vendor leeg is)
- Idem regel 135: `truncate` → `line-clamp-2` (max 2 regels met ellipsis)

**Verifieerd:** vendor toont nu echte merknaam ("HLTY", "FITTERGY", etc.) en
lange productnamen wrappen netjes op 2 regels.

**Status:** ✅ Live.

### ✅ Batch C — Productpagina (punten 17 + 21)

**Bevindingen:**
- #17 Accordion-titel "Ingredienten" zonder trema
- #21 Breadcrumb sloeg het collectie/categorie-niveau over

**Oplossing #17:**
- [src/components/ProductDescription.tsx](../src/components/ProductDescription.tsx):
  `TITLE_OVERRIDES` uitgebreid met `{ match: /^ingredi[eë]nten/i, label: 'Ingrediënten' }`
- Werkt **sitebreed** voor alle producten, ongeacht hoe het in Shopify
  staat. Past in de strategie uit § 2b (presentatie-laag-fixes voor Holland
  Pharma content)

**Oplossing #21:**
- Nieuw bestand [src/lib/categories.ts](../src/lib/categories.ts) met
  `PRIMARY_CATEGORIES` (5 handles uit footer) + `findPrimaryCategory()`
  helper
- [src/lib/shopify.ts](../src/lib/shopify.ts): `PRODUCT_FRAGMENT` haalt nu
  `collections(first: 10) { edges { node { handle title } } }` op;
  `Product` type uitgebreid met `collections: { handle, title }[]`;
  `reshapeProduct` mapped naar plat array
- [src/components/ProductCard.tsx](../src/components/ProductCard.tsx):
  nieuwe `from?: { type, handle, title }` prop, geeft state mee aan
  `<Link state={{ from }}>`
- [src/pages/Collection.tsx](../src/pages/Collection.tsx) en
  [src/pages/Brand.tsx](../src/pages/Brand.tsx): geven `from` mee aan elke
  ProductCard
- [src/pages/Product.tsx](../src/pages/Product.tsx): nieuwe breadcrumb-
  logica leest `useLocation().state`. Bij `from.type === 'collection'` →
  toon collectie als tussenniveau. Bij `from.type === 'brand'` → geen
  tussenniveau (brand staat al in breadcrumb). Bij geen state → fallback op
  `findPrimaryCategory()` whitelist

**Drie scenario's geverifieerd:**
- Vanaf `/collectie/energie-1` → `Home / Energie / Royal Green / Product` ✓
- Vanaf `/merken/royal-green` → `Home / Royal Green / Product` ✓
- Direct URL Royal Green Magnesium → `Home / Royal Green / Product`
  (geen fallback want product zit niet in primary categories — zie
  aandachtspunt hieronder)

**Aandachtspunt voor toekomst:** Holland Pharma plaatst veel producten
alleen in **gezondheidsdoel-** (`energie-1`, `botten`, etc.) en
**ingrediënt-collecties** (`magnesium-1`, etc.), maar **niet** in de 5
primary-category-collecties die nu in de whitelist staan
(`vitamines-1`, `mineralen-1`, `eiwitten-aminozuren-1`,
`kruiden-planten-2`, `fysiotherapie-herstel-1`). Voor zulke producten
werkt de fallback niet en valt de breadcrumb terug op `Home / Merk /
Product`.

**Toekomstige verbetering:** de whitelist verbreden naar bredere top-
niveau-collecties (bv. "Supplementen & Vitamines" of de header-nav-
items: Gezondheidsdoelen, Ingrediënten & Stoffen, Bewuste Voeding,
Fysiotherapie & Herstel, Accessoires & Lifestyle). Vraag is wel welke
"meest logisch" voelt voor klanten die direct binnenkomen op een
productpagina. Op te pakken als aparte verbetering wanneer de overige
rapport-punten zijn afgehandeld.

**Status:** ✅ Live.

### ✅ Batch B — Homepage Hero (punten 8 + 9 + 23) + nieuwe /alle-producten

**Bevindingen:**
- #8 Twee CTA's ('Ontdek producten' + 'Bekijk alle producten') wezen beide
  naar `/collectie/vitamines-1`
- #9 Hero-afbeelding toonde grijs placeholder bij eerste laden
- #23 Hero- en Productadvisor-sectie hadden dezelfde kop "Welk supplement
  past bij jou?"

**Oplossing #9:**
[src/pages/Home.tsx](../src/pages/Home.tsx) — hero-img krijgt
`loading="eager"` + `fetchPriority="high"`. Browser geeft de above-the-fold
afbeelding nu prioriteit.

**Oplossing #23:**
[src/components/AIAdvisor.tsx](../src/components/AIAdvisor.tsx) — kop
gewijzigd naar "Persoonlijk supplementadvies". Geen dubbele h1 meer op
de homepage.

**Oplossing #8 — uitgegroeid tot eigen feature:**
Stefan koos voor optie C3 (volledig): een echte "alle producten"-pagina
met multi-laags tegelfiltering, multi-select, URL-state en filter
sidebar. Geen Shopify-config-actie nodig.

- Nieuwe [src/pages/AllProducts.tsx](../src/pages/AllProducts.tsx) op
  route `/alle-producten`
- Nieuwe [src/lib/product-categories.ts](../src/lib/product-categories.ts):
  taxonomie van 3 hoofdcategorieën (Voeding / Supplementen / Fysio &
  Accessoires) met sub-tegels die elk naar één of meerdere Shopify-
  collecties verwijzen. Bijvoorbeeld "Omega-3 & Vetzuren" bundelt
  `omega-3-visolie-1`, `krillolie-overige-vetzuren-1`, `mct-olie-1` en
  `algenolie-1` in één tegel
- [src/lib/shopify.ts](../src/lib/shopify.ts): `PRODUCT_CARD_FRAGMENT`
  uitgebreid met `collections` zodat client-side filtering op
  productcategorie werkt; nieuwe `getAllProducts()`-helper paginineert
  intern alle ~950 producten in batches van 250
- [src/pages/Home.tsx](../src/pages/Home.tsx): Trust-banner CTA én hero
  CTA "Ontdek producten" wijzen nu beide naar `/alle-producten`

**Werkwijze op de pagina:**
1. Klant ziet 3 hoofdcategorieën — single-select (één tegelijk actief)
2. Bij keuze verschijnen alle sub-tegels van die hoofdcategorie — multi-
   select (meerdere tegelijk actief mogelijk)
3. Producten in grid filteren live mee met de selectie
4. Daarnaast filter sidebar (merk, dieet, voorraad) — orthogonaal aan
   tegel-keuze
5. Actieve selecties als chip-rij bovenaan met X-knop per chip + "Wis
   alles" link
6. URL synchroon met state (`?cat=supplementen&sub=vitamines,mineralen`)
   → deelbaar, bookmark-baar, browser-back werkt

**Sportvoeding-strategie:** producten die in zowel Voeding- als
Supplementen-collecties zitten verschijnen automatisch in beide
hoofdcategorieën — geen extra mapping nodig (Shopify's many-to-many
collectie-koppeling).

**Aandachtspunt:** ~950 producten worden bij eerste pageload in één
keer geladen (4 API-calls van 250 elk). Cached via `getAllProducts`.
Voor toekomstige optimalisatie: server-side filtering zodra het
catalogus groeit voorbij ~2000 producten.

**Status:** ✅ Live (in dezelfde push als de rest van fase 6).

### ✅ Uitbreiding: categorie-filter ook in FilterSidebar

Tijdens fase 6 koos Stefan ervoor om de tegel-strategie van
`/alle-producten` ook bruikbaar te maken op **alle gezondheidsdoel- en
collectie-pagina's** via de filter sidebar. Klant kan dan op bv.
"Spieren & Kracht" filteren op "Supplementen → Eiwitten & Aminozuren".

**Implementatie:**
- [src/components/FilterSidebar.tsx](../src/components/FilterSidebar.tsx):
  nieuwe optionele "Categorie"-sectie (multi-select main + gegroepeerde
  subs per actieve main, met live counts)
- [src/components/Checkbox.tsx](../src/components/Checkbox.tsx): nieuwe
  herbruikbare component met HLTY-styling (mint-tegel + wit
  Check-icoon, afgeronde hoeken). Vervangt overal de browser-default
  checkbox-look voor consistentie tussen FilterSidebar en
  Account-pagina
- [src/pages/Collection.tsx](../src/pages/Collection.tsx): categorie-
  filter state + filter-logica + props doorgeven aan FilterSidebar
- [src/pages/AllProducts.tsx](../src/pages/AllProducts.tsx): tegels en
  sidebar-categorie zijn nu gesynchroniseerd via dezelfde URL-state
  (C3 — één bron van waarheid)
- [src/lib/product-categories.ts](../src/lib/product-categories.ts):
  helpers `findMainBySubId()` en `handlesForMainsAndSubs()` voor
  multi-main flow

**Resultaat:** klant op `/collectie/spieren-kracht-1` ziet in de
sidebar `Categorie > Voeding (15) / Supplementen (73) / Fysio &
Accessoires (22)`. Bij keuze Supplementen verschijnt
`BINNEN SUPPLEMENTEN` met sub-checkboxes (Vitamines 5, Eiwitten &
Aminozuren 55, etc.) — alles met live counts die alle andere
filter-secties respecteren.

**Status:** ✅ Live.

### ⏭ Punt 3 — BUG Productadvisor "STAP 0 VAN 3"

**Bevinding:** Tijdens het laden van de productadvisor verschijnt
tijdelijk 'STAP 0 VAN 3'. De stapteller zou pas zichtbaar moeten zijn
vanaf stap 1.

**Beslissing:** Doorgeschoven naar een **eigen volledige fase
(fase 7+)** in plaats van als losse bugfix afgehandeld. Reden:
Stefan heeft zelf nog meerdere extra issues geconstateerd die niet in
het AI-rapport staan. Het is efficiënter om de hele Productadvisor in
één keer onder de loep te nemen dan stukje bij beetje.

**Gerelateerd:** punt #5 (BUG Productadvisor stap 2 knop "Bekijk mijn
advies" i.p.v. "Volgende") — ook doorgeschoven naar de
Productadvisor-fase.

**Status:** ⏭ Uitgesteld.

---

## 5. Eindstaat — voortgang

| # | Cat. | Onderwerp | Status |
|---|------|-----------|--------|
| 1 | KRITIEK | Klantenservice-links leeg | ✅ Live |
| 2 | KRITIEK | Account/login leeg | ✅ Live |
| 3 | BUG | Productadvisor "STAP 0 VAN 3" | ⏭ Eigen fase |
| 4 | BUG | Browsertab — generieke titel | ⏭ Eigen SEO/GEO-fase |
| 5 | BUG | Productadvisor "Bekijk mijn advies" op stap 2 | ⏭ Eigen fase |
| 6 | BUG | Bewaarvoorschrift afgebroken zin | ⏳ Batch A (Shopify admin) |
| 7 | BUG | ESN voetnootmarkeringen zonder definities | ⏳ Batch A (Shopify admin) |
| 8 | UX | Hero CTA's beide naar vitamines | ✅ Live |
| 9 | UX | Hero-afbeelding grijs placeholder | ✅ Live |
| 10 | UX | Merken dropdown te lang | ⏳ Batch E |
| 11 | UX | Sticky nav overlapt producttitel | ⏳ Batch E |
| 12 | UX | Productnamen afgekapt in cart drawer | ✅ Live |
| 13 | UX | Geen checkout progress-indicator | ⏳ Solo (onderzoek) |
| 14 | UX | Geen autocomplete in zoekmodal | ⏳ Solo (feature) |
| 15 | CONTENT | "FITTERG" afgekapt in cart | ✅ Live |
| 16 | CONTENT | "by fittergy" dubbel | ⏳ Batch A (Shopify admin) |
| 17 | CONTENT | "Ingredienten" zonder trema | ✅ Live |
| 18 | CONTENT | Orthica spatie ontbreekt | ⏳ Batch A (Shopify admin) |
| 19 | CONTENT | "buiten bereik" kleine letter | ⏳ Batch A (Shopify admin) |
| 20 | CONTENT | ".00" in productnamen sitebreed | ⏳ Batch A (Shopify admin) |
| 21 | CONTENT | Breadcrumb mist collectie-niveau | ✅ Live |
| 22 | COPY | Fysiotherapie vs Fysiotherapie & Herstel | ⏳ Batch E |
| 23 | COPY | Dubbele hero & advisor kop | ✅ Live |
| 24 | COPY | marketing-hypes vs marketingverhalen | ⏳ Batch E |
| 25 | URL | kruiden-planten-2 URL | ⏳ Batch A (Shopify admin) |
| 26 | URL | Klantenservice-links naar checkout-subdomein | ✅ Live (deel van punt 1) |

**Voortgang:** 12 van 26 punten live (46%); 3 punten doorgeschoven naar
eigen fases; 11 punten in resterende batches.

---

## 6. Wishlist / aandachtspunten

### Privacy-tekst updaten bij activatie van nieuwe features

Zodra Stefan een van deze activeert moet `src/lib/policy-content.ts`
worden bijgewerkt:

1. **Meta pixel + analytische cookies** — paragraaf 6 (Cookies)
   uitbreiden: vermelden wat de pixel doet, welke gegevens worden
   gedeeld met Meta, en een cookiebanner / -consent flow toevoegen
   (vereist onder AVG + cookie-wet voor tracking-cookies)
2. **Marketing-mail** — nieuwe paragraaf toevoegen: opt-in via
   bewuste keuze (niet pre-checked), één-klik-afmelden in elke mail,
   bewaartermijn voor opt-in-bewijs

### Server-side 301 redirects voor SEO

De redirects in fase 6 punt 2 zijn nu client-side (React-Router
`<Navigate>`). Voor SEO is een server-side 301 in `vercel.json`
beter (Google honoreert die anders). Klein, kan later als losse
optimalisatie.

### Merken-pagina inrichting

De individuele merk-pagina's (`/merken/:brand`) verdienen een keer een
eigen review en inhoudelijke opwaardering. Open punt om in een latere
sessie samen te bekijken — niet kritisch voor het websitetest-rapport,
maar wel een aandachtspunt van Stefan. Mogelijk te overwegen:

- Hero-sectie met merk-verhaal / USP's
- Bestsellers per merk
- Visuele inrichting (merk-eigen kleuren / typografie waar passend)
- Eventueel een `/merken` overzichtspagina (bestaat nu alleen via
  dropdown in header)

Op te pakken in een vervolgsessie wanneer het websitetest-rapport
is afgerond.

---

## 7. Werkwijze: batches

Tijdens fase 6 is besloten de overige punten in **batches** af te
werken zodat overlappende issues efficient in één pass worden
opgelost:

| Batch | Punten | Onderwerp |
|-------|--------|-----------|
| A | 6, 7, 16, 18, 19, 20, 25 | Shopify Admin data-fixes (Stefan in admin) |
| B | 8, 9, 23 | Homepage Hero (CTA's, placeholder, dubbele kop) |
| C | 17, 21 | Productpagina (Ingrediënten-typo, breadcrumb) |
| D | 12, 15 | Cart drawer (productnaam + merklabel afgekapt) |
| E | 10, 11, 22, 24 | Sitewide consistentie (dropdown, sticky nav, copy) |
| Solo | 13 | Checkout indicator — Shopify-side, onderzoek nodig |
| Solo | 14 | Zoekmodal autocomplete — eigen feature |

**Volgorde:** D → C → B → E → A → 14 → 13.

## 8. Verplaatst naar eigen fase

### Punt 4 — Browsertab / meta-titels — Eigen SEO/GEO-fase

Aanvankelijk geplaatst als solo-item in fase 6. Verplaatst naar een
**eigen latere fase (Fase 8 — SEO & GEO)** op verzoek van Stefan: hij
wil zowel klassieke SEO (meta-titels, descriptions, Open Graph,
structured data) als GEO (Generative Engine Optimization — content
zo schrijven dat AI-assistenten als ChatGPT/Perplexity HLTY kunnen
citeren) in één integrale pass aanpakken, **zodra alle content en
UX-issues uit dit rapport zijn afgewerkt**. Pas dan staat de
inhoudelijke basis goed genoeg om de optimalisatie-laag eroverheen te
leggen.

## 9. Volgende stap

Live op productie (commit `5794949` op `main`, Vercel auto-deploy):
- Batches B, C, D + Punt 2 + categorie-filter in sidebar + Checkbox-styling

**Eerstvolgende actie — Batch A (Shopify admin)**

Stefan handelt de volgende punten af in Shopify admin op niet-HLTY
producten. Belangrijk: Holland Pharma overschrijft Shopify-aanpassingen
bij volgende sync (zie § 2b) — dus voor sommige items is een
**presentatie-laag-fix** mogelijk de betere oplossing dan handmatig in
admin werken. Per punt te beoordelen:

| # | Onderwerp | Aanpak |
|---|-----------|--------|
| 6 | Bewaarvoorschrift afgebroken zin (Holland Pharma) | Code-fix (presentatie-laag) zoals #17 — TITLE_OVERRIDE of regex |
| 7 | ESN voetnootmarkeringen ¹³ zonder definities | Code-fix (regex om dangling superscripts te strippen) of ESN-specifieke override |
| 16 | "by fittergy" dubbel in titel | Code-fix in productnaam-rendering OF Stefan in Shopify (overschrijfbaar) |
| 18 | Orthica "10 jaar.Bevat" mist spatie | Code-fix (regex `\.([A-Z])` → `. $1`) |
| 19 | "buiten bereik" zonder hoofdletter | Code-fix (capitalize-eerste-letter in bullet-rendering) |
| 20 | ".00" in productnamen sitebreed | Code-fix (regex `\.00\s` → ' ') in title-display helper |
| 25 | `/collectie/kruiden-planten-2` URL (`-2` ipv `-1`) | Stefan in Shopify — collection-handle is custom, niet door HP gemanaged |

Daarna **Batch E (sitewide consistentie)**: #10 merken-dropdown te lang,
#11 sticky nav overlapt producttitel, #22 Fysiotherapie-copy
inconsistentie, #24 marketing-hypes vs -verhalen.

**Volgorde-afspraak met Stefan:**
1. ⏳ Batch A — Shopify-data fixes (deels code, deels admin)
2. ⏳ Batch E — Sitewide consistentie
3. ⏳ Solo #14 — Zoekmodal autocomplete (eigen feature)
4. ⏳ Solo #13 — Checkout indicator (onderzoek, mogelijk niets te doen)
5. ⏭ Eigen Fase 7+ — Productadvisor (#3, #5 + Stefan's extra issues)
6. ⏭ Eigen Fase 8 — SEO & GEO (#4 meta-titels + Open Graph + structured data)
7. ⏭ Wishlist — Merken-pagina inrichting (open punt, samen oppakken)
