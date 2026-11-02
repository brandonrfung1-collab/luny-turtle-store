import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EMAIL_RE, ORDER_ID_RE, loadLastOrder, normalizeOrderId } from '../components/checkout/orderHelpers';
import { Icon } from '../components/Icons';
import { usePageTitle } from '../components/pages/usePageTitle';
import { Turtle } from '../components/TurtleLogo';
import { site } from '../data/site';
import styles from './TrackOrder.module.css';

type Errors = { id?: string; email?: string };

export default function TrackOrder() {
  usePageTitle('Track your order · Luny Turtle');
  const navigate = useNavigate();
  const last = loadLastOrder();
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const orderId = normalizeOrderId(id);
    const next: Errors = {};
    if (!id.trim()) next.id = 'Please enter your order number.';
    else if (!ORDER_ID_RE.test(orderId)) next.id = 'Order numbers look like LT-4F7K2 (LT, then 5 letters and numbers).';
    if (!email.trim()) next.email = 'Please enter the email you used at checkout.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'That email looks off. Try something like you@example.com.';
    setErrors(next);
    if (next.id || next.email) {
      document.getElementById(next.id ? 'track-id' : 'track-email')?.focus();
      return;
    }
    navigate(`/order/${encodeURIComponent(orderId)}?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <section className={`${styles.page} plaid-blue`}>
      <div className={`container ${styles.inner}`}>
        <div className={`card ${styles.card}`}>
          <div className={styles.art} aria-hidden="true">
            <span className={styles.envelope}>
              <Icon name="mail" size={40} strokeWidth={2} />
            </span>
            <span className={styles.turtle}>
              <Turtle size={104} fill="var(--sage-soft)" />
            </span>
            <Icon name="sparkle" size={22} className={styles.spark1} />
            <Icon name="heart" size={18} className={styles.spark2} />
          </div>

          <p className="eyebrow">Order lookup</p>
          <h1 className={`h1 ${styles.title}`}>Track your drawing</h1>
          <p className={`muted ${styles.lead}`}>
            Pop in your order number and the email you used at checkout to see where your drawing is, from first sketch to your door.
          </p>

          <form onSubmit={submit} noValidate className={styles.form}>
            <div className="field">
              <label className="label" htmlFor="track-id">
                Order number
              </label>
              <input
                id="track-id"
                className={`input ${styles.idInput}`}
                value={id}
                onChange={(e) => {
                  setId(e.target.value.toUpperCase());
                  if (errors.id) setErrors((er) => ({ ...er, id: undefined }));
                }}
                onBlur={() => id.trim() && setId(normalizeOrderId(id))}
                placeholder="LT-4F7K2"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={12}
                aria-invalid={errors.id ? true : undefined}
                aria-describedby={errors.id ? 'track-id-error' : 'track-id-hint'}
              />
              {errors.id ? (
                <span id="track-id-error" className="error-text">
                  {errors.id}
                </span>
              ) : (
                <span id="track-id-hint" className="hint">
                  It's on your order confirmation page.
                </span>
              )}
            </div>
            <div className="field">
              <label className="label" htmlFor="track-email">
                Email
              </label>
              <input
                id="track-email"
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((er) => ({ ...er, email: undefined }));
                }}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'track-email-error' : undefined}
              />
              {errors.email && (
                <span id="track-email-error" className="error-text">
                  {errors.email}
                </span>
              )}
            </div>
            <button type="submit" className="btn btn--primary btn--lg btn--block">
              <Icon name="search" size={20} /> Find my order
            </button>
          </form>

          {last && (
            <p className={`small ${styles.recent}`}>
              Your most recent order {site.ordersSavedIn}:{' '}
              <Link className="link" to={`/order/${encodeURIComponent(last.id)}?email=${encodeURIComponent(last.email)}`}>
                {last.id}
              </Link>
            </p>
          )}
        </div>

        <p className={`small ${styles.help}`}>
          Can't find your order number? Send me a DM on Instagram at{' '}
          <a className="link" href={site.instagramUrl} target="_blank" rel="noreferrer">
            {site.instagramHandle}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
