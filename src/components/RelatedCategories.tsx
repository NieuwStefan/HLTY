import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PRIMARY_CATEGORIES } from '../lib/categories';

interface Props {
  /** Collectie-handle die niet getoond hoeft te worden (de huidige pagina). */
  excludeHandle?: string;
  /** Kop boven de links. */
  title?: string;
}

/**
 * Interne-link-blok naar de hoofdcategorieën. Verbetert crawlability en helpt
 * bezoekers verder navigeren. De huidige collectie wordt overgeslagen.
 */
export default function RelatedCategories({ excludeHandle, title = 'Verder ontdekken' }: Props) {
  const categories = PRIMARY_CATEGORIES.filter((c) => c.handle !== excludeHandle);
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Verwante categorieën" className="mt-16 border-t border-[var(--color-border)] pt-8">
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {categories.map((cat) => (
          <Link
            key={cat.handle}
            to={`/collectie/${cat.handle}`}
            className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-navy)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            {cat.label}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
          </Link>
        ))}
      </div>
    </nav>
  );
}
