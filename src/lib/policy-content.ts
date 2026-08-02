export type PolicySlug =
  | 'privacy'
  | 'verzending'
  | 'retour'
  | 'voorwaarden'
  | 'contact-informatie'
  | 'wettelijke-kennisgeving';

export interface Policy {
  slug: PolicySlug;
  title: string;
  body: string;
}

const PRIVACY = `
<p><em>Laatst bijgewerkt: 26 mei 2026</em></p>

<h2>1. Wie zijn we</h2>
<p>HLTY (VOF, KvK 98276441) is gevestigd aan Skrokdam 5, 8918 LB Leeuwarden. Wij verkopen voedingssupplementen en fysiotherapie-producten via hlty.shop. Voor vragen over deze verklaring: <a href="mailto:info@hlty.shop">info@hlty.shop</a>.</p>

<h2>2. Welke gegevens en waarvoor</h2>
<p>Wij verwerken jouw persoonsgegevens uitsluitend voor:</p>
<ul>
  <li><strong>Bestelafhandeling</strong>: naam, adres, e-mail (om je bestelling te verzenden en je orderbevestiging te sturen)</li>
  <li><strong>Klantaccount</strong>: e-mail, naam, bezorgadres (alleen als je een account aanmaakt)</li>
  <li><strong>Betaling</strong>: betaalgegevens worden direct door onze betaalpartner verwerkt — wij ontvangen die niet</li>
  <li><strong>Communicatie</strong>: vragen via e-mail beantwoorden</li>
  <li><strong>Wettelijke verplichting</strong>: factuurgegevens voor de Belastingdienst (7 jaar)</li>
  <li><strong>Site-werking</strong>: technische gegevens (IP, browser) om de site veilig te laten werken en fouten te onderzoeken</li>
</ul>

<h2>3. Op welke grondslag</h2>
<p>Volgens artikel 6 AVG verwerken wij gegevens op basis van: uitvoering van de overeenkomst (bestelling), wettelijke plicht (boekhouding), of jouw toestemming (account).</p>

<h2>4. Met wie delen wij gegevens</h2>
<p>Om onze diensten te leveren werken wij met de volgende verwerkers:</p>
<ul>
  <li><strong>Shopify</strong> (e-commerce platform — webshop en klantaccounts)</li>
  <li><strong>Mollie / PayPal / Shopify Payments</strong> (betalingen)</li>
  <li><strong>Vervoerders</strong> (PostNL of vergelijkbaar — voor bezorging)</li>
  <li><strong>Google Workspace</strong> (e-mail)</li>
  <li><strong>Google Analytics 4</strong> (websitestatistieken — alleen met jouw toestemming)</li>
  <li><strong>Meta Platforms</strong> (advertentiemeting via de Meta Pixel — alleen met jouw toestemming)</li>
  <li><strong>Vercel</strong> (hosting van de website)</li>
</ul>
<p>Met elk van deze partijen hebben wij verwerkersovereenkomsten. Wij verkopen jouw gegevens <strong>niet</strong> aan derden.</p>

<h2>5. Hoe lang bewaren wij gegevens</h2>
<ul>
  <li>Bestelgegevens en facturen: 7 jaar (wettelijke bewaarplicht)</li>
  <li>Klantaccountgegevens: zolang je account actief is, plus 1 jaar na inactiviteit</li>
  <li>E-mailcontact: maximaal 2 jaar</li>
</ul>

<h2>6. Cookies en tracking</h2>
<p>Wij plaatsen cookies in drie categorieën. Je kiest zelf welke je toestaat via de cookiebanner; je keuze pas je altijd aan via <strong>Cookie-instellingen</strong> onderaan elke pagina.</p>
<ul>
  <li><strong>Functioneel (altijd aan)</strong>: noodzakelijk voor winkelwagen, inloggen en beveiliging. Hiervoor is geen toestemming nodig.</li>
  <li><strong>Analytisch</strong>: met jouw toestemming meten wij via Google Analytics 4 hoe de site wordt gebruikt, zodat we hem kunnen verbeteren.</li>
  <li><strong>Marketing</strong>: met jouw toestemming gebruiken wij de Meta Pixel om te meten welke advertenties tot een bezoek of aankoop leiden en om advertenties relevanter te maken.</li>
</ul>
<p>Analytische en marketingcookies worden pas geladen nádat je daarvoor toestemming hebt gegeven. Geef je geen toestemming, dan blijft alleen het functionele deel actief. Je kunt je toestemming op elk moment intrekken via Cookie-instellingen.</p>

<h2>7. Jouw rechten</h2>
<p>Je hebt het recht op inzage, correctie, verwijdering, beperking, overdraagbaarheid en bezwaar tegen verwerking van jouw gegevens. Stuur een mail naar <a href="mailto:info@hlty.shop">info@hlty.shop</a> om gebruik te maken van een van deze rechten. Wij reageren binnen 30 dagen.</p>

<h2>8. Beveiliging</h2>
<p>Onze website werkt uitsluitend over een versleutelde verbinding (HTTPS). Onze verwerkers hanteren actuele beveiligingsstandaarden.</p>

<h2>9. Klachten</h2>
<p>Heb je een klacht over hoe wij met jouw gegevens omgaan? Neem eerst contact op met ons via <a href="mailto:info@hlty.shop">info@hlty.shop</a>. Je hebt daarnaast het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens via <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer">autoriteitpersoonsgegevens.nl</a>.</p>

<h2>10. Wijzigingen</h2>
<p>Wij kunnen deze verklaring aanpassen. De laatste versie staat altijd op deze pagina, met de datum "Laatst bijgewerkt" bovenaan.</p>
`;

