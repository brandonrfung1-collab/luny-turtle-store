// Tiny JSON-file store for demo orders: server/data/orders.json + server/data/uploads/<orderId>/.
// Writes are serialized (one at a time per process) and atomic (temp file + rename),
// so a crash mid-write never leaves a half-written orders.json.
import { randomInt, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// No 0/O/1/I so order numbers are easy to read out loud or type.
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ORDER_ID_RE = /^LT-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/;

let queue = Promise.resolve();
/** Runs fn after every earlier write has finished. */
function serialized(fn) {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

const ordersFile = (paths) => path.join(paths.dataDir, 'orders.json');

async function readOrders(paths) {
  let raw;
  try {
    raw = await fs.readFile(ordersFile(paths), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  if (!raw.trim()) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('orders.json should contain a JSON array');
  return parsed;
}

async function writeOrders(paths, orders) {
  await fs.mkdir(paths.dataDir, { recursive: true });
  const file = ordersFile(paths);
  const tmp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(orders, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, file);
  } catch (err) {
    await fs.rm(tmp, { force: true });
    throw err;
  }
}

function newId(taken) {
  for (;;) {
    let id = 'LT-';
    for (let i = 0; i < 5; i++) id += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
    if (!taken.has(id)) return id;
  }
}

export const listOrders = (paths) => readOrders(paths);

export async function findOrder(paths, id) {
  const orders = await readOrders(paths);
  return orders.find((o) => o.id === id) ?? null;
}

/** Saves a validated draft from validate.js (photos as buffers) and returns the stored Order. */
export function createOrder(paths, draft) {
  return serialized(async () => {
    const orders = await readOrders(paths);
    const id = newId(new Set(orders.map((o) => o.id)));
    const orderDir = path.join(paths.uploadsDir, id);
    const now = new Date().toISOString();

    try {
      const lines = [];
      for (const [i, line] of draft.lines.entries()) {
        const referencePhotoUrls = [];
        for (const [n, photo] of line.photos.entries()) {
          // File names are built here from numbers only; nothing from the request reaches the path.
          const fileName = `${i + 1}-${n + 1}.${photo.ext}`;
          await fs.mkdir(orderDir, { recursive: true });
          await fs.writeFile(path.join(orderDir, fileName), photo.buffer);
          referencePhotoUrls.push(`/uploads/${id}/${fileName}`);
        }
        lines.push({
          id: `${id}-${i + 1}`,
          config: { ...line.config, referencePhotoUrls },
          unitPrice: line.unitPrice,
          quantity: line.quantity,
        });
      }

      const order = {
        id,
        createdAt: now,
        status: 'received',
        customer: draft.customer,
        shipTo: draft.shipTo,
        lines,
        subtotal: draft.subtotal,
        shipping: draft.shipping,
        total: draft.total,
        cardLast4: draft.cardLast4,
        statusHistory: [{ status: 'received', at: now }],
      };
      orders.push(order);
      await writeOrders(paths, orders);
      return order;
    } catch (err) {
      await fs.rm(orderDir, { recursive: true, force: true });
      throw err;
    }
  });
}

/** Applies { status?, artistNote? }. Returns the updated Order, or null when the id is unknown. */
export function updateOrder(paths, id, patch) {
  return serialized(async () => {
    const orders = await readOrders(paths);
    const order = orders.find((o) => o.id === id);
    if (!order) return null;
    if (patch.status !== undefined && patch.status !== order.status) {
      order.status = patch.status;
      order.statusHistory = [...(order.statusHistory ?? []), { status: patch.status, at: new Date().toISOString() }];
    }
    if (patch.artistNote !== undefined) {
      if (patch.artistNote) order.artistNote = patch.artistNote;
      else delete order.artistNote;
    }
    await writeOrders(paths, orders);
    return order;
  });
}
