# Fase 2 — OAuth login + eigen account-dashboard

**Datum:** 13 mei 2026
**Status:** ✅ Afgerond
**Doel:** Popup-flow vervangen door een volledige OAuth 2.0 + PKCE redirect-flow
op de Shopify Customer Account API. Klantdata in eigen UI (dashboard met
naam, e-mail, adres, bestellingen). Tokens server-side beheerd in
HTTP-only cookies.

---

## 1. Doel & scope

Wat Stefan in [01-fase-1-foundation.md § 1](./01-fase-1-foundation.md) als
klacht inbracht moest nu in code opgelost worden:

- Popup naar `inlog.hlty.shop` met onbetrouwbare "popup gesloten = ingelogd"
  detectie weghalen
- Eigen `/account` dashboard met echte klantdata
- Header die ingelogde klant herkent ("Hoi {voornaam}")

**Niet in scope (komt in Fase 3):**
- Cart-binding via customer access token (vereist Storefront API-upgrade)
- Bedankt-pagina na checkout op `www.hlty.shop/bedankt`
- Eventueel: bestelling-detail-modal met tracking, retour, herhalen

---

## 2. Initial state

Fase 1 had de Shopify-kant volledig opgezet:
- Headless-app "Hlty Headless" geïnstalleerd
- Customer Account API OAuth-client: `e95f30c7-5193-4188-84a9-7328be328ec4`
- Callback URIs geconfigureerd: `https://www.hlty.shop/auth/callback` + apex
- Endpoints op `inlog.hlty.shop/authentication/oauth/{authorize,token,logout}`

In de codebase:
- [src/context/CustomerContext.tsx](../src/context/CustomerContext.tsx)
  gebruikte popup + `window.closed` polling
- [src/lib/shopify.ts:935+](../src/lib/shopify.ts) had dode
  `customerLogin`/`customerRegister`/`getCustomer`/`customerRecover`
  functies via de deprecated Storefront-API customer-mutaties
- [src/pages/Account.tsx](../src/pages/Account.tsx) toonde alleen een
  knop om de popup te openen
- Geen API-routes in [api/](../api) behalve `api/openai.ts`

---

## 3. Architectuur

```
Browser                  Vercel (API routes)         Shopify
─────────────────────────────────────────────────────────────
1. klik "Inloggen"
                         GET /api/auth/start
                         (PKCE gen, cookies, 302) →
                                                   inlog.hlty.shop
                                                   /authentication
                                                   /oauth/authorize
2. user logs in (mail/Google)
                                                   ← 302 met code
                         /auth/callback?code+state →
                         (React SPA, AuthCallback)

3. AuthCallback POSTs    /api/auth/exchange
                         - state-check (CSRF)
                         - exchange code for atkn_  →
                                                    inlog.../oauth/token
                                                    (code grant)
                                                    ← atkn_ + refresh
                         - exchange atkn_ for shcat_→
                                                    inlog.../oauth/token
                                                    (token-exchange grant,
                                                     audience=30243aa5-...)
                                                    ← shcat_ + refresh
                         - set HTTP-only cookies
                         - return { returnTo }
4. Browser navigeert naar /account

5. CustomerContext fetcht /api/customer/me
                         - read shcat_ cookie
                         - POST GraphQL          →
                                                    inlog.../customer/api
                                                    /2026-04/graphql
                                                    Authorization: shcat_xxx
                                                    ← customer { ... }
                         - return JSON

6. Dashboard rendert
```

### Cookies

| Naam | HTTP-only | Levensduur | Inhoud |
|------|-----------|------------|--------|
| `hlty_pkce_verifier` | ✓ | 10 min | PKCE code_verifier voor één OAuth-trip |
| `hlty_pkce_state` | ✓ | 10 min | CSRF-state `<random>.<base64(returnTo)>` |
| `hlty_access` | ✓ | `expires_in` (~24h) | `shcat_`-prefixed access token |
| `hlty_refresh` | ✓ | 7 dagen | refresh token |
| `hlty_session` | **nee** | 7 dagen | `base64({firstName, expiresAt})` — leesbaar door React |

---

## 4. Wat is gedaan

### 4.1 Nieuwe bestanden

