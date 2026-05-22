# HLTY documentatie

Kennisbank voor het HLTY-project. Bij elke grote milestone wordt hier een
nieuw verslag toegevoegd zodat we altijd terug kunnen vallen op wat is
besloten, wat is gedaan en waarom.

## Verslagen

| # | Bestand | Onderwerp | Status |
|---|---------|-----------|--------|
| 01 | [01-fase-1-foundation.md](./01-fase-1-foundation.md) | Fase 1 — Shopify-foundation: Headless-app, OAuth-client, branding, checkout op eigen subdomein | ✅ afgerond |
| 02 | [02-fase-2-auth.md](./02-fase-2-auth.md) | Fase 2 — OAuth-login + eigen account-dashboard in code | ✅ afgerond |
| 03 | [03-fase-3-checkout-finishing.md](./03-fase-3-checkout-finishing.md) | Fase 3 — Checkout pre-fill + order-detail-modal + re-order | ✅ afgerond |
| 04 | [04-fase-4-profile-edit.md](./04-fase-4-profile-edit.md) | Fase 4 — Eigen profile-edit UI (vervangt link-naar-Shopify in Profiel-tab) | ✅ afgerond |
| 05 | [05-fase-5-checkout-privacy.md](./05-fase-5-checkout-privacy.md) | Fase 5 — Checkout-privacy fix + UX-polishing (cart-unbind, OIDC id_token, onboarding-flow, NAAM-card, switch-user, F6.1 logo-redirect) | ✅ afgerond |
| 06 | [06-fase-6-rapport-websitetest.md](./06-fase-6-rapport-websitetest.md) | Fase 6 — AI-websitetest: 26 bevindingen systematisch afwerken + Solo #13 (Checkout indicator) + payment cleanup | ✅ afgerond |
| 07 | [07-fase-7-productadvisor.md](./07-fase-7-productadvisor.md) | Fase 7 — Productadvisor: fundamenteel herontwerp van AIAdvisor → HLTY Health Consultation (4-stappen rule-engine, dieet-substitutie, leefstijl-modifier). **Live op productie**, in feedback-ronde | ✅ afgerond (live) |
| 08 | [08-fase-8-seo-geo.md](./08-fase-8-seo-geo.md) | Fase 8 — SEO & GEO: meta-tags, structured data, sitemap, crawlability + AI-citeerbaarheid | 🚧 opgepakt |
| 09 | _(nog te schrijven)_ | Fase 9 — Assortiment-onderzoek: welke categorieën/producten aanvullen of bijstellen | ⏭ gepland |
| 10 | _(nog te schrijven)_ | Fase 10 — SEO/GEO content-pass: bijwerken op punten die Fase 9 raakt | ⏭ gepland |
| 11 | [11-fase-11-productadvisor-optimalisaties.md](./11-fase-11-productadvisor-optimalisaties.md) | Fase 11 — Productadvisor post-live optimalisaties: feedback verwerken, AI-fallback + stap 5 terug, doserings-keuze, bundle-suggestie, analytics-events | 🅿️ geparkeerd |

### Werkdocumenten Fase 7

| Bestand | Onderwerp |
|---------|-----------|
| [_dieet-filter-voorstel.md](./_dieet-filter-voorstel.md) | Per-product dieet-onderzoek + 1-op-1 alternatieven (geïmplementeerd) |
| [_shopify-tag-werkwijze.md](./_shopify-tag-werkwijze.md) | HLTY-tag-mechanisme: producten actief houden bij Holland Pharma-sync |
| [_productadvisor-wishlist.md](./_productadvisor-wishlist.md) | Geparkeerd voor later: Fase 4 AI-fallback, doserings-/grootte-keuze, bundle-suggestie |
| [_productadvisor-keuze-combinaties.md](./_productadvisor-keuze-combinaties.md) | Enumeratie alle 351 keuze-combinaties + strategie A/B/C |
| [_productadvisor-mappings-template.md](./_productadvisor-mappings-template.md) | (Historisch) invul-template — niet meer gebruikt, mappings via Stefan's PDF ingevuld |
| [_productadvisor-mappings-quickref.md](./_productadvisor-mappings-quickref.md) | (Historisch) quick-ref naast het template |

## Conventies voor verslagen

Elk milestone-verslag bevat:

1. **Doel & scope** — wat we wilden bereiken
2. **Initial state** — wat we aantroffen
3. **Beslissingen** — wat is gekozen en waarom
4. **Wat is gedaan** — stap voor stap, met concrete waarden waar relevant
5. **Problemen onderweg** — wat niet werkte, wat de root cause was
6. **Eindstaat** — hoe het er na de milestone uitziet
7. **Aandachtspunten** — open punten / dingen om later op te volgen
8. **Volgende stap** — wat erna komt

## Belangrijke constantes

Zie [01-fase-1-foundation.md § "Belangrijke configuratie-waarden"](./01-fase-1-foundation.md)
voor client-IDs, OAuth-endpoints en domein-config.
