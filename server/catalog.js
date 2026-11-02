// Server copy of the price-relevant product facts, used to recompute every order total.
// The browser's prices are never trusted.
// keep in sync with src/data/products.ts (basePrice, includedFigures, extraFigurePrice, maxFigures, hasFigures),
// src/data/types.ts (Occasion, OrderStatus) and src/lib/pricing.ts (priceFor).

/** @typedef {{ slug: string, name: string, basePrice: number, includedFigures: number, extraFigurePrice: number, maxFigures: number, hasFigures: boolean }} CatalogProduct */

/** @type {Record<string, CatalogProduct>} */
export const catalog = {
  'full-portrait': {
    slug: 'full-portrait',
    name: 'Full-body portrait',
    basePrice: 50,
    includedFigures: 3,
    extraFigurePrice: 5,
    maxFigures: 12,
    hasFigures: true,
  },
  'close-up-portrait': {
    slug: 'close-up-portrait',
    name: 'Close-up portrait',
    basePrice: 50,
    includedFigures: 3,
    extraFigurePrice: 5,
    maxFigures: 6,
    hasFigures: true,
  },
  'christmas-tree': {
    slug: 'christmas-tree',
    name: 'Christmas tree portrait',
    basePrice: 65,
    includedFigures: 3,
    extraFigurePrice: 5,
    maxFigures: 10,
    hasFigures: true,
  },
  ornament: {
    slug: 'ornament',
    name: 'Ornament drawing',
    basePrice: 25,
    includedFigures: 0,
    extraFigurePrice: 0,
    maxFigures: 0,
    hasFigures: false,
  },
};

/** Mirrors priceFor() in src/lib/pricing.ts. Whole dollars. */
export function priceFor(product, people, pets) {
  if (!product.hasFigures) return product.basePrice;
  const extra = Math.max(0, people + pets - product.includedFigures);
  return product.basePrice + extra * product.extraFigurePrice;
}

export const OCCASIONS = [
  'everyday',
  'couple',
  'family',
  'wedding',
  'anniversary',
  'birthday',
  'graduation',
  'halloween',
  'christmas',
  'memorial',
  'pet',
];

export const ORDER_STATUSES = ['received', 'sketching', 'awaiting-approval', 'inking-coloring', 'shipped', 'delivered'];

// 50 states + DC (keep in sync with src/components/checkout/usStates.ts)
export const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'DC',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
];
