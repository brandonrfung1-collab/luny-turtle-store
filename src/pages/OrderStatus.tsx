import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Confetti } from '../components/checkout/Confetti';
import { ItemThumb } from '../components/checkout/ItemThumb';
import { EMAIL_RE, figuresText, loadLastOrder, occasionText, productName } from '../components/checkout/orderHelpers';
import { StatusTimeline } from '../components/checkout/StatusTimeline';
import { stateName } from '../components/checkout/usStates';
import { Icon, type IconName } from '../components/Icons';
import { Turtle } from '../components/TurtleLogo';
import { site } from '../data/site';
import type { Order, OrderLine, OrderStatus as Status } from '../data/types';
import { ApiError, api, orderStatusLabels } from '../lib/api';
import { dollars, formatDate, formatDateTime } from '../lib/format';
import styles from './OrderStatus.module.css';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ok'; order: Order }
  | { kind: 'not-found'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'need-email' };

const EARLY: Status[] = ['received', 'sketching', 'awaiting-approval'];

export default function OrderStatus() {
  const params = useParams();
  const [search] = useSearchParams();
  const id = (params.id ?? '').trim().toUpperCase();
  const isNew = search.get('new') === '1';
  const last = loadLastOrder();
  const email = (search.get('email') ?? '').trim() || (last && last.id.toUpperCase() === id ? last.email : '');

  const [state, setState] = useState<LoadState>(email ? { kind: 'loading' } : { kind: 'need-email' });

  const load = useCallback(
    async (quiet = false) => {
      if (!email) {
        setState({ kind: 'need-email' });
        return;
      }
      if (!quiet) setState({ kind: 'loading' });
      try {
        const order = await api.getOrder(id, email);
        setState({ kind: 'ok', order });
      } catch (err) {
        if (quiet) return; // keep showing what we have
        if (err instanceof ApiError && err.status === 404) setState({ kind: 'not-found', message: err.message });
        else setState({ kind: 'error', message: "I couldn't reach the store server. Is it still running? Try refreshing in a moment." });
      }
    },
    [id, email],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Pick up changes from the studio when the customer comes back to this tab.
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && void load(true);
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  useEffect(() => {
    document.title = state.kind === 'ok' ? `Order ${state.order.id} · ${site.brand}` : `Your order · ${site.brand}`;
  }, [state]);

  if (state.kind === 'loading') return <Loading />;
  if (state.kind === 'need-email') return <NeedEmail id={id} />;
  if (state.kind === 'not-found' || state.kind === 'error')
    return <NotFound message={state.message} isError={state.kind === 'error'} onRetry={() => void load()} />;
  return <OrderView order={state.order} isNew={isNew} />;
}

/* ------------------------------------------------------------------ */

function OrderView({ order, isNew }: { order: Order; isNew: boolean }) {
  return (
    <>
      {isNew ? <ThankYou order={order} /> : <PlainHeader order={order} />}

      <div className={`container ${styles.layout}`}>
        <div className={styles.main}>
          <section className={`card card-pad ${styles.block}`} aria-labelledby="os-progress">
            <div className={styles.blockHead}>
              <h2 id="os-progress" className="h3">
                Where your drawing is
              </h2>
              <span className="badge badge--green">{orderStatusLabels[order.status]}</span>
            </div>
            <StatusTimeline order={order} />
          </section>

          {order.artistNote && <ArtistNote note={order.artistNote} />}

          {EARLY.includes(order.status) && <WhatsNext order={order} />}

          <section className={`card card-pad ${styles.block}`} aria-labelledby="os-commissions">
            <h2 id="os-commissions" className="h3">
              {order.lines.length === 1 ? 'Your commission' : `Your commissions (${order.lines.length})`}
            </h2>
            <div className={styles.lines}>
              {order.lines.map((line, i) => (
                <CommissionLine key={line.id} line={line} index={i} />
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.side} aria-label="Order details">
          <Details order={order} />
        </aside>
      </div>
    </>
  );
}

function ThankYou({ order }: { order: Order }) {
  return (
    <section className={`${styles.thanks} plaid-pink`}>
      <Confetti />
      <div className={`container ${styles.thanksInner}`}>
        <div className={styles.thanksTurtle} aria-hidden="true">
          <Turtle size={112} fill="var(--sage-soft)" />
        </div>
        <p className="eyebrow">
          <Icon name="heart" size={16} /> Order placed
        </p>
        <h1 className={`h-display ${styles.thanksTitle}`}>
          <span className={styles.thanksBig}>Thank you!</span> Your drawing is <span className="squiggle">on my desk</span>.
        </h1>
        <p className={`lead ${styles.thanksLead}`}>
          Thanks so much, {firstName(order.customer.name)}! I'll start with little thumbnail sketches, then send you a pencil sketch to
          approve before any ink goes down.
        </p>
        <OrderNumber id={order.id} />
        <p className={`tiny ${styles.demoLine}`}>
          <Icon name="info" size={14} /> Demo order: {site.demoNotice}
        </p>
      </div>
    </section>
  );
}

function PlainHeader({ order }: { order: Order }) {
  return (
    <section className={styles.plainHead}>
      <div className="container">
        <Link to="/track" className={styles.back}>
          <Icon name="arrowLeft" size={18} /> Track another order
        </Link>
        <p className="eyebrow">Order status</p>
        <h1 className="h1">Order {order.id}</h1>
        <p className="muted" style={{ margin: 0 }}>
          Placed {formatDate(order.createdAt)} by {order.customer.name}
        </p>
      </div>
    </section>
  );
}

function OrderNumber({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: the number is on screen anyway */
    }
  };
  return (
    <div className={styles.orderNo}>
      <span className={styles.orderNoLabel}>Order number</span>
      <strong className={styles.orderNoValue}>{id}</strong>
      <button type="button" className="btn btn--sm btn--ghost" onClick={copy}>
        {copied ? (
          <>
            <Icon name="check" size={16} /> Copied
          </>
        ) : (
          'Copy'
        )}
      </button>
      <span className="visually-hidden" role="status">
        {copied ? 'Order number copied' : ''}
      </span>
    </div>
  );
}

function ArtistNote({ note }: { note: string }) {
  return (
    <section className={`${styles.note} tape`} aria-labelledby="os-note">
      <h2 id="os-note" className={`hand ${styles.noteTitle}`}>
        A note from {site.artistFirstName}
      </h2>
      <p className={styles.noteText}>{note}</p>
      <p className={styles.noteSign}>
        <Turtle size={34} /> {site.artistFirstName}
      </p>
    </section>
  );
}

function WhatsNext({ order }: { order: Order }) {
  const steps: { icon: IconName; title: string; body: string }[] = [
    {
      icon: 'pencil',
      title: 'Sketch for your approval',
      body:
        order.status === 'awaiting-approval'
          ? `Your pencil sketch is on its way to ${order.customer.email}. Ask for any changes before ink goes down.`
          : `I'll email a pencil sketch to ${order.customer.email} so you can ask for changes before any ink goes down.`,
    },
    {
      icon: 'palette',
      title: 'Ink and colored pencil',
      body: 'Once you approve, I ink and color it by hand and sign it with my little turtle.',
    },
    {
      icon: 'truck',
      title: 'Shipped to your door',
      body: `Packed with care and shipped to ${order.shipTo.recipientName}. Shipping is included.`,
    },
  ];
  return (
    <section className={`card card-pad ${styles.block}`} aria-labelledby="os-next">
      <h2 id="os-next" className="h3">
        What happens next
      </h2>
      <ol className={styles.next}>
        {steps.map((s, i) => (
          <li key={s.title} className={styles.nextStep}>
            <span className={styles.nextIcon} data-i={i} aria-hidden="true">
              <Icon name={s.icon} size={24} />
            </span>
            <div>
              <p className={styles.nextTitle}>{s.title}</p>
              <p className={styles.nextBody}>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className={`small muted ${styles.turnaround}`}>
        <Icon name="sparkle" size={16} /> Typically {site.turnaround}. <span className="badge">Demo estimate</span>
      </p>
    </section>
  );
}

function CommissionLine({ line, index }: { line: OrderLine; index: number }) {
  const c = line.config;
  const brief: [string, string][] = [
    ['Scene idea', c.sceneIdea],
    ['Ornaments', c.ornaments],
    ['Text to include', c.textToInclude],
    ['Notes', c.notes],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  return (
    <article className={styles.line}>
      <header className={styles.lineHead}>
        <ItemThumb slug={c.productSlug} photo={c.referencePhotoUrls[0]} size={76} tilt={index % 2 ? 2 : -2} />
        <div className={styles.lineTitle}>
          <h3 className={styles.lineName}>
            {productName(c.productSlug)}
            {line.quantity > 1 && <span className="muted"> × {line.quantity}</span>}
          </h3>
          <p className={styles.lineMeta}>
            {occasionText(c)} · {figuresText(c)}
          </p>
          {c.isGift && (
            <span className="badge badge--blue">
              <Icon name="gift" size={12} /> Gift
            </span>
          )}
        </div>
        <span className={styles.linePrice}>{dollars(line.unitPrice * line.quantity)}</span>
      </header>

      {(brief.length > 0 || (c.isGift && c.giftNote)) && (
        <dl className={styles.brief}>
          {brief.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          {c.isGift && c.giftNote && (
            <div>
              <dt>Gift note</dt>
              <dd>{c.giftNote}</dd>
            </div>
          )}
        </dl>
      )}

      {c.referencePhotoUrls.length > 0 && (
        <div className={styles.photos}>
          <p className={styles.photosLabel}>
            <Icon name="camera" size={16} /> Your reference photos
          </p>
          <ul className={styles.photoList}>
            {c.referencePhotoUrls.map((url, n) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className={styles.photo}>
                  <img
                    src={url}
                    alt={`Reference photo ${n + 1} for ${productName(c.productSlug).toLowerCase()} (opens full size)`}
                    loading="lazy"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function Details({ order }: { order: Order }) {
  const s = order.shipTo;
  return (
    <div className={`card card-pad ${styles.details}`}>
      <h2 className="h3">Order details</h2>
      <dl className={styles.facts}>
        <div>
          <dt>Order number</dt>
          <dd className={styles.mono}>{order.id}</dd>
        </div>
        <div>
          <dt>Placed</dt>
          <dd>{formatDateTime(order.createdAt)}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd className={styles.break}>{order.customer.email}</dd>
        </div>
      </dl>

      <hr className="soft" />
      <h3 className={styles.subhead}>
        <Icon name="truck" size={18} /> Ship to
      </h3>
      <address className={styles.address}>
        <strong>{s.recipientName}</strong>
        <br />
        {s.line1}
        {s.line2 && (
          <>
            <br />
            {s.line2}
          </>
        )}
        <br />
        {s.city}, <abbr title={stateName(s.state)}>{s.state}</abbr> {s.postalCode}
        <br />
        {s.country}
      </address>

      <hr className="soft" />
      <h3 className={styles.subhead}>
        <Icon name="lock" size={18} /> Payment
      </h3>
      <p className={styles.payment}>Demo card ending {order.cardLast4}</p>

      <dl className={styles.totals}>
        <div>
          <dt>Subtotal</dt>
          <dd>{dollars(order.subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd className={styles.included}>{order.shipping === 0 ? 'Included' : dollars(order.shipping)}</dd>
        </div>
        <div className={styles.grand}>
          <dt>Total</dt>
          <dd>{dollars(order.total)}</dd>
        </div>
      </dl>

      <div className={styles.sideActions}>
        <Link to="/shop" className="btn btn--primary btn--block">
          Order another drawing
        </Link>
        <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="btn btn--ghost btn--block">
          <Icon name="instagram" size={18} /> Say hi on Instagram
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Loading() {
  return (
    <section className="section">
      <div className={`container ${styles.center}`} role="status">
        <span className={styles.wiggle}>
          <Turtle size={96} fill="var(--sage-soft)" />
        </span>
        <p className="lead">Finding your order…</p>
      </div>
    </section>
  );
}

function NotFound({ message, isError, onRetry }: { message: string; isError: boolean; onRetry: () => void }) {
  return (
    <section className="section">
      <div className="container container--narrow">
        <div className={`card ${styles.notFound}`}>
          <span className={styles.lost} aria-hidden="true">
            <Turtle size={110} fill="var(--blush-soft)" />
            <Icon name="search" size={44} className={styles.lostGlass} />
          </span>
          <h1 className="h2">{isError ? 'Hmm, something went wrong' : "Hmm, I couldn't find that order"}</h1>
          <p className="lead">{message}</p>
          <div className={styles.notFoundActions}>
            {isError ? (
              <button type="button" className="btn btn--primary" onClick={onRetry}>
                Try again
              </button>
            ) : (
              <Link to="/track" className="btn btn--primary">
                <Icon name="search" size={18} /> Look up an order
              </Link>
            )}
            <Link to="/shop" className="btn btn--ghost">
              Back to the shop
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** No email in the link (e.g. a shared URL): ask for it here instead of failing. */
function NeedEmail({ id }: { id: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter the email you used at checkout.');
      document.getElementById('os-email')?.focus();
      return;
    }
    navigate(`/order/${encodeURIComponent(id)}?email=${encodeURIComponent(email.trim())}`, { replace: true });
  };
  return (
    <section className="section">
      <div className="container container--narrow">
        <form className={`card ${styles.notFound}`} onSubmit={submit} noValidate>
          <Turtle size={96} fill="var(--sky-soft)" />
          <h1 className="h2">Order {id}</h1>
          <p className="lead">To keep your order private, enter the email you used at checkout.</p>
          <div className={`field ${styles.emailField}`}>
            <label className="label" htmlFor="os-email">
              Email
            </label>
            <input
              id="os-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'os-email-error' : undefined}
            />
            {error && (
              <span id="os-email-error" className="error-text">
                {error}
              </span>
            )}
          </div>
          <button type="submit" className="btn btn--primary">
            See my order
          </button>
        </form>
      </div>
    </section>
  );
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'friend';
