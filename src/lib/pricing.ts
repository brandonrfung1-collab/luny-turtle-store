import { getProduct } from '../data/products';
import type { CartItem, CommissionConfig, Product } from '../data/types';

export const figureCount = (c: Pick<CommissionConfig, 'people' | 'pets'>) => c.people + c.pets;

export function extraFigures(product: Product, figures: number): number {
  if (!product.hasFigures) return 0;
  return Math.max(0, figures - product.includedFigures);
}

/** Price in whole dollars for one drawing with this configuration. */
export function priceFor(config: CommissionConfig): number {
  const product = getProduct(config.productSlug);
  return product.basePrice + extraFigures(product, figureCount(config)) * product.extraFigurePrice;
}

/** Human-readable price breakdown lines, e.g. for the builder summary and cart. */
export function priceBreakdown(config: CommissionConfig): { label: string; amount: number }[] {
  const product = getProduct(config.productSlug);
  const lines: { label: string; amount: number }[] = [];
  if (product.hasFigures) {
    lines.push({ label: `${product.name}, up to ${product.includedFigures} figures`, amount: product.basePrice });
    const extra = extraFigures(product, figureCount(config));
    if (extra > 0) {
      lines.push({ label: `${extra} extra figure${extra === 1 ? '' : 's'} × $${product.extraFigurePrice}`, amount: extra * product.extraFigurePrice });
    }
  } else {
    lines.push({ label: product.name, amount: product.basePrice });
  }
  lines.push({ label: 'Shipping', amount: 0 });
  return lines;
}

export const cartSubtotal = (items: CartItem[]) => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0);
