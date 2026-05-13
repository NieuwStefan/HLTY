# Fase 1 — Shopify-foundation

**Datum:** 13 mei 2026
**Status:** ✅ Afgerond
**Doel:** De Shopify-kant van het project klaarmaken voor een naadloze
ervaring tussen de React-storefront en de Shopify-checkout: Headless-app,
Customer Account API OAuth-client, branding, betaalmethodes, e-mails, en
een eigen `checkout.hlty.shop` subdomein voor de checkout.

---

## 1. Doel & scope

Stefan's klacht aan het begin:
- Inloggen/registreren werkte slecht (popup-flow naar `inlog.hlty.shop`,
  vandaar kon klant terug naar oude Shopify-thema)
- Account-info zichtbaar in eigen UI ontbrak
- Shopify-checkout voelde los van de rest van de site

Doel van Fase 1: alles in Shopify, DNS en branding zo neerzetten dat
Fase 2 (de eigenlijke code-implementatie van OAuth + dashboard) zonder
verrassingen kan starten.

**Niet in scope (komt in Fase 2/3):**
- Code-wijzigingen voor OAuth flow met PKCE
- Eigen account-dashboard met klantnaam/orders
- Header die ingelogde klant herkent
- Cart koppelen aan klant

---

## 2. Initial state — wat we aantroffen

### Architectuur van het systeem

HLTY draait verspreid over drie verschillende plekken op drie domeinen:

| Domein | Wat het is | Beheerder |
|--------|------------|-----------|
| `www.hlty.shop` | Headless React-app (Vite/React 19) | Vercel, project `hlty-storefront` |
| `hlty.shop` (apex) | Hetzelfde, DNS gefixt door Stefan op 13 mei | Vercel |
| `inlog.hlty.shop` | Shopify's hosted "New Customer Accounts" | Shopify |
| `8crbbh-zu.myshopify.com` | Default Shopify URL | Shopify |

De React-app praat met Shopify via Storefront API (token in `.env`).
Auth gebruikte een **popup-flow** naar `inlog.hlty.shop` met polling op
window.closed — onbetrouwbaar, mobile-onvriendelijk, klant kon vanuit de
popup naar de oude Shopify-theme bladeren.

### Shopify-plan

- **Basic, €28/maand**
- Betalingen: Shopify Payments (1,9% + €0,25) + PayPal + Mollie
- Mollie heeft 2% transactiekosten bovenop omdat Shopify Payments aan staat
- Uitbetalingsrekening: REVOLUT BANK NETHERLANDS BRANCH ****7814

### Geïnstalleerde apps bij aanvang

- HLTY Storefront — custom private app, toonde "Example Domain" placeholder.
  Verstrekt het Storefront API token in `.env` (`VITE_STOREFRONT_TOKEN=55e04c4a...`)
- Flow — Shopify Flow automation
- HLTY HP Integration — onbekend
- Chance2Brand — $29/30 dgn
- Messaging — Shopify Inbox

Geen officiële **Shopify Headless** sales-channel app. Die hadden we nodig
om een eigen Customer Account API OAuth-client te kunnen maken met onze
eigen redirect-URIs.

### Checkout-instellingen 🚨

Twee conversie-killers die meteen mee genomen werden:
- **Adresregel 2 = Verplicht** (Shopify zelf waarschuwde al)
- **Telefoonnummer bezorgadres = Verplicht**

### Customer Accounts

- "New Customer Accounts" actief (passwordless OAuth/OIDC)
- Inlogmethoden: e-mail-code AAN, Google AAN, Shop UIT
- URL: `https://inlog.hlty.shop`
- OAuth-flow gebruikte intern `client_id=20512e62-beb4-4a42-8e4e-3d6b16fcf94f`
  (Shopify-interne client voor de hosted login-pagina, niet aanpasbaar)

### Branding-staat

