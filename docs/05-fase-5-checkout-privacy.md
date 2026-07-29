# Fase 5 — Checkout-privacy fix + UX-polishing voor accounts

**Datum:** 13–14 mei 2026
**Status:** ✅ Afgerond — Pad A code-items + F6.1 (Horizon theme.liquid redirect)
**Doel:** een privacy-bug oplossen waarbij de Shopify-checkout van een
uitgelogde gebruiker nog steeds de e-mail, naam en het adres van de
vorige gebruiker toonde. Plus een serie UX-puntjes die tijdens de
testrun naar voren kwamen.

---

## 1. Symptoom

Stefan opende een nieuw browser-tabblad en bezocht `/account` — hij
zag "Inloggen / Registreren" (uitgelogd). Maar zodra hij vanuit de
winkelwagen op "Afrekenen" klikte, opende de Shopify checkout-pagina
mét volledige pre-fill van zijn vorige e-mail, naam en adres. Op een
gedeeld apparaat zou de volgende bezoeker dat zien.

---

## 2. Diagnose

Twee onafhankelijke oorzaken die samen het symptoom veroorzaakten:

### 2.1 Cart-record server-side gebonden aan customer (klein effect)

Shopify zet automatisch een `buyerIdentity.customer` op een cart-record
zodra de buyer minstens één keer de checkout heeft afgerond terwijl
ingelogd. Die binding overleeft logout en blijft aan de cart-id hangen.

Bewijs: `cart.buyerIdentity { email, phone, customer { id } }`
geïntrospecteerd via een tijdelijke uitbreiding op `CART_FRAGMENT`
toonde gevulde velden na een eerste checkout. Na ontkoppelen via
`recreateCart()` waren ze leeg.

### 2.2 Onjuist `id_token_hint` in `/api/auth/logout` (grote effect)

De originele code in [api/auth/logout.ts](../api/auth/logout.ts) stuurde
het `shcat_`-prefixed access token mee als `id_token_hint` naar Shopify's
OIDC-logout endpoint. Comment in de code zei "close enough — Shopify
accepts the access token here too" — dat bleek **onjuist**.

