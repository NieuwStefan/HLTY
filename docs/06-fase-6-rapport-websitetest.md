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

### ✅ Batch E — Sitewide consistentie (punten 10 + 11 + 22 + 24)

**Bevindingen:**
- #10 Merken-dropdown te lang, scrollen nodig
- #11 Sticky nav overlapt producttitel bij scrollen
- #22 Footer "Fysiotherapie" vs nav "Fysiotherapie & Herstel"
- #24 "marketing-hypes" (met koppelteken) vs "marketingverhalen"
  (inconsistente schrijfwijze)

**Oplossing #10 — Volledige mega-menu-refactor (uitgegroeid):**

Tijdens deze sessie groeide #10 uit van een Merken-dropdown-fix naar
een herontwerp van ALLE desktop-dropdowns. Eén nieuwe `<DesktopMegaMenu>`
component in [src/components/Header.tsx](../src/components/Header.tsx)
vervangt de oude accordion-stijl. Vorm-keuzes per type:

- **3-level dropdowns** (Gezondheidsdoelen 5 cat., Ingrediënten & Stoffen
  6 cat.) → mega-menu met max 3 kolommen per regel, 780px paneel.
  Categorieën met meer items wrappen naar tweede rij (3+2 of 3+3 layout).
- **2-level flat dropdowns** (Bewuste Voeding 3 items, Fysiotherapie &
  Herstel 7 items, Accessoires & Lifestyle 4 items) → smaller 360px
  paneel met één witte tegel + items als verticale lijst.
- **Merken (5 brand-categorieën met soms 13 merken per kolom)** →
  speciale wide variant: 5 kolommen op één regel, 1100px paneel. Past
  visueel beter omdat de merken-lijst per categorie veel hoger kan
  worden dan menu-categorieën.

**Styling-aanpak:** glass-paneel met `backdrop-filter: blur(28px)` en
`rgba(255,255,255,0.35)` achtergrond (zoals de header zelf). Daarbinnen
witte tegels (`#ffffff`) per kolom met afgeronde hoeken en zachte
shadow. Categorie-headers krijgen vaste `min-h-[2.5rem]` zodat de
border-onderstreep én eerste leaf-item altijd op dezelfde verticale
positie staan, ongeacht of de titel één of twee regels beslaat.

**Positionering:** alle panelen `position: absolute top-full mt-2`
relatief aan de button-container (was `fixed` aan viewport). Slimme
uitlijning per nav-positie:
- buttons idx 0-1 → `left-0` (paneel breidt naar rechts vanaf button-left)
- buttons idx 2-3 (midden) → `left-1/2 -translate-x-1/2` (centered)
- buttons idx 4-5 → `right-0` (paneel breidt naar links vanaf button-right)

Hierdoor hangt elk dropdown direct onder de button die geklikt is
(verticale gap ~8px), niet meer ergens los gecentreerd onder de header.

**Oplossing #11 — `scroll-padding-top` op `<html>`:** één regel in
[src/index.css](../src/index.css):
`html { scroll-padding-top: calc(var(--header-h, 96px) + 1rem); }`.
De browser respecteert dit automatisch bij anchor-jumps (`#productadvies`),
`scrollIntoView()` en hash-navigatie. Sitebreed effect, gebruikt de
bestaande `--header-h` infra die ResizeObserver al actueel houdt.

**Oplossing #22 — "Fysiotherapie & Herstel" overal:** vier plekken
aangepast naar de volledige naam zodat het overal consistent is met
de Shopify-collectie (single source of truth):
[Footer.tsx](../src/components/Footer.tsx),
[categories.ts](../src/lib/categories.ts),
[Home.tsx](../src/pages/Home.tsx) (footer-tegel),
en [NotFound.tsx](../src/pages/NotFound.tsx) had het al.

**Oplossing #24 — "marketingclaims" overal:** beide tekstplekken in
[Home.tsx](../src/pages/Home.tsx) (hero-paragraaf + How-It-Works stap 3)
vervangen door één term: **"marketingclaims"**. Past bij scherpe
HLTY-tone-of-voice en is grammaticaal aaneengeschreven (correcte NL).