| Bestand | Doel |
|---------|------|
| [api/_auth-helpers.ts](../api/_auth-helpers.ts) | Server-side PKCE, cookie helpers, token-endpoint client, Shopify constants (self-contained — niet via src/ import) |
| [api/auth/start.ts](../api/auth/start.ts) | GET — PKCE genereren, cookies zetten, 302 naar Shopify |
| [api/auth/exchange.ts](../api/auth/exchange.ts) | POST — code-for-token + token-exchange voor `shcat_` |
| [api/auth/refresh.ts](../api/auth/refresh.ts) | POST — refresh token gebruiken |
| [api/auth/logout.ts](../api/auth/logout.ts) | GET — cookies wissen + Shopify logout |
| [api/customer/me.ts](../api/customer/me.ts) | GET — proxy naar Customer Account GraphQL voor profiel |
| [api/customer/orders.ts](../api/customer/orders.ts) | GET — idem voor orders (max 50, default 10) |
| [src/lib/customer-auth-shared.ts](../src/lib/customer-auth-shared.ts) | React-side constants (cookie-namen, session shape) |
| [src/pages/AuthCallback.tsx](../src/pages/AuthCallback.tsx) | Vangt Shopify-redirect op, POST naar /api/auth/exchange |

### 4.2 Aangepaste bestanden

| Bestand | Wijziging |
|---------|-----------|
| [src/context/CustomerContext.tsx](../src/context/CustomerContext.tsx) | Complete rewrite — popup-flow weg, OAuth-redirect via `window.location.href = /api/auth/start?return_to=...`. Session-cookie lezen voor instant `isLoggedIn`. `hasAttemptedFetch`-flag tegen retry-loops |
| [src/pages/Account.tsx](../src/pages/Account.tsx) | Volledig nieuw dashboard met tabs Overzicht / Bestellingen / Profiel. Echte data uit `useCustomer()`. Order-cards met items + prijs + status |
| [src/components/Header.tsx](../src/components/Header.tsx) | "Hoi {voornaam}" naast user-icoon wanneer ingelogd (uit session cookie) |
| [src/App.tsx](../src/App.tsx) | Route `/auth/callback` toegevoegd |
| [src/lib/shopify.ts](../src/lib/shopify.ts) | Regels 935–1089 verwijderd (dode customerLogin/Register/Recover) |

### 4.3 GraphQL queries

**Profiel** (`/api/customer/me`):
```graphql
query Me {
  customer {
    id
    firstName
    lastName
    displayName
    emailAddress { emailAddress }
    phoneNumber { phoneNumber }
    defaultAddress {
      address1
      address2
      city
      zip
      country
      formatted
    }
  }
}
```

