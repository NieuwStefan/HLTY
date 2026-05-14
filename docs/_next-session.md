# Prompt voor de volgende chat-sessie

Kopieer onderstaande tekst en plak hem als eerste bericht in een nieuwe
Claude Code-sessie. Het geeft de nieuwe Claude meteen alle context zonder
dat je opnieuw uitlegt waar we mee bezig zijn.

---

```
Hoi! We gaan verder met HLTY.shop, een Shopify-headless React-app
(Vite/React 19, Vercel) in /Users/stefanritsema/Documents/VibeCode/HLTY.

We zitten in **fase 6 — AI-websitetest-rapport** (14 mei 2026, 26
bevindingen). 12 punten zijn al live op productie, de rest staat in
batches. Volledige status in:

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

**Eerstvolgende actie — Batch A (Shopify-data fixes):**

Zie § 9 in docs/06 voor de complete tabel. Punten 6, 7, 16, 18, 19, 20,
25. Mijn afspraak met de vorige sessie was: per punt eerst voorleggen
of we het code-side of admin-side aanpakken (Holland Pharma overweging).

Begin met **punt 6 — "Bewaarvoorschrift afgebroken zin"**. Onderzoek waar
dit voorkomt op de site, leg me 2-3 oplossingsopties voor (met jouw
voorkeur), wacht op mijn akkoord.

**Wat NIET in deze fase zit (eigen fases later):**
- Productadvisor (punten 3, 5 + extra issues) → eigen Fase 7+
- Meta-titels / SEO / GEO (punt 4) → eigen Fase 8
- Merken-pagina inrichting → wishlist, samen later oppakken

**Productie-URL:** https://www.hlty.shop
**Laatste commit:** `5794949` op `main`
**Vercel project:** `hlty-storefront`

Begin met `cat docs/06-fase-6-rapport-websitetest.md | head -200`, lees
de status, en stel daarna voor wat je voor punt 6 wil onderzoeken.
```

---

## Korte mentale-load-cheatsheet voor jou (Stefan)

Mocht je tussendoor de context kwijt zijn, hier de essentie:

| Wat | Antwoord |
|-----|----------|
| Hoeveel punten zijn live? | 12 van 26 (46%) |
| Wat eerstvolgend? | Batch A (Shopify-data fixes) — start met #6 |
| Wat krijgen eigen fase? | Productadvisor, SEO/GEO, Merken-pagina |
| Welke commit is live? | `5794949` op `main` |
| Welke ene file vat alles samen? | `docs/06-fase-6-rapport-websitetest.md` |
| Hoe weet de volgende AI dit? | Via `MEMORY.md` + bovenstaande prompt |
