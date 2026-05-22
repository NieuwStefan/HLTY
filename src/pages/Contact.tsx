import { Link } from 'react-router-dom';
import { Mail, MapPin, Building2, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';

export default function Contact() {
  return (
    <>
    <SEO
      title="Contact"
      description="Vragen over een product, bestelling of advies nodig? Neem contact op met HLTY — we helpen je graag."
      path="/contact"
    />
    <div className="mx-auto max-w-5xl px-6">
      <nav className="text-xs text-[var(--color-muted)] mb-8">
        <Link to="/" className="hover:text-[var(--color-navy)] transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-navy)]">Contact</span>
      </nav>

      {/* Hero — donkere glass-dark banner in HLTY-stijl, gelijk aan Home */}
      <section className="glass-dark rounded-[32px] p-6 sm:p-8 md:p-12 relative overflow-hidden mb-8">
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/15 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-2xl">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.05]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Heb je een vraag?
            <br />
            <span className="text-[var(--color-primary)]">We helpen je graag verder.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
            Over een bestelling, een product, of advies bij het kiezen — laat van je
            horen en we komen er samen uit. Persoonlijk, kort op de bal en zonder gedoe.
          </p>

          <div className="mt-8">
            <a
              href="mailto:info@hlty.shop"
              className="btn-primary inline-flex items-center gap-3 px-7 py-3.5 text-sm group"
            >
              <Mail className="w-4 h-4" />
              <span>info@hlty.shop</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      {/* Info-grid: Adres + Bedrijfsgegevens */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="card p-8">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[var(--color-primary-dark)]" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-2">
                Adres
              </h2>
              <p className="text-base font-medium text-[var(--color-navy)] leading-relaxed">
                Skrokdam 5<br />
                8918 LB Leeuwarden<br />
                Nederland
              </p>
            </div>
          </div>
        </div>

        <div className="card p-8">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[var(--color-primary-dark)]" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-2">
                Bedrijfsgegevens
              </h2>
              <p className="text-base font-medium text-[var(--color-navy)] leading-relaxed">
                HLTY — Vennootschap Onder Firma<br />
                KvK 98276441
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick-links naar veelgevraagde info */}
      <section className="text-center py-8">
        <p className="text-sm text-[var(--color-muted)] mb-4 uppercase tracking-widest font-semibold">
          Mogelijk vind je hier al je antwoord
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/beleid/verzending"
            className="px-5 py-2.5 rounded-full glass text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-primary-dark)] transition-colors"
          >
            Verzendbeleid
          </Link>
          <Link
            to="/beleid/retour"
            className="px-5 py-2.5 rounded-full glass text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-primary-dark)] transition-colors"
          >
            Retour & terugbetaling
          </Link>
          <Link
            to="/beleid/privacy"
            className="px-5 py-2.5 rounded-full glass text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-primary-dark)] transition-colors"
          >
            Privacyverklaring
          </Link>
          <Link
            to="/beleid/voorwaarden"
            className="px-5 py-2.5 rounded-full glass text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-primary-dark)] transition-colors"
          >
            Servicevoorwaarden
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}