**Orders** (`/api/customer/orders?first=20`):
```graphql
query Orders($first: Int!) {
  customer {
    orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
      edges {
        node {
          id
          number
          name
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice { amount currencyCode }
          lineItems(first: 5) {
            edges {
              node {
                title
                quantity
                image { url altText }
                variantTitle
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 5. Problemen onderweg — vier deploy-iteraties tot end-to-end werkend

Vier verschillende blokkers, elk een eigen commit:

### 5.1 Vercel kon `src/lib/customer-auth-shared` niet bundelen
- **Symptoom:** `FUNCTION_INVOCATION_FAILED` op alle `/api/auth/*` routes (commit `17555d9`)
- **Root cause:** Vercel's serverless bundler heeft moeite met imports
  vanuit `api/` naar bestanden buiten die directory
- **Fix (commit `63aa415`):** Constants gedupliceerd naar [api/_auth-helpers.ts](../api/_auth-helpers.ts).
  10 regels duplicatie — niet schoon maar pragmatisch
- **Les:** Vercel functions zijn het schoonst als ze self-contained zijn
  binnen `api/`. Onderscheid `_`-prefix files of subdirs als helper-only

### 5.2 ESM `ERR_MODULE_NOT_FOUND`
- **Symptoom:** `Cannot find module '/var/task/api/_auth-helpers'` in logs (commit `63aa415`)
- **Root cause:** `package.json` heeft `"type": "module"`. Onder strict ESM moet
  elke import-path eindigen op `.js` (ook in `.ts`-bestanden, dat is de
  TypeScript NodeNext-conventie)
- **Fix (commit `0566f0d`):** `from '../_auth-helpers'` → `from '../_auth-helpers.js'`
  in alle 6 routes via `sed`
- **Les:** Bij `"type": "module"` + Vercel functions altijd `.js` schrijven
  in imports, ook al is de bron `.ts`

### 5.3 Customer Account API gaf 401 "Invalid token, missing prefix shcat_"
- **Symptoom:** Token-exchange werkte, maar GraphQL call gaf 401 (commit `821978e`)
- **Root cause:** Shopify retourneert vanuit het OAuth code-grant een
  `atkn_`-prefixed token (voor authentication). De Customer Account
  GraphQL API verwacht een `shcat_`-prefixed token (voor authorization).
  Daartussen zit een **tweede token-exchange step**
- **Fix (commit `806cfe8`):** Na de eerste code-for-token uitwisseling
  doen we direct een tweede call met:
  ```
  grant_type=urn:ietf:params:oauth:grant-type:token-exchange
  audience=30243aa5-17c1-465a-8493-944bcc4e88aa  (Shopify Customer GraphQL audience)
  subject_token=<atkn_…>
  subject_token_type=urn:ietf:params:oauth:token-type:access_token
  scopes=https://api.customers.com/auth/customer.graphql
  ```
  Resultaat: een fresh `shcat_`-token in dezelfde response. Header naar
  GraphQL is dan **`Authorization: <shcat_token>`** zonder `Bearer ` prefix
- **Les:** Customer Account API heeft een eigen tokenformat dat verschilt
  van standaard OAuth. Reference: [markusvoigt/customer_account_api](https://github.com/markusvoigt/customer_account_api)
- **Niet gevonden in:** de officiële Shopify docs op
  shopify.dev — die laten de token-exchange step vaag

### 5.4 GraphQL query gebruikte Admin API field name
- **Symptoom:** `Field 'countryCodeV2' doesn't exist on type 'CustomerAddress'` (commit `806cfe8`)
- **Root cause:** Ik nam veldnamen over uit de Storefront API / Admin API
  `CustomerAddress` zonder te checken of ze ook in de Customer Account
  API bestaan. Veldnamen verschillen subtiel tussen de drie API's
- **Fix (commit `21c5565`):** `countryCodeV2` → `formatted` (string array
  met netjes geformatteerde adresregels, geschikt voor display)
- **Les:** Customer Account API ≠ Storefront API ≠ Admin API. Bij twijfel:
  introspection via `__schema { types { name fields { name } } }` of
  discovery via `/.well-known/customer-account-api`

### 5.5 (kleine) Retry-loop bij /api/customer/me failures
- **Symptoom:** Browser deed dozen requests per seconde naar /api/customer/me
- **Root cause:** Mijn `useEffect` in CustomerContext refetchte zodra
  `customer === null && !isLoading`. Bij elke gefaalde fetch werd dat
  weer waar
- **Fix (commit `821978e`):** Expliciete `hasAttemptedFetch` state. Eén
  poging, daarna error tonen tot user reload of logout. Reset bij logout
- **Les:** useEffect deps op een fail-failure-state veroorzaakt loops

---

## 6. Eindstaat — wat werkt nu

Visueel bevestigd via end-to-end test op productie (live `www.hlty.shop`):

| Stap | Status |
|------|--------|
| Klik "Inloggen / Registreren" → 302 naar Shopify met PKCE-challenge | ✅ |
| Shopify-login (e-mailcode of Google) | ✅ |
| Redirect terug naar `/auth/callback?code+state` | ✅ |
| AuthCallback POSTs naar `/api/auth/exchange` | ✅ |
| Token-exchange `atkn_` → `shcat_` | ✅ |
| HTTP-only cookies gezet, redirect naar `/account` | ✅ |
| Dashboard rendert "Welkom terug, TEST" | ✅ |
| Naam, e-mail, telefoon, bezorgadres uit Customer Account API | ✅ |
| Bestellingen-tab toont orders met items + prijs + status | ✅ |
| Profiel-tab linkt naar `inlog.hlty.shop/profile` voor wijzigingen | ✅ |
| Uitlog-knop wist cookies + redirect naar Shopify logout | ✅ |

### Commits in deze fase

| Commit | Onderwerp |
|--------|-----------|
| `17555d9` | Fase 2: OAuth login + eigen account-dashboard via Customer Account API |
| `63aa415` | Fix Vercel serverless: inline constants in api/_auth-helpers |
| `0566f0d` | Fix ESM module resolution in api/ routes (.js extensions) |
| `821978e` | Fix /api/customer/me: Bearer prefix + break retry loop on error |
| `806cfe8` | Add token-exchange step for Customer Account API shcat_ tokens |
| `21c5565` | Fix Customer Account API GraphQL query: replace countryCodeV2 with formatted |
| (volgende) | Cleanup diagnostic logs + dit verslag |

---

## 7. Belangrijke configuratie-waarden — bijwerkingen voor productie

### Niet-secrets (in code OK)
- **Client ID:** `e95f30c7-5193-4188-84a9-7328be328ec4`
- **Authorize endpoint:** `https://inlog.hlty.shop/authentication/oauth/authorize`
- **Token endpoint:** `https://inlog.hlty.shop/authentication/oauth/token`
- **Logout endpoint:** `https://inlog.hlty.shop/authentication/logout`
- **GraphQL endpoint:** `https://inlog.hlty.shop/customer/api/2026-04/graphql`
- **Token-exchange audience:** `30243aa5-17c1-465a-8493-944bcc4e88aa`
  (Shopify's hardcoded audience voor Customer GraphQL, identiek voor
  elke shop)
- **Token-exchange scope:** `https://api.customers.com/auth/customer.graphql`

### Cookie config
- `Secure`, `SameSite=Lax`, geen `Domain` attribute (scoped op host =
  `www.hlty.shop`)
- HTTP-only voor alles behalve `hlty_session` (die moet React lezen)

### Vercel env vars
Geen extra nodig! Alle constants staan in code (geen secrets sinds we
een **public client** gebruiken met PKCE — geen `client_secret`).

---

## 8. Aandachtspunten / open punten

### Klein
1. **Diagnostic console.logs** uit `/api/auth/exchange` zijn verwijderd in
   de cleanup-commit. Behouden op `/api/customer/me` en `/api/customer/orders`
   voor toekomstig debuggen — die loggen alleen bij failures
2. **Order-items zonder image** verschijnen als grijs blok in dashboard.
   Onbekend of dit komt door Shopify (geen variant image) of door query.
   Niet blokkerend
3. **Header voornaam** kan in zeldzame race-condition leeg zijn als
   session-cookie pas na page-render binnenkomt. Refresh fixt het. Voor
   nu acceptabel
4. **Profiel-tab** linkt naar `inlog.hlty.shop/profile` (extern). Geen
   eigen profile-edit UI in Fase 2 — vereist `customerUpdate` mutation
   en form-handling. Op te lossen in Fase 3 of later

### Groot — voor Fase 3
1. **Cart-binding aan klant**: cart koppelen via
   `cart.buyerIdentity.customerAccessToken` zodat checkout adres/email
   voorvult voor ingelogde klanten. Vereist:
   - Upgrade Storefront API-versie van `2024-01` → `2024-07+` in `.env`
   - In [CartContext.tsx](../src/context/CartContext.tsx) bij login: cart
     bijwerken met `cartBuyerIdentityUpdate` + access token
   - Bij logout: cart-token onthechten (of nieuwe cart)
   - Check of de `shcat_` token compatibel is met de Storefront API's
     `buyerIdentity` input
2. **Bedankt-pagina redirect** na checkout naar `www.hlty.shop/order-confirmed?order=...`
   — vereist Shopify checkout-config (post-purchase redirect URL,
   Plus-feature op sommige plannen, anders eigen verwerking)
3. **Logout van Shopify-sessie** is nu correct (logout-endpoint), maar
   in deze test bleef de Shopify-sessie ergens nog actief waardoor
   Stefan direct doorrolde zonder e-mailcode. Acceptabel maar het oog
   houden

### Architectuur-aandachtspunten voor toekomst
- **Refresh-token gebruik**: nu alleen in `/api/customer/me` bij 401.
  De `/api/auth/refresh` route is gebouwd maar wordt nog niet aangeroepen
  vanuit React. Pas in als we proactief vernieuwen voor scheduled tasks
- **Multiple-tab login state**: bij login in tab A, blijft tab B ongelogd
  tot focus-event of refresh. Zou opgelost kunnen worden met
  BroadcastChannel of `storage` event

---

## 9. Volgende stap: Fase 3

**Werktitel:** Checkout finishing + cart-binding

**Scope:**
1. Cart koppelen aan ingelogde klant (`buyerIdentity.customerAccessToken`)
2. Storefront API-versie upgraden naar `2024-07+`
3. Eigen bedankt-pagina op `www.hlty.shop/order-confirmed`
4. Optioneel: profile-edit UI met `customerUpdate` mutation
5. Optioneel: order-detail-modal met tracking-link en re-order knop

**Voordat we beginnen** — vragen voor Stefan:
- Wil je de bedankt-pagina echt herhuisvesten op `www.hlty.shop` of mag
  Shopify's standaard order-status-page blijven (al gebrand)?
- Profile-edit prioriteit: hoog (eigen UI) of laag (link naar Shopify)?
- Akkoord met Storefront API-upgrade naar 2024-07 (kleine kans op
  breaking changes in cart/product queries)?
