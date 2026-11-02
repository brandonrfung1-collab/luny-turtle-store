import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, CommissionConfig } from '../data/types';
import { uid } from '../lib/format';
import { cartCount, cartSubtotal, priceFor } from '../lib/pricing';

const STORAGE_KEY = 'lunyturtle.cart.v1';

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  /** Adds a configured commission; returns the new item id. */
  addItem: (config: CommissionConfig, quantity?: number) => string;
  updateItem: (id: string, config: CommissionConfig) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  getItem: (id: string) => CartItem | undefined;
  /** true when photos were too big to save in the browser (they stay in memory for this tab) */
  photosNotPersisted: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    // Probably over quota because of reference photos: save without them.
    try {
      const slim = items.map((i) => ({ ...i, config: { ...i.config, referencePhotos: [] } }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      /* storage unavailable */
    }
    return false;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);
  const [photosNotPersisted, setPhotosNotPersisted] = useState(false);

  useEffect(() => {
    setPhotosNotPersisted(!save(items));
  }, [items]);

  // Keep tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addItem = useCallback((config: CommissionConfig, quantity = 1) => {
    const id = uid('item_');
    setItems((prev) => [...prev, { id, config, unitPrice: priceFor(config), quantity, addedAt: new Date().toISOString() }]);
    return id;
  }, []);

  const updateItem = useCallback((id: string, config: CommissionConfig) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, config, unitPrice: priceFor(config) } : i)));
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(10, Math.round(quantity))) } : i)));
  }, []);

  const removeItem = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const getItem = useCallback((id: string) => items.find((i) => i.id === id), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      addItem,
      updateItem,
      setQuantity,
      removeItem,
      clear,
      getItem,
      photosNotPersisted,
    }),
    [items, addItem, updateItem, setQuantity, removeItem, clear, getItem, photosNotPersisted],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