Verrassend goed voorbereid door Stefan / vorige ontwikkelaar:
- Logo, kleuren, fonts in Checkout Editor al ingesteld
- Order-bevestiging e-mail al gebrand
- Customer Accounts deelt dezelfde branding-config

Geen ingrepen nodig — alleen geverifieerd.

---

## 3. Beslissingen

### B1 — Welke optie uit het oorspronkelijke plan
Stefan koos optie **B (hybride)**: behoud Shopify checkout, maar bouw
een eigen OAuth-flow met PKCE in Fase 2 en haal klantdata via Customer
Account GraphQL API. Geen volledig custom checkout (niet mogelijk op Basic-plan,
zou ToS-overtreding zijn).

### B2 — Primair webshop-domein
**Initieel:** Stefan koos voor `hlty.shop` (apex) blijven primair.
**Later gewijzigd naar:** `checkout.hlty.shop` primair, na ontdekking van
de Vercel/Shopify redirect-loop (zie § Problemen onderweg).

### B3 — Quick wins direct doorvoeren
Ja: adresregel 2 en telefoon op Optioneel.

### B4 — Vercel-proxy aanpak afgewezen
Eerste experiment was `vercel.json` rewrites om Shopify-paden door te
proxien. Dat veroorzaakte een redirect-loop. Aanpak teruggedraaid in
commit `a14605d`.

### B5 — checkout op eigen subdomein
`checkout.hlty.shop` toegevoegd aan Shopify, CNAME naar
`shops.myshopify.com` bij Strato, primary gemaakt in Shopify.
Werkt zonder proxy.

---

## 4. Wat is gedaan — stap voor stap

### 4.1 Quick wins (Shopify Admin → Settings → Checkout)

- ✅ Adresregel 2 (appartement, unit, enz.): Verplicht → **Optioneel**
- ✅ Telefoonnummer bezorgadres: Verplicht → **Optioneel**

### 4.2 Shopify Headless-app geïnstalleerd

- Vanuit Shopify App Store → "Headless" → Installeren
- Nieuw verkoopkanaal "Hlty Headless" aangemaakt (storefront ID `229706`)

### 4.3 Customer Account API OAuth-client geconfigureerd

In Hlty Headless → "API-toegang beheren" → Klantaccount-API → Beheren:

**Clienttype:** Openbaar (webapp) — PKCE wordt afgedwongen, perfect voor SPA.

**Client-ID:** `e95f30c7-5193-4188-84a9-7328be328ec4`

**App-eindpunten (vast door Shopify):**
- Autorisatie: `https://inlog.hlty.shop/authentication/oauth/authorize`
- Token: `https://inlog.hlty.shop/authentication/oauth/token`
- Uitlog: `https://inlog.hlty.shop/authentication/logout`

**App-installatie (door mij ingesteld):**
- Callback URIs:
  - `https://www.hlty.shop/auth/callback`
  - `https://hlty.shop/auth/callback`
- JavaScript-herkomst(en):
  - `https://www.hlty.shop`
  - `https://hlty.shop`
- Uitlog-URI's:
  - `https://www.hlty.shop/`
  - `https://hlty.shop/`

### 4.4 Branding geverifieerd (geen wijzigingen nodig)

Checkout Editor (Shopify Admin → Settings → Checkout → "Mijn winkel-configuratie"
→ Aanpassen → Instellingen-tab):

- Logo: HLTY logo, 200px breed, links uitgelijnd
- Accent kleur: `#0C1C2C` (navy)
- Knop kleur: `#6AD3E8` (HLTY mint)
- Kopteksten font: **Montserrat**
- Hoofdtekst font: **Maven Pro**
- Opmaak checkout: **Eén pagina**
- Auto-fill adres: AAN

Klantaccounts (Inloggen-pagina, Bestellingen, Profiel) gebruiken dezelfde
config — automatisch gebrand.

### 4.5 Mollie payment methodes geauditeerd

Actief:
- ✅ Visa
- ✅ Mastercard
- ✅ iDEAL | Wero (€0,32 flat fee — perfect voor NL)
- ✅ Bancontact

