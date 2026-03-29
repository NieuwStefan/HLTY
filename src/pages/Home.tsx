import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Dumbbell,
  ArrowRight, Sparkles, Leaf, CheckCircle, ShieldCheck, Truck,
  Award, FlaskConical, Pill, Apple, Cross,
} from 'lucide-react';
import AIAdvisor from '../components/AIAdvisor';

// ---------- Data ----------

const FEATURED_COLLECTIONS = [
  { handle: 'vitamines-1', label: 'Vitamines', icon: Pill, color: '#FF9500' },
  { handle: 'mineralen-1', label: 'Mineralen', icon: Zap, color: '#007AFF' },
  { handle: 'eiwitten-aminozuren-1', label: 'Eiwitten', icon: Dumbbell, color: '#FF3B30' },
  { handle: 'kruiden-planten-2', label: 'Kruiden & Planten', icon: Leaf, color: '#34C759' },
  { handle: 'superfoods-1', label: 'Superfoods', icon: Apple, color: '#5E5CE6' },
  { handle: 'fysiotherapie-herstel-1', label: 'Fysiotherapie', icon: Cross, color: '#AF52DE' },
];

const TRUST_STATS = [
  { value: '900+', label: 'Producten', icon: FlaskConical },
  { value: '100%', label: 'Physio-expertise', icon: ShieldCheck },
  { value: 'Gratis', label: 'Verzending vanaf €50', icon: Truck },
  { value: '4.8/5', label: 'Klantwaardering', icon: Award },
];

const CORE_VALUES = [
  {
    icon: ShieldCheck,
    title: 'Geselecteerd door professionals',
    desc: 'Elk product in ons assortiment is zorgvuldig gekozen en goedgekeurd door gediplomeerde fysiotherapeuten. Geen marketing-hypes, alleen wat echt werkt.',
    color: '#00D1A0',
  },
  {
    icon: FlaskConical,
    title: 'Bewezen formules',
    desc: 'Wij kiezen uitsluitend producten met wetenschappelijk onderbouwde ingrediënten in de juiste doseringen. Geen onnodige toevoegingen.',
    color: '#007AFF',
  },
  {
    icon: Award,
    title: 'Premium kwaliteit',
    desc: 'Alleen de beste merken en hoogste kwaliteitsstandaarden. Van grondstof tot eindproduct — transparant en traceerbaar.',
    color: '#FF9500',
  },
  {
    icon: Leaf,
    title: 'Duurzaam & bewust',
    desc: 'Wij bieden een breed vegan assortiment en kiezen waar mogelijk voor duurzame verpakkingen en verantwoorde productie.',
    color: '#5E5CE6',
  },
];


// ---------- Component ----------

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-[1400px] px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-dark rounded-[32px] p-8 sm:p-12 md:p-20 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-primary)]/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-sm font-semibold mb-8"
              >
                <Sparkles className="w-4 h-4" />
                Geselecteerd door fysiotherapeuten
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Duidelijkheid
                <br />
                <span className="text-[var(--color-primary)]">in zelfzorg</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-lg text-white/60 max-w-xl mx-auto"
              >
                Premium supplementen & fysiotherapieproducten. Geen marketing-hypes,
                alleen wat echt werkt — geselecteerd met physio-expertise.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link to="/collectie/vitamines-1" className="btn-primary px-8 py-4 text-sm gap-2">
                  Ontdek producten
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#configurator" className="btn-secondary px-8 py-4 text-sm text-white/80 hover:!bg-white/10">
                  Vind jouw supplement
                </a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="mx-auto max-w-[1400px] px-4 -mt-8">
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

      {/* AI Productadviseur */}
      <section id="configurator" className="mx-auto max-w-[1400px] px-4 scroll-mt-28">
        <AIAdvisor />
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

      {/* Core Values */}
      <section className="mx-auto max-w-[1400px] px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest mb-4"
          >
            Waarom HLTY
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Montserrat' }}>
            Onze kernwaarden
          </h2>
          <p className="text-[var(--color-muted)] mt-2 max-w-lg mx-auto">
            Bij HLTY draait alles om eerlijkheid, kwaliteit en resultaat. Dit is waar wij voor staan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CORE_VALUES.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card p-7 hover:!shadow-lg"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${value.color}12` }}
              >
                <value.icon className="w-6 h-6" style={{ color: value.color }} />
              </div>
              <h3 className="text-base font-bold text-[var(--color-navy)]" style={{ fontFamily: 'Montserrat' }}>
                {value.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">
                {value.desc}
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
              <Link to="/collectie/vitamines-1" className="btn-primary px-8 py-4 text-sm gap-2">
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