const VERZENDING = `
<h2>1. Leveringsgebied</h2>
<p>HLTY richt zich momenteel uitsluitend op leveringen binnen Nederland. Bestellingen met een afleveradres buiten Nederland kunnen op dit moment helaas niet worden verwerkt.</p>

<h2>2. Verwachte bezorging</h2>
<p>Bestellingen worden doorgaans binnen 1 tot 2 werkdagen bezorgd. Deze termijn is indicatief. De uiteindelijke bezorging is mede afhankelijk van het bestelmoment, de beschikbaarheid van het product en onze logistieke partners.</p>

<h2>3. Verzendkosten</h2>
<p>Voor bezorging binnen Nederland betaalt u € 4,95. Bij een bestelbedrag van € 50,00 of hoger is de verzending gratis. De definitieve verzendkosten worden in de checkout getoond voordat u betaalt.</p>

<h2>4. Track &amp; Trace</h2>
<p>Zodra uw pakket is overgedragen aan onze bezorgpartner, ontvangt u per e-mail een Track &amp; Trace-code. Hiermee kunt u de status van uw zending en de verwachte bezorgtijd volgen.</p>

<h2>5. Onjuist adres</h2>
<p>De klant is verantwoordelijk voor het verstrekken van de juiste aflevergegevens. Indien een pakket niet kan worden afgeleverd door een foutief adres, zijn de kosten voor een herhaalde verzending voor rekening van de klant.</p>

<h2>6. Beschadiging bij ontvangst</h2>
<p>Controleer uw pakket direct bij ontvangst. Indien het pakket of de producten beschadigd zijn, verzoeken wij u dit bij voorkeur binnen 48 uur na ontvangst te melden via <a href="mailto:info@hlty.shop">info@hlty.shop</a>, liefst met foto's van de schade. Een latere melding beperkt uw wettelijke rechten niet.</p>
`;

