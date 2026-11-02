import { useState, type FormEvent } from 'react';
import { productBySlug } from '../../data/products';
import type { Order, OrderLine, OrderStatus } from '../../data/types';
import { ApiError, api, orderStatusFlow, orderStatusLabels } from '../../lib/api';
import { dollars, formatDateTime } from '../../lib/format';
import { ItemThumb } from '../checkout/ItemThumb';
import { figuresText, lineHasGift, occasionText, productName } from '../checkout/orderHelpers';
import { stateName } from '../checkout/usStates';
import { Icon } from '../Icons';
import { StatusPill, statusShortLabel } from './StatusPill';
import styles from './OrderDetail.module.css';

interface OrderDetailProps {
  order: Order;
  pass: string;
  onUpdated: (order: Order) => void;
  /** wrong passcode while saving */
  onUnauthorized: () => void;
  /** mobile: jump back to the list */
  onBack: () => void;
}

const NOTE_MAX = 1000;

/** Everything Esther needs for one order, plus the status + note editor. Remount with key={order.id}. */
export function OrderDetail({ order, pass, onUpdated, onUnauthorized, onBack }: OrderDetailProps) {
  const first = order.customer.name.split(/\s+/)[0] || order.customer.name;
  const igHandle = order.customer.instagram.replace(/^@/, '');
  const mailto = `mailto:${order.customer.email}?subject=${encodeURIComponent(`Your Luny Turtle commission (${order.id})`)}&body=${encodeURIComponent(`Hi ${first},\n\n`)}`;
  const customerUrl = `/order/${encodeURIComponent(order.id)}?email=${encodeURIComponent(order.customer.email)}`;

  return (
    <article className={styles.detail} aria-labelledby="studio-detail-title">
      <button type="button" className={`btn btn--ghost btn--sm ${styles.backBtn}`} onClick={onBack}>
        <Icon name="arrowLeft" size={16} /> Back to all orders
      </button>

      <header className={styles.head}>
        <div className={styles.headMain}>
          <h2 id="studio-detail-title" className={`h2 ${styles.title}`} tabIndex={-1}>
            {order.id}
          </h2>
          <p className={styles.placed}>
            Placed {formatDateTime(order.createdAt)} by <strong>{order.customer.name}</strong>
          </p>
        </div>
        <div className={styles.headSide}>
          <StatusPill status={order.status} />
          <span className={styles.total}>{dollars(order.total)}</span>
        </div>
      </header>

      <UpdateForm
        key={`${order.id}`}
        order={order}
        pass={pass}
        onUpdated={onUpdated}
        onUnauthorized={onUnauthorized}
        customerUrl={customerUrl}
      />

      <div className={styles.twoCol}>
        <section className={styles.box} aria-labelledby="studio-customer">
          <h3 id="studio-customer" className={styles.boxTitle}>
            <Icon name="people" size={18} /> Customer
          </h3>
          <p className={styles.strong}>{order.customer.name}</p>
          <ul className={styles.contact}>
            <li>
              <Icon name="mail" size={16} />
              <a className="link" href={mailto}>
                {order.customer.email}
              </a>
            </li>
            {order.customer.phone && (
              <li>
                <PhoneIcon />
                <a className="link" href={`tel:${order.customer.phone.replace(/[^\d+]/g, '')}`}>
                  {order.customer.phone}
                </a>
              </li>
            )}
            {igHandle && (
              <li>
                <Icon name="instagram" size={16} />
                <a className="link" href={`https://www.instagram.com/${encodeURIComponent(igHandle)}/`} target="_blank" rel="noreferrer">
                  @{igHandle}
                </a>
              </li>
            )}
          </ul>
        </section>

        <section className={styles.box} aria-labelledby="studio-shipto">
          <h3 id="studio-shipto" className={styles.boxTitle}>
            <Icon name="truck" size={18} /> Ship to
          </h3>
          <address className={styles.address}>
            <strong>{order.shipTo.recipientName}</strong>
            <br />
            {order.shipTo.line1}
            {order.shipTo.line2 && (
              <>
                <br />
                {order.shipTo.line2}
              </>
            )}
            <br />
            {order.shipTo.city}, <abbr title={stateName(order.shipTo.state)}>{order.shipTo.state}</abbr> {order.shipTo.postalCode}
            <br />
            {order.shipTo.country}
          </address>
          {lineHasGift(order.lines) && (
            <p className={styles.giftFlag}>
              <Icon name="gift" size={16} /> Includes a gift
            </p>
          )}
        </section>
      </div>

      <section aria-labelledby="studio-briefs">
        <h3 id="studio-briefs" className={`h3 ${styles.sectionTitle}`}>
          {order.lines.length === 1 ? 'The commission' : `The commissions (${order.lines.length})`}
        </h3>
        <div className={styles.lines}>
          {order.lines.map((line, i) => (
            <Brief key={line.id} line={line} index={i} />
          ))}
        </div>
      </section>

      <section className={styles.box} aria-labelledby="studio-history">
        <h3 id="studio-history" className={styles.boxTitle}>
          <Icon name="sparkle" size={18} /> History
        </h3>
        <ol className={styles.history}>
          {[...order.statusHistory].reverse().map((h, i) => (
            <li key={`${h.at}-${i}`}>
              <StatusPill status={h.status} />
              <time dateTime={h.at}>{formatDateTime(h.at)}</time>
            </li>
          ))}
        </ol>
        <p className={`tiny muted ${styles.paid}`}>
          Paid with demo card ending {order.cardLast4} · subtotal {dollars(order.subtotal)} · shipping included
        </p>
      </section>
    </article>
  );
}

