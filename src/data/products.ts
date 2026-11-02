import type { Occasion, Product, ProductSlug } from './types';

// The four drawing types echo Esther's "Holiday Gift Guide: 4 types of artwork you can choose from".
// Only the full-body portrait price is CONFIRMED (her Halloween post: "$50 for a portrait of 3 or less
// figures. +$5 for every additional figure. Ink and colored pencil. 8"x10". Shipping is included.").
// The other three prices are PLACEHOLDERS for the demo.
export const products: Product[] = [
  {
    slug: 'full-portrait',
    name: 'Full-body portrait',
    tagline: 'Your people (and pets), head to toe, in a scene you love.',
    description:
      'A full-body drawing of couples, families, friends and pets in any setting: a picnic, a paddle board, a pumpkin patch, your wedding day. Perfect for anniversaries, holidays and "just because".',
    size: '8" x 10"',
    medium: 'Ink and colored pencil',
    basePrice: 50,
    includedFigures: 3,
    extraFigurePrice: 5,
    maxFigures: 12,
    hasFigures: true,
    heroArtId: 'paddleboard-family',
    exampleArtIds: ['pooh-family', 'hanbok-couple', 'superhero-family', 'elopement-wedding', 'autumn-dog-family', 'frozen-sisters'],
    priceConfirmed: true,
  },
  {
    slug: 'close-up-portrait',
    name: 'Close-up portrait',
    tagline: 'Big faces, big feelings. Cheek to cheek and up close.',
    description:
      'A tighter, head-and-shoulders composition that puts every smile, freckle and whisker front and center. A favorite for grandparents, best friends and grumpy ole kitty cats.',
    size: '8" x 10"',
    medium: 'Ink and colored pencil',
    basePrice: 50,
    includedFigures: 3,
    extraFigurePrice: 5,
    maxFigures: 6,
    hasFigures: true,
    heroArtId: 'moo-closeup',
    exampleArtIds: ['grandma-closeup', 'wedding-closeup', 'family-closeup', 'ari-birthday'],
    priceConfirmed: false,
  },
  {
    slug: 'christmas-tree',
    name: 'Christmas tree portrait',
    tagline: 'Your family around a tree hung with the ornaments that tell your story.',
    description:
      'Send photos of your favorite ornaments (or just tell me the things you love) and I will draw a comfy cozy Christmas tree decorated with them, with your people and pets gathered around.',
    size: '8" x 10"',
    medium: 'Ink and colored pencil',
    basePrice: 65,
    includedFigures: 3,
    extraFigurePrice: 5,
    maxFigures: 10,
    hasFigures: true,
    heroArtId: 'navy-christmas-tree',
    exampleArtIds: ['yellow-christmas-tree', 'ladder-christmas-tree', 'promo-ornaments'],
    priceConfirmed: false,
    needsOrnamentList: true,
  },
  {
    slug: 'ornament',
    name: 'Ornament drawing',
    tagline: 'A smaller, sweeter memento of the season.',
    description:
      'A single favorite ornament (or a little object that means a lot) drawn on its own with a white sticker outline. A sweet stocking stuffer or gift tag companion.',
    size: '4" x 6"',
    medium: 'Ink and colored pencil',
    basePrice: 25,
    includedFigures: 0,
    extraFigurePrice: 0,
    maxFigures: 0,
    hasFigures: false,
    heroArtId: 'nyc-taxi-ornament',
    exampleArtIds: ['ringpop-pie'],
    priceConfirmed: false,
  },
];

export const productBySlug = (slug: string): Product | undefined => products.find((p) => p.slug === slug);

export const getProduct = (slug: ProductSlug): Product => {
  const p = productBySlug(slug);
  if (!p) throw new Error(`Unknown product ${slug}`);
  return p;
};

export const occasionLabels: Record<Occasion, string> = {
  everyday: 'Just because',
  couple: 'Couple',
  family: 'Family',
  wedding: 'Wedding or engagement',
  anniversary: 'Anniversary',
  birthday: 'Birthday',
  graduation: 'Graduation',
  halloween: 'Halloween costumes',
  christmas: 'Christmas and holidays',
  memorial: 'A precious memory',
  pet: 'Pet portrait',
};

/** Which occasions make sense for each product (first one is the default). */
export const occasionsFor: Record<ProductSlug, Occasion[]> = {
  'full-portrait': ['everyday', 'couple', 'family', 'wedding', 'anniversary', 'birthday', 'graduation', 'halloween', 'christmas', 'memorial', 'pet'],
  'close-up-portrait': ['everyday', 'couple', 'family', 'anniversary', 'birthday', 'memorial', 'pet'],
  'christmas-tree': ['christmas'],
  ornament: ['christmas', 'everyday'],
};
