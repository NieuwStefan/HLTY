import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Dumbbell,
  ArrowRight, Leaf, CheckCircle, ShieldCheck, Truck,
  Award, FlaskConical, Pill, Apple, Cross, Search, ClipboardCheck, PackageCheck,
} from 'lucide-react';
import AIAdvisor from '../components/AIAdvisor';
import ProductCard from '../components/ProductCard';
import { getFeaturedProducts, type Product } from '../lib/shopify';

// ---------- Data ----------

const FEATURED_COLLECTIONS = [
  { handle: 'vitamines-1', label: 'Vitamines', icon: Pill, color: '#FF9500' },
  { handle: 'mineralen-1', label: 'Mineralen', icon: Zap, color: '#007AFF' },
  { handle: 'eiwitten-aminozuren-1', label: 'Eiwitten', icon: Dumbbell, color: '#FF3B30' },
  { handle: 'kruiden-planten-1', label: 'Kruiden & Planten', icon: Leaf, color: '#34C759' },
  { handle: 'superfoods-1', label: 'Superfoods', icon: Apple, color: '#5E5CE6' },
  { handle: 'fysiotherapie-herstel-1', label: 'Fysiotherapie & Herstel', icon: Cross, color: '#AF52DE' },
];

const TRUST_STATS = [
  { value: '900+', label: 'Producten', icon: FlaskConical },
  { value: '100%', label: 'Physio-expertise', icon: ShieldCheck },
  { value: 'Gratis', label: 'Verzending vanaf €50', icon: Truck },
  { value: '4.8/5', label: 'Klantwaardering', icon: Award },
];

const SELECTION_STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'We screenen het aanbod',
    desc: 'Uit duizenden supplementen op de markt selecteren we alleen producten met een eerlijke formule en transparante etikettering.',
    color: '#007AFF',
  },
  {
    step: '02',
    icon: ClipboardCheck,
    title: 'Fysio\'s beoordelen',
    desc: 'Onze fysiotherapeuten toetsen elk product op werkzame ingrediënten, doseringen en wetenschappelijke onderbouwing.',
    color: '#00D1A0',
  },
  {
    step: '03',
    icon: PackageCheck,
    title: 'Alleen wat werkt',
    desc: 'Pas als een product écht toegevoegde waarde heeft, komt het in ons assortiment. Geen marketingclaims, geen onnodige toevoegingen.',
    color: '#FF9500',
  },
];


// ---------- Component ----------

