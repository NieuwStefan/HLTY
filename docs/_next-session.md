# Prompt voor de volgende chat-sessie

Kopieer onderstaande tekst en plak hem als eerste bericht in een nieuwe
Claude Code-sessie. Het geeft de nieuwe Claude meteen alle context zonder
dat je opnieuw uitlegt waar we mee bezig zijn.

---

```
Hoi! We gaan verder met HLTY.shop, een Shopify-headless React-app
(Vite/React 19, Vercel) in /Users/stefanritsema/Documents/VibeCode/HLTY.

We zitten in **fase 6 — AI-websitetest-rapport** (14 mei 2026, 26
bevindingen). 22 punten zijn al live op productie, 3 zijn doorgeschoven
naar eigen latere fases, en 1 punt (Solo #13 — Checkout indicator) is
nu het eerstvolgende. Volledige status in:

  docs/06-fase-6-rapport-websitetest.md

**LEES ALS EERSTE deze drie bestanden** voordat je iets anders doet:

1. `docs/06-fase-6-rapport-websitetest.md` — § 5 Eindstaat-tabel en
   § 9 Volgende stap; daar staat exact waar we zijn en wat eerstvolgend
   is.
2. `docs/README.md` — index van alle fase-verslagen.
3. Mijn projectmemory `MEMORY.md` (auto-loaded). Vooral
   `project_hlty_holland_pharma.md` is relevant — Holland Pharma is de
   API-bron voor alle niet-HLTY productdata, met implicaties voor hoe
   we content-fixes aanpakken (presentatie-laag i.p.v. Shopify admin).

**Werkwijze (belangrijk, vasthouden):**

- Stap voor stap door de lijst. Per punt: analyseren waarom, opties
  voorleggen, mijn keuze laten maken, implementeren, testen.
- **Geen quick fixes** — ik wil lange-termijn oplossingen.
- Per stap **meerdere oplossingen** met jouw voorkeur erbij, dan kies ik.
- **Voorzichtig met Shopify-wijzigingen** (onomkeerbare fouten vermijden);
  vraag voor elke admin-actie eerst akkoord.
- Voor **content-issues op niet-HLTY producten**: standaard presentatie-
  laag-fix in React-code, niet handmatig in Shopify admin
  (Holland Pharma overschrijft sync).
- **Per fase een verslag** in `docs/0X-fase-X-onderwerp.md` (volg conventie
  van fases 1–6).

**Eerstvolgende actie — Solo #13 — Checkout progress-indicator:**

Dit is een **onderzoekspunt**, niet zomaar een fix. Het AI-rapport
constateerde dat er geen voortgangs-indicator zichtbaar is tijdens de
checkout. Maar onze checkout draait op Shopify's eigen platform
(`checkout.hlty.shop`) — dat is grotendeels buiten onze directe
React-controle.

Begin met onderzoek:

1. Wat exact zag de AI-testbot — de Shopify-stap-indicator (Informatie /
   Verzending / Betaling) of iets anders?
2. Wat zit er in Shopify checkout-instellingen of Checkout Extensions
   (functie van Shopify Plus/upgrades) qua aanpasbaarheid?
3. Alternatieven aan onze kant — bv. een "Stap 1 van 3"-banner in de
   cart drawer of voor het verlaten van `/cart` zodat klanten weten
   waar ze staan voordat ze in de Shopify-flow stappen.

Leg me 2-3 opties voor met je voorkeur, dan kies ik.

**Daarna komen de eigen vervolg-fases** (Productadvisor + SEO/GEO), niet
in fase 6.

**Wat NIET in deze fase zit (eigen fases later):**
- Productadvisor (punten 3, 5 + extra issues) → eigen Fase 7+
- Meta-titels / SEO / GEO (punt 4) → eigen Fase 8
- Merken-pagina inrichting → wishlist, samen later oppakken

**Productie-URL:** https://www.hlty.shop
**Laatste commit:** (zie `git log --oneline -1` op `main`)
**Vercel project:** `hlty-storefront`

Begin met `cat docs/06-fase-6-rapport-websitetest.md | head -250`, lees
de eindstaat-tabel en volgende-stap-sectie, en stel daarna voor wat je
voor Solo #13 wil onderzoeken.
```

---

## Korte mentale-load-cheatsheet voor jou (Stefan)

Mocht je tussendoor de context kwijt zijn, hier de essentie:

| Wat | Antwoord |
|-----|----------|
| Hoeveel punten zijn live? | 22 van 26 (85%) |
| Wat eerstvolgend? | Solo #13 — Checkout progress-indicator (onderzoeksessie) |
| Wat krijgen eigen fase? | Productadvisor, SEO/GEO, Merken-pagina |
| Welke ene file vat alles samen? | `docs/06-fase-6-rapport-websitetest.md` |
| Hoe weet de volgende AI dit? | Via `MEMORY.md` + bovenstaande prompt |
