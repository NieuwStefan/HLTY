# Fase 12 — SEO & GEO vervolgplan: van "technisch in orde" naar vindbaar

**Datum onderzoek:** 29 juli 2026 (Claude Fable, volledige audit: code + live site
+ Google-index + Search Console)
**Status:** 📋 Plan — wacht op beslispunten Stefan (§4), daarna per fase
uitvoerbaar door een verse AI-sessie (startprompts in §11)

---

## 1. Managementsamenvatting

De technische SEO-fundering uit Fase 8 en 10 staat er goed bij en werkt. Maar
de cijfers na ruim twee maanden zijn hard: **6 klikken en 439 vertoningen in
drie maanden, uitsluitend op merknaam-zoekopdrachten** ("hlty", "helty").
Google heeft **21 van de 1.185 aangeboden pagina's geïndexeerd**. Op generieke
zoektermen ("creatine kopen", "magnesium bisglycinaat") is HLTY onzichtbaar,
en AI-assistenten (ChatGPT, Perplexity, Claude) kunnen de site **letterlijk
niet lezen** — elke pagina is voor hen een lege huls.

De drie echte problemen, in volgorde van impact:

1. **Autoriteit & content**: nieuw domein, geen backlinks, en 800+
   productpagina's met fabrikantteksten die woordelijk op tientallen andere
   webshops staan. Google indexeert geen duizendste kopie op een domein
   zonder autoriteit. Dit is het hoofdprobleem achter "21 van 1.185".
2. **GEO is de facto dood**: AI-crawlers (GPTBot, ClaudeBot, PerplexityBot)
   en social-share-bots renderen géén JavaScript. Zij zien op élke URL een
   lege body met de generieke fallback-titel. De AI-allowlist uit Fase 8 is
   daardoor een deur naar een lege kamer; alleen `llms.txt` is leesbaar.
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
concurrentie dun is, en **(d) bot-leesbare pagina's** zodat AI-assistenten
en social previews überhaupt iets te zien krijgen.

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
  Fragiel; zie onderhoudsritme §9.
- `hlty.shop` (apex) en `www.hlty.shop` serveren beide 200 zonder onderlinge
  redirect; canonicals wijzen naar www. Werkt, maar consolidatie ontbreekt.

---

## 4. Beslispunten voor Stefan (vooraf beslissen, daarna is alles uitvoerbaar)

| # | Vraag | Aanbeveling |
|---|---|---|
| B1 | **Bot-rendering bouwen** (Fase C)? AI-bots en social-bots krijgen server-gerenderde HTML met alle productdata; gewone bezoekers en Googlebot merken niets. | **Ja.** Zonder dit blijft GEO onmogelijk en blijven gedeelde links (WhatsApp/socials) generiek. |
| B2 | **Google Shopping: eigen feed op Vercel of de Shopify "Google & YouTube"-app?** De Shopify-app publiceert links op checkout.hlty.shop (zelfde probleem als bij Meta). | **Eigen feed** (`api/merchant-feed.ts`), links direct naar `www.hlty.shop/product/<handle>`. Zelfde patroon als de bestaande sitemap-functie. |
| B3 | **Content-programma**: AI schrijft gidsen, wie reviewt op claims en toon? Tempo? | AI schrijft per gids een PR; **Stefan reviewt** (evt. Chris voor fysio-onderwerpen). Tempo: **2 gidsen/week eerste 6 weken** (= kalender §D3 af), daarna 1/week. |
| B4 | **Reviews** (sterren + aggregateRating): nu systeem kiezen of parkeren? | **Parkeren** tot Fase A-D live zijn; dan Judge.me-headless vs eigen bouw afwegen (Fase E). |
| B5 | **SSR-migratie** (React Router 7 framework mode) om alles server-rendered te maken? | **Nu niet.** Grote verbouwing van een werkende shop. Herevalueren wanneer organisch verkeer bewezen groeit (zie §10). Fase C dekt de bot-behoefte af. |

---

## 5. Fase A — Technische quick wins (½ dag, kan direct)

