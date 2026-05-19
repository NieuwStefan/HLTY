# Productadvisor — Curatie-template voor 37 mappings

Dit document is het werkdocument voor jou (Stefan) en de fysio om de
HLTY Consultation-regels in te vullen. Elke mapping bepaalt welke
producten een klant te zien krijgt op de resultaatpagina, op basis van
hun gemaakte keuzes in stap 1 en stap 2.

**Volgorde**:
1. Lees eerst de **Inleiding** en het **Voorbeeld** hieronder
2. Vul daarna de 27 enkele-doel mappings in (DEEL 1)
3. Vul vervolgens de 10 dubbele-doel mappings in (DEEL 2)
4. Klaar → terug naar Claude voor verwerking in de code

---

## Inleiding — wat is een mapping?

Een mapping is een **regel** die zegt: *"Als klant kiest voor [doel] +
[antwoord], laat dan deze 5–8 producten zien met deze uitleg."*

Per mapping leveren jullie 5 elementen:

1. **Samenvatting** (2–3 zinnen, in HLTY-tone) — staat bovenaan het
   resultaat en kadert wat dit advies aanpakt
2. **5–8 producten** (Shopify product handles) — waaruit het algoritme
   straks de top 3 kiest, na filtering op dieet en leefstijl
3. **Per product 3 uitleg-blokken**:
   - **Waarom voor jou** — koppeling aan de specifieke situatie van de klant
   - **Hoe het werkt** — wetenschappelijke onderbouwing
   - **Doseringstip** — praktische hoe/wanneer/let-op
4. **Medische disclaimer** (optioneel) — alleen toevoegen bij rode vlaggen
5. **Leefstijl-tip** (optioneel) — gratis advies dat de supplementen aanvult

---

## Werkwijze

### Per product de 3 uitleg-blokken

Houd deze structuur scherp:

| Blok | Wat erin staat | Voorbeeld |
|------|---------------|-----------|
| **Waarom voor jou** | Link tussen klacht/doel en dit product. *"Bij X is dit logisch omdat..."* | *"Bij moeite met inslapen is magnesium de eerste stap omdat het direct werkt op het zenuwstelsel."* |
| **Hoe het werkt** | Mechanisme — bouwt vertrouwen. *"Werkt door X te doen..."* | *"Magnesium activeert GABA-receptoren — datzelfde mechanisme dat veel slaapmedicatie gebruikt, maar dan natuurlijk."* |
| **Doseringstip** | Praktisch. *"Neem X om Y..."* | *"Neem 30–60 minuten voor het slapen, met een glas water."* |

### HLTY-tone — wat je wel en niet doet

✅ **Wel doen**:
- Helder en eerlijk — geen marketing-vaagheid
- Wetenschappelijke onderbouwing waar mogelijk
- Praktisch en concreet (dosering, timing, waarschuwingen)
- "Onderbouwd advies zoals een fysiotherapeut het zou geven"

❌ **Niet doen**:
- Geen genees-claims (*"geneest", "verhelpt"*)
- Geen pushy verkooptaal (*"de beste!", "moet je hebben!"*)
- Geen vergezochte rationalisaties (zie de oude AI-advisor: K2 voor "kalme gemoedstoestand")
- Geen vage taal (*"ondersteunt het lichaam"*)

### Wanneer voeg je een medische disclaimer toe?

Voeg een disclaimer toe wanneer de klacht-context redenen geeft om eerst
een professional te raadplegen. Specifieke triggers:

- **Hart & vaten — "Op advies van arts"**: altijd disclaimer
- **Hormonen — "Specifieke levensfase"**: meestal disclaimer
- **Stress — "Slecht slapen door stress"**: alleen als chronisch
- **Gewrichten — meerdere plekken**: meestal disclaimer (kan systemisch zijn)
- **Andere situaties**: zelden nodig

### Hoe vind je een Shopify product handle?

Een product handle is de URL-naam van een product. Drie manieren om het te
vinden:

