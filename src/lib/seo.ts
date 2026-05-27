// Kleine SEO-helpers, gedeeld tussen pagina's.

/**
 * Bouwt een nette meta-description: whitespace genormaliseerd en afgekapt op
 * een woordgrens (≤ maxLen, default 160 — Google's snippet-limiet). Voegt een
 * ellipsis toe alleen als er daadwerkelijk is afgekapt.
 */
export function buildMetaDescription(text: string, maxLen = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:\s]+$/, '') + '…';
}
