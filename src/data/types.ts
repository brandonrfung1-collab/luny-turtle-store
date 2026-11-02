// Shared types for the Luny Turtle demo store.
// Every agent/page imports from here; change with care.

export type ArtCategory =
  | 'couples'
  | 'families'
  | 'friends'
  | 'weddings'
  | 'pets'
  | 'halloween'
  | 'christmas'
  | 'closeups'
  | 'ornaments'
  | 'process';

export interface Artwork {
  /** kebab-case, unique, matches the file name in /public/art (without extension) */
  id: string;
  /** public URL, e.g. "/art/ghost-onesies.jpg" */
  src: string;
  /** short display title, e.g. "Ghost onesie couple" */
  title: string;
  /** Esther's own caption text from Instagram when we know which post it is (verbatim, no hashtags) */
  caption?: string;
  /** descriptive alt text for screen readers */
  alt: string;
  categories: ArtCategory[];
  /** pixel size of the cropped file */
  width: number;
  height: number;
  /** 'art' = a finished drawing, 'promo' = an announcement graphic, 'process' = sketch / work in progress */
  kind: 'art' | 'promo' | 'process';
  /** good enough (sharp, complete, well-cropped) to use large on the home page */
  featured?: boolean;
}

export type ProductSlug = 'full-portrait' | 'close-up-portrait' | 'christmas-tree' | 'ornament';

export type Occasion =
  | 'everyday'
  | 'couple'
  | 'family'
  | 'wedding'
  | 'anniversary'
  | 'birthday'
  | 'graduation'
  | 'halloween'
  | 'christmas'
  | 'memorial'
  | 'pet';

export interface Product {
  slug: ProductSlug;
  name: string;
  tagline: string;
  description: string;
  /** e.g. '8" x 10"' */
  size: string;
  medium: string;
  /** whole US dollars */
  basePrice: number;
  /** how many figures the base price covers (people and pets each count as one) */
  includedFigures: number;
  /** price per figure beyond includedFigures */
  extraFigurePrice: number;
  /** max figures the builder allows */
  maxFigures: number;
  /** whether figures are part of this product at all (ornament drawings have none) */
  hasFigures: boolean;
  /** id of an Artwork to show as the product image */
  heroArtId: string;
  /** more Artwork ids for the product page */
  exampleArtIds: string[];
  /** true when the price is confirmed from Esther's own posts; false = placeholder for the demo */
  priceConfirmed: boolean;
  /** extra builder fields this product needs */
  needsOrnamentList?: boolean;
}

export interface ReferencePhoto {
  /** client-side id */
  id: string;
  name: string;
  /** downscaled JPEG data URL (max ~1400px), small enough to keep in localStorage + POST */
  dataUrl: string;
}

/** One configured commission sitting in the cart. */
export interface CommissionConfig {
  productSlug: ProductSlug;
  people: number;
  pets: number;
  occasion: Occasion;
  /** "Can you draw us paddle boarding?" — the scene / background idea */
  sceneIdea: string;
  /** names, a date, a school, etc. to letter into the drawing (optional) */
  textToInclude: string;
  /** Christmas tree only: the ornaments / things you love to hang on the tree */
  ornaments: string;
  /** anything else Esther should know (personalities, outfits, pet names...) */
  notes: string;
  referencePhotos: ReferencePhoto[];
  isGift: boolean;
  giftNote: string;
}

export interface CartItem {
  /** client-side id */
  id: string;
  config: CommissionConfig;
  /** computed with priceFor() at add time, whole dollars */
  unitPrice: number;
  quantity: number;
  addedAt: string;
}

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  instagram: string;
}

export type OrderStatus = 'received' | 'sketching' | 'awaiting-approval' | 'inking-coloring' | 'shipped' | 'delivered';

export interface OrderLine {
  id: string;
  config: Omit<CommissionConfig, 'referencePhotos'> & {
    /** server URLs, e.g. /uploads/LT-1234/ref-1.jpg */
    referencePhotoUrls: string[];
  };
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string; // e.g. "LT-4F7K2"
  createdAt: string;
  status: OrderStatus;
  customer: CustomerInfo;
  shipTo: Address & { recipientName: string };
  lines: OrderLine[];
  subtotal: number;
  shipping: number; // always 0, shipping included
  total: number;
  /** last 4 digits of the demo card, nothing else is stored */
  cardLast4: string;
  statusHistory: { status: OrderStatus; at: string; note?: string }[];
  /** message from Esther shown on the order page (studio can set it) */
  artistNote?: string;
}