Niet actief (kan later, geen blokkering):
- American Express, Klarna, Apple Pay, Google Pay
- Klarna kan +20-30% conversie geven bij >€50 orders → overwegen voor later

### 4.6 Order-bevestiging e-mail templates geverifieerd

Shopify Admin → Settings → Meldingen → Klantmeldingen → "E-mailtemplates aanpassen"

- Logo: HLTY logo, 180px
- Accentkleur: mint groen
- Bevestiging template toont: "Bedankt voor je bestelling!", HLTY-stijl knoppen

Geen wijzigingen nodig — was al gebrand.

### 4.7 `checkout.hlty.shop` subdomein opgezet

**Bij Strato (Domeinbeheer → hlty.shop → DNS):**

| Type | Voorvoegsel | Waarde |
|------|-------------|--------|
| CNAME | `checkout` | `shops.myshopify.com.` |

DNS-propagatie: snel (binnen 5 min wereldwijd resolved).
SSL: binnen 5 min na DNS-resolutie automatisch door Shopify gegenereerd.

**In Shopify (Settings → Domains):**
- Domein toegevoegd: `checkout.hlty.shop`
- Type: van "Omleidend domein" → **"Primair domein"**

Resultaat: `cart.checkoutUrl` van de Storefront API wijst nu automatisch
naar `https://checkout.hlty.shop/cart/c/...` → Shopify renderet checkout
direct, geen Vercel ertussen, geen redirect-loop.

---

## 5. Problemen onderweg

### 5.1 De Vercel-proxy aanpak — afgewezen na 2 commits

**Wat we probeerden:**
`vercel.json` rewrites toevoegen om Shopify-paden door te proxien:
```json
{
  "rewrites": [
    { "source": "/cart/:path*", "destination": "https://8crbbh-zu.myshopify.com/cart/:path*" },
    { "source": "/checkouts/:path*", "destination": "https://8crbbh-zu.myshopify.com/checkouts/:path*" }
  ]
}
```

**Wat er gebeurde:**
Redirect-loop tussen Shopify en Vercel:
1. Browser → `www.hlty.shop/cart/c/...` (DNS → Vercel)
2. Vercel proxy → Shopify (host: `myshopify.com`)
3. Shopify: "primary is `hlty.shop`, dus 301 → `hlty.shop/cart/c/...`"
4. Browser → `hlty.shop/cart/c/...` (DNS → Vercel)
5. Vercel canonical 307 → `www.hlty.shop/cart/c/...`
6. **Loop**

**Root cause:**
Shopify redirect altijd naar het ingestelde primary domain, ook bij requests
binnenkomend op `8crbbh-zu.myshopify.com`. Met `hlty.shop` als primary en
Vercel die alle requests naar dat domein opvangt: onvermijdelijke loop.

**Pogingen om de loop te breken (alle gefaald):**
- Vercel `vercel.json` redirect www→apex toevoegen → Vercel-projectsetting
  overruled vercel.json → dubbele loop
- Vercel-dashboard: apex `hlty.shop` van "Redirect to www" naar "Production"
  zetten → loop persisted want Shopify blijft 301'en naar apex; Vercel
  proxy-rewrite stuurt het wel door naar Shopify, maar de browser ziet
  alleen 301 → 301 zonder vooruitgang

**Wat wel werkte (uiteindelijk):**
Niet proberen Vercel te laten proxien. Geef Shopify een eigen subdomein
(`checkout.hlty.shop`) dat **rechtstreeks** bij Shopify aankomt via DNS
CNAME. Geen Vercel in het pad.

**Commits gerelateerd aan deze pad-afsluiting:**
- `1d48387` — eerste poging Vercel proxy
- `20c92af` — Vercel canonical flip via vercel.json (overruled)
- `030c207` — revert canonical flip
- `a14605d` — vercel.json terug naar baseline (geen rewrites meer)

