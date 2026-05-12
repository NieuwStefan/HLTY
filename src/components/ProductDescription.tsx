import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, Info } from 'lucide-react';

const SECTION_PATTERNS: RegExp[] = [
  /^samenstelling/i,
  /^ingredi[ëe]nten/i,
  /^gebruik(s|$)/i,
  /^dosering/i,
  /^bewaaradvies/i,
  /^bewaarvoorschrift/i,
  /^fabrikant/i,
  /^distributeur/i,
  /^verantwoordelijk voor/i,
  /^claims/i,
  /^werking/i,
  /^eigenschappen/i,
  /^waarschuwing/i,
  /^toepassing/i,
  /^voedingswaarde/i,
  /^let op/i,
  /^allergen/i,
  /^aanvulling/i,
];

function looksLikeSectionHeader(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 80) return false;
  return SECTION_PATTERNS.some((p) => p.test(t));
}

const TITLE_OVERRIDES: { match: RegExp; label: string }[] = [
  { match: /^verantwoordelijk voor/i, label: 'Fabrikant / Distributeur' },
  { match: /^distributeur$/i, label: 'Fabrikant / Distributeur' },
  { match: /^fabrikant$/i, label: 'Fabrikant / Distributeur' },
];

function normalizeTitle(raw: string): string {
  for (const { match, label } of TITLE_OVERRIDES) {
    if (match.test(raw)) return label;
  }
  return raw;
}

interface Section {
  title: string | null;
  html: string;
  variant?: 'default' | 'disclaimer';
}

function trimBrs(html: string): string {
  return html
    .replace(/^(?:\s|<br\s*\/?>)+/i, '')
    .replace(/(?:\s|<br\s*\/?>)+$/i, '')
    .trim();
}

// --- Composition table detection ------------------------------------------

// Row pattern: "<name> <amount> <unit> [<percentage>]"
//   - name: any chars (non-greedy) — digits allowed (B12, K2, 5-MTHF, …)
//   - amount: digits with optional decimal/comma, optional range
//   - unit: mg/μg/etc.
//   - optional %RI: number followed by %
const ROW_RX = new RegExp(
  '^\\s*(.+?)\\s+' + // name (non-greedy, anchored by following amount+unit)
    '(\\d+(?:[.,]\\d+)?(?:\\s*-\\s*\\d+(?:[.,]\\d+)?)?)\\s*' + // amount
    '(μg|mcg|µg|mg|gr|g|ml|IE|kj|kcal)\\b' + // unit
    '(?:\\s+(\\d+(?:[.,]\\d+)?\\s*%))?' + // optional %RI
    '\\s*$',
  'i'
);