const RETOUR = `
<h2>1. Bedenktijd en herroeping</h2>
<p>U heeft na ontvangst 14 dagen bedenktijd. Binnen die termijn kunt u zonder opgave van reden op iedere ondubbelzinnige manier laten weten dat u de koop wilt herroepen, bijvoorbeeld per e-mail via <a href="mailto:info@hlty.shop?subject=Retour%20aanmelden">info@hlty.shop</a>. Vermeld daarbij bij voorkeur uw ordernummer. Na uw melding heeft u nog 14 dagen om het product terug te sturen.</p>

<h2>2. Gratis retourzending</h2>
<p>HLTY betaalt de kosten van de retourzending. Meld uw retour eerst bij ons aan; u ontvangt daarna de retourinstructies. Bewaar uw verzendbewijs en Track &amp; Trace-code totdat de retour volledig is verwerkt.</p>

<h2>3. Staat van het product en verzegelde producten</h2>
<p>Stuur het product met alle geleverde toebehoren en — voor zover redelijkerwijs mogelijk — in de originele staat en verpakking terug. U mag het product alleen gebruiken voor zover dat nodig is om het te beoordelen. Verdergaand gebruik kan leiden tot waardevermindering, maar laat het herroepingsrecht niet automatisch vervallen.</p>
<p>Het herroepingsrecht vervalt na het verbreken van de verzegeling uitsluitend bij producten die om redenen van gezondheidsbescherming of hygiëne niet geschikt zijn om te worden teruggezonden. Deze uitzondering geldt alleen wanneer het product verzegeld is geleverd en dit vóór aankoop duidelijk bij het product is vermeld.</p>

<h2>4. Zakelijke klanten (B2B)</h2>
<p>Deze retourregels gelden uitsluitend voor consumenten (B2C). Voor zakelijke klanten die via HLTY Pro bestellen, geldt geen wettelijk herroepingsrecht. Eventuele gebreken dienen door zakelijke klanten direct gemeld te worden.</p>

<h2>5. Terugbetaling</h2>
<p>Wij betalen uiterlijk binnen 14 dagen na uw herroepingsmelding en zonder extra kosten terug. Wij mogen wachten totdat wij het product hebben ontvangen of totdat u aantoont dat het is teruggestuurd, afhankelijk van wat het eerst gebeurt. Bij een volledige retour ontvangt u het aankoopbedrag en de standaard bezorgkosten van de heenzending terug. Bij een gedeeltelijke retour worden die oorspronkelijke bezorgkosten niet terugbetaald. De terugbetaling verloopt via dezelfde betaalmethode, tenzij u uitdrukkelijk met een andere methode instemt.</p>

<h2>6. Modelformulier voor herroeping</h2>
<p>U bent niet verplicht dit formulier te gebruiken. Als u dat wel wilt, kunt u onderstaande tekst invullen en per post of e-mail naar HLTY sturen. Het genoemde adres is voor de herroepingsmelding; stuur het product pas terug volgens de retourinstructies die u na aanmelding ontvangt.</p>
<p><strong>Aan:</strong> HLTY VOF, Skrokdam 5, 8918 LB Leeuwarden, <a href="mailto:info@hlty.shop">info@hlty.shop</a></p>
<p>Hierbij deel ik u mede dat ik onze overeenkomst betreffende de verkoop van de volgende producten herroep:</p>
<p><strong>Product(en):</strong> ............................................................</p>
<p><strong>Besteld op / ontvangen op:</strong> ............................................................</p>
<p><strong>Naam consument:</strong> ............................................................</p>
<p><strong>Adres consument:</strong> ............................................................</p>
<p><strong>Datum:</strong> ............................................................</p>
<p><strong>Handtekening:</strong> alleen nodig wanneer u dit formulier op papier indient.</p>
`;

const VOORWAARDEN = `
<h2>1. Toepasselijkheid</h2>
<p>Deze servicevoorwaarden zijn van toepassing op alle aanbiedingen, bestellingen en overeenkomsten van HLTY via de website hlty.shop. Door onze site te bezoeken of iets van ons te kopen, stemt u in met deze voorwaarden.</p>

<h2>2. Gebruik van de website en medische disclaimer</h2>
<ul>
  <li><strong>Geen medisch advies</strong>: de informatie op deze website, in de HLTY.me blog of via onze producten is uitsluitend bedoeld voor algemene informatieve doeleinden. Het is nadrukkelijk geen vervanging voor professionele medische diagnostiek, advies of behandeling door een arts.</li>
  <li><strong>Supplementen</strong>: onze producten zijn voedingssupplementen en geen geneesmiddelen. Ze zijn niet bedoeld om ziekten te diagnosticeren, behandelen of voorkomen.</li>
  <li><strong>Eigen risico</strong>: het gebruik van de producten en het opvolgen van informatie op de website geschiedt volledig op eigen verantwoordelijkheid van de gebruiker.</li>
</ul>

<h2>3. Producten en verkoop</h2>
<ul>
  <li><strong>Aanbod</strong>: wij behouden ons het recht voor om de verkoop van onze producten of diensten te beperken tot een persoon, geografische regio of rechtsgebied.</li>
  <li><strong>Levering</strong>: HLTY richt zich uitsluitend op levering binnen Nederland. Opgegeven levertijden zijn indicatief.</li>
</ul>

<h2>4. Prijzen en betaling</h2>
<p>Alle prijzen voor consumenten zijn inclusief btw. Voor zakelijke klanten (B2B) worden prijzen exclusief btw vermeld. Betaling dient voorafgaand aan de levering te geschieden via de in de checkout aangeboden betaalmethoden.</p>

<h2>5. Zakelijk gebruik (HLTY Pro)</h2>
<p>Voor zakelijke klanten (zoals fysiotherapeuten en gezondheidscentra) die inkopen via HLTY Pro, gelden aanvullende afspraken. Het wettelijke herroepingsrecht voor consumenten is niet van toepassing op zakelijke transacties.</p>

<h2>6. Aansprakelijkheid</h2>
<p>HLTY is niet aansprakelijk voor enige directe of indirecte schade die voortvloeit uit het gebruik van de producten of de verstrekte informatie, tenzij er sprake is van opzet of grove nalatigheid aan de zijde van HLTY. De aansprakelijkheid is in alle gevallen beperkt tot het factuurbedrag van de betreffende bestelling.</p>

<h2>7. Wijzigingen</h2>
<p>HLTY behoudt zich het recht voor om deze servicevoorwaarden op elk moment te wijzigen. Het is de verantwoordelijkheid van de klant om deze pagina regelmatig te controleren op wijzigingen.</p>

<h2>8. Toepasselijk recht</h2>
<p>Op alle overeenkomsten is uitsluitend het Nederlands recht van toepassing.</p>
`;

