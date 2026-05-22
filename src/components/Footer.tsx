import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';

const CATEGORY_LINKS = [
  { label: 'Vitamines', href: '/collectie/vitamines-1' },
  { label: 'Mineralen', href: '/collectie/mineralen-1' },
  { label: 'Eiwitten', href: '/collectie/eiwitten-aminozuren-1' },
  { label: 'Kruiden & Planten', href: '/collectie/kruiden-planten-1' },
  { label: 'Fysiotherapie & Herstel', href: '/collectie/fysiotherapie-herstel-1' },
];

const GOAL_LINKS = [
  { label: 'Energie', href: '/collectie/energie-1' },
  { label: 'Weerstand', href: '/collectie/weerstand-1' },
  { label: 'Hart & Vaten', href: '/collectie/hart-vaten-organen-1' },
  { label: 'Geheugen & Focus', href: '/collectie/geheugen-focus-1' },
  { label: 'Balans', href: '/collectie/balans' },
];

const SERVICE_LINKS = [
  { label: 'Veelgestelde vragen', href: '/veelgestelde-vragen' },
  { label: 'Verzendbeleid', href: '/beleid/verzending' },
  { label: 'Retour- en terugbetalingsbeleid', href: '/beleid/retour' },
  { label: 'Servicevoorwaarden', href: '/beleid/voorwaarden' },
  { label: 'Privacyverklaring', href: '/beleid/privacy' },
  { label: 'Contactgegevens', href: '/beleid/contact-informatie' },
  { label: 'Wettelijke kennisgeving', href: '/beleid/wettelijke-kennisgeving' },
  { label: 'Contact', href: '/contact' },
];

export default function Footer() {
  return (
    <footer className="mt-20">
      <div className="glass-dark rounded-t-[32px]">
        <div className="mx-auto max-w-[1400px] px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <img src="/logo-white.png" alt="HLTY" className="h-8" />
              <p className="mt-4 text-sm text-white/60 max-w-sm leading-relaxed">
                Duidelijkheid in zelfzorg. Supplementen, fysiotherapie &amp; herstelproducten
                geselecteerd met physio-expertise.
              </p>
              <div className="mt-6 space-y-3">
                <a
                  href="mailto:info@hlty.shop"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-[var(--color-primary)] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  info@hlty.shop
                </a>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <MapPin className="w-4 h-4" />
                  Skrokdam 5, 8918LB Leeuwarden
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                Categorieën
              </h4>
              <ul className="space-y-2.5">
                {CATEGORY_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Goals */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                Gezondheidsdoelen
              </h4>
              <ul className="space-y-2.5">
                {GOAL_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Klantenservice */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                Klantenservice
              </h4>
              <ul className="space-y-2.5">
                {SERVICE_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} HLTY — VOF — KvK 98276441
            </p>
            <p className="text-xs text-white/40">
              Alle prijzen zijn inclusief BTW
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