**Doel:** consolidatie + herindexering triggeren + meetbaarheid compleet.

1. **Apex → www redirect.** In `vercel.json`, bovenaan `redirects`:
   `{ "source": "/:path*", "has": [{ "type": "host", "value": "hlty.shop" }], "destination": "https://www.hlty.shop/:path*", "permanent": true }`
   Alle canonicals/sitemap gebruiken al www; dit consolideert signalen.
   Verifieer daarna dat `https://hlty.shop/product/<handle>` in één 308 op
   www uitkomt en dat de bestaande Shopify-formaat-redirects blijven werken
   (bijv. apex `/products/<handle>` → www `/products/<handle>` → www
   `/product/<handle>` is twee hops — acceptabel; wie het in één hop wil,
   zet de host-regel ónder de padregels, maar test dan beide varianten).
2. **Sitemap opnieuw aanbieden** in Search Console (verwijderen + opnieuw
   indienen) en **indexering aanvragen** via URL-inspectie voor: home,
   `/veelgestelde-vragen`, `/alle-producten`, de 6 hoofdcollecties en de
   15-20 belangrijkste producten (advertentie-toppers). Google begrenst dit
   op ±10-12 verzoeken per dag — verdeel over meerdere dagen en noteer in
   dit document welke zijn aangevraagd.
3. **Bing Webmaster Tools** opzetten (importeert met één klik vanuit Search
   Console) + sitemap indienen. Bing voedt ChatGPT-search — dit is óók GEO.
4. **Lighthouse-baseline** meten (mobiel + desktop, productpagina + home) en
   scores hieronder vastleggen. Openstaand punt uit Fase 8.
5. **llms.txt actualiseren**: FAQ-URL, merkenpagina's en de 6 hoofdcollecties
   opnemen als "belangrijke pagina's"-lijst met absolute URL's.

**Kwaliteitspoort:** `npm run build` groen; curl-bewijs van de nieuwe
redirect; screenshot GSC "sitemap ingediend"; Lighthouse-scores genoteerd.

---

## 6. Fase B — Google Merchant Center + gratis vermeldingen (1-2 dagen)

**Doel:** alle ~850 producten in Google Shopping (gratis listings) met links
naar de eigen storefront. Snelste route naar niet-merk-zichtbaarheid die er
bestaat voor een webshop.

1. **Merchant Center-account** aanmaken (merchants.google.com) voor
   www.hlty.shop, land NL, valuta EUR. Domeinclaim verloopt automatisch via
   de bestaande Search Console-verificatie. *(Stap voor Stefan of via diens
   browser; documenteer de account-ID hier.)*
2. **`api/merchant-feed.ts`** bouwen naar het patroon van `api/sitemap.ts`:
   Storefront API → RSS 2.0 met `g:`-namespace. Per variant: `g:id`
   (variant-ID — zelfde ID-ruimte als de Meta-catalogus), `g:title`,
   `g:description` (fabrikanttekst, HTML gestript), `g:link`
   (`https://www.hlty.shop/product/<handle>`), `g:image_link`,
   `g:availability`, `g:price`, `g:brand` (vendor), `g:gtin` (veld
   `variant.barcode` uit de Storefront API — query uitbreiden), zonder gtin:
   `g:identifier_exists=false`, `g:condition=new`. Rewrite in `vercel.json`:
   `/merchant-feed.xml` → `/api/merchant-feed`, cache `s-maxage=3600`.
3. **Feed aanmelden** in Merchant Center (geplande ophaal, dagelijks) en
   **verzendinstellingen** in de MC-UI configureren (NL, standaardtarief,
   gratis vanaf €50 — conform `/beleid/verzending`).
4. **Verwachting managen:** net als bij Meta (76 afwijzingen) zal Google een
   deel van de supplementen afkeuren op beleid. Doel: >85% goedgekeurd.
   Afwijzingen per reden documenteren in dit bestand, niet ad-hoc fixen.

