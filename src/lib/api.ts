// Client for the local orders API (server/api.js). Same origin, so plain fetch('/api/...').
// The static Vercel demo (VITE_STATIC_DEMO=1) has no server, so it uses browserBackend instead.
import { STATIC_DEMO } from '../data/site';
import type { Address, CommissionConfig, CustomerInfo, Order, OrderStatus } from '../data/types';
import { ApiError } from './apiError';
import { browserBackend } from './browserBackend';

export interface NewOrderLine {
  config: CommissionConfig; // includes referencePhotos as data URLs; the server saves them to disk
  quantity: number;
}

export interface NewOrderRequest {
  customer: CustomerInfo;
  shipTo: Address & { recipientName: string };
  lines: NewOrderLine[];
  /** demo only: the server keeps the last 4 digits and discards the rest */
  card: { number: string; name: string; expiry: string; cvc: string };
}

export { ApiError } from './apiError';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* not JSON */
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

const serverApi = {
  createOrder: (body: NewOrderRequest) => request<Order>('/api/orders', { method: 'POST', body: JSON.stringify(body) }),

  /** Customers look up an order with its id + the email used at checkout. */
  getOrder: (id: string, email: string) =>
    request<Order>(`/api/orders/${encodeURIComponent(id)}?email=${encodeURIComponent(email)}`),

  studio: {
    listOrders: (pass: string) => request<Order[]>('/api/studio/orders', { headers: { 'x-studio-pass': pass } }),
    updateOrder: (pass: string, id: string, patch: { status?: OrderStatus; artistNote?: string }) =>
      request<Order>(`/api/studio/orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'x-studio-pass': pass },
        body: JSON.stringify(patch),
      }),
  },
};

export const api: typeof serverApi = STATIC_DEMO ? browserBackend : serverApi;

export const orderStatusLabels: Record<OrderStatus, string> = {
  received: 'Order received',
  sketching: 'Sketching',
  'awaiting-approval': 'Sketch sent for your approval',
  'inking-coloring': 'Inking and coloring',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

export const orderStatusFlow: OrderStatus[] = ['received', 'sketching', 'awaiting-approval', 'inking-coloring', 'shipped', 'delivered'];
