import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { getMenu, type Menu } from '../lib/shopify';

const CATEGORY_LINKS = [
  { label: 'Vitamines', href: '/collectie/vitamines-1' },
  { label: 'Mineralen', href: '/collectie/mineralen-1' },
  { label: 'Eiwitten', href: '/collectie/eiwitten-aminozuren-1' },
  { label: 'Kruiden & Planten', href: '/collectie/kruiden-planten-2' },
  { label: 'Fysiotherapie', href: '/collectie/fysiotherapie-herstel-1' },
];

const GOAL_LINKS = [
  { label: 'Energie', href: '/collectie/energie-1' },
  { label: 'Weerstand', href: '/collectie/weerstand-1' },
  { label: 'Hart & Vaten', href: '/collectie/hart-vaten-organen-1' },
  { label: 'Geheugen & Focus', href: '/collectie/geheugen-focus-1' },
  { label: 'Balans', href: '/collectie/balans' },
];

export default function Footer() {
  const [footerMenu, setFooterMenu] = useState<Menu | null>(null);

  useEffect(() => {
    getMenu('footer').then(setFooterMenu).catch(console.error);
  }, []);

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

            {/* Klantenservice (from Shopify footer menu) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                Klantenservice
              </h4>
              <ul className="space-y-2.5">
                {footerMenu?.items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {item.title}
                    </a>
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