**Kwaliteitspoort:** feed valideert in MC zonder kritieke fouten; steekproef
van 10 `g:link`-URL's geeft 200 op de eigen storefront; MC-diagnosepagina
>85% goedgekeurd binnen een week (screenshot hier archiveren).

---

## 7. Fase C — Bot-leesbare pagina's: GEO + social previews (2-3 dagen)

**Doel:** AI-crawlers en social-share-bots krijgen volwaardige, semantische
HTML met exact dezelfde informatie als de SPA toont. Googlebot en gewone
bezoekers blijven de SPA krijgen — één waarheid, geen cloaking-risico.

1. **`api/bot-render.ts`**: serverless functie die op basis van het pad de
   Storefront API bevraagt (hergebruik de fetch-helper uit `api/sitemap.ts`)
   en kale, nette HTML rendert. Te dekken routes: `/`,
   `/product/:handle` (h1, merk, prijs, voorraad, beschrijving, afbeeldingen
   met alt, breadcrumb, volledige Product-JSON-LD), `/collectie/:handle` en
   `/merken/:brand` (h1, beschrijving, productlijst met links, ItemList),
   `/alle-producten`, `/veelgestelde-vragen` (alle 8 Q&A's voluit +
   FAQPage-JSON-LD), `/beleid/:slug`, `/contact`. Elke pagina: correcte
   `<title>`, meta-description, canonical naar www, en OG/Twitter-tags —
   spiegel de logica van `src/components/SEO.tsx`.
2. **Bot-detectie in `vercel.json`**: een rewrite mét `has`-conditie op de
   `user-agent`-header (regex), geplaatst NÁ de bestaande redirects en de
   sitemap-rewrite maar VÓÓR de SPA-catch-all. Botlijst (regex, case-
   insensitive): `GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-User|
   Claude-SearchBot|PerplexityBot|Perplexity-User|facebookexternalhit|
   Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Discordbot|
   Applebot|bingbot`. **Googlebot bewust NIET** — die rendert de echte SPA
   (zie §3) en zo blijft de rankende bot op één waarheid zitten.
3. **Inhoudsgelijkheid is de wet:** de bot-HTML mag niets beweren dat de SPA
   niet toont. Zelfde titels, zelfde prijzen, zelfde beschrijvingen, zelfde
   JSON-LD-payload. Bij twijfel: minder, nooit meer.
4. **Cache**: `s-maxage=3600, stale-while-revalidate=86400` (zelfde beleid
   als de sitemap); Storefront-API-fouten → val terug op de SPA-shell
   (rewrite-fallback door 500 te vermijden: render dan een minimale pagina
   met alleen title/canonical).

**Kwaliteitspoort:** `npm run build` groen. Curl-bewijs (in dit doc
archiveren): `curl -A "GPTBot" https://www.hlty.shop/product/creatine-monohydrate-1000g-doypack`
bevat h1 + prijs + beschrijving + JSON-LD; idem `-A "facebookexternalhit"`
toont per-pagina OG-tags; `curl` met gewone browser-UA geeft de ongewijzigde
SPA-shell. Post-deploy: link delen in WhatsApp/Slack toont een echte preview
(screenshot), en de Meta Sharing Debugger toont de productdata.

---

## 8. Fase D — De content-motor: gidsen met de fysio-invalshoek (doorlopend)

**Doel:** de enige duurzame route naar niet-merk-verkeer én AI-citaties.
HLTY's verhaal ("geselecteerd door fysiotherapeuten, duidelijkheid in
zelfzorg") is precies het soort bron dat AI-assistenten citeren — als er
iets te lezen valt.

1. **Architectuur** (eenmalig, 1 dag): route `/gids` (overzicht) +
   `/gids/:slug` in de SPA. Content als TypeScript/markdown-bestanden in
   `src/content/gidsen/` (patroon: `src/data/brands.ts` — geen CMS, dus een
   AI-sessie kan een gids als gewone PR aanleveren en Stefan reviewt in de
   preview). Per gids: SEO-component, `Article`-JSON-LD (+ `FAQPage` voor de
   vraagsectie), breadcrumb, blok "bijpassende producten" (interne links
   naar 3-6 producten), publicatie-/wijzigingsdatum. Sitemap uitbreiden
   (`api/sitemap.ts`) en `/gids` opnemen in llms.txt en de footer. **Als
   Fase C al live is: de gids-routes toevoegen aan de bot-renderer.**
