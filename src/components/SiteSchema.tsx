// Organization + WebSite JSON-LD voor alle pagina's.
//
// Wordt eenmaal in App.tsx ge-mount zodat elke route hetzelfde
// globale schema deelt. Voor pagina-specifieke schemas (Product,
// BreadcrumbList, ItemList) gebruik <JsonLd /> op de pagina zelf.
//
// Bedrijfsgegevens (KvK, RSIN, BTW, adres) komen uit het KvK-uittreksel
// en zijn gelijk aan de wettelijke kennisgeving in src/lib/policy-content.ts.
// Nog open: sameAs (Instagram/Facebook/LinkedIn) zodra die accounts bestaan.

import JsonLd from './JsonLd';

const SITE_URL = 'https://www.hlty.shop';

const organization = {
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  '@id': `${SITE_URL}/#organization`,
  name: 'HLTY',
  legalName: 'HLTY VOF',
  alternateName: 'HLTY — Duidelijkheid in zelfzorg',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/og-image.jpg`,
  description:
    'Supplementen, voeding en fysiotherapie-accessoires, geselecteerd door fysiotherapeuten. Alleen wat écht werkt — helder, eerlijk en zonder marketingclaims.',
  slogan: 'Duidelijkheid in zelfzorg',
  taxID: '868426192',
  vatID: 'NL868426192B01',
  identifier: {
    '@type': 'PropertyValue',
    propertyID: 'KvK',
    value: '98276441',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Skrokdam 5',
    postalCode: '8918 LB',
    addressLocality: 'Leeuwarden',
    addressCountry: 'NL',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@hlty.shop',
      telephone: '+31648548450',
      availableLanguage: ['Dutch'],
    },
  ],
  // sameAs (social-profielen) volgt zodra Stefan Instagram/Facebook/
  // LinkedIn heeft aangemaakt — voeg dan een sameAs-array toe.
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
