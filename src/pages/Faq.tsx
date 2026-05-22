import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import JsonLd from '../components/JsonLd';

interface Faq {
  q: string;
  a: string;
}

// 8 vragen die GEO-impact maken: AI-assistenten kunnen deze antwoorden
// citeren wanneer een gebruiker vraagt "hoe werkt HLTY", "wat is het
// verschil tussen HLTY en een drogist", etc.
//
// Antwoorden zijn bewust feitelijk, kort en zonder marketingclaims —
// volgt HLTY's positionering uit het Fase-7-verslag en de Health
// Consultation-disclaimers.

const FAQS: Faq[] = [
  {
    q: 'Hoe selecteert HLTY producten?',
    a: 'Onze fysiotherapeuten beoordelen elk product op werkzame ingrediënten, doseringen en wetenschappelijke onderbouwing. Alleen producten met een eerlijke formule en transparante etikettering komen in het assortiment. Selectie verloopt in drie stappen: screening van de markt op aanbod en kwaliteit, beoordeling door fysiotherapeuten op inhoudelijke werking, en een finale check op marketingclaims en onnodige toevoegingen.',
  },
  {
    q: 'Wat is het verschil tussen HLTY en een drogist?',
    a: 'Drogisterijen voeren een breed assortiment — ook producten met dunne wetenschappelijke onderbouwing of veel marketingclaims. HLTY heeft een gecureerd assortiment: alleen producten die door fysiotherapeuten zijn getoetst en daadwerkelijk iets toevoegen. Geen "goedkoop, dus we voeren het"-logica en geen claims overgenomen van leveranciers zonder eigen toetsing.',
  },
  {
    q: 'Hoe weet ik welke supplementen ik nodig heb?',
    a: 'Onze HLTY Health Consultation is een gratis productadvisor: in vier stappen — gezondheidsdoel, specifieke vraag, dieetwensen, leefstijl — krijg je een persoonlijk advies met een top drie producten en uitleg. Het advies is door fysiotherapeuten gecureerd, niet door AI gegenereerd, en geeft bij dezelfde antwoorden altijd dezelfde aanbevelingen. Geen account of e-mailadres nodig.',
  },
  {
    q: 'Wanneer is een supplement zinvol — en wanneer niet?',
    a: 'Een supplement is zinvol wanneer dieet, leefstijl of gezondheidssituatie een aantoonbaar tekort of een verhoogde behoefte oplevert. Voorbeelden: vitamine B12 bij een vegan eetpatroon, magnesium bij sportieve belasting, of vitamine D3 in de winter. Een supplement is niet zinvol als compensatie voor een onevenwichtig dieet, voor algemene "meer is beter"-redenen, of zonder duidelijk doel. Bij twijfel raadpleeg eerst een huisarts of diëtist.',
  },
  {
    q: 'Wat betekent "geselecteerd door fysiotherapeuten"?',
    a: 'Onze fysiotherapeuten zijn vanuit hun klinische werk op de hoogte van de werkzame stoffen in supplementen. Zij toetsen elk product op of de ingrediënten in een effectieve dosering aanwezig zijn, of de samenstelling klopt, en of de leverancier transparant is over herkomst en productie. Het is geen advies-relatie tussen jou en een fysiotherapeut — wel een professionele inhoudelijke check vóór een product in het assortiment komt.',
  },
  {
    q: 'Maakt HLTY eigen supplementen of verkopen jullie alleen andere merken?',
    a: 'Beide. Onder het eigen merk HLTY bieden we een geselecteerd basisassortiment. Daarnaast voeren we merken zoals Mattisson, Orthica, Royal Green, ESN, Fittergy en Toco Tholin — geen onnodige overlap met onze eigen lijn, wel aanvulling op specifieke behoeften zoals sport-eiwit, doseringsvarianten of specialistische formules.',
  },
  {
    q: 'Zijn jullie producten medisch onderbouwd?',
    a: 'Onze fysiotherapeuten toetsen op wetenschappelijke onderbouwing van de werkzame ingrediënten en doseringen. Dat is geen vervanging voor medisch advies: HLTY doet géén medische claims en raadt bij twijfel altijd aan een huisarts, diëtist of behandelend specialist te raadplegen. Supplementen ondersteunen — zij genezen niet.',
  },
  {
    q: 'Hoe vergelijken jullie producten zich met goedkopere supplementen elders?',
    a: 'Een lagere prijs zegt iets over kostprijs, niet altijd over kwaliteit. Goedkopere supplementen gebruiken vaak minder goed opneembare vormen, lagere doseringen of meer vulstoffen. Wij selecteren juist op werkzame vorm en effectieve dosering — dat is doorgaans iets duurder. Voor wie prijs zwaarder weegt dan formule kan een drogisterij-product passen; wij positioneren ons voor klanten waarvoor "wat werkt" belangrijker is dan de laagste prijs.',
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hlty.shop/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Veelgestelde vragen',
        item: 'https://www.hlty.shop/veelgestelde-vragen',
      },
    ],
  };

  return (
    <>
      <SEO
        title="Veelgestelde vragen"
        description="Antwoorden op de meest gestelde vragen over HLTY: hoe we producten selecteren, het verschil met een drogist, wanneer supplementen zinvol zijn, en meer."
        path="/veelgestelde-vragen"
      />
      <JsonLd data={[faqSchema, breadcrumbSchema]} />

      <div className="mx-auto max-w-3xl px-6">
        <nav className="text-xs text-[var(--color-muted)] mb-8">
          <Link to="/" className="hover:text-[var(--color-navy)] transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--color-navy)]">Veelgestelde vragen</span>
        </nav>

        {/* Hero */}
        <section className="glass-dark rounded-[32px] p-6 sm:p-8 md:p-12 relative overflow-hidden mb-10">
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/15 rounded-full blur-[80px]" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[11px] tracking-widest font-semibold text-white/80 mb-4">
              <HelpCircle className="w-3.5 h-3.5" />
              VEELGESTELDE VRAGEN
            </div>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.05]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Antwoorden op de meest <br />
              <span className="text-[var(--color-primary)]">gestelde vragen.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
              Hoe werken wij, hoe selecteren we producten en wat moet je weten over supplementen?
              Hier vind je het kort en duidelijk.
            </p>
          </div>
        </section>

        {/* Accordion */}
        <section className="space-y-3 mb-12">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <article key={faq.q} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between text-left px-6 py-5 hover:bg-black/[0.02] transition-colors"
                  aria-expanded={isOpen}
                >
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--color-navy)] pr-4">
                    {faq.q}
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-[var(--color-muted)] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                      <p className="px-6 pb-6 pt-1 text-[var(--color-text)] leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
        </section>

        {/* CTA naar contact */}
        <section className="card p-8 mb-12 text-center">
          <p className="text-sm text-[var(--color-muted)] uppercase tracking-widest font-semibold mb-2">
            Staat je vraag er niet bij?
          </p>
          <h2 className="text-2xl font-extrabold text-[var(--color-navy)] mb-4" style={{ fontFamily: 'Montserrat' }}>
            We helpen je graag persoonlijk verder.
          </h2>
          <Link
            to="/contact"
            className="btn-primary inline-flex items-center gap-3 px-7 py-3.5 text-sm group"
          >
            Naar contact
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </section>
      </div>
    </>
  );
}
