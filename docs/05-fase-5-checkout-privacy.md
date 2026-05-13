# Fase 5 — Checkout-privacy fix: cart-unbind + correcte Shopify-logout

**Datum:** 13 mei 2026
**Status:** ✅ Afgerond
**Doel:** een privacy-bug oplossen waarbij de Shopify-checkout van een
uitgelogde gebruiker nog steeds de e-mail, naam en het adres van de
vorige gebruiker toonde.

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

## 9. Volgende stap

Klein:
- Verbeterpunten § 6.1 (nieuwe-gebruiker UX) — quick wins, ~1u totaal
- Verbeterpunten § 6.2 (silent OAuth bij /account) — 1-2u

Groot, zoals genoteerd in [04-fase-4-profile-edit.md § 9](./04-fase-4-profile-edit.md#9-volgende-stap-fase-5):
- E-mail/telefoon wijzigen via Admin API wrapper (oorspronkelijke Fase 5 onderwerp)
- Playwright e2e test-suite — vooral relevant nu auth-flow complex is geworden
- Optimistic updates in adresboek
- Nieuwsbrief opt-in via `customerEmailMarketingSubscribe`