function tryBuildTable(htmlChunk: string): string {
  // Browsers cannot nest <table> inside <p>; convert paragraph wrappers to
  // <div> so the eventual <table> stays inside its block.
  htmlChunk = htmlChunk
    .replace(/<p(\s[^>]*)?>/gi, '<div class="my-3">')
    .replace(/<\/p>/gi, '</div>');

  // Merge rows broken across <br> by a trailing comma (Shopify wraps long
  // ingredient names mid-line, e.g. "Vitamine B12 (adenosylcobalamine,<br>methylcobalamine) 150 μg")
  htmlChunk = htmlChunk.replace(/,\s*<br\s*\/?>\s*/gi, ', ');

  const parts = htmlChunk.split(/<br\s*\/?>/gi);
  if (parts.length < 4) return htmlChunk;

  type RowPart = { kind: 'row'; name: string; amount: string; unit: string; ri?: string };
  type OtherPart = { kind: 'other'; html: string };
  type Classified = RowPart | OtherPart;

  const classified: Classified[] = parts.map((chunk) => {
    // Strip simple inline / wrapper tags so the row regex sees plain text.
    const stripped = chunk
      .replace(/<\/?(?:strong|b|em|i|sup|sub|div|span)\b[^>]*>/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!stripped) return { kind: 'other', html: chunk };
    // If any tags remain after stripping the simple ones, treat as 'other'
    if (/<[^>]/.test(stripped)) return { kind: 'other', html: chunk };
    const m = stripped.match(ROW_RX);
    if (!m) return { kind: 'other', html: chunk };
    return { kind: 'row', name: m[1].trim(), amount: m[2], unit: m[3], ri: m[4] };
  });

  // Walk and group consecutive rows into tables.
  const out: string[] = [];
  let buffer: RowPart[] = [];
  const hasRI = (rows: RowPart[]) => rows.some((r) => !!r.ri);

  const flushBuffer = () => {
    if (buffer.length >= 3) {
      const showRI = hasRI(buffer);
      const rows = buffer
        .map(
          (r) => `
          <tr class="border-b border-black/5 last:border-0">
            <td class="py-2 pr-3 text-[var(--color-navy)]">${r.name}</td>
            <td class="py-2 pr-3 text-right tabular-nums whitespace-nowrap text-[var(--color-navy)]">${r.amount} ${r.unit}</td>${
              showRI
                ? `<td class="py-2 text-right tabular-nums whitespace-nowrap text-[var(--color-muted)]">${r.ri ?? ''}</td>`
                : ''
            }
          </tr>`
        )
        .join('');
      out.push(
        `<table class="w-full text-sm my-3 border-collapse">${rows}</table>`
      );
    } else {
      // Not enough rows — put back as <br>-separated lines
      for (const r of buffer) {
        out.push(`${r.name} ${r.amount} ${r.unit}${r.ri ? ' ' + r.ri : ''}`);
      }
    }
    buffer = [];
  };

  for (const c of classified) {
    if (c.kind === 'row') {
      buffer.push(c);
    } else {
      flushBuffer();
      out.push(c.html);
    }
  }
  flushBuffer();

  // Re-join with <br> only between non-table chunks
  let result = '';
  for (let i = 0; i < out.length; i++) {
    const cur = out[i];
    const prev = i > 0 ? out[i - 1] : '';
    const isTable = cur.startsWith('<table');
    const prevWasTable = prev.startsWith('<table');
    if (i > 0 && !isTable && !prevWasTable) result += '<br>';
    result += cur;
  }
  return result;
}

// --- Ingredient bullet detection ------------------------------------------

// Match a single "Name: description" line. Name is reasonably short and
// starts with a capital; description must be substantial (> 8 chars).
const BULLET_RX = /^([A-ZÀ-Ÿ][A-Za-zÀ-ÿ0-9®\s\-/+()]{1,50}):\s*(.{8,})$/;

function tryBuildBullets(htmlChunk: string): string {
  // Operate paragraph by paragraph (split on <br><br>+) to avoid pulling
  // bullets across blank lines.
  const paragraphs = htmlChunk.split(/(?:<br\s*\/?>\s*){2,}/gi);

  const transformed = paragraphs.map((para) => {
    const lines = para.split(/<br\s*\/?>/gi);
    if (lines.length < 3) return para;

    // Find the longest run of consecutive bullet-shaped lines (no nested tags).
    let bestStart = -1;
    let bestEnd = -1;
    let curStart = -1;
    for (let i = 0; i < lines.length; i++) {
      const stripped = lines[i].replace(/<[^>]*>/g, '').trim();
      const hasComplexTags = /<(?!\s*\/?\s*(?:sup|sub|em|i)\b)[^>]+>/i.test(lines[i]);
      const m = stripped.match(BULLET_RX);
      if (m && !hasComplexTags) {
        if (curStart === -1) curStart = i;
      } else {
        if (curStart !== -1 && i - curStart >= 3 && i - curStart > bestEnd - bestStart + 1) {
          bestStart = curStart;
          bestEnd = i - 1;
        }
        curStart = -1;
      }
    }
    if (curStart !== -1 && lines.length - curStart >= 3 && lines.length - curStart > bestEnd - bestStart + 1) {
      bestStart = curStart;
      bestEnd = lines.length - 1;
    }
    if (bestStart === -1) return para;

    const before = lines.slice(0, bestStart).join('<br>');
    const bulletLines = lines.slice(bestStart, bestEnd + 1);
    const after = lines.slice(bestEnd + 1).join('<br>');

    const items = bulletLines
      .map((l) => {
        const stripped = l.replace(/<[^>]*>/g, '').trim();
        const m = stripped.match(BULLET_RX);
        if (!m) return '';
        return `<li><strong class="text-[var(--color-navy)]">${m[1].trim()}</strong>: ${m[2].trim()}</li>`;
      })
      .filter(Boolean)
      .join('');

    let result = '';
    if (before.trim()) result += before + '<br>';
    result += `<ul class="my-3 space-y-1.5 list-disc pl-5 marker:text-[var(--color-primary)]">${items}</ul>`;
    if (after.trim()) result += after;
    return result;
  });

  return transformed.join('<br><br>');
}