**Status:** ✅ Live.

### ✅ Batch A — Holland Pharma data-fixes op presentatie-laag (punten 6, 7, 16, 18, 19, 20, 25)

**Strategie-context:** alle 7 punten zijn cosmetische fouten in Holland
Pharma's productfeed (zie § 2b). Handmatige fixes in Shopify admin worden
bij de volgende sync overschreven. Daarom: **presentatie-laag-fixes in
React-code** — werken automatisch voor alle huidige én toekomstige
HP-imports.

**Aanpak per punt:**

| # | Bevinding | Oplossing |
|---|-----------|-----------|
| 6 | Bewaarvoorschrift afgebroken zin | DISCLAIMER_TRIGGERS regex `/Droog, afgesloten en bij kamertemperatuur/i` verwijderd (was bewaaradvies-content, geen waarschuwing) + `extractDisclaimer()` knipt nu alleen op `<br><br>`/`</p>` boundary, niet mid-zin |
| 7 | ESN voetnootmarkeringen `¹³` zonder definities | Nieuwe `stripDanglingSuperscripts()` in [ProductDescription.tsx](../src/components/ProductDescription.tsx): strip `<sup>` met cijfers + Unicode superscripts (`⁰`, `¹-³`, `⁴-⁹`). Sitebreed |
| 16 | "by fittergy" dubbel in titel | Nieuwe helper [src/lib/product-title.ts](../src/lib/product-title.ts) `formatProductTitle(title, vendor)` strip `\bby VENDOR\b` overal in titel (zowel suffix als midden). Toegepast in ProductCard, CartDrawer, Product page |
| 18 | Orthica "10 jaar.Bevat" mist spatie | Nieuwe `addMissingSpaceAfterPeriod()` in ProductDescription: regex `([a-zà-ÿ0-9])\.([A-ZÀ-Ÿ])` → `$1. $2`. Sitebreed, geldt voor alle product-beschrijvingen |
| 19 | "buiten bereik" zonder hoofdletter | Nieuwe `capitalizeSentenceStarts()` werkt op disclaimer-pieces voordat ze gerenderd worden. Capitalize eerste letter aan begin én na elke `<br>` |
| 20 | ".00" in productnamen sitebreed | In `formatProductTitle()`: regex `\b(\d+)\.00\b` → `$1`. Strikt na cijfers — geen risico op false positives in andere context |
| 25 | `/collectie/kruiden-planten-2` URL | Shopify admin-actie + code-update — zie eigen sectie hieronder |

**Punt 25 — Shopify collection handle wijziging:**

Reden waarom de handle `kruiden-planten-2` was: een TWEEDE (lege) collectie
"Kruiden-Planten" had `kruiden-planten-1` al geclaimd, waardoor Shopify
auto-suffix `-2` toevoegde aan de echte primary categorie "Kruiden &
Planten". Beide collecties waren door Stefan zelf eerder aangemaakt en
hadden 0 producten (mogelijk per ongeluk).

Aanpak in Shopify admin (Stefan kijkt mee, expliciet akkoord per save):

1. "Kruiden-Planten" handle → `kruiden-planten-old`. Redirect-checkbox
   **uitgevinkt** zodat de `-1` slot vrij komt. (Anders zou de
   `kruiden-planten-1 → -old`-redirect voorrang krijgen op een nieuwe
   collectie met dezelfde handle.)
2. "Kruiden & Planten" handle → `kruiden-planten-1`. Redirect-checkbox
   **aangevinkt** zodat oude URL's (`/collections/kruiden-planten-2`)
   keurig doorverwijzen naar de nieuwe handle.

Code-update direct daarna: 4 verwijzingen naar `kruiden-planten-2`
aangepast in
[categories.ts](../src/lib/categories.ts),
[Footer.tsx](../src/components/Footer.tsx),
[Home.tsx](../src/pages/Home.tsx) en
[product-categories.ts](../src/lib/product-categories.ts).

