# Shopify HLTY-tag werkwijze

Dit document legt vast hoe het instroom-mechanisme voor producten in HLTY
werkt en welke regels Claude (en iedereen die met de Shopify-admin werkt)
moet volgen om te voorkomen dat producten "verdwijnen".

## De situatie

- Productdata wordt geautomatiseerd geïmporteerd vanuit groothandel
  Holland Pharma naar Shopify (domain `8crbbh-zu.myshopify.com`).
- Bij iedere sync komen er nieuwe producten binnen — soms honderden tegelijk.
- Stefan wil **bewust kiezen** welke producten écht in het HLTY-assortiment
  komen. Hij wil niet dat de winkel zich automatisch volzet met alles wat
  Holland Pharma voert.

## Het mechanisme: HLTY-tag = "deze hoort bij ons"

Een product is pas onderdeel van het HLTY-assortiment als beide condities
gelden:

1. **Status `Actief`** in plaats van `Concept` (rechter sidebar in admin)
2. **Tag `HLTY`** toegevoegd in de Tags-sectie van het product

> ⚠️ **Zonder de HLTY-tag wordt het product door de volgende Holland Pharma
> sync automatisch teruggezet naar status Concept.** De tag fungeert als
> ankerpunt: *"laat dit product met rust, het hoort bij ons assortiment."*

## Wanneer wordt dit relevant?

### A. Bij het toevoegen van een nieuw product

Bijvoorbeeld wanneer de productadviseur een vegan alternatief nodig heeft
dat nog niet in het assortiment zit, maar wel van een merk is dat HLTY
voert (Mattisson, Orthica, Royal Green, Arctic Blue, etc.):

1. Open Shopify admin → Producten → zoek product op naam/merk
2. Open de product-detail pagina (vaak staat 'ie op Concept)
3. Zet status naar `Actief` (rechter sidebar)
4. Voeg in de **Tags** sectie de tag `HLTY` toe
5. Bewaar
6. Verifieer in de Storefront API of het product nu beschikbaar is via
   `curl https://8crbbh-zu.myshopify.com/api/2024-10/graphql.json` (zie
   bestaande check-scripts in deze repo)

### B. Bij het verklaren van "waarom verschijnt mijn nieuwe product niet?"

Eerste check (in deze volgorde):
1. Is het product `Actief` of nog `Concept`?
2. Heeft het de tag `HLTY`?
3. Is het beschikbaar via de Storefront API?

Vaak is het antwoord: status was Actief, maar HLTY-tag ontbrak — dus de
volgende sync heeft 'm weer naar Concept gezet.

### C. Bij het opstellen van een dieet-filter / mapping-update

Wanneer een alternatief product wordt voorgesteld voor de productadviseur,
en dat product is van een merk dat HLTY al voert maar het zit nog niet in
het assortiment:

- Mag toegevoegd worden via Shopify admin, **mits**: status=Actief +
  HLTY-tag.
- Documenteer in de mapping-file welke producten zijn toegevoegd via dit
  pad, voor traceerbaarheid.

## Wat NIET te doen

- ❌ Geen nieuwe merken toevoegen die HLTY nog niet voert. Stefan kiest
  bewust welke merken in de winkel staan.
- ❌ Status veranderen zonder HLTY-tag toe te voegen — het effect is
  tijdelijk en verdwijnt bij de volgende sync.
- ❌ Niet de Holland Pharma kant aanraken; alle wijzigingen via Shopify
  admin.

## Memory-pointer

Dit gedrag is ook vastgelegd in de cross-session memory:
[project_hlty_shopify_tag.md](../../../.claude/projects/-Users-stefanritsema-Documents-VibeCode/memory/project_hlty_shopify_tag.md).
