# Fase 3 — Checkout finishing + order-detail

**Datum:** 13 mei 2026
**Status:** ✅ Afgerond
**Doel:** De checkout-ervaring naadloos maken voor ingelogde klanten
(pre-fill van adres + e-mail), het account-dashboard verdiepen met een
klikbare order-detail-modal inclusief tracking en re-order, en kleine
quality-of-life fixes (header-voornaam).

---

## 1. Doel & scope

Na Fase 2 had de klant een werkend dashboard met klantgegevens en
bestellingen, maar:
- bij **checkout** moest hij alles opnieuw invullen ondanks ingelogd zijn
- de **bestellingen-lijst** was statisch, geen detail-view, geen re-order
- **header** toonde soms geen voornaam (race-condition tussen cookie
  en customer-state)

Fase 3 lost dit op binnen de beperkingen van Shopify Basic.

**Niet in scope:**
- Eigen bedankt-pagina op `www.hlty.shop` (Shopify's order-status-page
  is al gebrand op `checkout.hlty.shop`)
- Profile-edit UI in dashboard (link naar `inlog.hlty.shop/profile`
  blijft, want adres-validatie + privacy is daar al goed)
- Storefront API-upgrade naar 2024-07 (oorspronkelijk gepland voor
  cart-binding, maar zie § 2.1)

---

## 2. Beslissingen onderweg

### 2.1 Cart-binding via Storefront API: **afgeblazen**

Het oorspronkelijke Fase 3-plan was: koppel cart aan klant via
`cart.buyerIdentity.customerAccessToken` zodat de checkout adres+email
automatisch overneemt.

