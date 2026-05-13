# Fase 4 — Eigen profile-edit UI in dashboard

**Datum:** 13 mei 2026
**Status:** ✅ Afgerond
**Doel:** De Profiel-tab in `/account` van een link-naar-Shopify ombouwen
naar een volwaardig eigen profielbeheer-blok ("Optie A" uit Fase 3).

---

## 1. Doel & scope

De Profiel-tab toonde tot voor deze fase alleen:

> Wijzigingen aan je profiel kun je doorvoeren via je Shopify klantaccount.
> [ Profiel bewerken bij Shopify ]

Doel was een volledige in-dashboard editor met:

1. **Persoonsgegevens-card** — voornaam, achternaam bewerkbaar; e-mail en
   telefoon zichtbaar maar niet bewerkbaar (zie § 3.1).
2. **Adresboek-card** — alle adressen tonen, toevoegen, bewerken,
   verwijderen, standaard wisselen.

Niet in scope: wachtwoord/2FA, nieuwsbrief-voorkeur, account-verwijderen.

---

## 2. Initial state

Klaar uit Fase 1–3:
- Customer Account API OAuth-flow met `shcat_` tokens in HTTP-only cookies
- `/api/customer/me` voor profiel, `/api/customer/orders` voor orders
- `useCustomer()` context met session + customer state
- Branding consistent (Montserrat / Maven Pro / mint / navy)

Nog niet aanwezig:
- GraphQL mutations richting Customer Account API
- Form-components / validators
- Klantadresboek in de client-state

---

## 3. Beslissingen

### 3.1 E-mail en telefoon niet wijzigbaar via API

Introspectie wees uit dat `CustomerUpdateInput` op de Customer Account API
**alleen** `firstName` en `lastName` accepteert. Er is geen
`customerEmailUpdate` of `customerPhoneUpdate` mutation — alleen
`customerEmailMarketingSubscribe/Unsubscribe`. Email en telefoon zijn dus
protected (logisch: het zijn auth-credentials).

**Gekozen:** beide read-only tonen, met onder de card de tekst
"E-mailadres of telefoonnummer wijzigen? Stuur een bericht naar
[info@hlty.shop](mailto:info@hlty.shop?subject=Wijziging%20contactgegevens)".

Geen Shopify-link meer in de UI — strikt eigen interface, met support-
fallback voor de zeldzame e-mail/telefoonwijziging.

### 3.2 Geen aparte default-address mutation

Het schema heeft geen `customerDefaultAddressUpdate`. In plaats daarvan
zit `defaultAddress: Boolean` als optionele argument op zowel
`customerAddressCreate` als `customerAddressUpdate`. Eén minder route
nodig in de geplande architectuur.

"Standaard maken" doet nu een `PUT /api/customer/address?id=…` met body
`{ "defaultAddress": true }` — daarmee maakt Shopify dat adres automatisch
standaard en de andere adressen verliezen de status.

### 3.3 Veldnamen volgens Customer Account API

Storefront/Admin's `countryCode`/`countryCodeV2` bestaan niet hier.
Customer Account API gebruikt `territoryCode` (ISO-2, bv. `"NL"`) en
`zoneCode` (provincie/state-code) als **input**. Op de query-kant geeft
het ook display-strings `country` ("Nederland") en `province`
("Noord-Holland") terug.

### 3.4 Landselector — vijf opties

NL + BE + DE + FR + GB. Past bij HLTY's EU-bezorggebied; geen vrije ISO-
selector om de UI klein te houden. Buitenlandse klanten kunnen via
[info@hlty.shop](mailto:info@hlty.shop) een verzoek doen.

### 3.5 Inline adres-form (geen modal)

Toevoegen verschijnt als card onderaan de adreslijst, bewerken expandt
de bestaande card. Past beter bij de rust van het dashboard en werkt
prettiger op mobiel dan een modal.

---

## 4. Architectuur

```
React /account → Profiel-tab
  │
  ├── <PersonalInfoCard>
  │     view-mode  → toont firstName/lastName/email/phone
  │     edit-mode  → form → POST /api/customer/profile
  │
  └── <AddressBookCard>
        │
        ├── lijst van <AddressItem>
        │     ├── "Standaard maken"  → PUT /api/customer/address?id=…
        │     ├── "Bewerken"         → expand naar <AddressEditor>
        │     └── "Verwijderen"      → confirm → DELETE /api/customer/address?id=…
        │
        ├── "+ Adres toevoegen"      → <AddressEditor mode="create">
        │                              → POST /api/customer/address
        │
        └── <AddressEditor> (herbruikt voor create + edit)
              → form met land-select, postcode/phone-validatie
```

### 4.1 Nieuwe / gewijzigde bestanden

