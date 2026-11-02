// Small helpers shared by the checkout, order status, track and studio pages.
import { getProduct, occasionLabels, productBySlug } from '../../data/products';
import type { CommissionConfig, Order, OrderLine } from '../../data/types';
import { plural } from '../../lib/format';

const LAST_ORDER_KEY = 'lunyturtle.lastOrder';

export interface LastOrder {
  id: string;
  email: string;
}

export function saveLastOrder(value: LastOrder) {
  try {
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function loadLastOrder(): LastOrder | null {
  try {
    const raw = localStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v.id === 'string' && typeof v.email === 'string' ? { id: v.id, email: v.email } : null;
  } catch {
    return null;
  }
}

/** "LT-4F7K2" from whatever the customer typed ("lt 4f7k2", "4F7K2", ...). */
export function normalizeOrderId(raw: string): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = compact.startsWith('LT') && compact.length === 7 ? compact.slice(2) : compact;
  return `LT-${body}`;
}

export const ORDER_ID_RE = /^LT-[A-Z0-9]{5}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const productName = (slug: string) => productBySlug(slug)?.name ?? 'Drawing';

/** "2 people + 1 pet" / "4" x 6" ornament" */
export function figuresText(config: Pick<CommissionConfig, 'productSlug' | 'people' | 'pets'>): string {
  const product = productBySlug(config.productSlug);
  if (product && !product.hasFigures) return `${product.size} drawing`;
  const parts: string[] = [];
  if (config.people > 0) parts.push(plural(config.people, 'person', 'people'));
  if (config.pets > 0) parts.push(plural(config.pets, 'pet'));
  return parts.join(' + ') || 'No figures yet';
}

export const occasionText = (config: Pick<CommissionConfig, 'occasion'>) => occasionLabels[config.occasion] ?? config.occasion;

export const isPriceConfirmed = (slug: CommissionConfig['productSlug']) => {
  try {
    return getProduct(slug).priceConfirmed;
  } catch {
    return false;
  }
};

export const orderItemCount = (order: Order) => order.lines.reduce((n, l) => n + l.quantity, 0);

export const lineSummary = (order: Order) => {
  const first = order.lines[0];
  if (!first) return 'No drawings';
  const rest = order.lines.length - 1;
  return `${productName(first.config.productSlug)}${rest > 0 ? ` + ${rest} more` : ''}`;
};

export const lineHasGift = (lines: Pick<OrderLine, 'config'>[]) => lines.some((l) => l.config.isGift);
