import { useParams, Link, Navigate } from 'react-router-dom';
import { getPolicy } from '../lib/policy-content';
import SEO from '../components/SEO';

const POLICY_DESCRIPTIONS: Record<string, string> = {
  privacy: 'Hoe HLTY met je persoonsgegevens omgaat — onze privacyverklaring.',
  verzending: 'Verzending bij HLTY: gratis vanaf €50, levertijden en bezorgopties.',
  retour: 'Retourneren bij HLTY: voorwaarden, termijnen en terugbetaling.',
  voorwaarden: 'Onze servicevoorwaarden — afspraken voor het gebruik van hlty.shop.',
  'contact-informatie': 'Contactgegevens van HLTY — bedrijfsadres en bereikbaarheid.',
  'wettelijke-kennisgeving': 'Wettelijke kennisgeving en bedrijfsinformatie van HLTY.',
};

export default function Policy() {
  const { slug } = useParams<{ slug: string }>();
  const policy = slug ? getPolicy(slug) : null;

  if (!policy) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SEO
        title={policy.title}
        description={POLICY_DESCRIPTIONS[policy.slug] || `${policy.title} — HLTY.`}
        path={`/beleid/${policy.slug}`}
      />
    <div className="mx-auto max-w-3xl px-6">
      <nav className="text-xs text-[var(--color-muted)] mb-6">
        <Link to="/" className="hover:text-[var(--color-navy)] transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-navy)]">{policy.title}</span>
      </nav>

      <div className="card p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-[var(--color-navy)]">
          {policy.title}
        </h1>

        <article
          className="prose-hlty"
          dangerouslySetInnerHTML={{ __html: policy.body }}
        />
      </div>
    </div>
    </>
  );
}