### 5.2 `www.hlty.shop` "Ongeldige DNS" in Shopify

Shopify markeert `www.hlty.shop` als "Ongeldige DNS" omdat de CNAME bij
Vercel staat (`49fdfa6683505dea.vercel-dns-016.com.`) ipv `shops.myshopify.com`.
Geen blokkering — het domein werkt prima voor de React-app. Wel een UI-kleurtje
in Shopify-admin dat je kunt negeren. Mocht het storen: verwijder `www.hlty.shop`
uit Shopify's connected domains.

---

## 6. Eindstaat

### Shopify Admin → Settings → Domains

| Domein | Type | Status |
|--------|------|--------|
| `checkout.hlty.shop` | **Primair** (Webshop) | Verbonden ✓ |
| `8crbbh-zu.myshopify.com` | Webshop alias | Verbonden ✓ |
| `hlty.shop` | Webshop alias | Verbonden ✓ |
| `www.hlty.shop` | Webshop alias | Ongeldige DNS (cosmetisch) |
| `inlog.hlty.shop` | Primair (Klantaccount) | Verbonden ✓ |

### DNS bij Strato (hlty.shop zone) — relevante records

| Type | Voorvoegsel | Waarde |
|------|-------------|--------|
| A | (apex) | `216.150.1.1` (deels Vercel via Vercel apex IP) |
| CNAME | `www` | `49fdfa6683505dea.vercel-dns-016.com.` (Vercel) |
| CNAME | `inlog` | `shops.myshopify.com.` (Shopify) |
| CNAME | `checkout` | `shops.myshopify.com.` (Shopify) ← **nieuw** |
| CNAME | `mailerpgr` | `28543f9ecc7b.p81.email.myshopify.com.` (Shopify mail) |
| CNAME | `pgr._domainkey` | `dkim1.28543f9ecc7b.p81.email.myshopify.com.` (DKIM) |
| CNAME | `pgr2._domainkey` | `dkim2.28543f9ecc7b.p81.email.myshopify.com.` (DKIM) |
| MX | (apex) | Google Workspace MX records |
| TXT | (apex) | SPF: `v=spf1 include:_spf.google.com ~all` |
| TXT | (apex) | Google Search Console verificatie |
| TXT | `_dmarc` | DMARC quarantine |
| TXT | `google._domainkey` | Google Workspace DKIM |

### Vercel-project `hlty-storefront` → Domains

| Domein | Configuratie |
|--------|--------------|
| `hlty.shop` | Connect to Production |
| `www.hlty.shop` | Connect to Production |
| `hlty-storefront.vercel.app` | Production (default Vercel-domein) |

⚠️ Geen apex↔www canonical-redirect ingesteld op Vercel. Beide domeinen
serveren de React-app direct. Voor SEO is dit niet optimaal — overweeg
later één canonical te kiezen.

### `vercel.json` (HLTY repo, branch `main`)

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

Terug naar baseline. Geen proxy-rewrites meer.

### Checkout-test (laatst gedraaid 13 mei)

✅ Product in cart → "Afrekenen" → land op
`https://checkout.hlty.shop/checkouts/cn/<token>/nl-nl` →
HLTY-gebrande checkout met:
- HLTY logo
- Snelle checkout: PayPal
- Contact (e-mail)
- Bezorging (NL, alleen achternaam verplicht, adresregel 2 optioneel, telefoon optioneel)
- Verzendwijze sectie
- Totaal incl. BTW

---

## 7. Belangrijke configuratie-waarden

Voor Fase 2-implementatie (code) heb je deze nodig:

### Customer Account API (OAuth)
- **Client-ID:** `e95f30c7-5193-4188-84a9-7328be328ec4`
- **Authorize endpoint:** `https://inlog.hlty.shop/authentication/oauth/authorize`
- **Token endpoint:** `https://inlog.hlty.shop/authentication/oauth/token`
- **Logout endpoint:** `https://inlog.hlty.shop/authentication/logout`
- **Scopes:** `openid email customer-account-api:full`
- **Response type:** `code` (Authorization Code flow met PKCE)

