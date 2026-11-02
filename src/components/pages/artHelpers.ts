// Helpers for picking Esther's drawings safely (any id may be missing) and for the gallery.
import { artById, artworks } from '../../data/artworks';
import type { ArtCategory, Artwork, ProductSlug } from '../../data/types';

/** The artworks for these ids that exist, in the given order. Missing ids are skipped. */
export function pickArt(ids: readonly string[]): Artwork[] {
  const out: Artwork[] = [];
  for (const id of ids) {
    const a = artById(id);
    if (a && !out.some((o) => o.id === a.id)) out.push(a);
  }
  return out;
}

/**
 * Picks `n` artworks, preferring the given ids (in order), then topping up with other
 * finished, featured drawings so a section never looks half empty.
 */
export function pickArtWithFallback(ids: readonly string[], n: number, exclude: readonly string[] = []): Artwork[] {
  const chosen = pickArt(ids).filter((a) => !exclude.includes(a.id));
  if (chosen.length >= n) return chosen.slice(0, n);
  const taken = new Set([...exclude, ...chosen.map((a) => a.id)]);
  const extras = [
    ...artworks.filter((a) => a.kind === 'art' && a.featured && !taken.has(a.id)),
    ...artworks.filter((a) => a.kind === 'art' && !a.featured && !taken.has(a.id)),
  ];
  return [...chosen, ...extras].slice(0, n);
}

/** Width / height of a drawing. */
export const ratio = (a: Artwork) => a.width / a.height;

export const categoryLabels: Record<ArtCategory, string> = {
  couples: 'Couples',
  families: 'Families',
  friends: 'Friends',
  weddings: 'Weddings',
  pets: 'Pets',
  halloween: 'Halloween',
  christmas: 'Christmas',
  closeups: 'Close-ups',
  ornaments: 'Ornaments',
  process: 'Sketches',
};

/** Order of the gallery filter chips. */
export const galleryCategories: ArtCategory[] = [
  'couples',
  'families',
  'friends',
  'weddings',
  'pets',
  'halloween',
  'christmas',
  'closeups',
  'ornaments',
  'process',
];

/** Everything shown in the gallery: finished drawings and sketches, never promo graphics. */
export const galleryArt = (): Artwork[] => artworks.filter((a) => a.kind === 'art' || a.kind === 'process');

/** Sketches always count as 'process', even if the data forgot the category. */
export function inCategory(a: Artwork, c: ArtCategory): boolean {
  if (c === 'process') return a.kind === 'process' || a.categories.includes('process');
  return a.categories.includes(c);
}

/** The product that best matches a drawing, for "Commission something like this". */
export function productFor(a: Artwork): ProductSlug {
  // Tree drawings are also tagged 'ornaments' (they show the ornaments), so check for a tree first.
  if (a.categories.includes('christmas') && /tree/i.test(`${a.id} ${a.title}`)) return 'christmas-tree';
  if (a.categories.includes('ornaments')) return 'ornament';
  if (a.categories.includes('christmas')) return 'christmas-tree';
  if (a.categories.includes('closeups')) return 'close-up-portrait';
  return 'full-portrait';
}
