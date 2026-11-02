import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { usePageTitle } from '../components/pages/usePageTitle';
import { Turtle } from '../components/TurtleLogo';
import {
  DEMO_CARD,
  DEMO_DECLINE_CARD,
  cardNumberError,
  cvcError,
  demoExpiry,
  expiryError,
  formatCardNumber,
  formatExpiry,
  onlyDigits,
} from '../components/checkout/cardFormat';
import { ItemThumb } from '../components/checkout/ItemThumb';
import { EMAIL_RE, figuresText, isPriceConfirmed, occasionText, productName, saveLastOrder } from '../components/checkout/orderHelpers';
import { usStates } from '../components/checkout/usStates';
import { site } from '../data/site';
import type { CartItem } from '../data/types';
import { ApiError, api } from '../lib/api';
import { dollars, plural } from '../lib/format';
import { priceFor } from '../lib/pricing';
import { useCart } from '../state/cart';
import styles from './Checkout.module.css';

interface FormValues {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  recipientName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvc: string;
}
type FieldName = keyof FormValues;
type Errors = Partial<Record<FieldName, string>>;

/** DOM order, so we can focus the first field with an error. */
const FIELD_ORDER: FieldName[] = [
  'name',
  'email',
  'phone',
  'instagram',
  'recipientName',
  'line1',
  'line2',
  'city',
  'state',
  'postalCode',
  'cardNumber',
  'cardName',
  'expiry',
  'cvc',
];
const CARD_FIELDS: FieldName[] = ['cardNumber', 'cardName', 'expiry', 'cvc'];
const DRAFT_KEY = 'lunyturtle.checkout.draft';

const emptyValues: FormValues = {
  name: '',
  email: '',
  phone: '',
  instagram: '',
  recipientName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  cardNumber: '',
  cardName: '',
  expiry: '',
  cvc: '',
};

/** Contact + shipping survive a refresh (sessionStorage, this tab only). Card details never do. */
function loadDraft(): FormValues {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyValues;
    const saved = JSON.parse(raw) as Partial<FormValues>;
    const next = { ...emptyValues };
    for (const k of FIELD_ORDER) {
      if (!CARD_FIELDS.includes(k) && typeof saved[k] === 'string') next[k] = saved[k] as string;
    }
    return next;
  } catch {
    return emptyValues;
  }
}

function saveDraft(values: FormValues) {
  try {
    const draft: Partial<FormValues> = {};
    for (const k of FIELD_ORDER) if (!CARD_FIELDS.includes(k)) draft[k] = values[k];
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage unavailable */
  }
}

function validate(v: FormValues): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = 'Please add your name.';
  if (!v.email.trim()) e.email = 'Please add your email so I can send your sketch.';
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'That email looks off. Try something like you@example.com.';
  const phoneDigits = onlyDigits(v.phone);
  if (v.phone.trim() && (phoneDigits.length < 7 || phoneDigits.length > 15 || /[^0-9+().\-\s]/.test(v.phone)))
    e.phone = "That phone number looks off. It's optional, so you can leave it blank.";
  const ig = v.instagram.trim().replace(/^@+/, '');
  if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig)) e.instagram = 'Handles use letters, numbers, periods and underscores.';

  if (!v.recipientName.trim()) e.recipientName = 'Who should the package be addressed to?';
  if (!v.line1.trim()) e.line1 = 'Please add a street address.';
  if (!v.city.trim()) e.city = 'Please add a city.';
  if (!v.state) e.state = 'Please choose a state.';
  if (!v.postalCode.trim()) e.postalCode = 'Please add a ZIP code.';
  else if (!/^\d{5}(-\d{4})?$/.test(v.postalCode.trim())) e.postalCode = 'ZIP codes look like 12345.';

  const cn = cardNumberError(v.cardNumber);
  if (cn) e.cardNumber = cn;
  if (!v.cardName.trim()) e.cardName = 'Please add the name on the card.';
  const ex = expiryError(v.expiry);
  if (ex) e.expiry = ex;
  const cv = cvcError(v.cvc);
  if (cv) e.cvc = cv;
  return e;
}

const fieldId = (name: FieldName) => `co-${name}`;

/** Price as the server will compute it; falls back to the cart's price for an item it can't price (stale cart). */
function linePrice(item: CartItem): number {
  try {
    return priceFor(item.config) * item.quantity;
  } catch {
    return item.unitPrice * item.quantity;
  }
}

