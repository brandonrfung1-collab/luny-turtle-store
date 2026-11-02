// Validation for POST /api/orders. Everything from the browser is untrusted:
// strings are trimmed and length-capped, prices are recomputed from server/catalog.js,
// photos are decoded and checked, and only the card's last 4 digits survive.
import { OCCASIONS, US_STATES, catalog, priceFor } from './catalog.js';

export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const fail = (message, status = 400) => {
  throw new ValidationError(message, status);
};

export const LIMITS = {
  lines: 10,
  quantity: 10,
  photosPerLine: 6, // MAX_REFERENCE_PHOTOS in src/lib/images.ts
  photosPerOrder: 24,
  photoBytes: 6 * 1024 * 1024,
  orderPhotoBytes: 30 * 1024 * 1024,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const INSTAGRAM_RE = /^[A-Za-z0-9._]{1,30}$/;
const PHONE_RE = /^[0-9+().\-\s]{7,24}$/;
const DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const DEMO_DECLINE = '4000000000000002';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Reads an optional/required string field, trimmed, with a length cap. */
function str(obj, key, label, { max, required = false, multiline = false } = {}) {
  const raw = obj?.[key];
  if (raw === undefined || raw === null) {
    if (required) fail(`Please add ${label}.`);
    return '';
  }
  if (typeof raw !== 'string') fail(`${cap(label)} should be text.`);
  // Drop control characters (keep newlines/tabs in multiline fields).
  let v = raw.replace(multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, '');
  v = multiline ? v.replace(/\r\n?/g, '\n').trim() : v.replace(/\s+/g, ' ').trim();
  if (required && !v) fail(`Please add ${label}.`);
  if (v.length > max) fail(`${cap(label)} is too long (max ${max} characters).`);
  return v;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function int(value, label, min, max) {
  if (typeof value !== 'number' || !Number.isInteger(value)) fail(`${cap(label)} should be a whole number.`);
  if (value < min || value > max) fail(`${cap(label)} should be between ${min} and ${max}.`);
  return value;
}

export function luhn(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function sniffImage(buf, type) {
  if (type === 'jpeg') return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (type === 'png') return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === 'webp') return buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

function decodePhoto(photo, where) {
  const dataUrl = isObj(photo) ? photo.dataUrl : undefined;
  if (typeof dataUrl !== 'string') fail(`${where}: a reference photo is missing its image data.`);
  // Cheap size check before running a regex or decoding.
  if (dataUrl.length > Math.ceil((LIMITS.photoBytes * 4) / 3) + 64)
    fail(`${where}: one reference photo is over 6 MB. Try a smaller photo.`);
  const m = DATA_URL_RE.exec(dataUrl);
  if (!m) fail(`${where}: reference photos must be JPEG, PNG or WebP images.`);
  const type = m[1];
  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length === 0) fail(`${where}: a reference photo is empty.`);
  if (buffer.length > LIMITS.photoBytes) fail(`${where}: one reference photo is over 6 MB. Try a smaller photo.`);
  if (!sniffImage(buffer, type)) fail(`${where}: one reference photo doesn't look like a real image file.`);
  return { buffer, ext: type === 'jpeg' ? 'jpg' : type };
}

function validateCustomer(c) {
  if (!isObj(c)) fail('Please fill in your contact details.');
  const name = str(c, 'name', 'your name', { max: 80, required: true });
  const email = str(c, 'email', 'your email', { max: 254, required: true });
  if (!EMAIL_RE.test(email)) fail('Please enter a valid email address, like you@example.com.');
  const phone = str(c, 'phone', 'phone number', { max: 24 });
  if (phone && (!PHONE_RE.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15)) {
    fail('That phone number looks off. It is optional, so you can leave it blank.');
  }
  let instagram = str(c, 'instagram', 'Instagram handle', { max: 31 }).replace(/^@+/, '');
  if (instagram && !INSTAGRAM_RE.test(instagram)) fail('Instagram handles use letters, numbers, periods and underscores only.');
  instagram = instagram ? `@${instagram}` : '';
  return { name, email, phone, instagram };
}

function validateShipTo(s) {
  if (!isObj(s)) fail('Please fill in the shipping address.');
  const recipientName = str(s, 'recipientName', "the recipient's name", { max: 80, required: true });
  const line1 = str(s, 'line1', 'a street address', { max: 100, required: true });
  const line2 = str(s, 'line2', 'address line 2', { max: 100 });
  const city = str(s, 'city', 'a city', { max: 60, required: true });
  const state = str(s, 'state', 'a state', { max: 2, required: true }).toUpperCase();
  if (!US_STATES.includes(state)) fail('Please choose a US state.');
  const postalCode = str(s, 'postalCode', 'a ZIP code', { max: 10, required: true });
  if (!ZIP_RE.test(postalCode)) fail('ZIP codes look like 12345 or 12345-6789.');
  const country = str(s, 'country', 'a country', { max: 40 });
  if (country && !/^(united states( of america)?|us|usa)$/i.test(country)) fail('For now I only ship within the US.');
  return { recipientName, line1, line2, city, state, postalCode, country: 'United States' };
}

function validateLine(line, index, budget) {
  const where = `Drawing ${index + 1}`;
  if (!isObj(line) || !isObj(line.config)) fail(`${where} is missing its details.`);
  const c = line.config;
  const product = typeof c.productSlug === 'string' && Object.hasOwn(catalog, c.productSlug) ? catalog[c.productSlug] : null;
  if (!product) fail(`${where}: that drawing type isn't one I offer.`);

  let people = int(c.people ?? 0, `${where}: people`, 0, 50);
  let pets = int(c.pets ?? 0, `${where}: pets`, 0, 50);
  if (product.hasFigures) {
    const figures = people + pets;
    if (figures < 1) fail(`${where}: add at least one person or pet.`);
    if (figures > product.maxFigures) fail(`${where}: a ${product.name.toLowerCase()} fits up to ${product.maxFigures} people and pets.`);
  } else {
    // Ornament drawings have no figures.
    people = 0;
    pets = 0;
  }

  const occasion = typeof c.occasion === 'string' && OCCASIONS.includes(c.occasion) ? c.occasion : null;
  if (!occasion) fail(`${where}: please pick an occasion.`);

  const config = {
    productSlug: product.slug,
    people,
    pets,
    occasion,
    sceneIdea: str(c, 'sceneIdea', `${where}: the scene idea`, { max: 1000, multiline: true }),
    textToInclude: str(c, 'textToInclude', `${where}: the text to include`, { max: 200 }),
    ornaments: str(c, 'ornaments', `${where}: the ornament list`, { max: 1000, multiline: true }),
    notes: str(c, 'notes', `${where}: the notes`, { max: 1500, multiline: true }),
    isGift: c.isGift === true,
    giftNote: '',
  };
  if (config.isGift) config.giftNote = str(c, 'giftNote', `${where}: the gift note`, { max: 500, multiline: true });

  const rawPhotos = c.referencePhotos ?? [];
  if (!Array.isArray(rawPhotos)) fail(`${where}: reference photos should be a list.`);
  if (rawPhotos.length > LIMITS.photosPerLine) fail(`${where}: up to ${LIMITS.photosPerLine} reference photos, please.`);
  const photos = rawPhotos.map((p) => decodePhoto(p, where));
  budget.count += photos.length;
  budget.bytes += photos.reduce((n, p) => n + p.buffer.length, 0);
  if (budget.count > LIMITS.photosPerOrder) fail(`That's a lot of photos! Please keep it to ${LIMITS.photosPerOrder} per order.`);
  if (budget.bytes > LIMITS.orderPhotoBytes) fail('Your reference photos are too big in total. Try fewer or smaller photos.');

  const quantity = int(line.quantity ?? 1, `${where}: quantity`, 1, LIMITS.quantity);
  const unitPrice = priceFor(product, people, pets);
  return { config, photos, unitPrice, quantity };
}

function validateCard(card) {
  if (!isObj(card)) fail('Please add the demo card details.');
  const number = str(card, 'number', 'a card number', { max: 30, required: true }).replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(number)) fail('Card numbers are 13 to 19 digits.');
  if (!luhn(number)) fail("That card number doesn't look right. For the demo, use 4242 4242 4242 4242.");
  str(card, 'name', 'the name on the card', { max: 80, required: true });

  const expiry = str(card, 'expiry', 'an expiry date', { max: 7, required: true }).replace(/\s/g, '');
  const em = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!em) fail('Expiry dates look like MM/YY.');
  const month = Number(em[1]);
  const year = 2000 + Number(em[2]);
  if (month < 1 || month > 12) fail('The expiry month should be 01 to 12.');
  const now = new Date();
  const thisMonth = now.getFullYear() * 12 + now.getMonth(); // getMonth is 0-based
  const cardMonth = year * 12 + (month - 1);
  if (cardMonth < thisMonth) fail('That card has expired. Any future date works for the demo.');
  if (cardMonth > thisMonth + 12 * 20) fail('That expiry date is too far in the future.');

  const cvc = str(card, 'cvc', 'a security code (CVC)', { max: 4, required: true });
  if (!/^\d{3,4}$/.test(cvc)) fail('The security code (CVC) is 3 or 4 digits.');
  return { number, last4: number.slice(-4) };
}

/**
 * Validates a NewOrderRequest (src/lib/api.ts). Returns a clean draft:
 * { customer, shipTo, lines: [{ config, photos: [{buffer, ext}], unitPrice, quantity }], subtotal, shipping, total, cardLast4 }
 */
export function validateNewOrder(body) {
  if (!isObj(body)) fail('Your order was empty. Please try again.');
  const customer = validateCustomer(body.customer);
  const shipTo = validateShipTo(body.shipTo);

  if (!Array.isArray(body.lines) || body.lines.length === 0) fail('Your cart is empty. Add a drawing first.');
  if (body.lines.length > LIMITS.lines) fail(`Please keep it to ${LIMITS.lines} drawings per order.`);
  const budget = { count: 0, bytes: 0 };
  const lines = body.lines.map((l, i) => validateLine(l, i, budget));

  const card = validateCard(body.card);
  // Everything else is valid: now the pretend payment.
  if (card.number === DEMO_DECLINE) fail('Your card was declined (demo). Try 4242 4242 4242 4242.', 402);

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  return { customer, shipTo, lines, subtotal, shipping: 0, total: subtotal, cardLast4: card.last4 };
}