**Probleem:** de Customer Account API `shcat_`-tokens worden **niet**
geaccepteerd door de Storefront API's `cart.buyerIdentity.customerAccessToken`
field. Shopify retourneert `"Customer is invalid"`. Dit is een open
issue: [Shopify/hydrogen#2495](https://github.com/Shopify/hydrogen/issues/2495).
Shopify werkt aan een fix maar die is er nog niet.

**Workaround:** in plaats van de cart binden, append ik de customer-data
**als query-params aan de Shopify checkout-URL** bij klik op "Afrekenen".
Shopify herkent `?checkout[email]=...&checkout[shipping_address][first_name]=...`
parameters en pre-filt de bijbehorende velden in de checkout.

Resultaat: zelfde UX-effect, zonder dat we op de Shopify-fix hoeven te
wachten. Geen Storefront API-upgrade nodig.

### 2.2 Order-detail in modal i.p.v. eigen pagina

Modal i.p.v. eigen URL (`/account/orders/:id`) omdat:
- Eén round-trip naar het dashboard, geen second-fetch nodig (alle
  data zit al in de orders-array)
- Snellere UX, geen navigatie
- Werkt natuurlijker met de tabs-structuur

### 2.3 Re-order: best-effort, geen foutmelding bij stockless

Bij re-order proberen we elke line-item één voor één toe te voegen aan
de cart via Storefront API. Als een variant niet meer beschikbaar is
(niet meer in storefront, uit assortiment), valt die af stilletjes —
we tonen alleen het aantal items dat is gelukt. Klant kan dan alsnog
verder met wat over is.

---

## 3. Wat is gedaan

### 3.1 Pre-filled checkout URL — [src/components/CartDrawer.tsx](../src/components/CartDrawer.tsx)

Nieuwe helper `buildPrefilledCheckoutUrl` voegt deze query-params toe
aan `cart.checkoutUrl` als de klant is ingelogd:

```
checkout[email]
checkout[shipping_address][first_name]
checkout[shipping_address][last_name]
checkout[shipping_address][phone]
checkout[shipping_address][address1]
checkout[shipping_address][address2]
checkout[shipping_address][city]
checkout[shipping_address][zip]
checkout[shipping_address][country]
```

Gebruikt `useCustomer().customer` voor de data. Niet-ingelogde
klanten krijgen de unchanged URL.

### 3.2 Header voornaam — [src/components/Header.tsx](../src/components/Header.tsx)

`session.firstName` (cookie) is een snelle render-hint maar kan leeg
zijn als de id_token geen `given_name` claim had. Toegevoegd: fallback
op `customer.firstName` (vanuit `/api/customer/me` response). Resultaat:
"Hoi {voornaam}" verschijnt zodra een van beide bronnen iets oplevert.

### 3.3 Order-detail-modal — [src/pages/Account.tsx](../src/pages/Account.tsx)

`OrderCard` is nu een `<button>` die `OrderDetailModal` opent. De modal
toont:
- Order header (nummer, datum)
- Status + totaalbedrag
- **Tracking-sectie** (alleen als fulfillment tracking-info heeft) — toont
  vervoerder + nummer + klikbare link per fulfillment
- **Bezorgadres** (uit `order.shippingAddress.formatted[]`)
- **Producten** — alle line items met image, titel, variant, aantal
- **"Opnieuw bestellen" knop**

Modal sluit op klik op X, op de backdrop, of automatisch 1,2s na een
succesvolle re-order (waarna cart-drawer opent).

### 3.4 Re-order — in [Account.tsx](../src/pages/Account.tsx)

`onReorder` callback in OrderDetailModal:
1. Filtert items zonder `variantId` (defensief)
2. Voor elk item: `addItem(variantId, quantity)` via `useCart()`
3. Tracking van geslaagd/gefaald
4. Statusmelding ("Alles toegevoegd" / "X items toegevoegd, Y niet meer
   beschikbaar" / "Geen items op voorraad")
5. Bij succes: modal sluiten + cart-drawer openen

### 3.5 Orders GraphQL query uitgebreid — [api/customer/orders.ts](../api/customer/orders.ts)

Velden toegevoegd:
- `lineItems.edges.node.variantId` (voor re-order)
- `shippingAddress { formatted city zip country }`
- `fulfillments.edges.node.{ status, trackingInformation { number url company } }`

`first` op line items van 5 → 25 (voor complete order-detail-modal).

---

## 4. Problemen onderweg

### 4.1 Onverwacht: shcat_ token ≠ Storefront API customer access token

Bij het plannen van cart-binding ging ik ervan uit dat de Customer
Account API token compatibel zou zijn met Storefront API's customer
field. Niet zo: zie § 2.1. Workaround toegepast, code aangepast.

### 4.2 Variants uit oude orders niet meer in Storefront API zichtbaar

Test-order #1001 bevatte Lucovitaal-producten met variantIds
`gid://shopify/ProductVariant/56358...`. Een directe Storefront API
node-query met die ID retourneerde `node: null` — die producten zijn
niet meer gepubliceerd op de storefront (mogelijk uit assortiment).

**Implicatie:** "Opnieuw bestellen" werkt voor recente orders met
nog-beschikbare items, maar niet voor oude orders. De UI handelt dit
graceful af met een melding. Geen code-fix nodig.

### 4.3 E-mail pre-fill niet zichtbaar in nieuwe checkout

Bij e2e test: alle adresvelden ✓ pre-filled, maar e-mail-veld bleef
leeg. Vermoeden: de nieuwe Shopify checkout (`cn/`-format) accepteert
`checkout[email]` niet meer; de oude (`cart/c/`-format) wel.

**Impact:** klein — klanten typen e-mail makkelijk zelf, de grote
winst (adres overslaan) blijft. Op te volgen als bug-ticket of door
later een additionele param-naam toe te voegen (`checkout[buyer_identity][email]`
of `checkout[contact_information][email_address]`).

---

## 5. Eindstaat — visueel bevestigd op productie

| Stap | Status |
|------|--------|
| Inloggen → header toont "Hoi {voornaam}" | ✅ |
| `/account` → Overzicht-tab toont naam, e-mail, telefoon, bezorgadres | ✅ |
| `/account` → Bestellingen-tab toont order-cards | ✅ |
| Klik op order-card → modal opent met details | ✅ |
| Modal toont: status, bezorgadres, line items met images | ✅ |
| "Opnieuw bestellen" knop voor items uit storefront werkt (test geprobeerd op out-of-stock items: graceful melding) | ✅ |
| Cart-drawer → "Afrekenen" → checkout met adresvelden vooringevuld | ✅ |
| E-mail-veld in nieuwe checkout: leeg (zie § 4.3) | ⚠️ |

### Commits in deze fase

| Commit | Onderwerp |
|--------|-----------|
| `116a87d` | Fase 3: checkout pre-fill + order-detail-modal + re-order |
| (volgende) | docs/03 + eventueel e-mail-param fix |

---

## 6. Aandachtspunten / open punten

### Klein
1. **E-mail pre-fill in nieuwe checkout** (zie § 4.3). Werkt alleen op
   legacy checkout. Niet blokkerend
2. **Order-detail "Verzending"-sectie** verschijnt alleen als
   `trackingInformation` niet leeg is. Op test-order #1001 (nog niet
   fulfilled) ontbreekt die sectie correct
3. **Modal a11y**: huidige modal heeft geen focus-trap en geen
   `Esc`-key close. Voor minimum-viable OK, voor productie-grade kunnen
   we radix-ui of headless-ui toevoegen
4. **Header "Hoi {naam}" op smalle schermen**: nu `hidden sm:flex` —
   onder 640px alleen het icoon. Eventueel mobiel-versie maken (in
   hamburger-menu?)

### Voor toekomstige fasen
1. **Storefront API-upgrade naar 2024-07+** wanneer Shopify cart-binding
   met Customer Account API tokens ondersteunt
2. **Profile-edit UI** in eigen dashboard met `customerUpdate` mutation
   van Customer Account API. Daarvoor moeten we adres-validatie zelf
   doen (Shopify Customer Account UI heeft dat al) of een library
   gebruiken
3. **Re-order fallback** via product-titel-zoeken voor items waarvan
   de variantId niet meer bestaat. Fragile maar voor "best effort"
   bruikbaar
4. **Order-status real-time updates** via Customer Account API webhooks
   of polling (nu: refresh-page nodig)
5. **Wishlist / Favorieten**: nice-to-have feature voor ingelogde klanten,
   typisch via Shopify metafields

---

## 7. Architectuur na drie fasen — samenvatting

```
Browser (www.hlty.shop)
  │
  ├── React (Vite, Tailwind, Framer Motion)
  │   ├── CustomerContext  ── session cookie + API-fetch
  │   ├── CartContext      ── localStorage cart-id + Storefront API
  │   ├── /account         ── Dashboard met tabs + Order-detail-modal
  │   ├── /auth/callback   ── OAuth-callback handler
  │   └── CartDrawer       ── Afrekenen met pre-fill params
  │
  └── Vercel API routes (api/)
      ├── auth/start       ── PKCE init + 302 naar Shopify
      ├── auth/exchange    ── code→atkn_→shcat_ (token-exchange)
      ├── auth/refresh     ── refresh token
      ├── auth/logout      ── cookies wissen + Shopify logout
      ├── customer/me      ── proxy naar Customer Account GraphQL
      ├── customer/orders  ── idem voor orders
      └── openai           ── (bestaande AIAdvisor proxy)

Shopify
  ├── Storefront API (8crbbh-zu.myshopify.com/api/2024-01/graphql.json)
  │     ── products, collections, cart
  │
  ├── Customer Account API (inlog.hlty.shop/customer/api/2026-04/graphql)
  │     ── customer profile, orders, addresses
  │
  └── Checkout (checkout.hlty.shop — primary domain)
        ── pre-filled via URL-params
        ── Mollie payment (iDEAL, etc.)
```

---

## 8. Volgende stap

Fase 1-3 leveren de **kern-storefront** op die Stefan aan het begin in
gedachten had:

- ✅ Klant kan registreren, inloggen, uitloggen (modern, passwordless)
- ✅ Klant ziet eigen profiel, bestellingen, kan re-orderen
- ✅ Checkout voelt naadloos met pre-fill
- ✅ Branding consistent over storefront, customer accounts, checkout, e-mail
- ✅ Mollie als payment provider
- ✅ Geen redirect-loops, geen popups, geen verbroken flows

**Nu kan de focus terug naar product/marketing:**
- Promoties, kortingscodes, gift cards
- Reviews / sterren-rating
- Wishlist / favorieten
- SEO / sitemap / structured data
- Performance optimization (Lighthouse audit)
- Klant-segmentatie via tags (newsletter, B2B, etc.)

Of: nu de Vercel-deploys stabiel zijn, kan een **end-to-end test-suite**
worden opgezet (Playwright) zodat regressies in toekomstige wijzigingen
direct zichtbaar zijn.
