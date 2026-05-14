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
<p><em>Laatst bijgewerkt: 14 mei 2026</em></p>

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
  <li><strong>Vercel</strong> (hosting van de website)</li>
</ul>
<p>Met elk van deze partijen hebben wij verwerkersovereenkomsten. Wij verkopen jouw gegevens <strong>niet</strong> aan derden.</p>

<h2>5. Hoe lang bewaren wij gegevens</h2>
<ul>
  <li>Bestelgegevens en facturen: 7 jaar (wettelijke bewaarplicht)</li>
  <li>Klantaccountgegevens: zolang je account actief is, plus 1 jaar na inactiviteit</li>
  <li>E-mailcontact: maximaal 2 jaar</li>
</ul>

<h2>6. Cookies</h2>
<p>Wij gebruiken functionele cookies (winkelwagen, login) en beperkte analytische cookies om de site te verbeteren. Geen tracking voor advertenties.</p>

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

<h2>2. Verwerkingstijd</h2>
<p>Wij streven ernaar om bestellingen zo snel mogelijk te verwerken. In de regel wordt uw bestelling binnen 1 tot 2 werkdagen gereedgemaakt voor verzending.</p>

<h2>3. Levertijden</h2>
<p>De opgegeven levertijden op de website zijn indicatief. Omdat HLTY werkt met een gecureerd assortiment van eigen producten en hoogwaardige partners, kan de levertijd variëren per producttype. Wij doen ons uiterste best om de indicatieve levertijd te halen, maar zijn hierbij mede afhankelijk van onze logistieke partners.</p>

<h2>4. Verzendkosten</h2>
<p>De verzendkosten worden duidelijk weergegeven in de checkout voordat u de betaling definitief maakt. Deze kosten kunnen variëren op basis van het gewicht van de bestelling of de gekozen verzendmethode.</p>

<h2>5. Track &amp; Trace</h2>
<p>Zodra uw pakket is overgedragen aan onze bezorgpartner, ontvangt u per e-mail een Track &amp; Trace-code. Hiermee kunt u de status van uw zending en de verwachte bezorgtijd volgen.</p>

<h2>6. Onjuist adres</h2>
<p>De klant is verantwoordelijk voor het verstrekken van de juiste aflevergegevens. Indien een pakket niet kan worden afgeleverd door een foutief adres, zijn de kosten voor een herhaalde verzending voor rekening van de klant.</p>

<h2>7. Beschadiging bij ontvangst</h2>
<p>Controleer uw pakket direct bij ontvangst. Indien het pakket of de producten beschadigd zijn, verzoeken wij u dit binnen 48 uur na ontvangst te melden via <a href="mailto:info@hlty.shop">info@hlty.shop</a>, bij voorkeur met foto's van de schade.</p>
`;

const RETOUR = `
<h2>1. Bedenktijd en herroeping</h2>
<p>U heeft het recht om uw bestelling tot 14 dagen na ontvangst zonder opgave van reden te annuleren. Na annulering heeft u nogmaals 14 dagen om het product retour te sturen. U krijgt dan het volledige orderbedrag inclusief verzendkosten gecrediteerd. Indien u gebruikmaakt van uw herroepingsrecht, zal het product met alle geleverde toebehoren en — indien redelijkerwijze mogelijk — in de originele staat en verpakking aan HLTY geretourneerd worden.</p>

<h2>2. Uitsluiting recht van retour (verzegelde producten)</h2>
<p>Conform de wettelijke richtlijnen voor gezondheidsbescherming en hygiëne, is het herroepingsrecht niet van toepassing op de volgende producten zodra de verzegeling na levering is verbroken:</p>
<ul>
  <li><strong>Voedingssupplementen</strong>: supplementen waarvan de verzegeling (seal) is verbroken, kunnen om redenen van gezondheidsbescherming niet worden teruggenomen.</li>
  <li><strong>Hygiënische producten</strong>: fysiotherapie- en herstelproducten (zoals foam rollers of oefenbanden) die om hygiënische redenen verzegeld zijn geleverd, kunnen niet worden geretourneerd als de verzegeling is verbroken.</li>
</ul>

<h2>3. Zakelijke klanten (B2B)</h2>
<p>Deze retourregels gelden uitsluitend voor consumenten (B2C). Voor zakelijke klanten die via HLTY Pro bestellen, geldt geen wettelijk herroepingsrecht. Eventuele gebreken dienen door zakelijke klanten direct gemeld te worden.</p>

<h2>4. Terugbetaling</h2>
<p>Zodra wij uw retourzending hebben ontvangen en gecontroleerd op de intacte verzegeling, storten wij het verschuldigde bedrag binnen 14 dagen terug via de oorspronkelijke betaalmethode.</p>
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
<p><strong>Kamer van Koophandel (KvK) nummer:</strong> 98276441</p>
`;

const WETTELIJKE_KENNISGEVING = `
<h2>Bedrijfsgegevens</h2>
<ul>
  <li><strong>Statutaire naam:</strong> HLTY</li>
  <li><strong>Rechtsvorm:</strong> Vennootschap Onder Firma</li>
  <li><strong>Vestigingsadres:</strong> Skrokdam 5, 8918 LB Leeuwarden, Nederland</li>
  <li><strong>E-mailadres:</strong> <a href="mailto:info@hlty.shop">info@hlty.shop</a></li>
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
