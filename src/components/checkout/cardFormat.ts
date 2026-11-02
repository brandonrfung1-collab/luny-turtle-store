// Formatting + validation for the demo card fields. Mirrors server/validate.js.

export const DEMO_CARD = '4242 4242 4242 4242';
export const DEMO_DECLINE_CARD = '4000 0000 0000 0002';

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

/** "4242424242424242" -> "4242 4242 4242 4242" (up to 19 digits) */
export const formatCardNumber = (raw: string) =>
  onlyDigits(raw)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

/**
 * Auto-slash for MM/YY. `prev` is the previous value so deleting the slash works.
 * "4" -> "04/", "12" -> "12/", "123" -> "12/3"
 */
export function formatExpiry(raw: string, prev: string): string {
  let d = onlyDigits(raw).slice(0, 4);
  const deleting = raw.length < prev.length;
  if (d.length === 1 && Number(d) > 1 && !deleting) d = `0${d}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  if (d.length === 2 && !deleting) return `${d}/`;
  return d;
}

export function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardNumberError(value: string): string | undefined {
  const d = onlyDigits(value);
  if (!d) return 'Please enter a card number. For the demo, use 4242 4242 4242 4242.';
  if (d.length < 13 || d.length > 19) return 'Card numbers are 13 to 19 digits.';
  if (!luhn(d)) return "That card number doesn't look right. Try 4242 4242 4242 4242.";
  return undefined;
}

export function expiryError(value: string, now = new Date()): string | undefined {
  if (!value.trim()) return 'Please add the expiry date (MM/YY).';
  const m = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!m) return 'Expiry dates look like MM/YY.';
  const month = Number(m[1]);
  if (month < 1 || month > 12) return 'The month should be 01 to 12.';
  const card = (2000 + Number(m[2])) * 12 + month - 1;
  const current = now.getFullYear() * 12 + now.getMonth();
  if (card < current) return 'That date is in the past. Any future date works.';
  if (card > current + 12 * 20) return 'That date is too far in the future.';
  return undefined;
}

export function cvcError(value: string): string | undefined {
  if (!value) return 'Please add the 3 or 4 digit security code.';
  if (!/^\d{3,4}$/.test(value)) return 'The security code is 3 or 4 digits.';
  return undefined;
}

/** A demo expiry two years from now, e.g. "11/28". */
export function demoExpiry(now = new Date()): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String((now.getFullYear() + 2) % 100).padStart(2, '0');
  return `${mm}/${yy}`;
}