export default function Home() {
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFeaturedProducts(6)
      .then((products) => {
        if (cancelled) return;
        setBestsellers(products);
      })
      .catch(() => {
        if (cancelled) return;
        setBestsellers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero — split layout met productfoto */}
      <section className="relative">
        <div className="mx-auto max-w-[1400px] px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-dark rounded-[32px] p-6 sm:p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />

            <div className="relative z-10 grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center">
              {/* Tekst links */}
              <div className="text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest mb-6"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Geselecteerd door fysiotherapeuten
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.05]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Welk supplement
                  <br />
                  <span className="text-[var(--color-primary)]">past bij jou?</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 text-base sm:text-lg text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                >
                  Onze fysiotherapeuten selecteerden uit duizenden supplementen
                  alleen wat écht werkt. Helder, eerlijk en zonder marketingclaims.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                >
                  <Link to="/alle-producten" className="btn-primary px-7 py-3.5 text-sm gap-2">
                    Ontdek producten
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#productadvies"
                    className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white border border-white/40 bg-white/5 rounded-full hover:bg-white/15 hover:border-white/60 transition-all"
                  >
                    Vind jouw supplement
                  </a>
                </motion.div>
              </div>

              {/* Afbeelding rechts — uitgelijnd aan onderkant van hero, met groene gradient erachter */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative flex items-end justify-center self-end -mb-6 sm:-mb-8 md:-mb-12"
              >
                {/* Groene gradient achter de afbeelding (zowel desktop als mobiel) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[420px] h-[420px] bg-[var(--color-primary)]/30 rounded-full blur-[110px]" />
                </div>
                <img
                  src="/images/hlty-banner.png"
                  alt="HLTY — geselecteerd door fysiotherapeuten"
                  className="relative w-full max-w-[560px] h-auto object-contain block"
                  loading="eager"
                  fetchPriority="high"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="mx-auto max-w-[1400px] px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="card flex items-center gap-4 p-5 hover:transform-none"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                <stat.icon className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-[var(--color-navy)]" style={{ fontFamily: 'Montserrat' }}>
                  {stat.value}
                </p>
                <p className="text-xs text-[var(--color-muted)]">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Collections */}
      <section className="mx-auto max-w-[1400px] px-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8" style={{ fontFamily: 'Montserrat' }}>
          Shop per categorie
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {FEATURED_COLLECTIONS.map((col, i) => (
            <motion.div
              key={col.handle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/collectie/${col.handle}`}
                className="card flex flex-col items-center gap-3 p-6 text-center group"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${col.color}15` }}
                >
                  <col.icon className="w-6 h-6" style={{ color: col.color }} />
                </div>
                <span className="text-sm font-semibold text-[var(--color-navy)] group-hover:text-[var(--color-primary)] transition-colors">
                  {col.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Populair op HLTY — Bestsellers */}
      {(loadingProducts || bestsellers.length > 0) && (
        <section className="mx-auto max-w-[1400px] px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
                Populair op HLTY
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Montserrat' }}>
                Onze meestgekozen producten
              </h2>
            </div>
            <Link
              to="/collectie/vitamines-1"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:gap-2 transition-all"
            >
              Bekijk alles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-0 animate-pulse">
                  <div className="aspect-square bg-[var(--color-muted)]/10" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-1/3 bg-[var(--color-muted)]/15 rounded" />
                    <div className="h-4 w-3/4 bg-[var(--color-muted)]/15 rounded" />
                    <div className="h-4 w-1/4 bg-[var(--color-muted)]/15 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {bestsellers.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Persoonlijk Productadvies */}
      <section id="productadvies" className="mx-auto max-w-[1400px] px-4 scroll-mt-28">
        <AIAdvisor />
      </section>

      {/* Zo selecteren wij ons assortiment */}
      <section className="mx-auto max-w-[1400px] px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest mb-4"
          >
            Onze werkwijze
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Montserrat' }}>
            Zo selecteren wij ons assortiment
          </h2>
          <p className="text-[var(--color-muted)] mt-3 max-w-xl mx-auto">
            Je vindt bij HLTY geen overvolle schappen. Wel een zorgvuldig samengestelde
            collectie die door professionals is gewogen — stap voor stap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
          {SELECTION_STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-7 relative"
            >
              <span
                className="absolute top-6 right-6 text-4xl font-extrabold text-[var(--color-muted)]/15"
                style={{ fontFamily: 'Montserrat' }}
              >
                {step.step}
              </span>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${step.color}15` }}
              >
                <step.icon className="w-6 h-6" style={{ color: step.color }} />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-navy)]" style={{ fontFamily: 'Montserrat' }}>
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust / CTA Banner */}
      <section className="mx-auto max-w-[1400px] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-dark rounded-[28px] p-8 sm:p-12 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/15 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px]" />

          <div className="relative z-10">
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-white"
              style={{ fontFamily: 'Montserrat' }}
            >
              Klaar om te beginnen?
            </h2>
            <p className="mt-3 text-white/60 max-w-md mx-auto">
              Ontdek ons volledige assortiment of laat je adviseren door onze supplement-assistent.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <CheckCircle className="w-4 h-4 text-[var(--color-primary)]" />
                Gratis verzending vanaf €50
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <CheckCircle className="w-4 h-4 text-[var(--color-primary)]" />
                30 dagen retourgarantie
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <CheckCircle className="w-4 h-4 text-[var(--color-primary)]" />
                Veilig betalen
              </div>
            </div>

            <div className="mt-8">
              <Link to="/alle-producten" className="btn-primary px-8 py-4 text-sm gap-2">
                Bekijk alle producten
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