const CONTACT_INFORMATIE = `
<p><strong>Handelsnaam:</strong> HLTY</p>
<p><strong>Bedrijfsvorm:</strong> Vennootschap Onder Firma (VOF)</p>
<p><strong>Bezoekadres:</strong> Skrokdam 5, 8918 LB Leeuwarden</p>
<p><strong>E-mailadres:</strong> <a href="mailto:info@hlty.shop">info@hlty.shop</a></p>
<p><strong>Telefoonnummer:</strong> <a href="tel:+31648548450">06 48 54 84 50</a></p>
<p><strong>Kamer van Koophandel (KvK) nummer:</strong> 98276441</p>
`;

const WETTELIJKE_KENNISGEVING = `
<h2>Bedrijfsgegevens</h2>
<ul>
  <li><strong>Statutaire naam:</strong> HLTY</li>
  <li><strong>Rechtsvorm:</strong> Vennootschap Onder Firma</li>
  <li><strong>Vestigingsadres:</strong> Skrokdam 5, 8918 LB Leeuwarden, Nederland</li>
  <li><strong>E-mailadres:</strong> <a href="mailto:info@hlty.shop">info@hlty.shop</a></li>
  <li><strong>Telefoonnummer:</strong> <a href="tel:+31648548450">06 48 54 84 50</a></li>
  <li><strong>Website:</strong> www.hlty.shop</li>
</ul>

<h2>Registratie en identificatie</h2>
<ul>
  <li><strong>KvK-nummer:</strong> 98276441</li>
  <li><strong>RSIN:</strong> 868426192</li>
  <li><strong>BTW-identificatienummer:</strong> NL868426192B01</li>
</ul>

<h2>Verantwoordelijken</h2>
<p>Vennoten: Christiaan Ritsema en Stefan Christiaan Ritsema.</p>

<h2>Bedrijfsactiviteiten</h2>
<p>HLTY houdt zich bezig met de online verkoop van voedingssupplementen en fysiotherapie-benodigdheden.</p>
<p>SBI-codes: 47741 (Drogisterij-artikelen) en 47742 (Medische en orthopedische artikelen).</p>
`;

export const POLICIES: Record<PolicySlug, Policy> = {
  privacy: { slug: 'privacy', title: 'Privacyverklaring', body: PRIVACY },
  verzending: { slug: 'verzending', title: 'Verzendbeleid', body: VERZENDING },
  retour: { slug: 'retour', title: 'Retour- en terugbetalingsbeleid', body: RETOUR },
  voorwaarden: { slug: 'voorwaarden', title: 'Servicevoorwaarden', body: VOORWAARDEN },
  'contact-informatie': { slug: 'contact-informatie', title: 'Contactgegevens', body: CONTACT_INFORMATIE },
  'wettelijke-kennisgeving': { slug: 'wettelijke-kennisgeving', title: 'Wettelijke kennisgeving', body: WETTELIJKE_KENNISGEVING },
};

export function getPolicy(slug: string): Policy | null {
  return POLICIES[slug as PolicySlug] ?? null;
}