| Bestand | Doel |
|---------|------|
| [api/_customer-graphql.ts](../api/_customer-graphql.ts) | Shared helper: auth-cookie lezen, refresh-on-401, GraphQL POST naar Customer Account API |
| [api/customer/profile.ts](../api/customer/profile.ts) | `POST` — `customerUpdate` met `firstName`/`lastName` |
| [api/customer/address.ts](../api/customer/address.ts) | `POST`/`PUT`/`DELETE` — method-routing; PUT/DELETE met `?id=<gid>` query-param; `defaultAddress` als optionele body-flag |
| [api/customer/me.ts](../api/customer/me.ts) | **uitgebreid** met `addresses(first: 20, skipDefault: false)` connectie — `defaultAddress.id` toegevoegd om matching te doen |
| [src/lib/validators.ts](../src/lib/validators.ts) | `validatePhone` (E.164), `validateZip` (NL/BE/DE/FR/GB), `validateRequired`, `normalizeZip` (zet NL-postcodes naar `1234 AB`) |
| [src/lib/countries.ts](../src/lib/countries.ts) | `COUNTRIES` lijst + `countryName(code)` lookup |
| [src/context/CustomerContext.tsx](../src/context/CustomerContext.tsx) | `Customer` interface uitgebreid: `addresses: { edges: { node: CustomerAddress }[] }` + nieuw `CustomerAddress` type |
| [src/pages/Account.tsx](../src/pages/Account.tsx) | `ProfileTab` volledig herschreven — nieuwe componenten `PersonalInfoCard`, `AddressBookCard`, `AddressItem`, `AddressEditor`, `FormField`, `FormError`, `ReadOnlyRow` |
| [src/index.css](../src/index.css) | `.form-input` utility-class toegevoegd in `@layer components` |

### 4.2 GraphQL mutations

```graphql
# Profiel
mutation UpdateProfile($input: CustomerUpdateInput!) {
  customerUpdate(input: $input) {
    customer { id firstName lastName displayName }
    userErrors { field message code }
  }
}

# Adres aanmaken (defaultAddress mag true zijn om het meteen standaard te maken)
mutation CreateAddress($address: CustomerAddressInput!, $defaultAddress: Boolean) {
  customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
    customerAddress { ...AddressFields }
    userErrors { field message code }
  }
}

# Adres updaten of alleen default-flag flippen
mutation UpdateAddress($addressId: ID!, $address: CustomerAddressInput, $defaultAddress: Boolean) {
  customerAddressUpdate(addressId: $addressId, address: $address, defaultAddress: $defaultAddress) {
    customerAddress { ...AddressFields }
    userErrors { field message code }
  }
}

# Adres verwijderen
mutation DeleteAddress($addressId: ID!) {
  customerAddressDelete(addressId: $addressId) {
    deletedAddressId
    userErrors { field message code }
  }
}

# Velden op CustomerAddress (query + AddressFields fragment)
# id firstName lastName company address1 address2 city zip
# province zoneCode country territoryCode phoneNumber formatted
```

`CustomerAddressInput` accepteert: `firstName`, `lastName`, `company`,
`address1`, `address2`, `city`, `zip`, `territoryCode`, `zoneCode`,
`phoneNumber`.

---

## 5. Workflow & problemen onderweg

### 5.1 Schema-introspectie eerst

Eerste stap was een tijdelijke `/api/customer/introspect` route die
`CustomerUpdateInput`, `CustomerAddressInput`, `CustomerAddress` en alle
`customer*` mutations ophaalde. Deployed, JSON via browser-sessie
opgehaald, gebruikt om de juiste veldnamen vast te leggen, daarna in een
cleanup-commit weer verwijderd. Deze flow voorkwam herhaling van het
`countryCodeV2 doesn't exist`-incident uit Fase 2.

### 5.2 Vercel CDN serveerde gecachte HTML

**Symptoom:** na de frontend-push gaf de live `/account` pagina op het
Profiel-tab nog steeds de oude OverviewTab-content terug, hoewel de
bundle hash op disk een nieuwe `Persoonsgegevens`-string bevatte en
`/api/customer/me` correct de uitgebreide payload teruggaf.

**Root cause:** Vercel's edge cache (zichtbaar via header
`x-vercel-cache: HIT`, `age: 331`) hield een verlopen `/account` HTML
vast die naar een script-src van vóór de Fase 4 deploy verwees. De
nieuwe bundle stond wel op `/assets/index-CrfuCiTT.js`, maar de browser
laadde de HTML met een script-src van een eerdere build.

**Fix:** een vervolgcommit (met een debug-marker) zorgde voor een nieuwe
bundle-hash. Daarmee werd de SPA-fallback opnieuw gegenereerd en kreeg
de cached `/account` een fresh script-src. De marker is in de
cleanup-commit weer verwijderd.

**Les:** een Vite content-hash garandeert dat `/assets/<hash>.js` uniek
is, maar de HTML die ernaar verwijst kan apart cached blijven. Bij een
"nieuwe code is gedeployed maar UI verandert niet" symptoom: check de
`<script src>` in de live HTML, niet alleen de bundle-content. Een
volgende minieme codewijziging die de hash verandert, forceert herinvallidatie.

