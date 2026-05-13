# Fase 4 — Eigen profile-edit UI in dashboard

**Datum:** te starten
**Status:** 🔜 te doen
**Doel:** De Profiel-tab in `/account` van link-naar-Shopify ombouwen naar
een volledig **eigen UI** waarmee de klant naam, telefoon en adressen
beheert zonder de site te verlaten. Dit is **"Optie A"** zoals besproken
in de overgang vanuit Fase 3.

---

## 1. Doel & scope (= Optie A)

Wat de klant nu ziet onder de Profiel-tab:

> Wijzigingen aan je profiel kun je doorvoeren via je Shopify klantaccount.
> [ Profiel bewerken bij Shopify ]

Dat moet vervangen worden door een volwaardig profielbeheer-blok binnen
het dashboard zelf:

1. **Persoonsgegevens**
   - Voornaam, achternaam — bewerkbaar
   - E-mailadres — bewerkbaar (Shopify verstuurt een verificatie-mail)
   - Telefoonnummer — bewerkbaar (E.164 format)
2. **Adresboek**
   - Lijst van alle adressen (uit `customer.addresses`)
   - Per adres: Bewerken / Verwijderen / "Maak standaard"
   - Knop "Adres toevoegen"
   - Formulier met land/straatnaam/huisnummer/postcode/stad/telefoon

**Niet in scope (kan later):**
- Wachtwoord/2FA-instellingen (Shopify regelt de auth zelf, dat doen wij niet)
- Voorkeuren / nieuwsbrief-checkbox (apart blokje, voor later)
- Privacy / account-verwijderen knop (GDPR — apart, voor later)

---

## 2. Initial state

Dit is klaar uit Fase 1–3:
- Customer Account API OAuth-flow werkt (alle tokens in HTTP-only cookies)
- `/api/customer/me` geeft profiel terug
- `/api/customer/orders` geeft orders terug
- `useCustomer()` context laadt klantdata
- Dashboard met tabs Overzicht / Bestellingen / Profiel
- Branding (Montserrat / Maven Pro / mint / navy) consistent
- Helper [src/lib/customer-auth-shared.ts](../src/lib/customer-auth-shared.ts) bevat cookie-namen
- Helper [api/_auth-helpers.ts](../api/_auth-helpers.ts) bevat token-refresh logica

Wat er nog niet is:
- GraphQL mutations richting Customer Account API
- Form-components in de codebase (zou simpel kunnen blijven, geen library)

---

## 3. Architectuur

```
React /account (Profiel-tab)
  │
  ├── Persoonsgegevens-card
  │     └── form  ──POST/PATCH──→  /api/customer/profile
  │
  └── Adresboek-card
        ├── lijst van adressen (uit customer-state)
        ├── "Adres toevoegen" knop ─POST──→ /api/customer/address
        ├── Bewerken knop  ──PUT───→ /api/customer/address/:id
        ├── Verwijderen   ──DELETE→ /api/customer/address/:id
        └── "Maak standaard" ──POST→ /api/customer/default-address
                                       │
                                       ▼
                            Customer Account GraphQL
                            (inlog.hlty.shop)
```

### Nieuwe Vercel API routes nodig

| Route | Method | Doel |
|-------|--------|------|
| `/api/customer/profile` | POST | `customerUpdate` mutation (name, email, phone) |
| `/api/customer/addresses` | GET | Haal alle adressen op (kan ook via `/api/customer/me` als die wordt uitgebreid) |
| `/api/customer/address` | POST | `customerAddressCreate` |
| `/api/customer/address/:id` | PUT | `customerAddressUpdate` |
| `/api/customer/address/:id` | DELETE | `customerAddressDelete` |
| `/api/customer/default-address` | POST | `customerDefaultAddressUpdate` |

**Tip:** voor route-flexibiliteit kan dit ook één endpoint `/api/customer/address` zijn die per HTTP-method anders gedraagt. Vercel ondersteunt dat in één file.

### Mutations naar Customer Account API (research nodig)

De waarschijnlijke veldnamen (te valideren via introspection):

```graphql
mutation UpdateProfile($input: CustomerUpdateInput!) {
  customerUpdate(input: $input) {
    customer { id firstName lastName emailAddress { emailAddress } phoneNumber { phoneNumber } }
    userErrors { field message code }
  }
}

mutation CreateAddress($address: CustomerAddressInput!, $defaultAddress: Boolean) {
  customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
    customerAddress { id ... }
    userErrors { field message code }
  }
}

mutation UpdateAddress($addressId: ID!, $address: CustomerAddressInput!) {
  customerAddressUpdate(addressId: $addressId, address: $address) {
    customerAddress { id ... }
    userErrors { field message code }
  }
}

mutation DeleteAddress($addressId: ID!) {
  customerAddressDelete(addressId: $addressId) {
    deletedAddressId
    userErrors { field message code }
  }
}
```

⚠️ **Belangrijk:** de Customer Account API gebruikt **andere veldnamen**
dan Storefront/Admin API. In Fase 2 liep ik tegen `countryCodeV2 doesn't
exist on type CustomerAddress` aan. Doe daarom **eerst** een introspection
query om te bevestigen welke fields exact bestaan op:
- `CustomerUpdateInput`
- `CustomerAddressInput`
- `MailingAddress` of `CustomerAddress` (welk type het is)

Het schema is op `https://inlog.hlty.shop/customer/api/2026-04/graphql`
(via `Authorization: <shcat_token>` header, dezelfde als in
[api/customer/me.ts](../api/customer/me.ts)).

---

## 4. UI-design — wat de klant ziet

### Persoonsgegevens-card

