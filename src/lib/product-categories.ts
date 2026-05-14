export interface SubCategory {
  id: string;
  label: string;
  /** Eén of meerdere Shopify-collection-handles die deze tegel
   *  representeert. Een product matcht als het in minstens één van
   *  deze collecties zit. */
  handles: string[];
}

export interface MainCategory {
  id: string;
  label: string;
  subs: SubCategory[];
}

export const MAIN_CATEGORIES: MainCategory[] = [
  {
    id: 'voeding',
    label: 'Voeding',
    subs: [
      { id: 'superfoods', label: 'Superfoods', handles: ['superfoods-1'] },
      { id: 'snacks', label: 'Gezonde Snacks', handles: ['gezonde-snacks-1'] },
      { id: 'etherische-olien', label: 'Etherische Oliën', handles: ['etherische-olien-1'] },
      { id: 'dieetvoeding', label: 'Dieetvoeding', handles: ['dieetvoeding-1'] },
      { id: 'vetten-olien', label: 'Vetten & Oliën', handles: ['vetten-olien-1'] },
    ],
  },
  {
    id: 'supplementen',
    label: 'Supplementen',
    subs: [
      { id: 'vitamines', label: 'Vitamines', handles: ['vitamines-1'] },
      { id: 'multivitamines', label: 'Multivitamines', handles: ['multivitamines-1'] },
      { id: 'mineralen', label: 'Mineralen', handles: ['mineralen-1'] },
      { id: 'eiwitten', label: 'Eiwitten & Aminozuren', handles: ['eiwitten-aminozuren-1'] },
      {
        id: 'vetzuren',
        label: 'Omega-3 & Vetzuren',
        handles: ['omega-3-visolie-1', 'krillolie-overige-vetzuren-1', 'mct-olie-1', 'algenolie-1'],
      },
      {
        id: 'kruiden',
        label: 'Kruiden & Planten',
        handles: [
          'kruiden-planten-1',
          'kurkuma-curcumine-1',
          'ashwagandha-adaptogenen-1',
          'medicinale-paddenstoelen-1',
        ],
      },
      { id: 'spijsvertering', label: 'Spijsvertering', handles: ['spijsvertering-darmen-1'] },
      { id: 'probiotica', label: 'Probiotica', handles: ['probiotica-prebiotica-1'] },
      { id: 'collageen', label: 'Collageen', handles: ['collageen-1'] },
      { id: 'creatine', label: 'Creatine', handles: ['creatine'] },
      { id: 'vezels', label: 'Vezels', handles: ['vezels-1'] },
    ],
  },
  {
    id: 'fysio-accessoires',
    label: 'Fysio & Accessoires',
    subs: [
      { id: 'fysiotherapie', label: 'Fysiotherapie & Herstel', handles: ['fysiotherapie-herstel-1'] },
      { id: 'massage', label: 'Massage & Mobiliteit', handles: ['massage-mobiliteit-1'] },
      { id: 'taping', label: 'Taping & Gewrichtsondersteuning', handles: ['taping-gewrichtsondersteuning-1'] },
      { id: 'warmte-koude', label: 'Warmte & Koudetherapie', handles: ['warmte-koudetherapie-1'] },
      { id: 'comfort', label: 'Comfort & Hulpmiddelen', handles: ['comfort-hulpmiddelen'] },
      { id: 'verzorging', label: 'Persoonlijke Verzorging', handles: ['persoonlijke-verzorging-1'] },
      { id: 'meetinstrumenten', label: 'Meetinstrumenten', handles: ['meetinstrumenten-diagnostiek-1'] },
      {
        id: 'lifestyle',
        label: 'Accessoires & Lifestyle',
        handles: ['accessoires-lifestyle-1', 'hydratatie-shakers-1'],
      },
    ],
  },
];

const MAIN_BY_ID = new Map(MAIN_CATEGORIES.map((m) => [m.id, m]));

// Lookup: sub-id → main-id (om subs aan een main te koppelen bij multi-main)
const SUB_TO_MAIN = new Map<string, string>();
for (const main of MAIN_CATEGORIES) {
  for (const sub of main.subs) {
    SUB_TO_MAIN.set(sub.id, main.id);
  }
}

export function getMainCategory(id: string): MainCategory | null {
  return MAIN_BY_ID.get(id) ?? null;
}

export function findMainBySubId(subId: string): MainCategory | null {
  const mainId = SUB_TO_MAIN.get(subId);
  return mainId ? MAIN_BY_ID.get(mainId) ?? null : null;
}

/** All Shopify-handles that belong to a given main category (across all subs). */
export function handlesForMain(mainId: string): string[] {
  const main = MAIN_BY_ID.get(mainId);
  if (!main) return [];
  const set = new Set<string>();
  for (const sub of main.subs) {
    for (const h of sub.handles) set.add(h);
  }
  return [...set];
}

/** Resolve sub-ids (e.g. "vitamines,mineralen") back to their Shopify handles. */
export function handlesForSubs(mainId: string, subIds: string[]): string[] {
  const main = MAIN_BY_ID.get(mainId);
  if (!main) return [];
  const set = new Set<string>();
  for (const sub of main.subs) {
    if (subIds.includes(sub.id)) {
      for (const h of sub.handles) set.add(h);
    }
  }
  return [...set];
}

/** Compute allowed Shopify-handles given multiple mains + sub-ids.
 *  Logic per main:
 *  - If subs exist that belong to this main → use those subs' handles
 *  - Otherwise → use all handles of the main
 *  Returns the union of handles across all selected mains. Returns empty
 *  array when no mains and no subs selected (= no category-filter active). */
export function handlesForMainsAndSubs(mainIds: string[], subIds: string[]): string[] {
  if (mainIds.length === 0 && subIds.length === 0) return [];
  const set = new Set<string>();
  // Group selected subs by their main
  const subsByMain = new Map<string, string[]>();
  for (const subId of subIds) {
    const m = SUB_TO_MAIN.get(subId);
    if (!m) continue;
    if (!subsByMain.has(m)) subsByMain.set(m, []);
    subsByMain.get(m)!.push(subId);
  }
  // For each selected main: either filter on its selected subs, or include all
  for (const mainId of mainIds) {
    const subsForMain = subsByMain.get(mainId);
    if (subsForMain && subsForMain.length > 0) {
      for (const h of handlesForSubs(mainId, subsForMain)) set.add(h);
    } else {
      for (const h of handlesForMain(mainId)) set.add(h);
    }
  }
  // Also include subs whose main is NOT selected (loose subs)
  for (const [mainId, subs] of subsByMain) {
    if (mainIds.includes(mainId)) continue;
    for (const h of handlesForSubs(mainId, subs)) set.add(h);
  }
  return [...set];
}

/** Does a product (via its collections) match a set of allowed Shopify-handles? */
export function productMatchesHandles(
  productCollections: { handle: string }[],
  allowedHandles: string[],
): boolean {
  if (allowedHandles.length === 0) return true;
  const set = new Set(allowedHandles);
  return productCollections.some((c) => set.has(c.handle));
}