function UpdateForm({
  order,
  pass,
  onUpdated,
  onUnauthorized,
  customerUrl,
}: {
  order: Order;
  pass: string;
  onUpdated: (o: Order) => void;
  onUnauthorized: () => void;
  customerUrl: string;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState(order.artistNote ?? '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = status !== order.status || note.trim() !== (order.artistNote ?? '');

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const patch: { status?: OrderStatus; artistNote?: string } = {};
      if (status !== order.status) patch.status = status;
      if (note.trim() !== (order.artistNote ?? '')) patch.artistNote = note.trim();
      const updated = await api.studio.updateOrder(pass, order.id, patch);
      onUpdated(updated);
      setNote(updated.artistNote ?? '');
      const parts = [];
      if (patch.status) parts.push(`shows “${orderStatusLabels[updated.status]}”`);
      if (patch.artistNote !== undefined) parts.push(patch.artistNote ? 'has your note' : 'no longer shows a note');
      setFeedback({ ok: true, text: `Saved! The customer's order page now ${parts.join(' and ')}.` });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onUnauthorized();
      setFeedback({ ok: false, text: err instanceof ApiError ? err.message : "Couldn't reach the store server. Is it running?" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.update} onSubmit={save}>
      <div className={styles.updateGrid}>
        <div className="field">
          <label className="label" htmlFor="studio-status">
            Status
          </label>
          <select
            id="studio-status"
            aria-describedby="studio-status-hint"
            className="select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus);
              setFeedback(null);
            }}
          >
            {orderStatusFlow.map((s, i) => (
              <option key={s} value={s}>
                {i + 1}. {statusShortLabel(s)}
              </option>
            ))}
          </select>
          <span id="studio-status-hint" className="hint">
            Customer sees: “{orderStatusLabels[status]}”
          </span>
        </div>
        <div className={`field ${styles.noteField}`}>
          <label className="label" htmlFor="studio-note">
            Note to customer
          </label>
          <textarea
            id="studio-note"
            className="textarea"
            value={note}
            maxLength={NOTE_MAX}
            rows={3}
            placeholder="e.g. Your sketch is in your inbox! Let me know if you'd like any changes."
            onChange={(e) => {
              setNote(e.target.value);
              setFeedback(null);
            }}
            aria-describedby="studio-note-hint"
          />
          <span id="studio-note-hint" className="hint">
            Shows on the customer's order page. {note.length > NOTE_MAX - 100 && `${NOTE_MAX - note.length} characters left.`}
          </span>
        </div>
      </div>
      <div className={styles.updateActions}>
        <button type="submit" className="btn btn--green" disabled={!dirty || saving} aria-busy={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <a className={`link small ${styles.viewLink}`} href={customerUrl} target="_blank" rel="noreferrer">
          View the customer's page <span className="visually-hidden">(opens in a new tab)</span>
        </a>
      </div>
      <div role="status" aria-live="polite">
        {feedback && (
          <p className={`notice ${feedback.ok ? 'notice--green' : 'notice--red'} ${styles.feedback}`}>
            <Icon name={feedback.ok ? 'check' : 'info'} size={20} />
            <span>{feedback.text}</span>
          </p>
        )}
      </div>
    </form>
  );
}

function Brief({ line, index }: { line: OrderLine; index: number }) {
  const c = line.config;
  const product = productBySlug(c.productSlug);
  const wide = new Set(['Scene idea', 'Ornaments', 'Text to include', 'Notes', 'Gift note']);
  const rows: [string, string][] = [
    ['Occasion', occasionText(c)],
    ['Gift', c.isGift ? 'Yes' : 'No'],
    ...(product?.hasFigures
      ? ([
          ['People', String(c.people)],
          ['Pets', String(c.pets)],
        ] as [string, string][])
      : []),
    ['Scene idea', c.sceneIdea],
    ...(c.productSlug === 'christmas-tree' || c.ornaments ? ([['Ornaments', c.ornaments]] as [string, string][]) : []),
    ['Text to include', c.textToInclude],
    ['Notes', c.notes],
    ...(c.isGift ? ([['Gift note', c.giftNote]] as [string, string][]) : []),
  ];
  return (
    <article className={styles.brief}>
      <header className={styles.briefHead}>
        <ItemThumb slug={c.productSlug} photo={c.referencePhotoUrls[0]} size={64} tilt={index % 2 ? 2 : -2} />
        <div className={styles.briefTitle}>
          <h4 className={styles.briefName}>
            {index + 1}. {productName(c.productSlug)}
            {line.quantity > 1 && <span className="muted"> × {line.quantity}</span>}
          </h4>
          <p className={styles.briefMeta}>{product?.hasFigures ? `${figuresText(c)} · ${product.size}` : figuresText(c)}</p>
        </div>
        <span className={styles.briefPrice}>{dollars(line.unitPrice * line.quantity)}</span>
      </header>
      <dl className={styles.briefList}>
        {rows.map(([k, v]) => (
          <div key={k} data-empty={!v || undefined} data-wide={wide.has(k) || undefined}>
            <dt>{k}</dt>
            <dd>{v || '—'}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.refs}>
        <p className={styles.refsLabel}>
          <Icon name="camera" size={16} /> Reference photos ({c.referencePhotoUrls.length})
        </p>
        {c.referencePhotoUrls.length > 0 ? (
          <ul className={styles.refList}>
            {c.referencePhotoUrls.map((url, n) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className={styles.ref} title="Open full size in a new tab">
                  <img
                    src={url}
                    alt={`Reference photo ${n + 1} for commission ${index + 1}, opens full size in a new tab`}
                    loading="lazy"
                  />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            No photos uploaded. Ask for some by email or DM.
          </p>
        )}
      </div>
    </article>
  );
}

/** Icons.tsx has no phone, so a matching one lives here. */
function PhoneIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4Z" />
    </svg>
  );
}
