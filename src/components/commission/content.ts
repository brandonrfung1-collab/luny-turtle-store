// Copy + small helpers shared by the Shop, Product and Cart pages.
// Everything here is derived from products.ts / site.ts so prices and facts stay in one place.
import { useEffect } from 'react';
import { artById, artworks } from '../../data/artworks';
import { occasionsFor } from '../../data/products';
import { site } from '../../data/site';
import type { ArtCategory, Artwork, CommissionConfig, Product, ProductSlug } from '../../data/types';
import { dollars, plural } from '../../lib/format';
import { extraFigures } from '../../lib/pricing';

/** "$50 for up to 3 figures, +$5 each extra" (or "$25 flat" for products without figures). */
export function priceRule(p: Product): string {
  if (!p.hasFigures) return `${dollars(p.basePrice)} flat`;
  return `${dollars(p.basePrice)} for up to ${p.includedFigures} figures, +${dollars(p.extraFigurePrice)} each extra`;
}

/** The part of the rule after the big price: "for up to 3 figures, +$5 each extra". */
export function priceRuleTail(p: Product): string {
  if (!p.hasFigures) return 'flat price, one drawing';
  return `for up to ${p.includedFigures} figures, +${dollars(p.extraFigurePrice)} each extra`;
}

export function defaultConfig(product: Product): CommissionConfig {
  return {
    productSlug: product.slug,
    people: product.hasFigures ? 2 : 0,
    pets: 0,
    occasion: occasionsFor[product.slug][0],
    sceneIdea: '',
    textToInclude: '',
    ornaments: '',
    notes: '',
    referencePhotos: [],
    isGift: false,
    giftNote: '',
  };
}

/** "2 people, 1 pet" */
export function figuresLabel(c: Pick<CommissionConfig, 'people' | 'pets'>): string {
  const parts: string[] = [];
  if (c.people > 0) parts.push(plural(c.people, 'person', 'people'));
  if (c.pets > 0) parts.push(plural(c.pets, 'pet'));
  return parts.join(', ') || 'No figures yet';
}

/** Live helper under the figure steppers: "4 figures: $50 + 1 extra × $5". */
export function figuresHelper(p: Product, n: number): string {
  if (n === 0) return 'Add at least one person or pet.';
  const extra = extraFigures(p, n);
  if (extra === 0) {
    const left = p.includedFigures - n;
    const tail = left > 0 ? ` · room for ${left} more` : '';
    return `${plural(n, 'figure')}: included in the ${dollars(p.basePrice)} price${tail}`;
  }
  return `${plural(n, 'figure')}: ${dollars(p.basePrice)} + ${extra} extra × ${dollars(p.extraFigurePrice)}`;
}

export interface SceneCopy {
  /** section heading */
  title: string;
  /** field label */
  label: string;
  hint: string;
  placeholders: string[];
  /** used in the "add a photo or a description" error */
  what: 'who' | 'what';
}

const exactPhotoLine = "You don't need an exact photo.";

export const sceneCopy: Record<ProductSlug, SceneCopy> = {
  'full-portrait': {
    title: 'Your scene idea',
    label: 'Where are you? What are you doing?',
    hint: `${exactPhotoLine} "Here are pics of my fam. Can you draw us paddle boarding?" works just as well.`,
    placeholders: [
      'Paddle boarding together on a sunny lake',
      'At the pumpkin patch in our Halloween costumes',
      'A picnic in the park with our teddy bears',
      'Reading side by side at the beach',
    ],
    what: 'who',
  },
  'close-up-portrait': {
    title: 'Your scene idea',
    label: "What's the vibe? Outfits, expressions, a little background?",
    hint: `${exactPhotoLine} Tell me what makes these faces yours: the giggles, the glasses, the grumpy cat side-eye.`,
    placeholders: [
      'Cheek to cheek and laughing, in our cozy sweaters',
      'Grandma with her favorite sunhat and big smile',
      'Me and my cat, both looking a little grumpy',
      'Our kids in party hats, ready for birthday cake',
    ],
    what: 'who',
  },
  'christmas-tree': {
    title: 'Around the tree',
    label: "Who's around the tree, and what are they up to?",
    hint: `${exactPhotoLine} Matching pajamas, a ladder for the star, a pet napping under the branches: anything goes.`,
    placeholders: [
      'Opening presents in our matching pajamas',
      'Putting the star on top from a ladder while the dog supervises',
      'Cuddled up with hot cocoa next to the tree',
      'Decorating the tree with our two little ones',
    ],
    what: 'who',
  },
  ornament: {
    title: 'Describe your ornament',
    label: 'What should I draw?',
    hint: 'One favorite ornament (or a little object that means a lot), drawn on its own with a white sticker outline. A photo helps if you have one.',
    placeholders: [
      'A yellow NYC taxi carrying a tree on its roof',
      'The front door of our first apartment, with a wreath',
      "My grandma's apple pie, fresh out of the oven",
      "Our dog's favorite squeaky toy",
    ],
    what: 'what',
  },
};

/** "What's included" list for the product page, built from the product + site facts. */
export function includedFor(p: Product): string[] {
  const list = [`An original ${p.size} drawing in ${p.medium.toLowerCase()}`];
  if (p.hasFigures) list.push(`Up to ${p.includedFigures} people or pets, +${dollars(p.extraFigurePrice)} for each extra`);
  if (p.needsOrnamentList) list.push('A cozy tree hung with your favorite ornaments and things you love');
  if (p.slug === 'ornament') list.push('Drawn on its own with a white sticker outline');
  list.push('A pencil sketch to approve before any ink goes down');
  list.push('Finished with my signature turtle');
  if (site.shippingIncluded) list.push('Shipping included');
  return list;
}

/** Artwork ids that exist (the art set may drop some ids). */
export function existingArt(ids: readonly string[]): Artwork[] {
  const out: Artwork[] = [];
  for (const id of ids) {
    const a = artById(id);
    if (a && !out.some((o) => o.id === a.id)) out.push(a);
  }
  return out;
}

/** All drawings for a product: hero first, then the examples (missing ids skipped). */
export function productArt(p: Product): Artwork[] {
  return existingArt([p.heroArtId, ...p.exampleArtIds]);
}

const relatedCategories: Record<ProductSlug, ArtCategory[]> = {
  'full-portrait': ['families', 'couples', 'friends', 'pets', 'weddings', 'halloween'],
  'close-up-portrait': ['closeups'],
  'christmas-tree': ['christmas'],
  ornament: ['ornaments', 'christmas'],
};

/** A few more finished drawings for the bottom of a product page, not already shown above. */
export function moreArtFor(p: Product, exclude: string[], count = 3): Artwork[] {
  const cats = relatedCategories[p.slug];
  // Close-ups only belong on the close-up page; everywhere else they'd misrepresent the drawing type.
  const fits = (a: Artwork) =>
    a.kind === 'art' && !exclude.includes(a.id) && (p.slug === 'close-up-portrait' || !a.categories.includes('closeups'));
  const pool = (artworks ?? []).filter((a) => fits(a) && a.categories.some((c) => cats.includes(c)));
  pool.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  const picked = pool.slice(0, count);
  if (picked.length < count) {
    // Top up with any other finished drawing so the row never looks empty.
    for (const a of artworks ?? []) {
      if (picked.length >= count) break;
      if (fits(a) && !picked.some((x) => x.id === a.id)) picked.push(a);
    }
  }
  return picked;
}

/** Sets the tab title while a page is mounted. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [title]);
}

/** Cuts long free text for cart snippets. */
export function snippet(text: string, max = 110): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}
