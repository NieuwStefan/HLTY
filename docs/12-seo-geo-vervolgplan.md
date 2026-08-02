# Fase 12 — SEO & GEO vervolgplan: van "technisch in orde" naar vindbaar

**Datum onderzoek:** 29 juli 2026 (Claude Fable, volledige audit: code + live site
+ Google-index + Search Console)
**Status:** 🚧 **In uitvoering op 2-8-2026.** Beslispunten B1-B5 zijn
beslist door Stefan (§4). Na een onafhankelijke review is de veilige
uitvoeringsvolgorde aangescherpt naar **A → B-pilot → SSR-migratie →
B-uitrol → D0 → D → E**. Contentonderzoek kan parallel lopen, maar nieuwe
claimdragende content gaat pas live na D0. De oorspronkelijke bot-renderer
blijft vervallen ten gunste van de SSR-migratie.

**Externe beslispoorten:** Bing en het Merchant Center-account zijn op 2-8 na
expliciete bevestiging aangemaakt. De productfeed aanmelden, publiceren naar
productie, de SSR-cutover en het activeren van reviews vereisen elk opnieuw een
expliciete bevestiging op het moment van uitvoeren. Lokale bouw, tests en
preview-controles mogen zelfstandig.

---

## 1. Managementsamenvatting

De technische SEO-fundering uit Fase 8 en 10 staat er goed bij en werkt. Maar
de cijfers na ruim twee maanden zijn hard: **6 klikken en 439 vertoningen in
drie maanden, uitsluitend op merknaam-zoekopdrachten** ("hlty", "helty").
Google heeft **21 van de 1.185 aangeboden pagina's geïndexeerd**. Op generieke
zoektermen ("creatine kopen", "magnesium bisglycinaat") is HLTY onzichtbaar,
en meerdere niet-JavaScript-crawlers voor AI-search en social previews krijgen
alleen de generieke HTML-huls. Een AI-assistent kan een pagina soms alsnog via
een eigen browser- of zoeklaag ophalen; dat maakt de huidige basis niet
betrouwbaar genoeg voor bronvermelding.

De drie echte problemen, in volgorde van impact:

1. **Autoriteit & content**: nieuw domein, geen backlinks, en 800+
   productpagina's met fabrikantteksten die woordelijk op tientallen andere
   webshops staan. Google indexeert geen duizendste kopie op een domein
   zonder autoriteit. Dit is het hoofdprobleem achter "21 van 1.185".
2. **Niet-JavaScript-crawlers missen de inhoud**: meerdere AI- en
   social-preview-bots krijgen op de huidige SPA geen bruikbare initiële
   HTML. Verschillende bots hebben verschillende doelen: `OAI-SearchBot`
   is relevant voor ChatGPT Search, `GPTBot` voor training en
   `ChatGPT-User` voor ophalen op verzoek. De allowlist is correct, maar
   lost het ontbrekende HTML-document niet op. `llms.txt` blijft een
   experimentele extra en is geen ranking- of indexeringssignaal voor Google.
3. **Er is niets te vinden búiten producten**: geen gidsen, geen
   adviescontent, geen redenen voor Google of een AI om HLTY als bron te
   citeren. De FAQ (8 vragen over HLTY zelf) is een begin, maar beantwoordt
   geen enkele vraag waar een klant mee zoekt.

Realistische verwachting: een nieuwe supplementenshop verslaat Bol, Holland
& Barrett en Vitaminstore niet op "creatine kopen". De winbare routes zijn:
**(a) Google Shopping gratis productvermeldingen** (dagen werk, snelste
zichtbaarheid), **(b) long-tail informatiecontent met de fysio-invalshoek
als uniek verhaal** (het enige duurzame kanaal, ook voor AI-citaties),
**(c) merk+product-zoekopdrachten** ("Vitals R-alfaliponzuur") waar de
concurrentie dun is, en **(d) server-gerenderde pagina's** zodat
AI-assistenten en social previews überhaupt iets te zien krijgen (besloten:
via de SSR-migratie, zie B5).

---

## 2. Wat er al ligt (NIET opnieuw bouwen)

Uitvoerende AI: dit bestaat al en werkt. Controleer, maar bouw het niet dubbel.

