// Centrale titel-display-helper. Holland Pharma's productfeed bevat een paar
// terugkerende cosmetische fouten in titels (zie docs/06 batch A). In plaats van
// die per-product in Shopify te corrigeren — wat bij elke sync ongedaan gemaakt
// wordt — normaliseren we ze op de presentatie-laag.
//
// Fixes:
//   #16 — "by [VENDOR]" achter de titel verwijderen (vendor wordt al apart
//         getoond als label boven de titel).
//   #20 — ".00" decimals na cijfers strippen ("60.00 Capsules" → "60 Capsules").
export function formatProductTitle(title: string, vendor?: string): string {
  let out = title;

  // #20 first — werkt onafhankelijk van vendor.
  out = out.replace(/\b(\d+)\.00\b/g, '$1');

  // #16 — strip "by VENDOR" overal in de titel (case-insensitive). HP zet dit
  // soms als suffix, soms midden in de titel ("Fittergy Vegan flex by fittergy
  // 1 Set"). Vervang door enkele spatie om woorden niet aan elkaar te plakken.
  if (vendor && vendor.trim()) {
    const escaped = vendor.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`\\s*\\bby\\s+${escaped}\\b\\s*`, 'gi'), ' ');
  }

  // Collapse double spaces that the replacements may have introduced.
  out = out.replace(/\s{2,}/g, ' ');

  return out.trim();
}