### 5.3 Geen runtime issues

De `console.log` debug-marker en testronde via Chrome MCP toonden geen
JS-errors, geen failed network requests. Alle vier de mutations werkten
end-to-end in de eerste poging.

---

## 6. Eindstaat

Visueel + functioneel bevestigd via end-to-end test op
[www.hlty.shop](https://www.hlty.shop) (ingelogd als TEST):

| Flow | Status |
|------|--------|
| Profiel-tab toont persoonsgegevens-card met inline view | ✅ |
| "Bewerken" → form met autofocus op voornaam | ✅ |
| "Annuleren" → herstel originele waarden, terug naar view-mode | ✅ |
| E-mail / telefoon read-only met mailto info@hlty.shop link | ✅ |
| Adresboek toont alle adressen | ✅ |
| "Adres toevoegen" → inline form onderaan de lijst | ✅ |
| Adres opslaan → verschijnt direct (na `useCustomer().refresh()`) | ✅ |
| "Bewerken" op adres → AddressEditor expand met initial-values gevuld | ✅ |
| Wijziging opslaan → adres-card update direct | ✅ |
| "Standaard maken" → andere adres verliest STANDAARD-badge, dit krijgt 'm | ✅ |
| "Verwijderen" → confirmation-rij verschijnt → klik Verwijderen → weg | ✅ |
| Verwijderen-knop verborgen op enige + standaard adres (kan niet verwijderd worden) | ✅ |
| Geen "Profiel bewerken bij Shopify"-link meer in de UI | ✅ |

### Commits in deze fase

| Commit | Onderwerp |
|--------|-----------|
| `25f6bc6` | Tijdelijke `/api/customer/introspect` route voor schema-discovery |
| `b63f823` | API routes voor eigen profile-edit (profile.ts, address.ts, me.ts uitgebreid, _customer-graphql.ts) |
| `dcac690` | Eigen profile-edit UI vervangt Shopify-link (ProfileTab + sub-componenten + validators + countries + .form-input CSS) |
| `c3a23e3` | DEBUG: marker + console.log in ProfileTab (om Vercel CDN-cache te invalideren) |
| `53c6ecc` | Cleanup: introspect-route + debug-marker weg |
| (volgende) | Dit verslag |

---

## 7. Aandachtspunten / open punten

### Klein
1. **AnimatePresence + framer-motion** geeft tijdens tab-switch een
   exit→enter animatie van 0.18s. Snelle clicks tijdens transitie kunnen
   onverwacht voelen, maar leiden niet tot rendering-fouten.
2. **`useCustomer().refresh()`** na elke mutation re-fetcht `/api/customer/me`.
   Geen optimistic updates, dus 200-500ms wachttijd zichtbaar.
   Acceptabel voor de relatief lage frequentie van profielwijzigingen.
3. **Veldfouten van Shopify** worden weergegeven met `userErrors.field`
   → mapping naar inline form-error. Onbekend hoe Shopify ze
   precies voor exotische landen rapporteert; getest met NL/BE.

### Groot
4. **E-mail/telefoon-wijziging via support** is een handmatig kanaal
   nu. Als het volume groeit, optie om een aparte
   support-ticket-route of in-app reservering te bouwen.
5. **Geen e2e tests** — Playwright suite blijft op de takenlijst (zie
   [03-fase-3-checkout-finishing.md § 6](./03-fase-3-checkout-finishing.md#6-aandachtspunten--open-punten)).
   Komende regressies op Profiel-tab moet handmatig op live gechecked.

### Architectuur
6. **API design** — adres-routes gebruiken één file met method-routing
   (`POST`/`PUT`/`DELETE`). Profile is een aparte file omdat het een
   andere resource is. Schaalbaar voor toekomstige resources zoals
   wishlist / nieuwsbrief-voorkeur.
7. **`_customer-graphql.ts` helper** centraliseert de auth-loop. Nieuwe
   mutation-routes kunnen die hergebruiken zonder de 40-regels
   cookie/refresh-logica te dupliceren.

---

## 8. Volgende stap: Fase 5

Suggesties:

- **Playwright e2e test-suite** — vooral voor de Profiel-flow nu deze
  veel state-mutaties heeft (zie open punt 5)
- **Optimistic updates** in adresboek voor instant feedback
- **Nieuwsbrief / e-mail marketing opt-in** via
  `customerEmailMarketingSubscribe` (alleen zichtbaar in schema)
- **Wishlist / favorieten** via Customer metafields (zie
  [03-fase-3-checkout-finishing.md § 6](./03-fase-3-checkout-finishing.md#6-aandachtspunten--open-punten))
- **Lighthouse performance audit** + bundle-size optimalisatie
  (`framer-motion` is 128 KB gzipped)
- **SEO / sitemap / structured data**
