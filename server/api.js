// Orders API for the Luny Turtle demo store. Localhost only, no real payments.
// Contract (see src/lib/api.ts for the client side):
//   POST  /api/orders            body: NewOrderRequest      -> 201 Order
//   GET   /api/orders/:id        ?email=<customer email>    -> Order (404 if no match)
//   GET   /api/studio/orders     header x-studio-pass        -> Order[] (newest first)
//   PATCH /api/studio/orders/:id header x-studio-pass, body { status?, artistNote? } -> Order
// Errors are always JSON: { error: "..." }.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORDER_STATUSES } from './catalog.js';
import { validateNewOrder, ValidationError } from './validate.js';
import { ORDER_ID_RE, createOrder, findOrder, listOrders, updateOrder } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

/** Same as site.studioPasscode in src/data/site.ts (demo only). */
const STUDIO_PASSCODE = 'turtle';
const ARTIST_NOTE_MAX = 1000;
const NOT_FOUND = "We couldn't find that order. Double-check the order number and use the email you checked out with.";

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function requireStudio(req, res, next) {
  if (req.get('x-studio-pass') !== STUDIO_PASSCODE) {
    return res.status(401).json({ error: 'That passcode is not right.' });
  }
  next();
}

const normalizeId = (raw) =>
  String(raw ?? '')
    .trim()
    .toUpperCase();

export function createApiRouter() {
  const router = express.Router();
  const paths = { dataDir: DATA_DIR, uploadsDir: UPLOADS_DIR };

  router.get('/health', (_req, res) => res.json({ ok: true }));

  router.post(
    '/orders',
    asyncRoute(async (req, res) => {
      const draft = validateNewOrder(req.body); // throws ValidationError (400 / 402)
      const order = await createOrder(paths, draft);
      res.status(201).json(order);
    }),
  );

  router.get(
    '/orders/:id',
    asyncRoute(async (req, res) => {
      const id = normalizeId(req.params.id);
      const email = String(req.query.email ?? '')
        .trim()
        .toLowerCase();
      if (!ORDER_ID_RE.test(id) || !email) return res.status(404).json({ error: NOT_FOUND });
      const order = await findOrder(paths, id);
      if (!order || order.customer.email.toLowerCase() !== email) return res.status(404).json({ error: NOT_FOUND });
      res.json(order);
    }),
  );

  router.get(
    '/studio/orders',
    requireStudio,
    asyncRoute(async (_req, res) => {
      const orders = await listOrders(paths);
      orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
      res.json(orders);
    }),
  );

  router.patch(
    '/studio/orders/:id',
    requireStudio,
    asyncRoute(async (req, res) => {
      const id = normalizeId(req.params.id);
      if (!ORDER_ID_RE.test(id)) return res.status(404).json({ error: 'No order with that number.' });
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const patch = {};
      if (body.status !== undefined) {
        if (!ORDER_STATUSES.includes(body.status)) {
          return res.status(400).json({ error: `Unknown status. Use one of: ${ORDER_STATUSES.join(', ')}.` });
        }
        patch.status = body.status;
      }
      if (body.artistNote !== undefined) {
        if (typeof body.artistNote !== 'string') return res.status(400).json({ error: 'The note must be text.' });
        const note = body.artistNote.trim();
        if (note.length > ARTIST_NOTE_MAX) {
          return res.status(400).json({ error: `Keep the note under ${ARTIST_NOTE_MAX} characters.` });
        }
        patch.artistNote = note;
      }
      if (patch.status === undefined && patch.artistNote === undefined) {
        return res.status(400).json({ error: 'Nothing to update. Send a status and/or an artistNote.' });
      }
      const order = await updateOrder(paths, id, patch);
      if (!order) return res.status(404).json({ error: 'No order with that number.' });
      res.json(order);
    }),
  );

  // Unknown API routes get JSON, not the SPA's index.html.
  router.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  router.use((err, _req, res, _next) => {
    if (err instanceof ValidationError) return res.status(err.status).json({ error: err.message });
    console.error('[api]', err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });

  return router;
}
