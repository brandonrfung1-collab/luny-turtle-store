// Browser-only stand-in for the orders API (server/api.js), used by the static Vercel demo build
// (VITE_STATIC_DEMO=1), where there is no server. Orders live in this browser's localStorage, so a
// visitor can place a demo order, open its tracking page and see it in /studio — all in one browser.
// The rules mirror server/validate.js + server/store.js.
import { productBySlug } from '../data/products';
import { site } from '../data/site';
import type { Order, OrderLine, OrderStatus } from '../data/types';
import { ApiError } from './apiError';
import type { NewOrderRequest } from './api';
import { priceFor } from './pricing';

const STORAGE_KEY = 'lunyturtle.demoOrders.v1';
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ORDER_ID_RE = /^LT-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/;
const DEMO_DECLINE = '4000000000000002';
const STATUSES: OrderStatus[] = ['received', 'sketching', 'awaiting-approval', 'inking-coloring', 'shipped', 'delivered'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOT_FOUND = "We couldn't find that order. Double-check the order number and use the email you checked out with.";

const fail = (message: string, status = 400): never => {
  throw new ApiError(message, status);
};

/** A short pause so buttons show their loading state, like the real API. */
const pause = () => new Promise((r) => setTimeout(r, 450));

function read(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Saves orders; if photos overflow the browser's storage, drops photos from the oldest orders first. */
function write(orders: Order[]) {
  const attempt = (list: Order[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  };
  if (attempt(orders)) return;
  const slimmed = orders.map((o) => ({ ...o, lines: o.lines.map((l) => ({ ...l, config: { ...l.config } })) }));
  for (const order of slimmed) {
    for (const line of order.lines) line.config.referencePhotoUrls = [];
    if (attempt(slimmed)) return;
  }
  fail("Your browser's storage is full, so the demo order couldn't be saved. Try removing some reference photos.", 507);
}

function newId(taken: Set<string>) {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    const id = 'LT-' + Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('');
    if (!taken.has(id)) return id;
  }
}

function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function checkCard(card: NewOrderRequest['card']) {
  const number = (card?.number ?? '').replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(number)) fail('Card numbers are 13 to 19 digits.');
  if (!luhn(number)) fail("That card number doesn't look right. For the demo, use 4242 4242 4242 4242.");
  if (!card.name?.trim()) fail('Please add the name on the card.');
  const em = /^(\d{2})\/(\d{2})$/.exec((card.expiry ?? '').replace(/\s/g, ''));
  if (!em) fail('Expiry dates look like MM/YY.');
  const month = Number(em![1]);
  if (month < 1 || month > 12) fail('The expiry month should be 01 to 12.');
  const now = new Date();
  if ((2000 + Number(em![2])) * 12 + (month - 1) < now.getFullYear() * 12 + now.getMonth()) {
    fail('That card has expired. Any future date works for the demo.');
  }
  if (!/^\d{3,4}$/.test(card.cvc ?? '')) fail('The security code (CVC) is 3 or 4 digits.');
  if (number === DEMO_DECLINE) fail('Your card was declined (demo). Try 4242 4242 4242 4242.', 402);
  return number.slice(-4);
}

const checkPass = (pass: string) => {
  if (pass !== site.studioPasscode) fail('That passcode is not right.', 401);
};

export const browserBackend = {
  async createOrder(body: NewOrderRequest): Promise<Order> {
    await pause();
    const { customer, shipTo } = body;
    if (!customer?.name?.trim()) fail('Please add your name.');
    if (!EMAIL_RE.test(customer?.email?.trim() ?? '')) fail('Please add a valid email address.');
    if (!shipTo?.line1?.trim() || !shipTo.city?.trim() || !shipTo.state?.trim() || !/^\d{5}(-\d{4})?$/.test(shipTo.postalCode ?? '')) {
      fail('Please complete the shipping address.');
    }
    if (!body.lines?.length) fail('Your cart is empty.');
    const cardLast4 = checkCard(body.card);

    const orders = read();
    const id = newId(new Set(orders.map((o) => o.id)));
    const now = new Date().toISOString();
    const lines: OrderLine[] = body.lines.map((line, i) => {
      const product = productBySlug(line.config.productSlug);
      if (!product) fail('One of the drawings in your cart is no longer available.');
      if (product!.hasFigures && line.config.people + line.config.pets < 1) fail('Each drawing needs at least one person or pet.');
      const { referencePhotos, ...rest } = line.config;
      return {
        id: `${id}-${i + 1}`,
        config: { ...rest, referencePhotoUrls: (referencePhotos ?? []).map((p) => p.dataUrl) },
        unitPrice: priceFor(line.config), // recomputed, never trusted from the cart
        quantity: Math.max(1, Math.min(10, Math.round(line.quantity || 1))),
      };
    });
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const order: Order = {
      id,
      createdAt: now,
      status: 'received',
      customer: { ...customer, email: customer.email.trim() },
      shipTo,
      lines,
      subtotal,
      shipping: 0,
      total: subtotal,
      cardLast4,
      statusHistory: [{ status: 'received', at: now }],
    };
    write([...orders, order]);
    return order;
  },

  async getOrder(rawId: string, rawEmail: string): Promise<Order> {
    await pause();
    const id = rawId.trim().toUpperCase();
    const email = rawEmail.trim().toLowerCase();
    const order = ORDER_ID_RE.test(id) && email ? read().find((o) => o.id === id) : undefined;
    if (!order || order.customer.email.toLowerCase() !== email) fail(NOT_FOUND, 404);
    return order!;
  },

  studio: {
    async listOrders(pass: string): Promise<Order[]> {
      await pause();
      checkPass(pass);
      return read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
    },

    async updateOrder(pass: string, rawId: string, patch: { status?: OrderStatus; artistNote?: string }): Promise<Order> {
      await pause();
      checkPass(pass);
      if (patch.status !== undefined && !STATUSES.includes(patch.status)) fail('Unknown status.');
      const orders = read();
      const order = orders.find((o) => o.id === rawId.trim().toUpperCase());
      if (!order) fail('No order with that number.', 404);
      if (patch.status !== undefined && patch.status !== order!.status) {
        order!.status = patch.status;
        order!.statusHistory = [...(order!.statusHistory ?? []), { status: patch.status, at: new Date().toISOString() }];
      }
      if (patch.artistNote !== undefined) {
        const note = patch.artistNote.trim();
        if (note.length > 1000) fail('Keep the note under 1000 characters.');
        if (note) order!.artistNote = note;
        else delete order!.artistNote;
      }
      write(orders);
      return order!;
    },
  },
};