Shopify weigerde de logout met "Ongeldige id_token" (zichtbaar bij echte
logout-poging in Stefan's screenshot). Gevolg: de Shopify-side
customer-account-sessie werd **nooit geïnvalideerd**. De HttpOnly
cookies op `inlog.hlty.shop` / `checkout.hlty.shop` bleven actief en
identificeerden de browser bij elk volgend checkout-bezoek —
onafhankelijk van wat wij op cart-niveau deden.

Onze `hlty_*` cookies werden wél gewist (correct). Daardoor toonde
`/account` "uitgelogd", maar Shopify zelf bleef de klant herkennen.

---

## 3. Beslissingen

| Probleem | Aanpak | Reden |
|----------|--------|-------|
| Cart-binding | Optie B+C: `recreateCart()` bij logout én bij stale-state-detectie op mount | Behoudt items voor de gebruiker, drop alleen de binding |
| `id_token_hint` | Sla het echte OIDC `id_token` op als HttpOnly cookie tijdens `/api/auth/exchange`, gebruik die bij logout | Shopify's logout endpoint vereist een geldig JWT als hint per OIDC-spec |

---

## 4. Wat is gedaan

### 4.1 Nieuwe bestanden

| Bestand | Doel |
|---------|------|
| [src/lib/cart-storage.ts](../src/lib/cart-storage.ts) | Cross-context helper `unbindStoredCart()` die `recreateCart()` aanroept en de localStorage-id bijwerkt. Bestaat los van `CartContext` zodat `CustomerContext.logout` hem kan aanroepen zonder cross-provider state-manipulatie |

### 4.2 Aangepaste bestanden

| Bestand | Wijziging |
|---------|-----------|
| [api/_auth-helpers.ts](../api/_auth-helpers.ts) | `COOKIES.id` (`hlty_id`) toegevoegd; `buildAuthCookies()` slaat `token.id_token` op als HttpOnly cookie met 7-dagen TTL |
| [api/auth/logout.ts](../api/auth/logout.ts) | Leest `hlty_id` cookie i.p.v. `hlty_access`; wist die cookie bij logout |
| [src/lib/shopify.ts](../src/lib/shopify.ts) | `CART_FRAGMENT` uitgebreid met `buyerIdentity { email phone customer { id } }`; `Cart` interface uitgebreid; helpers `cartHasCustomerBinding()` en `recreateCart()` toegevoegd |
| [src/context/CartContext.tsx](../src/context/CartContext.tsx) | Importeert `CART_ID_KEY` uit cart-storage; mount-effect detecteert "no session + cart-binding" en unbind't dan automatisch via `recreateCart()` |
| [src/context/CustomerContext.tsx](../src/context/CustomerContext.tsx) | `logout` is nu async; wacht op `unbindStoredCart()` vóór de redirect; type-signature aangepast naar `() => Promise<void>` |

### 4.3 Werking na fix

```
Klant klikt "Uitloggen" op /account
   │
   ├─ CustomerContext.logout() doet:
   │     await unbindStoredCart()
   │       │
   │       ├─ Leest cart-id uit localStorage
   │       ├─ Haalt cart op, vindt buyerIdentity
   │       ├─ Maakt nieuwe cart met dezelfde lines via cartCreate
   │       └─ Schrijft nieuwe cart-id terug
   │
   └─ window.location.href = /api/auth/logout
         │
         ├─ /api/auth/logout doet:
         │     - leest hlty_id cookie (OIDC id_token JWT)
         │     - clearet alle hlty_* cookies (Set-Cookie Max-Age=0)
         │     - 302 naar inlog.hlty.shop/authentication/logout
         │         ?id_token_hint=<echte JWT>
         │         &post_logout_redirect_uri=https://www.hlty.shop/
         │
         └─ Shopify clearet zijn OWN customer-session cookies
               op inlog/checkout subdomains (waarvan we de HttpOnly
               namen niet kennen maar die wél worden ingevallideerd)
               en redirect terug naar /
```

---

## 5. Verificatie via 7 test-scenario's

Alle scenario's getest op productie via Chrome MCP, met
Stefan die de e-mailcodes aanleverde uit zijn inboxen.

| # | Scenario | Resultaat |
|---|----------|-----------|
| **T1** | Inlog A → cart → checkout (bindt) → Uitlog → checkout opnieuw | ✅ Logout schoon (geen "Ongeldige id_token"), checkout daarna volledig anoniem (alleen `country: NL` default) |
| **T2** | Stale-state: inlog → hlty_session JS-clear → reload → checkout | ⚠️ Kon niet meer worden gereproduceerd. Shopify bindt de cart niet automatisch alleen op basis van customer-session-cookies — pas na een afgeronde checkout. Mijn cart-fix (B+C) is een veiligheidsnet voor zulke gevallen |
| **T3** | Account-switch A → B (`info@nieuwcontent.info`) | ✅ Checkout toont alleen B's data (Stefan Ritsema, Julianastraat Emmen), geen leftover van A. Logout B → anoniem |
| **T4** | Nieuwe registratie `info@nxtwebs.com` | ✅ Eerste-keer login via dezelfde mailcode-flow. Bevat verbeterpunten — zie § 6.1 |
| **T5+T6** | Logout zonder cart-bezoek + cross-tab privacy | ✅ Impliciet bewezen via T1/T3 |
| **T7** | Uitgelogd in checkout → klik "Inloggen" link op checkout | ⚠️ Werkt voor Shopify-side, **maar logt niet in op onze app**. Zie § 6.2 |

---

## 6. Verbeterpunten gevonden tijdens testen

### 6.1 Nieuwe-gebruiker UX (uit T4)

| # | Pijnpunt | Locatie | Aanbevolen fix |
|---|----------|---------|----------------|
| 1 | "Welkom terug" voor accounts die net zijn aangemaakt | [Account.tsx:140](../src/pages/Account.tsx#L140) | Detecteer nieuw account (geen `firstName` én geen orders) → toon "Welkom bij HLTY!" |
| 2 | NAAM-card op Overzicht-tab toont e-mailadres als naam-waarde voor nieuwe accounts | [Account.tsx:228](../src/pages/Account.tsx#L228) | `customer.displayName` valt terug op e-mail bij ontbrekende voornaam. Gebruik in plaats daarvan `[firstName, lastName].filter(Boolean).join(' ') \|\| '—'` |
| 3 | Geen onboarding-CTA voor leeg profiel | Overzicht-tab | Bij `!firstName \|\| addresses.length === 0` → banner: "Vul je naam en adres in om sneller af te rekenen" + knop "Naar Profiel" |
| 4 | Cart van vorige sessie hangt door op nieuwe gebruiker | Header / CartContext | Acceptabel (localStorage cart-id blijft), maar mogelijk verwarrend |

### 6.2 Checkout-Inloggen sessie-mismatch (uit T7)

De "Inloggen"-link op de Shopify-checkout gebruikt een **andere
OAuth-client** (`f2a7589a-71df-4c79-9373-4f56fc99c3e1`) dan onze app
(`e95f30c7-5193-4188-84a9-7328be328ec4`). Na inloggen via de checkout:

- Shopify-side sessie is actief (checkout pre-filled, klant herkend)
- Onze React-app weet er niets van: `/account` toont "Inloggen / Registreren"

De gebruiker kan vervolgens met **één klik** op onze "Inloggen" knop
doorlopen (SSO via Shopify-cookies, geen mailcode), maar dat is niet
zichtbaar/aangekondigd.

**Aanbeveling (Fase 5+ werk, schatting 1-2u):**
Bij mount van `/account`, als er geen `hlty_session` cookie is, doe
een silent OAuth-poging via een redirect naar `/api/auth/start`. Als
Shopify een actieve sessie heeft, komt de gebruiker direct ingelogd
terug. Als niet, ziet hij de normale login-prompt. Eventueel met een
debounce zodat niet elke `/account`-bezoek een redirect veroorzaakt.

---

## 7. Commits

| Commit | Onderwerp |
|--------|-----------|
| `155c23a` | Cart-unbind bij logout en stale state (Optie B+C) |
| `3948df7` | OIDC id_token bewaren voor geldige Shopify-logout — de echte fix |

---

## 8. Lessen

- **De cart-binding-theorie was niet de hoofdoorzaak.** Mijn eerste
  hypothese was dat de cart-record server-side aan de klant was
  gekoppeld en de pre-fill veroorzaakte. Dat klopt voor *een deel*
  van de gevallen, maar curl-test zonder cookies bewees dat het
  vooral browser-cookies waren die de identificatie deden.
- **De échte oorzaak was de logout-implementatie zelf.** De comment
  `// close enough — Shopify accepts the access token here too` was
  een verkeerde aanname uit Fase 2. Pas door Stefan's screenshot van
  de "Ongeldige id_token"-error werd duidelijk dat Shopify de logout
  helemaal weigerde.
- **Privacy-bugs zijn lastig te diagnosticeren via UI alone.** Curl
  zonder cookies + bundle-introspectie + fiber-state-inspectie waren
  alle nodig om de juiste laag te vinden.
- **Test in een schone tab/browser pas écht wat de eindgebruiker ziet.**
  Mijn eerste reproductiepogingen waren in dezelfde tab waar cookies
  bestonden — een aparte fresh sessie liet eerder zien hoe sterk
  Shopify's cross-subdomain-cookies waren.

---

## 9. Pad A — UX-polishing na de testrun

Stefan en ik hebben samen de testrun-bevindingen vertaald naar een
concrete uitbreidings-stap die direct in deze fase is uitgevoerd. Dit
zijn de items die op die scope zaten (volgorde van impact):

### H5 — Onboarding-flow voor nieuwe accounts

[src/pages/Welcome.tsx](../src/pages/Welcome.tsx) is nieuw. Een
gloednieuw account dat door de OAuth-callback heen komt zonder
firstName/lastName en zonder adresboek wordt nu **niet** naar
`/account` gestuurd maar naar `/welkom` — een onboarding-scherm met
twee cards: voornaam/achternaam (verplicht) en bezorgadres
(optioneel). "Sla over"-link voor wie later wil. Submit gebruikt de
bestaande `/api/customer/profile` + `/api/customer/address`-routes
met `defaultAddress: true`.

Wijziging in [src/pages/AuthCallback.tsx](../src/pages/AuthCallback.tsx):
na de exchange probeert het `/api/customer/me` even op te halen. Bij
detectie van een "verse" customer (geen naam, geen adresboek) gaat de
browser door naar `/welkom`. Bij bestaande klanten verandert er
niets.

Telefoonnummer is bewust **niet** in de onboarding opgenomen — de
Customer Account API laat dat niet via klant-zelf-edit toe (zie
docs/04 § 3.1). Voor MKB-volume kan dat via de bestaande mailto-
fallback. Een Admin-API wrapper hiervoor zit op de wishlist.

### H2 — NAAM-card en h1 fresh-customer-greeting

[src/pages/Account.tsx](../src/pages/Account.tsx) `OverviewTab`
gebruikte tot nu `customer.displayName`. Shopify zet `displayName` op
het e-mailadres voor accounts zonder firstName, waardoor de NAAM-card
het hele e-mailadres als naam toonde. Vervangen door
`[firstName, lastName].filter(Boolean).join(' ') || '—'`.

De Dashboard h1 is ook dynamisch: bij een "fresh" account (geen
naam, geen adresboek) wordt nu "Welkom bij HLTY!" getoond i.p.v.
"Welkom terug" — relevant voor wie de onboarding-flow heeft
overgeslagen.

### M4 — Loading-state op de Uitlog-knop

Tussen klik op Uitloggen en de redirect zit een async stap (cart
unbind, ~500–1500 ms). Tot nu was er geen feedback. Knop is nu
disabled met een spinner en label "Uitloggen...". onLogout type
bijgewerkt naar `() => Promise<void>`.

### H3 + H4 — Sessie-mismatch en switch-user

Twee gerelateerde verbeteringen voor de auth-flow:

- **H4 (`?force=1` op `/api/auth/start`)**: een nieuwe query-param
  voegt OIDC `prompt=login` toe aan de OAuth-URL. Daardoor toont
  Shopify altijd opnieuw het e-mailformulier i.p.v. de auto-login
  via z'n customer-account-cookies. `CustomerContext.login()` heeft
  een `force?: boolean`-parameter, en er is een aparte
  `switchUser()`-actie die `unbindStoredCart()` aanroept en daarna
  via `/api/auth/start?force=1` Shopify dwingt opnieuw te
  authenticeren.
- **H3 (auto-trigger via referrer)**: bij mount van LoginPrompt
  controleert een `useEffect` of `document.referrer` op
  `checkout.hlty.shop` of `inlog.hlty.shop` matched. Zo ja → meteen
  `onLogin()` aanroepen. Een gebruiker die net via de checkout-
  Inloggen-link is geweest hoeft op `/account` geen extra klik te
  doen.

**Plek van de switch-user-actie:** een eerste iteratie zette de
"Inloggen met een ander account"-link onder de Inloggen-knop in de
uitgelogde view. Tijdens de live-walkthrough viel op dat dit
verwarrend is — twee knoppen die er nagenoeg hetzelfde uit zien op
een moment dat de bezoeker nog niet eens ingelogd is. De link is
daarom verplaatst naar het Dashboard naast de Uitlog-knop, als
"Wissel van account"-actie. Daar past hij contextueel: wanneer je
al als account X bent ingelogd en naar Y wilt. Commit `dde2333`.

### M2 — Cart leegmaken bij account-wissel (geparkeerd)

Niet uitgevoerd. De huidige cart-unbind (uit § 4) houdt items
behouden bij logout en de nieuwe cart heeft geen klant-binding. Een
extra cart-wipe bij account-wissel was overwogen, maar voor het
MKB-volume voegt het meer verwarring (waar zijn mijn items?) dan
veiligheid toe. Op de wishlist.

### F6.1 — HLTY-logo op de Shopify-checkout (✅ opgelost via optie B)

Tijdens de testrun viel op dat het logo op de Shopify-checkout naar
de oude Horizon-thema landingpage linkt (in plaats van naar de
React-app op www.hlty.shop). Onderzoek in de admin:

- Het primair domein voor "Webshop" in Shopify is
  `checkout.hlty.shop`. Het checkout-logo wijst automatisch naar
  `https://checkout.hlty.shop/` (root) — dat serveert de Horizon-
  thema (de "oude website").
- Zowel `hlty.shop` als `www.hlty.shop` wijzen DNS-technisch naar
  Vercel (de React-app). Shopify markeert beide als "Ongeldige DNS"
  en staat ze niet als primair toe. De normale weg ("Maak primair")
  is dus afgesloten.

**Toegepaste oplossing:** een korte JS-redirect bovenin
`layout/theme.liquid` van het Horizon-thema:

```html
<head>
  {%- comment -%} F6.1: HLTY-logo op de Shopify-checkout leidt
  standaard naar deze (oude) Horizon-thema homepage op
  checkout.hlty.shop/. Stuur die bezoekers door naar de echte
  React-app op www.hlty.shop. Alleen actief op het checkout-
  subdomein; de /checkouts/cn/... pages gebruiken hun eigen layout
  en blijven dus werken. Zie docs/05 § 9 F6.1. {%- endcomment -%}
  <script>
    if (window.location.hostname === 'checkout.hlty.shop') {
      window.location.replace('https://www.hlty.shop' + window.location.pathname + window.location.search);
    }
  </script>
  ...
```

Live-test bevestigd: `https://checkout.hlty.shop/` (de URL waar het
logo naar wijst) redirect onmiddellijk naar `https://www.hlty.shop/`.
De Shopify-checkout-pagina's onder `/checkouts/cn/...` gebruiken een
aparte renderer (geen theme.liquid) en zijn dus niet beïnvloed.

**Update 29-7-2026 — F6.1 is nu ook de advertentie-brug.** De
Meta-productcatalogus (Shopify-koppeling, 847 goedgekeurde producten)
publiceert productlinks op het primaire domein:
`checkout.hlty.shop/products/<handle>?utm_...`. Dankzij F6.1 komen
advertentieklikken op `www.hlty.shop/products/<handle>` uit, en sinds
29-7 zet een serverside redirect-laag in `HLTY/vercel.json` (commit
`a3104a8`) élk Shopify-URL-formaat om naar de eigen route
(`/products/` → `/product/`, `/collections/` → `/collectie/`,
`/search` → `/zoeken`, `/policies/` → `/beleid/`, enz.), met behoud
van query-parameters. Volledige keten e2e getest in de browser.
Gevolg: F6.1 is kritischer geworden — valt hij weg (thema-update),
dan landen catalogusadvertenties weer op de Horizon-store.

**Waarschuwing voor toekomst:** dit is een wijziging in de
Horizon-thema code, niet in de repo. Een **thema-update of een
fresh thema-installatie zal de wijziging overschrijven** — dan
opnieuw plaatsen. Mogelijk is dit op de wishlist te verplaatsen
naar een nettere oplossing (custom checkout-extension op Plus, of
DNS-herstructuring).

Alternatieven die zijn overwogen:

- **A. Status quo.** Geen werk, logo blijft naar Horizon linken.
- **C. Unpublish het Horizon-thema.** Schoner maar geeft een
  "Site under construction"-landing en heeft potentieel
  cascade-effecten op andere Shopify-functies.

---

## 10. Commits Fase 5

| Commit | Onderwerp |
|--------|-----------|
| `155c23a` | Cart-unbind bij logout en stale state (Optie B+C op cart-niveau) |
| `3948df7` | OIDC `id_token` bewaren voor geldige Shopify-logout — hoofdfix voor de privacy-bug |
| `029102e` | Fase 5 verslag (oorspronkelijk) |
| `9e75fd8` | Pad A: H5 onboarding-flow + H2 NAAM-card + M4 Uitlog spinner + H3+H4 force/referrer |
| `1b7eeb2` | Verslag uitgebreid met Pad A items + F6.1 status |
| `6823fa8` | F6.1 toegepast via Horizon `theme.liquid` redirect |
| `dde2333` | Switch-user verplaatst van LoginPrompt naar Dashboard (UX-fix uit live-walkthrough) |

---

## 11. Volgende stap

### Klein — kan nu of in een volgende sessie

- **/welkom volledige runtime-test** met een vers account.
  Technisch bevestigd (TS-build groen, alle imports/types kloppen,
  redirect-logica handmatig gevalideerd voor non-logged-in), maar
  mist een end-to-end visuele test met een echt nieuw e-mailadres.
- **M2** — cart leegmaken bij account-wissel. Geparkeerd; toevoegen
  als gebruikers laten weten dat ze in de war raken van cart-items
  die "van iemand anders" lijken.
- **Bewaak F6.1** bij toekomstige Horizon-thema-updates. De
  redirect-script in `layout/theme.liquid` zit in Shopify-admin,
  niet in deze repo. Een fresh theme-installatie overschrijft
  hem. Genoteerd in § 9 F6.1.

### Voor Fase 6 — UX-finetuning

- **Onboarding-tekst aanvullen** in `/welkom`: nu geen uitleg over
  waarom we deze gegevens vragen. Een korte zin over "we vragen
  alleen wat je nodig hebt om af te rekenen" zou helpen.
- **Cart-icoon "verwarrend leftover items"**: gerelateerd aan M2,
  optioneel een toast/banner "Je vorige winkelwagen is bewaard" bij
  eerste post-login pageload.
- **Logout-flow visuele continuity**: tussen klik op Uitloggen en
  landing op `/` is er nog een kort flikkering door de Shopify
  logout-redirect. Een eenvoudige tussen-pagina ipv direct 302 zou
  schoner zijn.

### Groot — Fase 7+

Zoals genoteerd in [04-fase-4-profile-edit.md § 9](./04-fase-4-profile-edit.md#9-volgende-stap-fase-5):

- **E-mail en telefoon wijzigen via Shopify Admin API wrapper**.
  Oorspronkelijk Fase 5 doel, doorgeschoven omdat de privacy-bug
  prioriteit kreeg. Vereist een Custom App in Shopify met
  `write_customers` scope, een Admin-token in Vercel env-var, en
  een server-route die strict de klant-ID matched aan de
  ingelogde shcat_-token. Schatting 3-4 uur.
- **Playwright e2e test-suite**. De auth-flow heeft nu zoveel
  paden (login, logout, switch-user, /welkom, silent OAuth bij
  referrer, cart-unbind, id_token-flow) dat handmatig testen bij
  elke wijziging zwaar wordt. Schatting 4-6 uur.
- **Optimistic updates in adresboek**. Verwijderen/toevoegen voelt
  nu traag (~500-1500 ms) door de `useCustomer().refresh()`-call.
- **Nieuwsbrief opt-in** via
  `customerEmailMarketingSubscribe` mutation, in onboarding én
  Profiel-tab.

### Architectuur-aandachtspunten

- **Theme-code in Shopify versus repo**: de F6.1-redirect leeft
  buiten de repo. Bij meer van zulke ingrepen in de toekomst is
  het de moeite waard om een "Shopify theme overlay" patroon te
  overwegen — bv. periodiek de Horizon-thema-code exporteren en in
  een aparte directory in de repo bewaren, zodat we wijzigingen
  reproduceerbaar in de hand hebben.
- **Customer Account API limieten**: e-mail/telefoon zijn de
  bekendste, maar er kunnen ook beperkingen zijn die we nog niet
  zijn tegengekomen (b.v. retour-aanvragen, kortingscodes, store
  credit). Bij scope-uitbreiding altijd eerst introspectie doen
  zoals in [04 § 5.1](./04-fase-4-profile-edit.md#51-schema-introspectie-eerst).