**Verifieerd in browser:**
- ✅ #16 — Fittergy Vegan flex 1 Set (was "Fittergy Vegan flex by fittergy 1 Set")
- ✅ #6 — Bewaarvoorschrift toont compleet: "Droog en afgesloten bewaren, buiten het bereik van jonge kinderen."
- ✅ #19 — Disclaimer-sectie toont "**B**uiten bereik van jonge kinderen houden." (hoofdletter)

De andere drie code-fixes (#7, #18, #20) zijn defensief — ze doen niets
totdat een matching pattern in de feed verschijnt. Zodra Holland Pharma
opnieuw syncet en deze artefacten meekomen, worden ze automatisch
weggewerkt.

**Status:** ✅ Live.

### ✅ Solo #14 — Zoekmodal autocomplete

**Bevinding:** De zoek-modal toonde tijdens typen geen suggesties; je
moest eerst op Enter drukken om resultaten te zien.

**Keuzes (Stefan):**
- **Data-scope 1C:** producten + merken + categorieën
- **Data-bron 2A:** Shopify's officiële `predictiveSearch`-endpoint
- **Layout 3A:** dropdown onder de input in dezelfde modal

**Implementatie:**

**Nieuwe API-helper** in [src/lib/shopify.ts](../src/lib/shopify.ts):
`predictiveSearch(query)` vraagt Shopify Storefront API om max 6
producten + 6 collecties per query. Cache-loos (een query verandert per
keystroke). Voor merken: Shopify retourneert geen vendors via dit
endpoint, dus we filteren onze al-in-state-bestaande `brands` lijst
(uit `getAllBrands()`) lokaal op title-match — max 3 resultaten.

**UI in [Header.tsx](../src/components/Header.tsx):**

Modal-layout:
- Header: input + close-knop. Search-icoon links wordt vervangen door
  een spinner tijdens fetch.
- Body (scroll-bare): drie secties met `border-t` scheiding:
  - **Producten** (thumb 48×48 + vendor + titel via `formatProductTitle` + prijs rechts)
  - **Merken** (tag-icoon + naam + "N producten")
  - **Categorieën** (folder-icoon + titel)
- Footer: "Druk Enter voor alle resultaten →" (met kbd-styling op "Enter")

Edge-states:
- **Lege state** (geen input): "PROBEER EENS" met 5 klikbare pills —
  Vitamine D, Magnesium, Probiotica, Herstel, Omega-3. Klik → vult input.
- **Loading** — spinner vervangt search-icoon.
- **Geen resultaten** — "Geen resultaten voor 'X'." + link naar
  `/alle-producten`.

UX-bouwstenen (allemaal default aan):
- **Debounce 250ms** — voorkomt request-storm per keystroke.
- **Min. 2 tekens** — pas vanaf "ma" begint zoeken.
- **Keyboard navigatie** — ↑/↓ door alle suggesties heen (vlakke index
  over de 3 secties), Enter selecteert, Esc sluit.
- **Mouse hover** synchroniseert met selected-idx zodat hover-state en
  keyboard-state consistent zijn.

**Geverifieerd in browser:** query "magn" toont 6 producten + categorie
"Magnesium"; query "matt" toont 6 producten + merk "Mattisson (200
producten)"; keyboard ↓ highlight beweegt mee.

**Status:** ✅ Live.

---

## 5. Eindstaat — voortgang

