// SEO-helper voor per-pagina meta-tags.
//
// Gebouwd op React 19's native hoisting van <title>, <meta> en <link>
// — geen externe library nodig. React zet de tags vanzelf in <head>
// en dedupeert op key.
//
// Wat erin gaat:
//  - title (verplicht)         — wordt aangevuld met " | HLTY" tenzij die er al staat
//  - description (verplicht)   — max 160 char aanbevolen voor Google snippet
//  - path (verplicht)          — pad zonder hostname; gebruikt voor canonical + og:url
//  - image (optioneel)         — absolute URL of pad onder /public; default = brand OG
//  - type (optioneel)          — Open Graph type, 'website' (default) of 'product'
//  - noindex (optioneel)       — robots meta op 'noindex' bv. voor /account, /welkom
//
// Single source of truth voor de canonical hostname:

const SITE_URL = 'https://www.hlty.shop';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/hlty-banner.png`;
const BRAND_SUFFIX = ' | HLTY';

interface SEOProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'product';
  noindex?: boolean;
}

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function withBrandSuffix(title: string): string {
  if (/hlty/i.test(title)) return title;
  if (title.includes('|')) return title;
  return `${title}${BRAND_SUFFIX}`;
}

export default function SEO({ title, description, path, image, type = 'website', noindex }: SEOProps) {
  const fullTitle = withBrandSuffix(title);
  const canonical = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="HLTY" />
      <meta property="og:locale" content="nl_NL" />

      {/* Twitter card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}
