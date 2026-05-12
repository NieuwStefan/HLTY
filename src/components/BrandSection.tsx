import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Loader2, Check, Award } from 'lucide-react';
import type { Brand } from '../data/brands';

interface Props {
  brand: Brand;
  onAddToCart: () => void;
  canAddToCart: boolean;
  isLoading: boolean;
  added: boolean;
}

export default function BrandSection({
  brand,
  onAddToCart,
  canAddToCart,
  isLoading,
  added,
}: Props) {
  return (
    <div className="w-full">
      <div className="relative rounded-[32px] overflow-hidden glass-dark">
        {/* Ambient gradient blobs — green sits behind the image (top on mobile, bottom-left on desktop) */}
        <div className="absolute top-0 left-0 sm:top-auto sm:bottom-0 w-[600px] h-[600px] bg-[var(--color-primary)]/25 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 sm:top-0 sm:bottom-auto w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-0 sm:min-h-[520px]">
          {/* Left (desktop) / Top (mobile): Brand image — sits on the green ambient gradient */}
          <div className="relative p-4 sm:p-8 lg:p-12 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-white/10">
            {brand.heroImage ? (
              <img
                src={brand.heroImage}
                alt={brand.name}
                className="relative w-full max-w-[520px] max-h-[380px] sm:max-h-[480px] object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
              />
            ) : (
              <div className="relative text-center">
                <h2
                  className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-white/95"
                  style={{ fontFamily: 'Montserrat' }}
                >
                  {brand.name}
                </h2>
              </div>
            )}
          </div>

          {/* Right: Info column */}
          <div className="p-5 sm:p-8 lg:p-12 flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6">
              <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Over het merk
            </div>

            <h2
              className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.05]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {brand.name}
            </h2>
            {brand.tagline && (
              <p className="mt-3 text-white/55 text-xs sm:text-sm leading-relaxed">
                {brand.tagline}
              </p>
            )}

            <p className="mt-4 sm:mt-5 text-white/65 text-[13px] sm:text-[15px] leading-relaxed">
              {brand.story}
            </p>

            {/* Why HLTY pullquote */}
            <div className="mt-5 sm:mt-6 p-4 sm:p-5 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
                Waarom HLTY {brand.name} voert
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-white/90">{brand.whyHlty}</p>
            </div>

            {/* Pillars — small tile grid */}
            {brand.pillars.length > 0 && (
              <div className="mt-6 sm:mt-7 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-2.5">
                {brand.pillars.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 px-2 py-3 sm:p-3 rounded-xl bg-white/[0.05] border border-white/10 text-center"
                  >
                    <Icon className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-medium text-white/75 leading-tight [overflow-wrap:anywhere] hyphens-auto">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="mt-6 sm:mt-8 flex flex-col md:flex-row md:flex-wrap gap-2.5 sm:gap-3">
              <Link
                to={`/merken/${brand.handle}`}
                className="w-full md:w-auto h-12 sm:h-14 px-7 rounded-full bg-white/[0.08] border border-white/15 hover:bg-white/[0.14] hover:scale-[1.02] active:scale-[0.98] text-white text-sm font-semibold inline-flex items-center justify-center gap-2.5 transition-all duration-300"
              >
                Alle {brand.name} producten
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                type="button"
                onClick={onAddToCart}
                disabled={!canAddToCart || isLoading}
                className={`w-full md:w-auto h-12 sm:h-14 px-7 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2.5 transition-all duration-300 ${
                  added
                    ? 'bg-green-500 text-white shadow-[0_4px_14px_rgba(34,197,94,0.3)] scale-100'
                    : canAddToCart
                      ? 'btn-primary hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : added ? (
                  <>
                    <Check className="w-5 h-5" />
                    Toegevoegd
                  </>
                ) : canAddToCart ? (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Dit product bestellen
                  </>
                ) : (
                  'Uitverkocht'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
