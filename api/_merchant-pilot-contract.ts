/**
 * Vastgelegde technische pilotbron, read-only gecontroleerd op 2-8-2026.
 * Een wijziging in identifier of commerciële Shopify-brontekst blokkeert de feed
 * totdat de betreffende regel bewust opnieuw is beoordeeld en bijgewerkt.
 * De feed zelf gebruikt een korte feitelijke beschrijving. Dit technische
 * contract vervangt geen afzonderlijke juridische review van de landingspagina.
 */
export interface PilotContractEntry {
  variantId: string;
  sku: string;
  gtin: string;
  contentHash: string;
}

export type PilotContract = Record<string, PilotContractEntry>;

export const PILOT_CONTRACT: PilotContract = {
  'orthica-cal-mag-zink-90-tabletten': {
    variantId: '57121222164857', sku: '103604', gtin: '8714439550396', contentHash: 'ASKGHcEm3AHilU2QfMyMLWqwEASXCyPM-vwknYrdPzA',
  },
  'arctic-blue-pure-visolie-300-milliliter': {
    variantId: '57121376076153', sku: '118201', gtin: '8719992626724', contentHash: 'mqdTFOzUdE3nbnOpaOcnngm2sHfE1pTrOxVwcN48FUw',
  },
  'fittergy-k2-100mcg-en-d3-50mcg-60-tabletten': {
    variantId: '57121376502137', sku: '117743', gtin: '8721154190042', contentHash: 'v5e_dwxmnFTHdYlh865_RlqLvcqlO1HGn1JY7zvXzxA',
  },
  'mattisson-organic-vegan-protein-blend-vanilla-400-gram': {
    variantId: '57372376596857', sku: '970063', gtin: '8720289192228', contentHash: 'SRLqsV3LnyPku9J83_yQvHBDPSQf7Xf2LfxunEI0FwI',
  },
  'mattisson-vitamine-d3-k2-75mcg-36mcg-vegan-druppels-25-milliliter': {
    variantId: '56464324886905', sku: '965899', gtin: '8720791841447', contentHash: 'SWpcxI4Tav9AFnHQERgMQOth9rUulEeryYc9Hbm19GY',
  },
  'mattisson-whey-protein-isolate-isolaat-sport-500-gram': {
    variantId: '57140229210489', sku: '949645', gtin: '8720791840884', contentHash: '5kQskq1BbsPwOo9flEE_PzK2kYVfNkE1D0pr2y18HVY',
  },
  'orthica-magnesium-400-120-tabletten': {
    variantId: '57139795165561', sku: '541434', gtin: '8714439552710', contentHash: 'B7XPHOeVB4_5HcaieFW7_XNFQ9JxOuvwu6ZqHhF-80A',
  },
  'orthica-foliumzuur-400-90-vegetarische-capsules': {
    variantId: '56464548790649', sku: '286753', gtin: '8714439533696', contentHash: 'qcT0vWGZAeOFC4IOri_tpCN7hZ96zC8NHYJYYpi4dj0',
  },
  'orthica-magnesium-citraat-125-90-capsules': {
    variantId: '57140503183737', sku: '814458', gtin: '8714439552895', contentHash: 'cf7vx9SDxb6x2JvGCTyJSoTvzN9uxZTdr-MCjEVF7ac',
  },
  'the-green-athlete-creatine-400-gram': {
    variantId: '56464167633273', sku: '288692', gtin: '5412360023929', contentHash: 'VHlGOmn9-YAhMdBidTnI4zSbhGy4kZRVvjaE9X4Efcs',
  },
  'royal-green-zinc-complex-bio-60-vegetarische-capsules': {
    variantId: '56464020242809', sku: '948400', gtin: '8710267781858', contentHash: 'R10jh4ZkDv2w9wgZLJNzMHySQ8asNS7BbsMA-0fsXtw',
  },
  'mattisson-calcium-magnesium-zink-90-tabletten': {
    variantId: '57371803320697', sku: '970132', gtin: '8720959400844', contentHash: 'k6FHCm8-toyLjjYNpuCUGVisP_SMKWF94zG8DdMAJJU',
  },
  'arctic-blue-algenolie-dha-met-vitamine-d-90-softgels': {
    variantId: '57371511849337', sku: '945030', gtin: '8719992626410', contentHash: 'UmDAuUgbtAs97uSy6RkUZpShPtA5LboIMxIY-T5hFzQ',
  },
  'arctic-blue-pure-arctische-visolie-msc-60-softgels': {
    variantId: '56463515844985', sku: '935927', gtin: '8719992626212', contentHash: 'fxcPXPZQgmimdAz0tfGLVe2OKlRcAWHUcK3TiHkqfu0',
  },
  'arctic-blue-pure-alaska-msc-visolie-60-softgels': {
    variantId: '57372373909881', sku: '935620', gtin: '8719992626243', contentHash: '9XZXmrW9wc2TztBWLJyq6Fcc4aK7fF1dsTSxWAof7eY',
  },
  'orthica-orthiflor-original-30-capsules': {
    variantId: '57140597522809', sku: '885719', gtin: '8714439570233', contentHash: 'FsrnFjJJ-e6Bo7kv0NBQ8D-ZQU5otdxuLEwLdH-nEig',
  },
  'mattisson-sport-wei-whey-proteine-concentraat-naturel-450-gram': {
    variantId: '63861629813113', sku: '953101', gtin: '8717677965045', contentHash: 'tfY8rnuerYmrcnEHapGlMw3PHQsxqtMrlEhOKVsCQgY',
  },
  'orthica-vitamine-d-10-120-tabletten': {
    variantId: '57139857391993', sku: '798269', gtin: '8714439517719', contentHash: '0H0HC8lYepcNg0imon_7U6Pq1y5xysGvPkWasyfZTXs',
  },
  'vitals-vitamine-d3-1000ie-vegan-100-softgels': {
    variantId: '56579151593849', sku: '290133', gtin: '8716717004713', contentHash: 'pZU5NKcsk-gp83_Z_i-1-kO3iUnVEuJnu2Dq4pfpA6g',
  },
  'mattisson-gefermenteerde-l-leucine-500mg-60-vegetarische-capsules': {
    variantId: '57372468380025', sku: '970539', gtin: '8720959400554', contentHash: 'meP5bzdKZTws6LfAFWrbQUfxiESjajf02pFXWUsJM-8',
  },
  'futuro-enkelbandage-aanpasbaar-1-stuks': {
    variantId: '57372377416057', sku: '564067', gtin: '4046719425594', contentHash: '8FeTZFDVjw4L_YB2kV5YLidxT7X3lxWX3ymVMMh_k-U',
  },
  'futuro-polsspalk-omkeerbaar-medium-1-stuks': {
    variantId: '56464176152953', sku: '897456', gtin: '4046719424689', contentHash: 'BZl54C-ENPBS_GqZQjoLtuOm9-z0fJGgy6UUsf0JY7c',
  },
  'futuro-sport-tenniselleboog-bandage-aanpasbaar-1-stuks': {
    variantId: '57373369762169', sku: '564037', gtin: '4046719424986', contentHash: 'FLlWYrNj2Rvid_1GGbxhaPzQNJhqNQAVaLSuYrDblS0',
  },
  'futuro-enkelbandage-maat-l-47876-1-stuks': {
    variantId: '57372777873785', sku: '877579', gtin: '4046719423712', contentHash: '1L3wX9_FmEaUwsN6_O7xW3Gsg2a8JJa4CWEzahgq_Mw',
  },
  'medisana-bloeddrukmeter-bovenarm-bu512-1-stuks': {
    variantId: '57121361166713', sku: '118120', gtin: '4015588511622', contentHash: 'pyPAw_hfvlgXJWgvxeWaivBuFLS4gzS6nPSASAhkjGo',
  },
  'aquashield-voet-1-stuks': {
    variantId: '56462188216697', sku: '721346', gtin: '791418120137', contentHash: 'hIfOKXI6J8x3Ktv2nkulcGPrLDcSHwzDcpCpDMFuv2U',
  },
  'kt-tape-pro-uncut-tape-roll-5-meter-zwart-1-stuks': {
    variantId: '57121403076985', sku: '117676', gtin: '857879003096', contentHash: 'LffD8zB47usU_cUceCvYA8P2tfXbNeifD_ag-4f5h4s',
  },
  'epitact-enkelknobbel-beschermer-sport-2-stuks': {
    variantId: '56464461169017', sku: '949750', gtin: '3660396019016', contentHash: 'CFjUF9DNmbTi6dRWvBC3s0UTFYGdSZnnfnvpZ8KNsJc',
  },
  'epitact-teenspreiders-small-6-stuks': {
    variantId: '56464434626937', sku: '949751', gtin: '3660396018941', contentHash: 'zJ7lNvYKrIsOXE8qliC1QkTBzqyjyZuAC11VyZxCw_I',
  },
  'kt-tape-original-precut-5-meter-beige-20-stuks': {
    variantId: '56464415621497', sku: '943212', gtin: '893169002981', contentHash: 'oO6eh9_4Wo9rfq6e6osL9wHzB2Nb46idhu10v7gktMk',
  },
  'nexcare-cold-hot-therapy-pack-flexible-1-stuks': {
    variantId: '63860637892985', sku: '857336', gtin: '5902658066191', contentHash: 'tnOvi1FdwU95c7zb3Ae5v1gpro9_QfUjOMU1efc05aw',
  },
  'nexcare-cold-hot-belt-rug-buik-s-m-1-stuks': {
    variantId: '63860637139321', sku: '868177', gtin: '5902658066207', contentHash: '_j-c53UfuuIO3KgSTBSrxdhgHQWBt66C9nBebJjzRKQ',
  },
  'emdee-elastic-support-enkel-maat-m-huidskleur-1-stuks': {
    variantId: '57372583199097', sku: '947194', gtin: '8719689978402', contentHash: 'KzgowFMkI8HyccPEMQlT4T-G-pKdpUu2W2IwATqXtkU',
  },
  'able-2-egelballen-8cm-1-stuks': {
    variantId: '56464173760889', sku: '889061', gtin: '5050996026572', contentHash: 'MN4cScDib5y5KyLU-HVUul2hO87y4029uBRBksv1IJc',
  },
  '3m-cold-hot-pack-classic-1-stuks': {
    variantId: '63860620198265', sku: '936375', gtin: '4054596799530', contentHash: 'njCZTmrqvyilGRBMMg54PI3wD4hzoajB1mStg2FLwJA',
  },
  'able-2-grijper-standaard-67cm-kort-1-stuks': {
    variantId: '57372300673401', sku: '835826', gtin: '5050996010694', contentHash: 'I8HQjt_d4_orDSiY0wqZKnHVhbFg16CJc7gRyW3gZw8',
  },
  'able-2-kruk-en-stokdoppen-19mm-zwart-2-stuks': {
    variantId: '56461596819833', sku: '889134', gtin: '5050996005010', contentHash: 'levRfYuBxBkgC27EZBAs17IH_Kq97OpHHfdieMvECds',
  },
  'able-2-pillendoos-extra-groot-1-stuks': {
    variantId: '57227396546937', sku: '912927', gtin: '5050996011134', contentHash: 'SSD9qZ7-fWOdeh2z_3znIwbWX89ygJVESNoCxABQuSs',
  },
  'aquashield-onderarm-klein-1-stuks': {
    variantId: '56460875071865', sku: '722478', gtin: '791418100177', contentHash: 'wNoalTuReLMlDjUON0ty0IEodSZKpo9zXUBLLSgHNII',
  },
  'able-2-harley-wigkussen-slimline-1-stuks': {
    variantId: '57371296760185', sku: '896561', gtin: '5050996003399', contentHash: 'EdKZx6oEgRcpUZ8Cbg4FiBl1a1VbObJiKvsirW2Bdik',
  },
};