```
┌─────────────────────────────────────────────────────┐
│  PERSOONSGEGEVENS                          [ Bewerken ] │
├─────────────────────────────────────────────────────┤
│  Voornaam   TEST                                     │
│  Achternaam TEST                                     │
│  E-mail     Ritsema2@gmail.com                       │
│  Telefoon   —                                        │
└─────────────────────────────────────────────────────┘
```

Bij klik op "Bewerken" → de waarden worden inputs, knoppen worden
"Opslaan" + "Annuleren". Loading-state tijdens save. Success-banner
("Profiel bijgewerkt"). Error-banner bij userErrors.

### Adresboek-card

```
┌─────────────────────────────────────────────────────┐
│  ADRESSEN                          [ + Adres toevoegen ] │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐  │
│  │ [STANDAARD] TEST, 1                            │  │
│  │             1234 TS TEST                       │  │
│  │             Nederland                          │  │
│  │                            [ Bewerken ] [ × ]   │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │            Tweede Straat 42                    │  │
│  │            5678 AB Amsterdam                   │  │
│  │            Nederland                           │  │
│  │  [ Standaard maken ] [ Bewerken ] [ × ]         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Adres-formulier (inline of in een modal)

Velden:
- Land/regio (select, default: Nederland)
- Voornaam, Achternaam
- Bedrijfsnaam (optioneel)
- Straatnaam, Huisnummer + toevoeging
- Postcode (validatie: NL/BE-formaat), Stad
- Telefoon (optioneel)

---

## 5. Validatie en edge cases

- **E-mail wijzigen:** Shopify stuurt een verificatie-mail. UI moet daarover
  een melding tonen ("Check je inbox voor de bevestigingsmail")
- **Telefoon:** moet in E.164-formaat (`+31612345678`). Een library als
  `libphonenumber-js` (lichte versie) of regex
- **Postcode NL:** `1234 AB` of `1234AB`
- **Standaard adres verwijderen:** Shopify staat dat niet toe — UI moet
  klant eerst een ander adres als standaard laten kiezen, anders foutmelding
- **Het enige adres verwijderen:** waarschuwing tonen
- **Netwerk failure:** form-state niet wissen, error-banner tonen
- **Loading states:** elke API call krijgt zijn eigen `isSaving`-flag
- **Optimistic updates:** voor adresboek nuttig — anders voelt het traag

---

## 6. Workflow voor nieuwe sessie

Aanbevolen volgorde van werken:

1. **Lees de docs**: `docs/README.md`, dan `01-fase-1-foundation.md`,
   `02-fase-2-auth.md`, `03-fase-3-checkout-finishing.md`, en dit document
2. **Schema-introspection** doen via een tijdelijke route of curl-call
   zodat we de exacte veldnamen kennen voor `CustomerUpdateInput` en
   `CustomerAddressInput`
3. **Vercel API routes** bouwen (één per mutation, of één met
   method-routing)
4. **Type-definitions** uitbreiden in [src/context/CustomerContext.tsx](../src/context/CustomerContext.tsx)
   voor het nieuwe `customer.addresses`-veld
5. **Update `/api/customer/me`** om ook `customer.addresses(first: 20)` mee
   te geven
6. **ProfileTab** in [src/pages/Account.tsx](../src/pages/Account.tsx)
   herschrijven met de twee cards
7. **Form-validatie** als utility module (`src/lib/validators.ts`)
8. **Test handmatig**: profiel bewerken, adres toevoegen, adres bewerken,
   adres verwijderen, standaard-adres wisselen
9. **Commit per logische unit**: API-routes apart, UI apart, types apart
10. **Verslag schrijven** in `docs/04-fase-4-profile-edit.md` (vervang dit
    document met de werkelijke ervaring)

---

## 7. Verwacht resultaat

| Stap | Acceptatie |
|------|------------|
| Profiel-tab toont persoonsgegevens-card | klant ziet naam, e-mail, telefoon |
| Klik op "Bewerken" → form opent | inputs verschijnen met huidige waarden |
| Naam wijzigen + opslaan → API call → UI update | wijziging direct zichtbaar, geen page reload |
| E-mail wijzigen → verificatie-melding | "Check je inbox" |
| Telefoon invalid format → inline error | "Gebruik formaat +316..." |
| Adresboek toont alle adressen | standaard-badge bij default |
| "Adres toevoegen" → modal of inline form | formulier met validatie |
| Adres opslaan → verschijnt in lijst | zonder page reload |
| "Verwijderen" → bevestigings-dialog → API → uit lijst | weg na confirmatie |
| "Standaard maken" → API → andere adressen verliezen standaard-badge | atomic UI-update |
| Standaard adres proberen te verwijderen → blokkering | duidelijke melding |
| Profiel-link "Profiel bewerken bij Shopify" weg | volledig vervangen |

---

## 8. Geschatte tijd

- API routes + types: 1,5 uur
- Profile-edit form + UI: 1,5 uur
- Adresboek + adres-form: 2 uur
- Validatie + edge cases: 1 uur
- Test + polish: 1 uur

**Totaal: ~7 uur werk** verspreid over één geconcentreerde sessie. Past
in een halve werkdag.

---

## 9. Na Fase 4

Suggesties voor toekomstige fasen (zoals genoteerd in [03-fase-3-checkout-finishing.md § 6](./03-fase-3-checkout-finishing.md#6-aandachtspunten--open-punten)):

- E-mail-param-format voor nieuwe Shopify checkout (zodat ook e-mail
  pre-fill werkt in `cn/`-format)
- Playwright e2e test-suite tegen regressies
- Wishlist / favorieten via Customer metafields
- Lighthouse performance audit + optimalisaties
- SEO / sitemap / structured data
- Reviews / sterren-rating systeem