2. **Redactiestatuut (hard, juridisch):** supplementen vallen onder
   EU-claimsverordening/KOAG-KAG. Alleen toegestane gezondheidsclaims
   ("magnesium draagt bij tot de vermindering van vermoeidheid") — nooit
   medische claims (genezen/voorkomen/behandelen van ziekte). Elke gids
   sluit af met de disclaimer die al op de FAQ staat + bronnenlijst
   (EFSA-register, PubMed). Twijfelclaim = schrappen. De uitvoerende AI
   controleert elke gids expliciet tegen deze regel vóór oplevering.
3. **Kalender — eerste 12 gidsen** (volgorde = prioriteit, gekozen op
   zoekvolume-kans × fysio-onderscheid × productkoppeling):
   1. Magnesiumvormen vergeleken: citraat, bisglycinaat, tauraat — welke
      past bij welk doel?
   2. Creatine-startgids: dosering, timing, mythes (koppelt aan het
      advertentie-topproduct)
   3. Omega-3-kwaliteit beoordelen: EPA/DHA, TOTOX, IFOS-certificering
   4. Vitamine D in de Nederlandse winter: wie, hoeveel, waarom
   5. Eiwitbehoefte bij krachttraining: berekening + voedingsbronnen
   6. Herstel na een hardloopblessure: wat een fysio adviseert (+ rol van
      voeding/supplementen)
   7. Slaap verbeteren zonder medicatie: onderbouwde opties op een rij
   8. Collageen: wat zegt het onderzoek écht?
   9. IJzer en vermoeidheid: wanneer suppleren en wanneer naar de huisarts
   10. Elektrolyten bij zweten: wie heeft ze echt nodig?
   11. Zink en weerstand: doseringen en vormen
   12. **Supplementen die je níet nodig hebt** — het "duidelijkheid in
       zelfzorg"-statement; onderscheidend en zeer citeerbaar
4. **Formaat per gids:** 1.200-1.800 woorden; de kernvraag in de eerste
   alinea beantwoord (AI-citaties pakken de eerste heldere definitie);
   H2-structuur; een vergelijkingstabel waar zinvol; 3-5 vragen als
   FAQ-sectie; interne links naar producten én naar verwante gidsen.
5. **Productbeschrijvingen verrijken (parallel spoor):** voor de top-50
   producten (advertentie- en omzet-toppers) een uniek "Waarom HLTY dit
   selecteerde"-blok (3-5 zinnen: voor wie, waarom deze formule, hoe te
   gebruiken) bóven de fabrikanttekst. Opslag: `src/content/product-notes.ts`
   keyed op handle (zelfde patroon als brands.ts). Dit is de directe aanval
   op het duplicate-content-probleem van §1.

**Kwaliteitspoort per gids-PR:** build groen; claim-check aantoonbaar
uitgevoerd (sectie in de PR-beschrijving); preview-URL bekeken; JSON-LD
valide (Rich Results Test na livegang van de eerste gids).

---

## 9. Fase E — Reviews & autoriteit (na A-D, apart te plannen)

- **Reviews:** systeemkeuze (Judge.me met headless API vs eigen bouw op
  Supabase) — beslispunt B4. Daarna `aggregateRating` toevoegen aan het
  Product-schema (het enige ontbrekende rich-result-veld, zie Fase 8 §3).
- **Autoriteit (doorlopend, deels handwerk Stefan):** bedrijfsvermeldingen
  (KvK-gerelateerde registers, supplementen-vergelijkers), een link vanaf
  fysiotherapiebilgaard.nl (relevant en legitiem: de fysio-curatie is het
  verhaal), gastartikelen/PR rond "fysiotherapeuten cureren een
  supplementenshop", socials volledig invullen (sameAs staat al klaar).