| Onderdeel | Waar | Status 29-7 |
|---|---|---|
| robots.txt met AI-bot-allowlist | `public/robots.txt` | ✅ live |
| llms.txt | `public/llms.txt` | ✅ live |
| Dynamische sitemap (1.175 URL's) | `api/sitemap.ts` → `/sitemap.xml` | ✅ live, cache 1u |
| Per-pagina meta (React 19 head-hoisting) | `src/components/SEO.tsx` + alle pagina's | ✅ live |
| JSON-LD: OnlineStore, WebSite, Product/AggregateOffer, Breadcrumb, ItemList, FAQPage | `src/components/JsonLd.tsx`, `SiteSchema.tsx`, pagina's | ✅ live, Rich Results groen (22-5) |
| FAQ-pagina (8 merkvragen) | `/veelgestelde-vragen` | ✅ live |
| Merkpagina's met unieke content + descriptions | `src/data/brands.ts`, `src/pages/Brand.tsx` | ✅ live (Fase 10) |
| Interne linking-blok | `src/components/RelatedCategories.tsx` | ✅ live |
| GA4 + Meta Pixel (consent-proof) + server-side Purchase | `src/lib/analytics.ts`, `api/shopify-order-webhook.ts` | ✅ live (Fase 10) |
| Search Console-property `https://www.hlty.shop` | HTML-tag in `index.html` — **nooit verwijderen** | ✅ geverifieerd |
| Shopify-formaat-redirects (/products/ → /product/ enz.) | `vercel.json` | ✅ live 29-7 (commit `a3104a8`) |
| Advertentie-keten Meta-catalogus → eigen storefront | F6.1-script in Shopify Horizon-theme + vercel.json | ✅ e2e bewezen 29-7 (docs/05 §9) |

## 3. Onderzoeksbevindingen 29-7-2026 (de nulmeting)

Bewaar deze cijfers; elke vervolgfase meet zich hieraan.

**Search Console, 21 mei t/m 30 juli:**
- 6 klikken, 439 vertoningen, CTR 1,4%, gemiddelde positie 13,9.
- Alle topquery's zijn merknaam-varianten: "hlty", "helty", "hltyu".
- Indexering: **21 geïndexeerd, 30 bekend-maar-niet-geïndexeerd** (5 daarvan
  bewust noindex: account/auth/zoeken). Redenen rest: "Crawled/Discovered –
  currently not indexed" = Google vindt ze de moeite niet waard.
- Sitemap `/sitemap.xml`: ingediend 22-5, status Success, 1.185 ontdekte
  pagina's, **laatst gelezen 5 juni** (bijna twee maanden geleden).

**Live-checks (curl, 29-7):**
- `www.hlty.shop/product/<handle>` zonder JS: title = generieke fallback
  "HLTY — Duidelijkheid in zelfzorg", **body leeg**, geen meta-description.
  Geldt site-breed. Dit is wat GPTBot/ClaudeBot/PerplexityBot/WhatsApp/
  Slack/Facebook-preview zien.
- `site:www.hlty.shop` in Google: home + productpagina's mét beschrijving en
  prijs → Google rendert de SPA wél en toont merchant-snippets. Fase 8 werkt
  dus voor Google; het probleem zit niet in de techniek maar in de selectie
  (21 van 1.185).
- `site:checkout.hlty.shop`: **0 resultaten** — de Shopify-store lekt niet de
  index in. Maar: hij is wél crawlbaar, heeft self-canonicals en een eigen
  sitemap. De enige bescherming is het F6.1-JS-redirect-script in het theme.
  Fragiel; zie onderhoudsritme §11.
- `hlty.shop` (apex) en `www.hlty.shop` serveren beide 200 zonder onderlinge
  redirect; canonicals wijzen naar www. Werkt, maar consolidatie ontbreekt.

---

## 4. Beslispunten — ✅ BESLIST door Stefan, 2-8-2026

Deze besluiten zijn definitief. Een bouwsessie heropent ze niet.

| # | Vraag | Besluit |
|---|---|---|
| B1 | Bot-rendering bouwen? | **Vervallen.** Aanvankelijk "ja", maar door B5 (SSR nu) overbodig geworden — de SSR-migratie maakt álle pagina's leesbaar voor AI-bots en social previews. Er wordt géén aparte bot-renderer gebouwd. |
| B2 | Google Shopping-feed: eigen feed of Shopify-app? | **Eigen feed** (`api/merchant-feed.ts`), links direct naar `www.hlty.shop/product/<handle>`. Eerst een afgeschermde pilot van 40; volledige uitrol pas na SSR en stabiele diagnose. De Shopify-app blijft afgewezen. |
| B3 | Content-programma: tempo en review? | **Pilot: 3 gidsen in 6 weken**, daarna 8–12 weken evalueren. Tempo is een maximum, geen quotum. Stefan keurt elke gids; Chris reviewt alleen binnen aantoonbare fysio-deskundigheid. Supplementclaims vereisen daarnaast een benoemde claimspecialist. |
| B4 | Reviews nu of later? | **Parkeren met trigger:** rond 50 bestellingen start discovery. Uitnodiging pas na betrouwbaar fulfillment-/delivery-event; echte positieve én negatieve reviews vanaf de eerste goedgekeurde review publiceren. De drempel van 3 geldt alleen voor een gemiddelde sterrenbadge. |
| B5 | SSR-migratie nu of bij bewezen groei? | **Nu inplannen**, na fase A en de lokale B-pilot. Stefans argument: de site is nu klein en rustig — het ideale moment voor een fundamentele verbouwing; elke maand wachten maakt de migratie groter. Voorwaarden: via de vaste werkwijze (plansessie → bouwsessie → controlesessie), op een branch met preview-deploy, cutover pas na complete e2e-gate (§7). |

---

## 5. Fase A — Technische quick wins en betrouwbare nulmeting

**Doel:** canonieke signalen consolideren, de echte indexeringssituatie
vastleggen en meetbaarheid compleet maken. Een sitemap is een ontdek-hint,
geen methode om zwakke of dubbele pagina's alsnog te laten indexeren.

1. **Apex → www redirect.** In `vercel.json` staat een hostgebonden permanente
   redirect vóór de bestaande padredirects. Alle canonicals en de sitemap
   gebruiken al www. Na een preview- of productiedeploy worden apex/www,
   legacy-product-, collectie-, zoek- en beleidspaden als matrix getest;
   onnodige redirectketens worden niet als eindstaat geaccepteerd.
   **Status lokaal 2-8:** ✅ gebouwd; productiecontrole wacht op deploy.
2. **Search Console-nulmeting en URL-inventaris.** De sitemap blijft staan;
   niet verwijderen en opnieuw toevoegen zonder substantiële wijziging.
   Na SSR of een nieuwe sitemapstructuur mag hij opnieuw worden aangeboden.
   Inspecteer per paginatype representatieve URL's en noteer gekozen
   canonical, laatste crawl, rendered HTML en indexeringsreden. Individuele
   indexeringsverzoeken alleen voor nieuwe of wezenlijk gewijzigde
   prioriteitspagina's; er wordt geen ongedocumenteerd dagquotum aangenomen.
3. **Sitemaps diagnostisch splitsen bij SSR.** Maak dan een sitemap-index met
   afzonderlijke sitemaps voor producten, collecties/merken, gidsen en
   statische pagina's. Dit is niet nodig vanwege de omvang, maar maakt in
   Search Console zichtbaar welk paginatype wordt ontdekt en geïndexeerd.
   Gebruik alleen betrouwbare `lastmod`; verwijder `priority` en `changefreq`
   omdat Google die negeert. Lege of niet-waardevolle collectie-URL's horen
   niet in de sitemap.
4. **Bing Webmaster Tools.** HLTY toevoegen aan het bestaande account,
   sitemap aanmelden en daarna Search Performance, AI Performance, IndexNow
   en Site Scan als meetbronnen gebruiken. **Status 2-8:** ✅
   `https://www.hlty.shop/` is via het HLTY Search Console-account geïmporteerd;
   `/sitemap.xml` staat in Bing op `Imported - Processing`.
5. **Lighthouse/PageSpeed-baseline.** Vastgelegd op 2-8-2026 met Lighthouse
   13.4.1, koude paginalaad:

   | Pagina | Device | Performance | A11y | LCP | FCP | TBT | CLS |
   |---|---:|---:|---:|---:|---:|---:|---:|
   | Home | Mobiel | 64 | 88 | 11,9 s | 3,2 s | 20 ms | 0 |
   | Home | Desktop | 79 | 88 | 3,4 s | 0,7 s | 30 ms | 0,017 |
   | Creatine-product | Mobiel | 81 | 90 | 4,0 s | 3,2 s | 10 ms | 0 |
   | Creatine-product | Desktop | 99 | 90 | 0,9 s | 0,7 s | 0 ms | 0,007 |

   De mobiele home-LCP en circa 4 MB beeldpayload zijn een expliciete
   performancebevinding. **Status lokaal 2-8:** de zes gebruikte homepage-
   PNG's zijn als WebP gekoppeld, met vaste beeldmaten; gezamenlijk circa
   4,0 MB → 0,6 MB (ongeveer 85% kleiner), visueel gecontroleerd. De echte
   LCP-winst wordt na preview/productiedeploy opnieuw gemeten.
6. **`llms.txt` beperkt actualiseren.** FAQ, prioriteitscollecties en drie
   merkpagina's zijn toegevoegd. Dit bestand is experimenteel en krijgt geen
   hogere prioriteit dan crawlbare HTML, robots-toegang en gewone SEO.

**Gevalideerde externe nulmeting 2-8:** sitemap Success, 1.185 aangeboden,
laatst gelezen 5-6; Search Console kent 51 pagina's: 21 geïndexeerd, 25
"Crawled – currently not indexed", 5 noindex. Merchant listings ziet 1
geldig item met waarschuwingen voor ontbrekend retour- en verzendbeleid.
Externe links: 3, alle drie algemene bedrijvengidsen. Voor Core Web Vitals is
nog onvoldoende echte gebruikersdata.

**Kwaliteitspoort:** `npm run build` groen; configuratie lokaal gevalideerd;
na deploy curl-bewijs van de redirectmatrix; Search Console- en
PageSpeed-cijfers hierboven vastgelegd; bestaande niet-gerelateerde
werkmapwijzigingen niet meenemen in de commit.

**Controle lokaal/preview 2-8:** ✅ `vercel.json` parseert; ✅ productiebuild;
✅ desktop- en mobiele lokale preview zonder foutoverlay of consolefouten; ✅
alle zes WebP-beelden laden met de verwachte intrinsieke afmetingen; ✅ branch
`codex/hlty-seo-uitvoering` gepusht; ✅ Vercel-preview `Ready` en de homepage
laadt onder de juiste titel. Openstaand: redirectmatrix en nieuwe PageSpeed-run
na een eventuele productiedeploy. De hostgebonden apexredirect kan niet op het
willekeurige previewdomein worden bewezen.

---

## 6. Fase B — Merchant Center: gecontroleerde pilot, daarna uitrol

**Doel:** eerst aantonen dat brondata, feed, landingspagina en beleid op elkaar
aansluiten. Daarna pas opschalen. Dit voorkomt dat catalogusbrede fouten of
beleidsproblemen direct het account raken.

### 6.1 Actuele catalogusnulmeting (read-only, 2-8-2026)

- 1.041 producten en 1.041 varianten; ieder product heeft nu exact één variant.
- 913 varianten zijn op voorraad en bestelbaar.
- 1.001 barcodes zijn aanwezig en hebben een geldige GTIN-lengte en
  controlecijfer; 40 ontbreken, grotendeels bij HLTY-private-labelproducten.
- Eén dubbele SKU/GTIN-combinatie, één product zonder SKU en zeven producten
  zonder afbeelding vragen broncorrectie.
- 746 producten voldoen nu al aan de strenge technische pilotcriteria.

Een product-URL zonder variantparameter is daardoor nú bruikbaar. Zodra een
product meerdere varianten krijgt, wordt het automatisch uitgesloten totdat
het variant-URL-contract uit §6.3 is gebouwd en getest.

### 6.2 Beslispoorten vóór bouw en registratie

1. **Verzending eerst waarheidsgetrouw maken.** Shopify rekent in het algemene
   Nederlandse profiel momenteel **€4,95 voor iedere order vanaf €0**; er is
   géén gratis-verzenddrempel en geen transittijd ingesteld. Home, policy-meta
   en `llms.txt` beloven wel gratis verzending vanaf €50. Praktijktests kwamen
   na circa 1,5–2 dagen aan, maar handling en transit zijn niet afzonderlijk
   bevestigd. Stefan kiest daarom eerst: Shopify gratis maken vanaf exact €50,
   of de publieke gratis-verzendclaim verwijderen. Site, checkout, schema.org
   en Merchant Center worden daarna exact gelijkgemaakt.
2. **Pilotselectie.** Bij voorkeur gebruikt Stefan een omzet-/Meta-toplijst.
   Zonder die lijst geldt een vaste, merkgespreide selectie van 40 handles:
   20 conventionele supplementen/voeding, 15 fysio-/medische hulpmiddelen en
   5 botanicals die handmatig door de claims-poort zijn gekomen. De technische
   40-productselectie is live gevalideerd; alleen de vijf botanicals wachten nog
   op een benoemde claimsreviewer en inhoudshash.
3. **Retourbeleid gelijkmaken.** Het geschreven beleid geeft 14 dagen om te
   herroepen en daarna 14 dagen om te verzenden; Home belooft ten onrechte
   `30 dagen retourgarantie`. Stefan bevestigt dat HLTY de retourzending betaalt,
   maar dat en de werkwijze staan nog niet publiek. Voor Merchant geldt daarom
   een aanmeldtermijn van 14 dagen en `FreeReturn`, pas nadat site en Shopify
   dezelfde tekst tonen.
4. **Externe registratie.** ✅ Merchant Center-account **HLTY / 5832930423** is
   op 2-8 aangemaakt onder `info@hlty.shop`, met het geregistreerde HLTY-adres
   en Nederland als enige verkoopland. Het account staat op 3 van 6 taken. De
   automatische sitescan, productimport, verzending en retour zijn bewust
   uitgesteld totdat bovenstaande poorten en product-SSR groen zijn.

### 6.3 Technische pilotfeed — exact 40 producten

- Gebruik een expliciete `PILOT_HANDLES`-allowlist; nooit toevallig de eerste
  veertig resultaten. Sluit ontbrekende/dubbele identifiers, beelden kleiner
  dan 500×500, niet-bestelbare items en niet-gecontroleerde claims uit.
- Pin de Shopify Storefront API op de actuele geteste stabiele versie. De code
  vraagt nu `2024-01` en wordt door Shopify stil naar een nieuwere versie
  doorgestuurd; na wijziging wordt ook de geretourneerde API-versie bewaakt.
- Eén feeditem per echte variant met stabiele ID
  `shopify-v-<numerieke-variant-id>`. Gebruik geen volledige Shopify-GID en
  stuur zonder echte variantgroep geen `item_group_id` mee.
- Verplichte velden: `id`, zichtbare titel, platte beschrijving, link,
  hoofdbeeld, beschikbaarheid, EUR-prijs, merk, geldige GTIN, `condition=new`,
  producttype en `custom_label_0=pilot`. MPN en Google-categorie alleen uit een
  betrouwbare bron; nooit verzinnen. `identifier_exists=false` alleen na
  fabrikantbevestiging dat GTIN én MPN werkelijk niet bestaan.
- Voor een toekomstig product met meerdere varianten geldt
  `?variant=<numerieke-id>`. Die URL moet in de initiële render de juiste
  variant, prijs, voorraad, afbeelding en concrete `Offer` tonen. Een ongeldige
  of verlopen variant-ID krijgt 404/noindex en valt niet stil terug op variant 1.
- Product-JSON-LD krijgt de echte SKU, meest specifieke `gtin8/12/13/14`,
  `itemCondition=NewCondition`, variantbeeld en concrete `Offer`. Feed,
  zichtbare pagina, Storefront API en JSON-LD moeten dezelfde waarden tonen.

### 6.4 Betrouwbaarheid van endpoint en brondata

- De pilot vraagt de expliciete allowlist in vier sequentiële Shopify-queries
  van tien handles op. Cataloguspaginering en nested variantpaginering horen
  pas bij de latere uitrol. Bij 429, 5xx of retrybare GraphQL-fouten begrensd
  opnieuw proberen.
- Eén mislukte pagina maakt de hele response 503; nooit een lege of gedeeltelijke
  feed met status 200. Foutresponses: `no-store`, `Retry-After`.
- `/merchant-feed.xml` wordt vóór de SPA/SSR-catch-all afgehandeld, ondersteunt
  `GET` en `HEAD` en retourneert `application/rss+xml; charset=utf-8`.
- Browser/Merchant-cache: `Cache-Control: public, max-age=0, must-revalidate`.
  Vercel-CDN-cache: `public, s-maxage=900, stale-while-revalidate=3600,
  stale-if-error=86400`.
- De quality gate krijgt een aparte API-typecheck: de huidige Vite-build neemt
  `api/*.ts` niet mee.

### 6.5 Diagnose, SSR-koppeling en uitrol

1. Valideer lokaal/preview exact 40 unieke items, XML, veldlimieten, GTIN's,
   afbeeldingen, productlinks en foutscenario's. Vergelijk alle 40 tegen
   Shopify en minimaal 10 tegen zichtbare pagina plus JSON-LD.
2. Migreer daarna minstens de productroute naar SSR. De ruwe server-HTML moet
   zonder JavaScript naam, prijs, voorraad, zichtbare producttekst en een met
   de feed overeenkomende concrete `Offer` bevatten.
3. Na expliciet akkoord: registreer de pilotfeed in Merchant Center en volg
   diagnostiek 3–7 dagen. Go/no-go = 100% bron verwerkt, nul technische
   attribuutfouten en nul prijs-/voorraad-/landingsmismatches. Beleidsafkeuringen
   worden per cohort gerapporteerd; een arbitrair percentage vervalt.
4. Volledige uitrol volgt pas ná SSR, variantconsistentie en een stabiele pilot.
   Dan worden alle technisch én beleidsmatig geschikte producten toegelaten;
   niet blind alle 1.041.

**Kwaliteitspoort:** unit-tests voor XML/UTF-8, identifiers, GTIN, prijs,
beschikbaarheid en allowlist; integratietests voor paginering, retry en
alles-of-niets-fouten; API-typecheck en productiebuild groen; previewfeed exact
40; alle links en beelden bereikbaar; feed <10 MB; nul technische mismatches.

---

## 7. Fase C — SSR-migratie naar React Router 7 framework mode

**Raming:** 2–3 weken pas na de contractfase herbevestigen; staging-auth,
Shopify-loaderherbouw of aangetroffen regressies kunnen dit verlengen.

> Vervangt de oorspronkelijke fase C (bot-renderer) — besluit B5, 2-8-2026.

**Doel:** de hele storefront server-side gerenderd op Vercel, zodat élke
bezoeker — mens, Googlebot, AI-crawler, social-preview-bot — dezelfde
volwaardige HTML krijgt. Dit dicht het leesbaarheidsgat fundamenteel en maakt
toekomstige content vanaf dag één bot-leesbaar. SSR is op zichzelf geen
garantie op betere Core Web Vitals; databudgetten, beelden en client-JS blijven
aparte performancepoorten.

**Waarom React Router 7 framework mode:** `react-router-dom` v7 zit al in het
project, routes en componenten zijn grotendeels herbruikbaar en dit is kleiner
dan een frameworkherschrijf. Alle React Router-pakketten worden wel op exact
dezelfde v7-patch vastgezet; een ongeversioneerde installatie kan inmiddels
v8 binnenhalen.

### 7.1 Contractfase — eerst beslissen en bewijzen

De plansessie (ontwerp-panel volgens de gedeelde werkinstructie) levert een
bindende file-by-file blauwdruk en testmatrix. Die legt vóór implementatie vast:

- **Runtime/build:** één Node LTS-versie voor lokaal, CI en Vercel; volledige
  typecheck inclusief `api/*.ts`; client- en serverbuild; route-typegeneratie.
- **Route- en statusmatrix:** de huidige app heeft twaalf routes plus catch-all,
  geen dertien. Beslis expliciet of `/merken` als crawlbaar overzicht wordt
  toegevoegd. Ontbrekende entiteit = 404; Shopify-timeout/storing = 502/503
  met noindex; verwijderde producten krijgen bewust 404, 410 of gerichte
  redirect. Een storing mag nooit als ‘niet gevonden’ worden vermomd.
- **Loaderbudgetten:** home maximaal zes featured producten; product alleen het
  hoofdproduct kritisch en aanbevelingen uitgesteld; collectie, merk en alle
  producten alleen de eerste URL-gestuurde pagina SSR. Geen catalogusscan voor
  navigatie, geen volledige membership-map of catalogus in hydration-data.
  Shopify-fetch krijgt timeout, `res.ok`-controle, malformed-JSON-afhandeling,
  typed errors en begrensde retry.
- **Cache/privacy:** publieke cache per route; auth-, customer-, account-,
  welkom- en callbackroutes expliciet `private, no-store`. Geen klantnaam,
  cart-ID, checkout-URL of persoonsgegevens in CDN-cache, gedeelde HTML of logs.
- **Omgevingsvariabelen:** matrix met publiek versus server-only. GA4- en
  Meta-ID's mogen publiek; OpenAI-, webhook-, CAPI- en andere secrets nooit.
  De `VITE_`-prefix verdwijnt niet automatisch zolang browsercode Shopify
  rechtstreeks benadert. Voeg startup-validatie en `.env.example` toe en
  controleer de clientbundle op secrets.
- **Merchantvariantcontract:** §6.3 is leidend voor URL, geselecteerde variant,
  prijs, voorraad, beeld en `Offer` in de eerste HTML.
- **Vercelcontract:** alleen de SPA-fallback vervalt. Redirects, statische
  bestanden, sitemap/feed en `/api/*` blijven vóór SSR afgevangen. De Shopify-
  webhook blijft een losse functie of behoudt aantoonbaar de onbewerkte body
  voor HMAC-verificatie.

### 7.2 Bekende releaseblokkers uit de code-audit

1. De huidige Framer Motion-wrappers renderen server-side `opacity: 0` en maken
   daardoor belangrijke tekst zonder JavaScript onzichtbaar. Maak kritieke
   content SSR-veilig (`initial={false}` of centrale strategie) en test ook
   `prefers-reduced-motion`.
2. `ProductDescription` retourneert server-side bewust geen geparseerde tekst.
   Vervang browser-only `DOMParser` door een deterministische server- én
   browsergeschikte transformatie; de volledige beschrijving moet in HTML staan.
3. De bestaande catalogusfuncties kunnen alles ophalen, breed uitwaaieren en
   bij fouten gedeeltelijke resultaten teruggeven. Splits serverreads,
   browsercart/predictive search en gedeelde types; gebruik de loaderbudgetten.
4. Preview-login kan niet betrouwbaar werken met productiecallback-URL's.
   Voor de acceptatietest is een stabiel staging-subdomein nodig dat in Shopify
   als callback/logout-URL is toegestaan, plus deployment-afhankelijke origin.
   Dit is een externe beslispoort voor Stefan; zonder staging kan auth pas als
   gecontroleerde productiecanary worden getest, wat de gate verzwakt.
5. `SEO.tsx` hoeft niet automatisch te verdwijnen: React 19 kan title/meta/link
   tijdens SSR hoisten. Behoud of vereenvoudig wat bewezen werkt. Verplaats de
   vaste verificatie-, favicon- en fonttags uit `index.html` naar de root-layout
   en voorkom dubbele metadata/JSON-LD na hydration en navigatie.

### 7.3 Implementatievolgorde

1. Frameworkskelet zonder cutover: versies uitlijnen, root/routes/entries,
   configs en scripts; vaste head-tags migreren.
2. Statische routes: FAQ, contact, beleid en echte 404; providers en motion
   SSR-veilig maken.
3. Shopify-laag begrenzen en daarna publieke routes één voor één: Home →
   Product → Collection → Brand → Alle producten. Iedere route passeert eerst
   status-, cache-, no-JS- en hydration-tests.
4. Private browserflows: cart/checkout, consent/tracking en auth/account/welkom;
   bestaande API-functies aanvankelijk behouden.
5. Vercel-preview op een aparte branch; SPA-fallback verwijderen en API,
   webhook, feeds en redirects bewijzen. Daarna staging-auth.
6. Gecontroleerde cutover na expliciet akkoord; productie-smoke en vooraf
   geteste rollback. Geen externe Shopify-configuratie of deploy zonder akkoord.

### 7.4 Bindende e2e-gate vóór cutover

- [ ] Build: route-types, volledige typecheck inclusief API, unit-tests en
      productiebuild op de vastgelegde Node-versie.
- [ ] Iedere route/catch-all: juiste status, H1 en inhoud, title, description,
      canonical, robots, OG, verification-tags en passende JSON-LD in SSR-HTML.
- [ ] Product: naam, juiste variant, prijs, voorraad en volledige beschrijving
      staan in de ontvangen HTML; `Article`/FAQ wordt niet op product toegepast.
- [ ] No-JS desktop/mobiel leesbaar; geen `opacity:0`; reduced-motion werkt.
- [ ] Geen hydration-warnings, dubbele head/schema of tweede Shopify-call voor
      reeds server-geladen data; back/forward en scrollherstel werken.
- [ ] Shopify-timeout, 429, 5xx en malformed JSON leveren begrensde retry en
      502/503-noindex; echte 404's blijven 404.
- [ ] Publieke/private cacheheaders kloppen en geen persoonsgegevens lekken.
- [ ] Cart add/update/remove, refresh-herstel, accountwissel, logout en checkout
      op `checkout.hlty.shop` werken.
- [ ] Auth: PKCE/state, nieuw/bestaand account, refresh, expiry en logout werken
      op het stabiele stagingdomein.
- [ ] Geen GA4/Meta vóór consent; exact één eerste pageview erna en één per
      navigatie; reject en revoke werken.
- [ ] Webhook: ongeldige HMAC 401, geldige raw-bodyfixture 200; `/api/*` wordt
      nooit door SSR opgeslokt.
- [ ] Volledige redirectmatrix, sitemap, robots, llms en Merchant-feed werken;
      tien feedlinks zijn variantconsistent.
- [ ] Browser-, Googlebot-, OAI/ChatGPT- en social-preview-UA krijgen dezelfde
      inhoud; geen UA-afhankelijke rendering.
- [ ] Koude en warme TTFB/LCP/CLS, JS- en hydration-payload blijven binnen de
      vooraf vastgelegde budgetten en minstens zonder regressie t.o.v. fase A.
- [ ] Meta-advertentieketen, preview-smoke, productie-smoke en rollbackscenario
      zijn aantoonbaar getest.

**Kwaliteitspoort:** alle vakken met bewijs afgevinkt in het controlesessie-
verslag; SSR-cutover en productie-deploy pas na expliciete bevestiging.

---

## 8. Fase D0 — Claims-governance vóór nieuwe content

**Doel:** zorgen dat vindbaarheid niet wordt gekocht met juridisch of medisch
risico. Een disclaimer, PubMed-bron of AI-check maakt een niet-toegestane
commerciële gezondheidsclaim niet geldig.

1. **Beperkte bestaande-contentaudit:** minimaal home, FAQ, productadviseur,
   collectiecopy, productnotities, metadata, alt-teksten en commerciële
   afbeeldingen. Ook een achtergrondgids met productlinks of -beelden geldt als
   commerciële communicatie.
2. **Claimsregister:** per publieke formulering pagina/sectie, claimtype,
   nutriënt/stof, EU-registerverwijzing, toegestane betekenis, gebruiksvoorwaarden,
   doelgroep, hoeveelheid per aanbevolen dagdosering van ieder gelinkt product,
   waarschuwingen, bron/versie/controledatum, reviewer, status, publicatie- en
   hercontroledatum en correctiehistorie.
3. **Rollen:** AI mag onderzoek structureren en een concept maken, maar geen
   claim goedkeuren. Stefan is publicatie-eigenaar. Chris beoordeelt alleen
   onderwerpen binnen zijn aantoonbare fysiotherapeutische deskundigheid.
   Supplementclaims gaan aanvullend langs een benoemde claimspecialist;
   interacties, tekorten, diagnostiek en individuele doseeradviezen langs een
   passende diëtist, apotheker of arts. Twijfel of open status blokkeert livegang.
4. **Transparantie:** iedere gids toont werkelijke auteur, relevante
   kwalificaties, reviewer, publicatie-/wijzigingsdatum, bronnen, commercieel
   belang van HLTY en een korte AI-toelichting wanneer AI substantieel hielp.
   De naam van een gezondheidsprofessional wordt niet als productaanbeveling
   of keurmerk gebruikt.

**Input nodig vóór publicatie:** naam/rol van de formele claimsreviewer;
bevestiging of Chris met gecontroleerde bio en beroepsgegevens zichtbaar mag;
budget/keuze voor externe controle van het statuut en de eerste drie gidsen;
de tien prioriteitsproducten met complete actuele etiketten.

## 9. Fase D — Contentarchitectuur en gecontroleerde pilot

**Doel:** duurzame niet-merk-vindbaarheid opbouwen met eigen, controleerbare
waarde. AI-citaties zijn een mogelijke uitkomst, geen gegarandeerd kanaal.

### 9.1 Architectuur na SSR

- Routes `/gids` en `/gids/:slug`; content als versiebeheerbare Markdown/MDX of
  typed content in de nieuwe SSR-structuur. Geen CMS in de eerste pilot.
- Per gids: zichtbare auteur/reviewer en kwalificaties, bronnen bij de relevante
  bewering, publicatie-/wijzigingsdatum, `Article` en `Breadcrumb`-schema,
  interne links en een beperkt blok met gecontroleerde producten.
- FAQ-vragen mogen zichtbaar helpen, maar een `FAQPage`-rich result is geen
  acceptatiecriterium voor een commerciële webshop.
- Sitemaptype ‘gidsen’, `/gids` in navigatie/footer en `llms.txt`, analytics-
  events voor gids → product, add-to-cart, aankoop en geassisteerde omzet.

### 9.2 Eerste batch: drie gidsen in zes weken

1. **Een supplementenetiket lezen: 7 controles vóór aankoop.** Laag
   claimrisico en een goede proef voor architectuur en redactiestatuut.
2. **Creatine-startgids.** Alleen exacte toegestane betekenis en voorwaarden;
   de prestatieclaim vereist onder meer 3 gram per dag en de toepasselijke
   volwassen doelgroep met hoogintensieve inspanning.
3. **Omega-3-etiketgids:** EPA, DHA, dagdosering en keurmerken; wettelijk
   toegestane claims, controleerbare eigenschappen en private keurmerken
   duidelijk uit elkaar houden.

Daarna 8–12 weken meten en pas dan bepalen of magnesium, eiwit, vitamine D,
elektrolyten en zink volgen. Blessureherstel, slaap, collageen, ijzer/
vermoeidheid en individueel klinkende ‘niet nodig’-adviezen blijven uit de
eerste reeks. Twee gidsen per week is hooguit een toekomstig maximum, nooit
een productiequotum; kwaliteit en eigen bijdrage bepalen het tempo.

Er geldt geen vast woordenaantal. Iedere gids beantwoordt de hoofdvraag vroeg,
is scanbaar en bevat minimaal één aantoonbaar origineel onderdeel, zoals een
etiketanalyse, beslisboom, praktijkobservatie of rekenvoorbeeld. Lengte volgt
uit wat nodig is om de vraag volledig en veilig te beantwoorden.

### 9.3 Productnotitiespilot

Start met tien, niet vijftig, producten met complete etiketten en commerciële
prioriteit. Leg alleen controleerbare gegevens vast: samenstelling en hoeveelheid
per dagdosering, ingrediëntvormen, allergenen, certificeringen, verpakkingsduur,
feitelijke reden voor assortimentsopname en gebruik conform etiket. ‘Voor wie’
en voordelen verschijnen alleen wanneer het claimregister ze voor dat concrete
product en die dosering goedkeurt.

**Kwaliteitspoort per publicatie:** productiebuild groen; SSR-response bevat
juiste status, canonical, title, description, volledige inhoud, auteur en
bronnen; `Article` en `Breadcrumb` valideren; claimregister zonder open punten;
ieder gelinkt product op actuele samenstelling/dosering gecontroleerd; copy,
metadata, tabellen, CTA's, beelden en alt-teksten meegecontroleerd; originele
bijdrage en AI-inzet vastgelegd; desktop/mobiel/linktracking bewezen; expliciete
goedkeuring van Stefan én de aangewezen claimsreviewer.

---

## 10. Fase E — Reviews en relevante autoriteit

### 10.1 Reviews — discovery rond 50 bestellingen

- Het bestelvolume start de discovery, niet automatisch de livegang. Vereist
  zijn een betrouwbaar fulfillment-/delivery-event, geverifieerde aankoop,
  moderatieproces, privacygrondslag en voldoende concentratie per product.
  `orders/paid` mag een toekomstige uitnodiging klaarzetten, maar bewijst geen
  levering; versturen pas na fulfillment of aantoonbare delivery.
- Publiceer echte positieve én negatieve reviews vanaf de eerste goedgekeurde
  review. Drie reviews is alleen de minimumdrempel voor een gemiddelde
  sterrenbadge, niet een reden om bestaande reviews te verbergen.
- Weiger alleen volgens vooraf zichtbare regels, bijvoorbeeld persoonsgegevens,
  spam, belediging of verboden voedings-/medische claims—nooit wegens een lage
  score. Bewaar reden en audittrail; wijzig reviewtekst niet stilzwijgend.
- Toon bron, methode voor ‘geverifieerde aankoop’, publicatiebeleid,
  scoreberekening en eventuele beloning. `aggregateRating` alleen voor het
  exacte product, gebaseerd op zichtbaar gepubliceerde reviews en hetzelfde
  zichtbare gemiddelde; externe sites niet samenvoegen.
- Bij een leverancier vooraf datastromen, verwerkersafspraken, subverwerkers,
  bewaartermijnen, export en verwijdering beoordelen. Laat ook bepalen of de
  uitnodiging servicebericht of direct marketing is en borg afmelding.

### 10.2 Autoriteit — kwaliteit boven aantallen

- Alleen vermeldingen die bezoekers echt helpen en bedrijfsgegevens correct
  tonen; geen bulkinschrijving in lagekwaliteitdirectories.
- Een link vanaf fysiotherapiebilgaard.nl is contextueel, niet sitebreed, met
  transparantie over de relatie en alleen waar hij inhoudelijk helpt.
- Geen betaling, gratis product of wederdienst voor een gewone dofollow-link.
  Betaalde/gesponsorde links krijgen `rel="sponsored"` of `nofollow`.
- Meet relevante verdiende verwijzende domeinen en referralverkeer, niet het
  kale aantal links.

### 10.3 AI-/antwoordmachinemeting is directioneel

Gebruik vaste prompts alleen als observatie, niet als KPI of bewijs van
autoriteit. Leg datum, exacte prompt, taal/land, model, zoekfunctie, accounttype,
nieuw gesprek, geheugenstatus, genoemde URL en concurrenten vast; herhaal per
kwartaal drie keer om toeval zichtbaar te maken. Gewone crawlbaarheid,
people-first content en bronkwaliteit blijven leidend; speciale ‘AI-markup’ is
geen vereiste.

---

## 11. Onderhoudsritme en meetkader

**Maandelijks, iedere eerste werkdag:**

- **Techniek:** aangeboden/geïndexeerd per sitemaptype, crawlstatus, canonical,
  Core Web Vitals en beschikbaarheid van sitemap/feed.
- **Search:** klikken, vertoningen, CTR en positie, uitgesplitst naar branded/
  non-branded, paginatype en querycluster.
- **Content/omzet:** gids → productklik, add-to-cart, aankoop, geassisteerde
  omzet en correcties of claimincidenten.
- **Merchant:** bronverwerking, technische mismatches, afkeuringen per cohort en
  actuele prijs/voorraad. Accountwaarschuwing = stop en analyseren.
- **Autoriteit:** relevante verdiende verwijzende domeinen en referralverkeer.
- **Generatieve zoekervaringen:** apart Search Console-rapport wanneer de
  property toegang krijgt; AI-promptruns alleen volgens §10.3.
- **Continuïteit:** `site:checkout.hlty.shop` blijft 0; na iedere Shopify-
  theme-update het F6.1-script controleren (docs/05 §9).

| Maand | Klikken | Vertoningen | Geïndexeerd | Opmerkingen |
|---|---|---|---|---|
| Nulmeting 29-7-2026 | 6 (3 mnd) | 439 (3 mnd) | 21 / 1.185 | Alleen merknaam-query's |

**Reviews-trigger (B4):** noteer maandelijks het totaal aantal bestellingen;
rond 50 start discovery voor §10.1, niet automatisch de review-livegang.

---

## 12. Startprompts per fase (voor een verse AI-sessie)

Elke fase is zelfstandig uitvoerbaar. Werkmap:
`/Users/stefanritsema/Documents/VibeCode/HLTY` (git-repo, `main` =
productie-deploy via Vercel). Kwaliteitspoort altijd: `npm run build`
(bevat tsc) groen vóór commit; wijzigingen aan `vercel.json` na deploy met
curl verifiëren; alleen de bestanden van je eigen fase committen.

> **Fase A:** Lees eerst volledig
> `/Users/stefanritsema/Documents/VibeCode/HLTY/docs/12-seo-geo-vervolgplan.md`
> (dit document). Voer Fase A (§5) uit. GSC-stappen die een browser vereisen:
> gebruik de verbonden Chrome van Stefan (property www.hlty.shop is
> geverifieerd). Werk §5 en de meettabel in §11 bij. Neem bestaande,
> niet-gerelateerde wijzigingen niet mee.

> **Fase B-pilot:** Lees dit document en voer §6 in volgorde uit. Stop vóór
> build zolang de verzendkeuze openstaat. Bouw daarna de allowlistfeed en tests;
> registreer hem pas ná product-SSR en expliciet akkoord. Werk §6 bij met
> selectiebron, account-ID, feedstatus en afkeuringsredenen.

> **Fase C (SSR) — start met de PLANSESSIE, niet met bouwen:** Lees eerst
> dit document volledig (met name §7 en de besluiten in §4), plus
> `/Users/stefanritsema/Documents/VibeCode/_WERKINSTRUCTIE-bouwsessie-opdracht.md`.
> Je bent de plansessie: zet een ontwerp-panel op voor de migratie naar
> React Router 7 framework mode volgens §7.1, leg externe/stagingkeuzes aan
> Stefan voor, en schrijf daarna het bindende opdrachtdocument. Neem iedere
> releaseblokker uit §7.2 en de volledige gate uit §7.4 integraal over.

> **Fase D0:** Lees §8 en inventariseer de genoemde bestaande pagina's. Bouw
> het claimsregister en redactiestatuut. Publiceer of herschrijf niets voordat
> Stefan de reviewerrol, Chris' zichtbaarheid, reviewbudget en tien
> prioriteitsproducten heeft bevestigd.

> **Fase D (ná SSR én D0):** Bouw §9.1 in de nieuwe SSR-structuur. Lever daarna
> één gids per PR volgens §9.2 en de volledige publicatiepoort. Een AI-check of
> disclaimer vervangt nooit de menselijke claimsgoedkeuring.

---

## 13. Primaire referenties voor uitvoering

- [Google Merchant-listing structured data](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing)
  en [productspecificatie](https://support.google.com/merchants/answer/7052112).
- [Shopify API-versionering](https://shopify.dev/docs/api/usage/versioning).
- [React Router framework modes](https://reactrouter.com/start/modes),
  [SSR-configuratie](https://reactrouter.com/start/framework/rendering) en
  [routeheaders](https://reactrouter.com/how-to/headers).
- [EU Claims Regulation](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02006R1924-20141213),
  [EU Claims Register](https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-health-claims_en)
  en [NVWA-regels voor online promotie](https://www.nvwa.nl/onderwerpen/voedselveiligheid/voedingsclaims-en-gezondheidsclaims/regels-voor-online-promoten-van-levensmiddelen).
- [Google people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content),
  [review markup](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
  en [linkspambeleid](https://developers.google.com/search/docs/essentials/spam-policies).

*Oorspronkelijk onderzoek en plan: Claude Fable, 29-7-2026. Uitvoeringsaudit
en live nulmeting aangescherpt op 2-8-2026 op basis van code, Shopify Storefront
API, Google Search Console, PageSpeed, Bing Webmaster Tools en Merchant Center.*