| # | Cat. | Onderwerp | Status |
|---|------|-----------|--------|
| 1 | KRITIEK | Klantenservice-links leeg | ✅ Live |
| 2 | KRITIEK | Account/login leeg | ✅ Live |
| 3 | BUG | Productadvisor "STAP 0 VAN 3" | ⏭ Eigen fase |
| 4 | BUG | Browsertab — generieke titel | ⏭ Eigen SEO/GEO-fase |
| 5 | BUG | Productadvisor "Bekijk mijn advies" op stap 2 | ⏭ Eigen fase |
| 6 | BUG | Bewaarvoorschrift afgebroken zin | ✅ Live (Batch A) |
| 7 | BUG | ESN voetnootmarkeringen zonder definities | ✅ Live (Batch A) |
| 8 | UX | Hero CTA's beide naar vitamines | ✅ Live |
| 9 | UX | Hero-afbeelding grijs placeholder | ✅ Live |
| 10 | UX | Merken dropdown te lang | ✅ Live (Batch E) |
| 11 | UX | Sticky nav overlapt producttitel | ✅ Live (Batch E) |
| 12 | UX | Productnamen afgekapt in cart drawer | ✅ Live |
| 13 | UX | Geen checkout progress-indicator | ⏳ Solo (onderzoek) |
| 14 | UX | Geen autocomplete in zoekmodal | ✅ Live (Solo) |
| 15 | CONTENT | "FITTERG" afgekapt in cart | ✅ Live |
| 16 | CONTENT | "by fittergy" dubbel | ✅ Live (Batch A) |
| 17 | CONTENT | "Ingredienten" zonder trema | ✅ Live |
| 18 | CONTENT | Orthica spatie ontbreekt | ✅ Live (Batch A) |
| 19 | CONTENT | "buiten bereik" kleine letter | ✅ Live (Batch A) |
| 20 | CONTENT | ".00" in productnamen sitebreed | ✅ Live (Batch A) |
| 21 | CONTENT | Breadcrumb mist collectie-niveau | ✅ Live |
| 22 | COPY | Fysiotherapie vs Fysiotherapie & Herstel | ✅ Live (Batch E) |
| 23 | COPY | Dubbele hero & advisor kop | ✅ Live |
| 24 | COPY | marketing-hypes vs marketingverhalen | ✅ Live (Batch E) |
| 25 | URL | kruiden-planten-2 URL | ✅ Live (Batch A) |
| 26 | URL | Klantenservice-links naar checkout-subdomein | ✅ Live (deel van punt 1) |

**Voortgang:** 22 van 26 punten live (85%); 3 punten doorgeschoven naar
eigen fases (Productadvisor #3+#5, SEO/GEO #4); 1 punt resterend
(Solo #13 — Checkout indicator).

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

**Live op productie** (Vercel auto-deploy op `main`):

- Eerdere batches (B, C, D) + Punt 2 + categorie-filter in sidebar
- Batch E — Sitewide consistentie + mega-menu-refactor voor alle desktop-dropdowns
- Batch A — alle 7 Holland Pharma data-fixes + Shopify collection-rename
- Solo #14 — Zoekmodal autocomplete met producten/merken/categorieën

**Eerstvolgende actie — Solo #13 — Checkout progress-indicator**

| # | Categorie | Onderwerp | Locatie (vermoed) |
|---|-----------|-----------|-------------------|
| 13 | UX | Geen checkout progress-indicator | Mogelijk niet oplosbaar — Shopify checkout is buiten onze controle |

**Onderzoeksvragen bij start:**

- Wat exact zag de AI-testbot? Was het de stap-indicator (Informatie /
  Verzending / Betaling) die ontbrak, of een algemenere "voortgang"?
- Shopify checkout draait op `checkout.hlty.shop` — kunnen we daar
  überhaupt iets aanpassen via thema-settings of Checkout Extensions,
  of moeten we accepteren dat dit een Shopify-platform-beslissing is?
- Alternatief: een eigen "Stap 1 van 3"-banner ABOVE de checkout-iframe
  /-link bij het verlaten van de cart, zodat klanten al weten waar ze
  staan voordat ze in de Shopify-flow stappen.

**Resterende werkelijkheid:**

1. ⏳ Solo #13 — Checkout indicator *(eerstvolgende — onderzoeksessie)*
2. ⏭ Eigen Fase 7+ — Productadvisor (#3, #5 + Stefan's extra issues)
3. ⏭ Eigen Fase 8 — SEO & GEO (#4 meta-titels + Open Graph + structured data)
4. ⏭ Wishlist — Merken-pagina inrichting (open punt, samen oppakken)