function focusField(name: FieldName) {
  const el = document.getElementById(fieldId(name));
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

export default function Checkout() {
  usePageTitle('Checkout · Luny Turtle');
  const { items, clear } = useCart();
  const navigate = useNavigate();
  const placed = useRef(false);

  if (items.length === 0 && !placed.current) return <EmptyCheckout />;
  return (
    <CheckoutForm
      items={items}
      onPlaced={(id, email) => {
        placed.current = true;
        saveLastOrder({ id, email });
        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        navigate(`/order/${encodeURIComponent(id)}?email=${encodeURIComponent(email)}&new=1`);
        clear();
      }}
    />
  );
}

/* ------------------------------------------------------------------ */

function CheckoutForm({ items, onPlaced }: { items: CartItem[]; onPlaced: (id: string, email: string) => void }) {
  const hasGift = items.some((i) => i.config.isGift);
  const [values, setValues] = useState<FormValues>(loadDraft);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; declined: boolean } | null>(null);
  // Recipient follows the contact name until it's edited (not for gifts, which usually go to someone else).
  const [recipientFollows, setRecipientFollows] = useState(() => !hasGift && !values.recipientName);

  const errors = useMemo(() => validate(values), [values]);
  const visibleError = (name: FieldName) => (submitted || touched[name] ? errors[name] : undefined);
  const errorCount = Object.keys(errors).length;

  const total = items.reduce((sum, i) => sum + linePrice(i), 0);

  useEffect(() => {
    saveDraft(values);
  }, [values]);

  const set = (name: FieldName, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'name' && recipientFollows) next.recipientName = value;
      return next;
    });
    if (serverError && CARD_FIELDS.includes(name)) setServerError(null);
  };
  const blur = (name: FieldName) => () => setTouched((t) => (t[name] ? t : { ...t, [name]: true }));

  /** Shared props for a text input bound to `name`. */
  const bind = (name: FieldName) => ({
    id: fieldId(name),
    name,
    value: values[name],
    onChange: (e: ChangeEvent<HTMLInputElement>) => set(name, e.target.value),
    onBlur: blur(name),
  });

  const onCardNumber = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const atEnd = caret >= el.value.length;
    const digitsBefore = onlyDigits(el.value.slice(0, caret)).length;
    const formatted = formatCardNumber(el.value);
    set('cardNumber', formatted);
    if (!atEnd) {
      // Keep the caret next to the same digit after re-spacing.
      requestAnimationFrame(() => {
        let pos = 0;
        let seen = 0;
        while (pos < formatted.length && seen < digitsBefore) {
          if (/\d/.test(formatted[pos])) seen++;
          pos++;
        }
        el.setSelectionRange(pos, pos);
      });
    }
  };

  const fillDemoCard = () => {
    setValues((prev) => ({
      ...prev,
      cardNumber: DEMO_CARD,
      cardName: prev.cardName || prev.name || 'Demo Customer',
      expiry: demoExpiry(),
      cvc: '123',
    }));
    setServerError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitted(true);
    setServerError(null);
    const first = FIELD_ORDER.find((f) => errors[f]);
    if (first) {
      focusField(first);
      return;
    }
    setSubmitting(true);
    const email = values.email.trim();
    try {
      const order = await api.createOrder({
        customer: {
          name: values.name.trim(),
          email,
          phone: values.phone.trim(),
          instagram: values.instagram.trim() ? `@${values.instagram.trim().replace(/^@+/, '')}` : '',
        },
        shipTo: {
          recipientName: values.recipientName.trim(),
          line1: values.line1.trim(),
          line2: values.line2.trim(),
          city: values.city.trim(),
          state: values.state,
          postalCode: values.postalCode.trim(),
          country: 'United States',
        },
        lines: items.map((i) => ({ config: i.config, quantity: i.quantity })),
        card: { number: onlyDigits(values.cardNumber), name: values.cardName.trim(), expiry: values.expiry, cvc: values.cvc },
      });
      onPlaced(order.id, order.customer.email);
    } catch (err) {
      const declined = err instanceof ApiError && err.status === 402;
      const message =
        err instanceof ApiError
          ? err.message
          : "I couldn't reach the store server. Is it still running? Your cart is safe, so try again in a moment.";
      setServerError({ message, declined });
      setSubmitting(false);
      if (declined) focusField('cardNumber');
      else document.getElementById('co-server-error')?.focus();
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.head}>
          <Link to="/cart" className={styles.back}>
            <Icon name="arrowLeft" size={18} /> Back to cart
          </Link>
          <h1 className="h1">Checkout</h1>
          <p className="lead">Just a few details, then your commission goes on my drawing list.</p>
        </header>

        <div className={styles.layout}>
          <OrderSummary items={items} total={total} />

          <form className={styles.form} onSubmit={onSubmit} noValidate aria-describedby="co-demo-note">
            {/* 1. Contact */}
            <Section step={1} title="Contact" intro="Where I'll reach you about your sketch.">
              <div className={styles.grid2}>
                <TextField name="name" label="Full name" error={visibleError('name')} className={styles.span2}>
                  {(a) => <input {...a} {...bind('name')} className="input" autoComplete="name" required />}
                </TextField>
                <TextField
                  name="email"
                  label="Email"
                  error={visibleError('email')}
                  hint="I'll send your pencil sketch here so you can approve it before any ink goes down."
                  className={styles.span2}
                >
                  {(a) => (
                    <input
                      {...a}
                      {...bind('email')}
                      className="input"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      spellCheck={false}
                    />
                  )}
                </TextField>
                <TextField name="phone" label="Phone" optional error={visibleError('phone')}>
                  {(a) => <input {...a} {...bind('phone')} className="input" type="tel" autoComplete="tel" inputMode="tel" />}
                </TextField>
                <TextField
                  name="instagram"
                  label="Instagram handle"
                  optional
                  hint="So Esther can say hi."
                  error={visibleError('instagram')}
                >
                  {(a) => (
                    <span className={styles.affix}>
                      <span className={styles.affixText} aria-hidden="true">
                        @
                      </span>
                      <input
                        {...a}
                        {...bind('instagram')}
                        onChange={(e) => set('instagram', e.target.value.replace(/^@+/, ''))}
                        className="input"
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder="yourhandle"
                      />
                    </span>
                  )}
                </TextField>
              </div>
            </Section>

            {/* 2. Shipping */}
            <Section step={2} title="Shipping" intro="Where should the finished drawing go?">
              {hasGift && (
                <div className={`notice notice--blue ${styles.giftNotice}`}>
                  <Icon name="gift" size={22} />
                  <span>
                    <strong>Sending a gift?</strong> I can ship it straight to the lucky giftee. Just pop their name and address below.
                  </span>
                </div>
              )}
              <div className={styles.grid2}>
                <TextField
                  name="recipientName"
                  label="Recipient name"
                  hint={hasGift ? 'The name on the package. For a gift, that is the giftee.' : 'The name on the package.'}
                  error={visibleError('recipientName')}
                  className={styles.span2}
                >
                  {(a) => (
                    <input
                      {...a}
                      {...bind('recipientName')}
                      onChange={(e) => {
                        setRecipientFollows(false);
                        set('recipientName', e.target.value);
                      }}
                      className="input"
                      autoComplete="shipping name"
                      required
                    />
                  )}
                </TextField>
                <TextField name="line1" label="Street address" error={visibleError('line1')} className={styles.span2}>
                  {(a) => <input {...a} {...bind('line1')} className="input" autoComplete="shipping address-line1" required />}
                </TextField>
                <TextField name="line2" label="Apartment, suite, etc." optional error={visibleError('line2')} className={styles.span2}>
                  {(a) => <input {...a} {...bind('line2')} className="input" autoComplete="shipping address-line2" />}
                </TextField>
              </div>
              <div className={styles.grid3}>
                <TextField name="city" label="City" error={visibleError('city')} className={styles.city}>
                  {(a) => <input {...a} {...bind('city')} className="input" autoComplete="shipping address-level2" required />}
                </TextField>
                <TextField name="state" label="State" error={visibleError('state')}>
                  {(a) => (
                    <select
                      {...a}
                      id={fieldId('state')}
                      name="state"
                      className="select"
                      autoComplete="shipping address-level1"
                      value={values.state}
                      onChange={(e) => set('state', e.target.value)}
                      onBlur={blur('state')}
                      required
                    >
                      <option value="">Choose…</option>
                      {usStates.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </TextField>
                <TextField name="postalCode" label="ZIP code" error={visibleError('postalCode')}>
                  {(a) => (
                    <input
                      {...a}
                      {...bind('postalCode')}
                      className="input"
                      autoComplete="shipping postal-code"
                      inputMode="numeric"
                      maxLength={10}
                      required
                    />
                  )}
                </TextField>
              </div>
              <div className={styles.country}>
                <span className="label">Country</span>
                <span className={styles.countryValue}>
                  <Icon name="truck" size={18} /> United States
                </span>
                <span className="hint">For now I ship within {site.shipsTo}, and shipping is included.</span>
              </div>
            </Section>

            {/* 3. Payment */}
            <Section step={3} title="Payment" intro="Nothing is charged. This part is just for show.">
              <div className={`${styles.demo} plaid-butter`} id="co-demo-note">
                <div className={styles.demoTurtle} aria-hidden="true">
                  <Turtle size={64} fill="var(--butter-soft)" />
                </div>
                <div className={styles.demoBody}>
                  <p className={styles.demoTitle}>This is a pretend checkout</p>
                  <p className={styles.demoText}>{site.demoNotice}</p>
                  <p className={styles.demoText}>
                    Use <strong className={styles.mono}>{DEMO_CARD}</strong>, any future date and any CVC. Want to see a decline? Try{' '}
                    <strong className={styles.mono}>{DEMO_DECLINE_CARD}</strong>.
                  </p>
                  <button type="button" className="btn btn--sm" onClick={fillDemoCard}>
                    <Icon name="sparkle" size={16} /> Fill in the demo card
                  </button>
                </div>
              </div>

              <div className={styles.cardGrid}>
                <TextField name="cardNumber" label="Card number" error={visibleError('cardNumber')} className={styles.span2}>
                  {(a) => (
                    <span className={styles.affix}>
                      <span className={styles.affixIcon} aria-hidden="true">
                        <Icon name="lock" size={18} />
                      </span>
                      <input
                        {...a}
                        {...bind('cardNumber')}
                        onChange={onCardNumber}
                        className="input"
                        autoComplete="cc-number"
                        inputMode="numeric"
                        placeholder="4242 4242 4242 4242"
                        maxLength={23}
                        spellCheck={false}
                        required
                      />
                    </span>
                  )}
                </TextField>
                <TextField name="cardName" label="Name on card" error={visibleError('cardName')} className={styles.span2}>
                  {(a) => <input {...a} {...bind('cardName')} className="input" autoComplete="cc-name" required />}
                </TextField>
                <TextField name="expiry" label="Expiry" hint="MM/YY" error={visibleError('expiry')}>
                  {(a) => (
                    <input
                      {...a}
                      {...bind('expiry')}
                      onChange={(e) => set('expiry', formatExpiry(e.target.value, values.expiry))}
                      className="input"
                      autoComplete="cc-exp"
                      inputMode="numeric"
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  )}
                </TextField>
                <TextField name="cvc" label="CVC" hint="3 or 4 digits" error={visibleError('cvc')}>
                  {(a) => (
                    <input
                      {...a}
                      {...bind('cvc')}
                      onChange={(e) => set('cvc', onlyDigits(e.target.value).slice(0, 4))}
                      className="input"
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  )}
                </TextField>
              </div>
            </Section>

            <div className={styles.placeBox}>
              {serverError && (
                <div id="co-server-error" className={`notice notice--red ${styles.serverError}`} role="alert" tabIndex={-1}>
                  <Icon name="info" size={22} />
                  <span>
                    <strong>{serverError.declined ? 'Payment declined (demo)' : "That didn't go through"}</strong>
                    <br />
                    {serverError.message}
                  </span>
                </div>
              )}
              {submitted && errorCount > 0 && !serverError && (
                <p className={`error-text ${styles.fixNote}`} role="status">
                  Almost! Please fix the {errorCount === 1 ? 'highlighted field' : `${errorCount} highlighted fields`} above.
                </p>
              )}
              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.totalValue}>{dollars(total)}</span>
              </div>
              <p className={`hint ${styles.totalHint}`}>Shipping included. No real payment is taken.</p>
              <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting} aria-busy={submitting}>
                {submitting ? (
                  <>
                    <span className={styles.spinner} aria-hidden="true" /> Placing your order…
                  </>
                ) : (
                  <>
                    <Icon name="lock" size={20} /> Place demo order · {dollars(total)}
                  </>
                )}
              </button>
              <p className={`tiny muted ${styles.finePrint}`}>
                Your order is saved {site.ordersSavedIn} only, so you can see the order page and the artist studio.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Section({ step, title, intro, children }: { step: number; title: string; intro?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className={`card ${styles.section}`} aria-labelledby={id}>
      <div className={styles.sectionHead}>
        <span className={styles.stepNum} aria-hidden="true">
          {step}
        </span>
        <div>
          <h2 id={id} className={`h3 ${styles.sectionTitle}`}>
            <span className="visually-hidden">Step {step}: </span>
            {title}
          </h2>
          {intro && <p className={`small muted ${styles.sectionIntro}`}>{intro}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

interface ControlAria {
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
}

interface TextFieldProps {
  name: FieldName;
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  className?: string;
  /** render the control; spread the aria props onto it (its id must be fieldId(name)) */
  children: (aria: ControlAria) => ReactNode;
}

/** Label + control + hint + inline error, with aria-invalid / aria-describedby wired up. */
function TextField({ name, label, hint, optional, error, className = '', children }: TextFieldProps) {
  const id = fieldId(name);
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;
  return (
    <div className={`field ${className}`}>
      <label className="label" htmlFor={id}>
        {label} {optional && <span className={styles.optional}>(optional)</span>}
      </label>
      {children({ 'aria-invalid': error ? true : undefined, 'aria-describedby': [errId, hintId].filter(Boolean).join(' ') || undefined })}
      {error && (
        <span id={errId} className="error-text">
          {error}
        </span>
      )}
      {hint && (
        <span id={hintId} className="hint">
          {hint}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function OrderSummary({ items, total }: { items: CartItem[]; total: number }) {
  const [open, setOpen] = useState(false);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  return (
    <aside className={`card ${styles.summary}`} aria-labelledby="co-summary-title">
      <button
        type="button"
        className={styles.summaryToggle}
        aria-expanded={open}
        aria-controls="co-summary-body"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="bag" size={22} />
        <span className={styles.toggleText}>
          {open ? 'Hide' : 'Show'} order summary <span className="muted">({plural(count, 'drawing')})</span>
        </span>
        <span className={styles.toggleTotal}>{dollars(total)}</span>
        <Icon name="chevronDown" size={20} className={styles.chevron} data-open={open} />
      </button>

      <div id="co-summary-body" className={styles.summaryBody} data-open={open}>
        <div className={styles.summaryHead}>
          <h2 id="co-summary-title" className="h3">
            Your order
          </h2>
          <Link to="/cart" className="link small">
            Edit cart
          </Link>
        </div>

        <ul className={styles.items}>
          {items.map((item, i) => {
            const price = linePrice(item);
            return (
              <li key={item.id} className={styles.item}>
                <span className={styles.thumbWrap}>
                  <ItemThumb
                    slug={item.config.productSlug}
                    photo={item.config.referencePhotos[0]?.dataUrl}
                    size={68}
                    tilt={i % 2 ? 2 : -2}
                  />
                  {item.quantity > 1 && (
                    <span className={styles.qty} aria-label={`Quantity ${item.quantity}`}>
                      {item.quantity}
                    </span>
                  )}
                </span>
                <div className={styles.itemBody}>
                  <p className={styles.itemName}>{productName(item.config.productSlug)}</p>
                  <p className={styles.itemMeta}>
                    {occasionText(item.config)} · {figuresText(item.config)}
                  </p>
                  <div className={styles.itemBadges}>
                    {item.config.isGift && (
                      <span className="badge badge--blue">
                        <Icon name="gift" size={12} /> Gift
                      </span>
                    )}
                    {!isPriceConfirmed(item.config.productSlug) && <span className="badge">Demo price</span>}
                  </div>
                </div>
                <span className={styles.itemPrice}>{dollars(price)}</span>
              </li>
            );
          })}
        </ul>

        <dl className={styles.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>{dollars(total)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd className={styles.included}>Included</dd>
          </div>
          <div className={styles.grand}>
            <dt>Total</dt>
            <dd>{dollars(total)}</dd>
          </div>
        </dl>

        <ul className={styles.promises}>
          <li>
            <Icon name="pencil" size={18} /> You approve a pencil sketch before any ink goes down.
          </li>
          <li>
            <Icon name="palette" size={18} /> {site.medium}, drawn by hand by {site.artistName}.
          </li>
          <li>
            <Icon name="truck" size={18} /> Shipping is included.
          </li>
        </ul>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */

function EmptyCheckout() {
  return (
    <section className="section">
      <div className="container container--narrow">
        <div className={`card ${styles.empty}`}>
          <Turtle size={120} fill="var(--sage-soft)" />
          <h1 className="h2">Your cart is empty</h1>
          <p className="lead">Pick a drawing type and tell me about your people (and pets), then come back here to check out.</p>
          <div className={styles.emptyActions}>
            <Link to="/shop" className="btn btn--primary btn--lg">
              Start a commission <Icon name="arrowRight" size={20} />
            </Link>
            <Link to="/track" className="btn btn--ghost">
              Track an order
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