// --- Disclaimer extraction ------------------------------------------------

const DISCLAIMER_TRIGGERS: RegExp[] = [
  /Dit product is een voedingssupplement/i,
  /Aanbevolen dosering niet overschrijden/i,
  /Een gevarieerde,?\s*evenwichtige voeding/i,
  /Buiten bereik van (jonge )?kinderen/i,
  /Droog,?\s*afgesloten en bij kamertemperatuur/i,
  /Raadpleeg een (deskundige|arts)/i,
  /Niet geschikt voor (kinderen|zwangeren)/i,
];

function extractDisclaimer(html: string): { main: string; disclaimer: string } {
  let earliest = -1;
  for (const t of DISCLAIMER_TRIGGERS) {
    const m = html.match(t);
    if (m && m.index !== undefined && (earliest === -1 || m.index < earliest)) {
      earliest = m.index;
    }
  }
  if (earliest === -1) return { main: html, disclaimer: '' };

  // Walk back to the previous <br><br> or paragraph boundary so we cut at a
  // sensible spot (not mid-sentence).
  const before = html.slice(0, earliest);
  const cutAt = Math.max(
    before.lastIndexOf('<br><br>'),
    before.lastIndexOf('</p>'),
    0
  );
  const main = trimBrs(html.slice(0, cutAt > 0 ? cutAt : earliest));
  const disclaimer = trimBrs(html.slice(cutAt > 0 ? cutAt : earliest));
  return { main, disclaimer };
}

// --- Top-level parser -----------------------------------------------------

function enhanceHtml(html: string): string {
  // Run table builder first (operates on long runs of <br>-separated rows),
  // then bullet builder (operates on remaining <br>-separated lines).
  return tryBuildBullets(tryBuildTable(html));
}

function parseDescription(rawHtml: string, productTitle: string): Section[] {
  if (typeof window === 'undefined' || !rawHtml) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');
  const container = doc.body.firstChild as HTMLElement | null;
  if (!container) return [];

  const sections: Section[] = [];
  let currentTitle: string | null = null;
  let parts: string[] = [];

  const currentIsEmpty = () => trimBrs(parts.join('')) === '';

  const flush = () => {
    const html = trimBrs(parts.join(''));
    if (html) sections.push({ title: currentTitle, html });
    parts = [];
  };

  for (const child of Array.from(container.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if ((tag === 'b' || tag === 'strong') && looksLikeSectionHeader(el.textContent || '')) {
        flush();
        currentTitle = normalizeTitle((el.textContent || '').trim().replace(/[:.]$/, ''));
        continue;
      }

      if (tag === 'p') {
        const first = el.firstElementChild;
        const firstTag = first?.tagName.toLowerCase();
        if (
          first &&
          (firstTag === 'strong' || firstTag === 'b') &&
          looksLikeSectionHeader(first.textContent || '')
        ) {
          if (currentTitle && currentIsEmpty()) {
            parts.push(el.outerHTML);
            continue;
          }
          const newTitle = normalizeTitle((first.textContent || '').trim().replace(/[:.]$/, ''));
          flush();
          currentTitle = newTitle;
          first.remove();
          const rest = el.innerHTML.replace(/^(?:\s|<br\s*\/?>)+/i, '');
          if (rest.trim()) parts.push(`<p>${rest}</p>`);
          continue;
        }
      }

      parts.push(el.outerHTML);
    } else if (child.nodeType === Node.TEXT_NODE) {
      const t = child.textContent || '';
      if (t.trim()) parts.push(t);
    }
  }
  flush();

  // Strip leading product-title repeat from intro section
  if (sections.length > 0 && sections[0].title === null && productTitle) {
    const m = sections[0].html.match(
      /^<(?:b|strong)>([^<]+)<\/(?:b|strong)>\s*(?:<br\s*\/?>\s*)*/i
    );
    if (m) {
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const a = norm(m[1]);
      const b = norm(productTitle);
      const prefixLen = Math.min(a.length, b.length, 14);
      if (prefixLen >= 6 && a.slice(0, prefixLen) === b.slice(0, prefixLen)) {
        sections[0].html = trimBrs(sections[0].html.slice(m[0].length));
      }
    }
  }

  // Extract trailing disclaimer text into its own collapsed section
  const disclaimerPieces: string[] = [];
  for (const s of sections) {
    const { main, disclaimer } = extractDisclaimer(s.html);
    if (disclaimer) {
      s.html = main;
      disclaimerPieces.push(disclaimer);
    }
  }
  let result = sections.filter((s) => s.html || s.title);

  // Enhance each section's HTML (table + bullets)
  result = result.map((s) => ({ ...s, html: enhanceHtml(s.html) }));

  if (disclaimerPieces.length > 0) {
    result.push({
      title: 'Belangrijk om te weten',
      html: disclaimerPieces.join('<br><br>'),
      variant: 'disclaimer',
    });
  }

  return result;
}