- **AI-citatie-meting:** maandelijks dezelfde 5 prompts stellen aan
  ChatGPT, Perplexity en Claude ("beste magnesiumvorm bij spierkrampen",
  "creatine dosering beginner", "betrouwbare supplementenshop Nederland",
  "omega 3 kwaliteit herkennen", "supplementen bij hardloopblessure") en
  noteren of HLTY genoemd/gelinkt wordt. Nulmeting: nog nergens genoemd
  (verwacht — er valt niets te lezen).

---

## 10. Onderhoudsritme + herevaluatie SSR

**Maandelijks (10 min, elke eerste werkdag):** GSC-cijfers (klikken/
vertoningen/geïndexeerd) in de tabel hieronder bijschrijven;
`site:checkout.hlty.shop` checken (moet 0 blijven); Merchant
Center-diagnose; na élke Shopify-theme-update het F6.1-script controleren
(zie docs/05 §9 — het sneuvelt bij theme-updates en de advertentie-keten
hangt eraan).

| Maand | Klikken | Vertoningen | Geïndexeerd | Opmerkingen |
|---|---|---|---|---|
| Nulmeting 29-7-2026 | 6 (3 mnd) | 439 (3 mnd) | 21 / 1.185 | Alleen merknaam-query's |

**SSR-herevaluatie (beslispunt B5):** wanneer twee opeenvolgende maanden
elk >500 organische klikken laten zien, of wanneer de shop structureel
omzet uit organisch haalt, plan dan een aparte ontwerpsessie voor migratie
naar React Router 7 framework mode (SSR op Vercel). Tot die tijd is Fase C
de afdoende en veel goedkopere oplossing.

---

## 11. Startprompts per fase (voor een verse AI-sessie)

Elke fase is zelfstandig uitvoerbaar. Werkmap:
`/Users/stefanritsema/Documents/VibeCode/HLTY` (git-repo, `main` =
productie-deploy via Vercel). Kwaliteitspoort altijd: `npm run build`
(bevat tsc) groen vóór commit; wijzigingen aan `vercel.json` na deploy met
curl verifiëren; alleen de bestanden van je eigen fase committen.

> **Fase A:** Lees eerst volledig
> `/Users/stefanritsema/Documents/VibeCode/HLTY/docs/12-seo-geo-vervolgplan.md`
> (dit document). Voer Fase A (§5) uit. GSC-stappen die een browser vereisen:
> gebruik de verbonden Chrome van Stefan (property www.hlty.shop is
> geverifieerd). Werk §5 en de meettabel in §10 bij en commit het document mee.

> **Fase B:** Lees eerst dit document volledig. Voer Fase B (§6) uit; bouw
> `api/merchant-feed.ts` naar het patroon van `api/sitemap.ts` (zelfde
> env-vars). Stap 1 (accountaanmaak) samen met Stefan. Werk §6 bij met
> account-ID, feedstatus en afkeuringsredenen.

> **Fase C:** Lees eerst dit document volledig, plus `api/sitemap.ts`,
> `src/components/SEO.tsx` en `src/pages/Product.tsx` (de waarheid die je
> spiegelt). Voer Fase C (§7) uit. Lever het curl-bewijs uit de
> kwaliteitspoort letterlijk op in §7. Googlebot blijft uitgesloten van de
> botlijst — dat is een besluit, niet een suggestie.

> **Fase D (architectuur):** Lees eerst dit document volledig plus
> `src/data/brands.ts` en `src/pages/Brand.tsx` (patroon). Bouw §8 stap 1.
> Daarna per gids een eigen sessie/PR: schrijf gids N uit de kalender in §8.3
> volgens formaat §8.4 en het redactiestatuut §8.2 (claim-check verplicht in
> de PR-beschrijving).

---

*Onderzoek en plan: Claude Fable, 29-7-2026. Nulmeting-bronnen: Google
Search Console (property https://www.hlty.shop), site:-queries, curl-audits
op www.hlty.shop en checkout.hlty.shop, code-audit Fase 8/10-bestanden.*
