import { Link } from 'react-router-dom';
import { ArrowRight, Home } from 'lucide-react';

const SUGGESTED_LINKS = [
  { label: 'Vitamines', href: '/collectie/vitamines-1' },
  { label: 'Fysiotherapie & Herstel', href: '/collectie/fysiotherapie-herstel-1' },
  { label: 'Mijn Account', href: '/account' },
  { label: 'Contact', href: '/contact' },
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <section className="glass-dark rounded-[32px] p-6 sm:p-8 md:p-12 relative overflow-hidden mb-8">
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/15 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-2xl">
          <p
            className="text-7xl sm:text-8xl md:text-9xl font-extrabold text-[var(--color-primary)] leading-none mb-4"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            404
          </p>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.05]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Deze pagina bestaat niet.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
            Mogelijk volg je een verouderde link of is er een typo in de URL.
          </p>

          <div className="mt-8">
            <Link
              to="/"
              className="btn-primary inline-flex items-center gap-3 px-7 py-3.5 text-sm group"
            >
              <Home className="w-4 h-4" />
              <span>Terug naar home</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="text-center py-8">
        <p className="text-sm text-[var(--color-muted)] mb-4 uppercase tracking-widest font-semibold">
          Of bekijk deze populaire pagina's
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {SUGGESTED_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="px-5 py-2.5 rounded-full glass text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-primary-dark)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