### Storefront API (al in gebruik)
- **Shop domain (env):** `8crbbh-zu.myshopify.com`
- **Token (env):** in [.env](/.env) als `VITE_STOREFRONT_TOKEN`
- **API versie:** `2024-01`

### Headless storefront
- **Shopify storefront ID:** `229706`
- **Naam:** "Hlty Headless"

### Domeinen
- **Primair webshop (Shopify):** `checkout.hlty.shop`
- **Primair klantaccount (Shopify):** `inlog.hlty.shop`
- **React-app:** `www.hlty.shop` en `hlty.shop`

---

## 8. Aandachtspunten / open punten

### Nu nog niet kritisch, kan later

1. **`www.hlty.shop` als Shopify-domein verwijderen** — staat op "Ongeldige DNS"
   omdat het bij Vercel hoort. Verwijderen maakt Shopify-admin cleaner.
2. **Vercel canonical kiezen** — apex ↔ www. SEO-best-practice. Geen haast.
3. **Oude "HLTY Storefront" custom app uitfaseren** — vervangen door de nieuwe
   "Hlty Headless" storefront API-token. Schoner.
4. **Mollie methodes uitbreiden** met Klarna (NL: "betaal achteraf" — +20-30%
   conversie bij grotere orders) en eventueel Apple/Google Pay.
5. **DMARC-record** in Strato bestaat al maar staat op `quarantine`; eventueel
   naar `reject` als alle authenticatie schoon is.
6. **Shopify Payments vs Mollie afweging** — als alle creditcards via Mollie
   gaan, kun je Shopify Payments uitschakelen en de 2% Mollie-toeslag
   verdwijnt.
7. **Logout flow tijdens Fase 2** — Shopify-logout-endpoint redirected naar
   logout-URI; daarna moet React-app cookies/state opschonen.

### Belangrijk voor Fase 2

- Bij OAuth-flow: PKCE is verplicht (client is openbaar)
- Token-exchange werkt niet direct vanuit browser (CORS) → kleine Vercel
  API-route nodig (`/api/auth/callback`)
- Refresh-token bewaren in HTTP-only cookie, niet in localStorage
- Bestaande `customerLogin`/`customerRegister` functies in
  [src/lib/shopify.ts](../src/lib/shopify.ts) (regels 935+) zijn dood —
  ze gebruiken de deprecated Storefront API customer-mutaties. Verwijderen
  in Fase 2.

---

## 9. Volgende stap: Fase 2

**Doel:** popup-flow vervangen door echte OAuth 2.0 + PKCE flow, klantdata
in eigen UI tonen, header met klantnaam, cart koppelen aan klant.

**Te bouwen in code:**
1. Vercel serverless functions:
   - `api/auth/callback.ts` — token-exchange na OAuth-redirect
   - `api/auth/refresh.ts` — refresh-token gebruiken
   - `api/auth/logout.ts` — Shopify logout + cookies wissen
   - `api/customer/me.ts` — proxy naar Customer Account GraphQL
   - `api/customer/orders.ts` — order-data ophalen
2. React-aanpassingen:
   - `src/context/CustomerContext.tsx` — popup-flow vervangen door redirect-flow
   - `src/pages/Account.tsx` — echt dashboard met tabs (Overzicht, Bestellingen, Profiel, Adressen)
   - `src/components/Header.tsx` — toon "Hoi {voornaam}" als ingelogd
   - `src/context/CartContext.tsx` — `cart.buyerIdentity.customerAccessToken` koppelen
   - `src/App.tsx` — `/auth/callback` route toevoegen
3. Dead code verwijderen:
   - `customerLogin`, `customerRegister`, `customerRecover`, `getCustomer`
     in [src/lib/shopify.ts](../src/lib/shopify.ts) (regels 935+)

Geschatte tijd: ~1 dag code + ½ dag testen.