interface Props {
  html: string;
  productTitle: string;
}

export default function ProductDescription({ html, productTitle }: Props) {
  const sections = useMemo(() => parseDescription(html, productTitle), [html, productTitle]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Reset to "intro open" whenever a different product is rendered
  useEffect(() => {
    setOpenIndex(0);
  }, [html]);

  if (sections.length === 0) return null;

  // Treat the intro section (title === null) as a regular "Beschrijving"
  // accordion item so every section renders identically.
  const items = sections.map((s) =>
    s.title === null ? { ...s, title: 'Beschrijving' } : s
  );
  // Beschrijving is always at the first position if an intro section exists.
  const introIndex = sections[0]?.title === null ? 0 : -1;

  const proseClasses =
    'text-sm text-[var(--color-navy)]/80 leading-relaxed ' +
    '[&_b]:font-semibold [&_b]:text-[var(--color-navy)] ' +
    '[&_strong]:font-semibold [&_strong]:text-[var(--color-navy)] ' +
    '[&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 ' +
    '[&_ul]:my-3 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 ' +
    '[&_a]:text-[var(--color-primary)] [&_a]:underline ' +
    '[&_table]:my-3';

  return (
    <div className="w-full space-y-3">
      {items.map((s, i) => {
        const open = openIndex === i;
        const isDisclaimer = s.variant === 'disclaimer';
        return (
          <div
            key={`${s.title}-${i}`}
            className={`rounded-2xl overflow-hidden ${
              isDisclaimer
                ? 'bg-amber-50/70 border border-amber-100'
                : 'bg-white border border-black/5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                // Beschrijving is the always-fallback: closing any other item
                // reopens it; clicking Beschrijving while open keeps it open.
                if (open) {
                  if (introIndex >= 0) setOpenIndex(introIndex);
                  else setOpenIndex(null);
                } else {
                  setOpenIndex(i);
                }
              }}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-black/[0.02] transition-colors"
              aria-expanded={open}
            >
              <span
                className={`text-sm font-bold flex items-center gap-2 ${
                  isDisclaimer ? 'text-amber-900' : 'text-[var(--color-navy)]'
                }`}
                style={{ fontFamily: 'Montserrat' }}
              >
                {isDisclaimer && <Info className="w-4 h-4" />}
                {s.title}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  open ? 'rotate-180' : ''
                } ${isDisclaimer ? 'text-amber-700' : 'text-[var(--color-muted)]'}`}
              />
            </button>
            <div
              className={`grid transition-all duration-200 ease-out ${
                open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={`px-6 pb-6 ${proseClasses} ${
                    isDisclaimer ? 'text-[12.5px] text-amber-900/80' : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: s.html }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
