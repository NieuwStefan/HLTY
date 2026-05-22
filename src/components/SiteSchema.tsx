// Organization + WebSite JSON-LD voor alle pagina's.
//
// Wordt eenmaal in App.tsx ge-mount zodat elke route hetzelfde
// globale schema deelt. Voor pagina-specifieke schemas (Product,
// BreadcrumbList, ItemList) gebruik <JsonLd /> op de pagina zelf.
//
// TODO Stefan — vul aan met echte bedrijfsgegevens:
//   - KvK-nummer (vereist voor Wettelijke kennisgeving + Schema legalName)
//   - Telefoon en e-mail voor contactPoint
//   - Sociale-media-URLs voor sameAs (Instagram, Facebook, LinkedIn, etc.)
// De huidige placeholders worden door Google getolereerd maar lever
// minder rich-result-eigenschappen op.

import JsonLd from './JsonLd';

const SITE_URL = 'https://www.hlty.shop';

const organization = {
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  '@id': `${SITE_URL}/#organization`,
  name: 'HLTY',
  alternateName: 'HLTY — Duidelijkheid in zelfzorg',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/images/hlty-banner.png`,
  description:
    'Supplementen, voeding en fysiotherapie-accessoires, geselecteerd door fysiotherapeuten. Alleen wat écht werkt — helder, eerlijk en zonder marketingclaims.',
  slogan: 'Duidelijkheid in zelfzorg',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@hlty.shop',
      telephone: '+31648548450',
      availableLanguage: ['Dutch'],
    },
  ],
  // Aanvullende velden bewust nog niet ingevuld (KvK, adres, sameAs).
  // Voeg toe wanneer Stefan deze in het schema wil opnemen — KvK en
  // adres staan al wel in `src/lib/policy-content.ts` voor de wettelijke
  // kennisgeving, dus content-zijde is gedekt.
};

const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: 'HLTY',
  inLanguage: 'nl-NL',
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/zoeken?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function SiteSchema() {
  return <JsonLd data={[organization, website]} />;
}