1. **Vanaf de webshop** ([www.hlty.shop](https://www.hlty.shop)):
   ga naar een product, kijk in de URL — alles na `/products/` is het
   handle.
   Voorbeeld: `www.hlty.shop/products/orthica-magnesium-plus` → handle is
   `orthica-magnesium-plus`

2. **Vanaf Shopify admin**: open een product → de URL bevat het handle
   na `/products/`

3. **Voor de fysio bij twijfel**: schrijf gewoon de productnaam op zoals
   die in Shopify staat — Stefan kan de handle achteraf toevoegen

---

## Voorbeeld — volledig ingevulde mapping

Onder volgt een **complete, ingevulde** voorbeeld-mapping als referentie.
Gebruik dit als template voor jouw eigen invullingen.

---

### VOORBEELD: Beter slapen — Moeite met inslapen

**Samenvatting** *(2–3 zinnen)*:

> Bij moeite met inslapen werken supplementen die het zenuwstelsel
> kalmeren en het natuurlijke slaap-mechanisme ondersteunen. We kiezen
> daarom voor combinaties die zowel de geest tot rust brengen als het
> lichaam helpen om in slaap-modus te schakelen.

**Producten** *(5–8 stuks, in volgorde van prioriteit)*:

**1. Orthica Magnesium plus 60 caps**
- Shopify handle: `orthica-magnesium-plus-60-capsules`
- **Waarom voor jou**: Bij moeite met inslapen door een drukke geest is
  dit de eerste keuze. De combinatie pakt zowel het lichamelijke
  (spier-ontspanning) als het mentale (cortisol) deel aan.
- **Hoe het werkt**: Magnesium activeert GABA-receptoren — datzelfde
  mechanisme dat veel slaapmedicatie gebruikt, maar dan natuurlijk.
  Ashwagandha verlaagt cortisol meetbaar binnen 4 weken.
- **Doseringstip**: Neem 30–60 minuten voor het slapen, met een glas water.

**2. Mattisson Slaap & Rust complex**
- Shopify handle: `mattisson-slaap-rust-complex`
- **Waarom voor jou**: Specifiek voor mensen met een "ratelende geest"
  die niet kunnen ontspannen.
- **Hoe het werkt**: Valeriaan kalmeert het zenuwstelsel, L-theanine
  bevordert alpha-hersengolven (kalme alertheid die overgaat in slaap).
- **Doseringstip**: 1 capsule ongeveer 45 minuten voor het slapen.
  Niet combineren met alcohol of slaapmedicatie.

**3. Royal Green Melatonine 0,29mg**
- Shopify handle: `royal-green-melatonine`
- **Waarom voor jou**: Als de oorzaak in een ontregelde biologische klok
  ligt (late schermtijd, jetlag, ploegendienst).
- **Hoe het werkt**: Melatonine is het natuurlijke slaaphormoon. 0,29mg
  geeft genoeg signaal zonder oversturing.
- **Doseringstip**: Neem 30 minuten voor bed. Vermijd fel licht
  (telefoon) na inname — anders blokkeer je de werking weer.

**4. [vul aan]**
- Shopify handle: _____
- **Waarom voor jou**: _____
- **Hoe het werkt**: _____
- **Doseringstip**: _____

**5. [vul aan]**
- Shopify handle: _____
- **Waarom voor jou**: _____
- **Hoe het werkt**: _____
- **Doseringstip**: _____

**Medische disclaimer** *(optioneel — laat leeg als niet relevant)*:

> _Geen disclaimer nodig voor deze mapping._

**Leefstijl-tip** *(optioneel)*:

> Beperk schermgebruik 1 uur voor het slapen — blauw licht remt
> melatonine-productie en maakt het inslapen lastiger.

---

## Stap-2-vragen per doel (referentie)

Hieronder de 9 vragen + antwoorden zoals klanten ze zien in stap 2.
Gebruik deze als referentie bij het invullen van de mappings.

| Doel | Vraag op stap 2 | A1 | A2 | A3 |
|------|-----------------|----|----|----|
| 🌙 Beter slapen | *Wat speelt voor jou het meest?* | Moeite met inslapen | Vaak 's nachts wakker | Niet uitgerust opstaan |
| ⚡ Meer energie | *Wanneer ervaar je het meest vermoeidheid?* | Hele dag, structureel | 's Middags / na werk | Bij mentale inspanning |
| 💪 Spieren & herstel | *Wat is je hoofdfocus?* | Spiermassa opbouwen | Uithoudingsvermogen & herstel | Algemene fitheid |
| 🧠 Focus & concentratie | *In welke situatie het meest?* | Werk of studie | Onder stress | Algemene mentale vermoeidheid |
| 🛡️ Weerstand | *Wat past het beste bij jou?* | Algemene ondersteuning | Vaak verkouden | Seizoens-ondersteuning |
| 🦴 Gewrichten | *Waar zit de klacht voornamelijk?* | Knieën | Rug / nek | Schouders / meerdere plekken |
| ❤️ Hart & vaten | *Wat past het beste bij jouw situatie?* | Algemene preventie | Verhoogd risico | Op advies van arts |
| 🌊 Stress & rust | *Wat ervaar je vooral?* | Mentale onrust | Lichamelijke spanning | Slecht slapen door stress |
| 🌸 Hormonen | *Wat past het beste bij jou?* | Algemene balans | Energie & vitaliteit | Specifieke levensfase |

---

# DEEL 1 — 27 enkele-doel mappings

---

## Mapping 1: 🌙 Beter slapen — Moeite met inslapen

*(Zie voorbeeld hierboven — deze mapping kun je direct gebruiken of
aanpassen waar nodig)*

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 2: 🌙 Beter slapen — Vaak 's nachts wakker

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 3: 🌙 Beter slapen — Niet uitgerust opstaan

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 4: ⚡ Meer energie — Hele dag, structureel

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 5: ⚡ Meer energie — 's Middags / na werk

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 6: ⚡ Meer energie — Bij mentale inspanning

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 7: 💪 Spieren & herstel — Spiermassa opbouwen

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 8: 💪 Spieren & herstel — Uithoudingsvermogen & herstel

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 9: 💪 Spieren & herstel — Algemene fitheid

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 10: 🧠 Focus & concentratie — Werk of studie

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 11: 🧠 Focus & concentratie — Onder stress

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 12: 🧠 Focus & concentratie — Algemene mentale vermoeidheid

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 13: 🛡️ Weerstand — Algemene ondersteuning

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 14: 🛡️ Weerstand — Vaak verkouden

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 15: 🛡️ Weerstand — Seizoens-ondersteuning

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 16: 🦴 Gewrichten — Knieën

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 17: 🦴 Gewrichten — Rug / nek

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 18: 🦴 Gewrichten — Schouders / meerdere plekken

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer** *(klachten op meerdere plekken kunnen systemisch zijn — overweeg disclaimer)*: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 19: ❤️ Hart & vaten — Algemene preventie

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 20: ❤️ Hart & vaten — Verhoogd risico

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer** *(aanbevolen voor deze mapping)*: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 21: ❤️ Hart & vaten — Op advies van arts

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer** *(altijd toevoegen voor deze mapping)*: _____

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 22: 🌊 Stress & rust — Mentale onrust

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 23: 🌊 Stress & rust — Lichamelijke spanning

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 24: 🌊 Stress & rust — Slecht slapen door stress

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer** *(overweeg bij chronische klachten)*: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 25: 🌸 Hormonen — Algemene balans

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 26: 🌸 Hormonen — Energie & vitaliteit

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 27: 🌸 Hormonen — Specifieke levensfase

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer** *(meestal aanbevolen voor deze mapping)*: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

# DEEL 2 — 10 dubbele-doel mappings (logische paren)

Deze mappings worden gebruikt wanneer een klant **2 doelen samen kiest**.
Per paar lever je één set producten + samenvatting die voor de meest
voorkomende antwoord-combinaties van dat paar werkt. Het algoritme
selecteert uit deze set de uiteindelijke top 3 op basis van dieet,
leefstijl en de specifieke antwoorden.

---

## Mapping 28: 🌙 Beter slapen + ⚡ Meer energie

*(Klassiek samengaan — slechte slaap voedt vermoeidheid)*

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 29: 🌙 Beter slapen + 🌊 Stress & rust

*(Stress is veelvoorkomende oorzaak van slaapproblemen)*

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 30: 🌙 Beter slapen + 🌸 Hormonen

*(Hormonale schommelingen verstoren slaap, vooral bij menopauze)*

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 31: ⚡ Meer energie + 🧠 Focus & concentratie

*(Mentale en fysieke energie hangen samen)*

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 32: ⚡ Meer energie + 🌊 Stress & rust

*(Stress put energie uit)*

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 33: 🧠 Focus & concentratie + 🌊 Stress & rust

*(Stress vermindert focus direct)*

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 34: 💪 Spieren & herstel + 🦴 Gewrichten

*(Sporters met klachten / actieve mensen die belast worden)*

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 35: 🛡️ Weerstand + 🌊 Stress & rust

*(Chronische stress verlaagt immuunsysteem aantoonbaar)*

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 36: 🌸 Hormonen + ⚡ Meer energie

*(Hormoonschommelingen → energietekorten)*

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer**: _____ (of leeg)

**Leefstijl-tip**: _____ (of leeg)

---

## Mapping 37: ❤️ Hart & vaten + ⚡ Meer energie

*(Vermoeidheid kan signaal zijn van hart-issues — extra zorg)*

**Samenvatting**:
> _____

**Producten**:
1. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
2. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
3. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
4. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____
5. **____**
   - Handle: _____
   - Waarom voor jou: _____
   - Hoe het werkt: _____
   - Doseringstip: _____

**Medische disclaimer** *(aanbevolen — vermoeidheid + hart-bezorgdheid verdient arts-consult)*: _____

**Leefstijl-tip**: _____ (of leeg)

---

# Klaar?

Wanneer alle 37 mappings ingevuld zijn:
1. Geef dit document terug aan Claude
2. Claude verwerkt alles in `src/lib/consultation-rules.ts`
3. We testen samen of de regels het juiste resultaat geven
4. Daarna pakken we **fase 3 (dieet- en leefstijl-modifiers)** samen op

**Bij twijfel of vragen tijdens invullen**: noteer ze in de mapping zelf
(*"Vraag aan Claude: kunnen we hier ook X overwegen?"*) of stuur direct
een bericht — geen probleem om tussentijds te overleggen.

---

## Bijlage — checklist voor de fysio-sessies

**Voor de sessie zorg je dat je hebt**:
- [ ] Toegang tot Shopify admin (om product handles op te zoeken)
- [ ] Of: een open tab van [www.hlty.shop](https://www.hlty.shop) waar
      je handles uit URL kunt halen
- [ ] Dit document op je scherm
- [ ] Eventueel een aparte notitie voor "open vragen"

**Tijdens de sessie**:
- Begin bij de doelen die jullie het meest verkopen / het beste kennen
  — Beter slapen, Meer energie, Spieren zijn vaak goede startpunten
- Streef per mapping naar 5 producten — meer mag, maar 5 is een goed
  minimum
- Houd de uitleg-blokken kort en concreet (1–2 zinnen)
- Bij grijze gevallen: liever een mapping overslaan en terugkomen, dan
  iets invullen waar je niet zeker van bent

**Inschatting tijdsbesteding**:
- 27 enkele-doel mappings: ~10 minuten per stuk = **4,5 uur**
- 10 dubbele-doel mappings: ~12 minuten per stuk = **2 uur**
- Totaal: **6,5 uur** (gepland: 2 sessies van 3-4 uur)
