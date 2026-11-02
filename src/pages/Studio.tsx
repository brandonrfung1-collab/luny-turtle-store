import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { lineSummary } from '../components/checkout/orderHelpers';
import { Icon, type IconName } from '../components/Icons';
import { OrderDetail } from '../components/studio/OrderDetail';
import { StatusPill, statusShortLabel } from '../components/studio/StatusPill';
import { Turtle } from '../components/TurtleLogo';
import { site } from '../data/site';
import type { Order, OrderStatus } from '../data/types';
import { ApiError, api, orderStatusFlow } from '../lib/api';
import { dollars, formatDate } from '../lib/format';
import styles from './Studio.module.css';

const PASS_KEY = 'lunyturtle.studioPass';
const DONE: OrderStatus[] = ['shipped', 'delivered'];

function readPass(): string {
  try {
    return sessionStorage.getItem(PASS_KEY) ?? '';
  } catch {
    return '';
  }
}
function writePass(pass: string) {
  try {
    if (pass) sessionStorage.setItem(PASS_KEY, pass);
    else sessionStorage.removeItem(PASS_KEY);
  } catch {
    /* storage unavailable: stays unlocked for this page view only */
  }
}

export default function Studio() {
  const [pass, setPass] = useState(readPass);
  const [lockedMessage, setLockedMessage] = useState('');

  useEffect(() => {
    document.title = `Artist studio · ${site.brand}`;
  }, []);

  const lock = useCallback((message = '') => {
    writePass('');
    setPass('');
    setLockedMessage(message);
  }, []);

  if (!pass)
    return (
      <Gate
        message={lockedMessage}
        onUnlock={(p) => {
          writePass(p);
          setPass(p);
          setLockedMessage('');
        }}
      />
    );
  return <Dashboard pass={pass} onLock={lock} />;
}

/* ------------------------------------------------------------------ */
/* Passcode gate                                                       */
/* ------------------------------------------------------------------ */

function Gate({ message, onUnlock }: { message: string; onUnlock: (pass: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(message);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const pass = value.trim();
    if (!pass) {
      setError('Please enter the studio passcode.');
      inputRef.current?.focus();
      return;
    }
    setChecking(true);
    try {
      await api.studio.listOrders(pass);
      onUnlock(pass);
    } catch (err) {
      setChecking(false);
      setError(
        err instanceof ApiError && err.status === 401
          ? "That passcode isn't right. Try again?"
          : "Couldn't reach the store server. Is it running?",
      );
      inputRef.current?.select();
    }
  };

  return (
    <section className={`${styles.gatePage} plaid-green`}>
      <div className="container">
        <form className={`card ${styles.gate}`} onSubmit={submit} noValidate>
          <span className={styles.gateIcon} aria-hidden="true">
            <Icon name="lock" size={30} />
          </span>
          <p className="eyebrow">Artist studio</p>
          <h1 className={`h1 ${styles.gateTitle}`}>{site.artistFirstName}'s studio</h1>
          <p className={`muted ${styles.gateLead}`}>
            This is where {site.artistFirstName} would manage commissions: read each brief, look at reference photos, update progress and
            leave notes for customers.
          </p>
          <div className={`field ${styles.gateField}`}>
            <label className="label" htmlFor="studio-pass">
              Studio passcode
            </label>
            <input
              ref={inputRef}
              id="studio-pass"
              className="input"
              type="password"
              autoComplete="off"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={`studio-pass-hint${error ? ' studio-pass-error' : ''}`}
              autoFocus
            />
            {error && (
              <span id="studio-pass-error" className="error-text" role="alert">
                {error}
              </span>
            )}
            <span id="studio-pass-hint" className="hint">
              Demo passcode: <strong>{site.studioPasscode}</strong>
            </span>
          </div>
          <button type="submit" className="btn btn--primary btn--block" disabled={checking}>
            {checking ? 'Checking…' : 'Open the studio'}
          </button>
          <p className={`tiny muted ${styles.gateFoot}`}>Demo only: it shows orders saved {site.ordersSavedIn}. A real studio would have a proper login.</p>
        </form>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

type Filter = 'all' | 'open' | OrderStatus;

function Dashboard({ pass, onLock }: { pass: string; onLock: (message?: string) => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isWide = () => window.matchMedia('(min-width: 961px)').matches;

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await api.studio.listOrders(pass);
      setOrders(list);
      setLoadError('');
      setSelectedId((cur) => (cur && list.some((o) => o.id === cur) ? cur : isWide() ? (list[0]?.id ?? null) : null));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onLock('That passcode stopped working. Please enter it again.');
      else setLoadError("Couldn't reach the store server. Is it running?");
    } finally {
      setRefreshing(false);
    }
  }, [pass, onLock]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const list = orders ?? [];
    return {
      open: list.filter((o) => !DONE.includes(o.status)).length,
      awaiting: list.filter((o) => o.status === 'awaiting-approval').length,
      shipped: list.filter((o) => DONE.includes(o.status)).length,
      revenue: list.reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0, open: stats.open };
    for (const s of orderStatusFlow) c[s] = (orders ?? []).filter((o) => o.status === s).length;
    return c;
  }, [orders, stats.open]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (orders ?? []).filter((o) => {
      if (filter === 'open' && DONE.includes(o.status)) return false;
      if (filter !== 'all' && filter !== 'open' && o.status !== filter) return false;
      if (!q) return true;
      return [o.id, o.customer.name, o.customer.email, o.shipTo.recipientName].some((f) => f.toLowerCase().includes(q));
    });
  }, [orders, filter, query]);

  const selected = orders?.find((o) => o.id === selectedId) ?? null;

  const select = (id: string) => {
    setSelectedId(id);
    if (!isWide()) {
      // List and detail are stacked on small screens: jump to the detail.
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ block: 'start' });
        document.getElementById('studio-detail-title')?.focus({ preventScroll: true });
      });
    }
  };

  const backToList = () => {
    const row = selectedId ? document.querySelector<HTMLButtonElement>(`[data-order-row="${selectedId}"]`) : null;
    (row ?? listRef.current)?.scrollIntoView({ block: 'center' });
    row?.focus({ preventScroll: true });
  };

  const onUpdated = (updated: Order) => setOrders((list) => (list ?? []).map((o) => (o.id === updated.id ? updated : o)));

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    ...orderStatusFlow.map((s) => ({ value: s as Filter, label: statusShortLabel(s) })),
  ];

  const tiles: { label: string; value: string; icon: IconName; tone: string; note?: string }[] = [
    { label: 'Open commissions', value: String(stats.open), icon: 'pencil', tone: 'butter' },
    { label: 'Awaiting approval', value: String(stats.awaiting), icon: 'mail', tone: 'blush' },
    { label: 'Shipped', value: String(stats.shipped), icon: 'truck', tone: 'sage' },
    { label: 'Demo revenue', value: dollars(stats.revenue), icon: 'heart', tone: 'sky', note: 'Pretend money' },
  ];

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.head}>
          <div>
            <p className="eyebrow">
              <Turtle size={26} fill="var(--sage-soft)" /> Artist studio · demo
            </p>
            <h1 className="h1">Hi {site.artistFirstName}!</h1>
            <p className="muted" style={{ margin: 0 }}>
              Everything on your drawing desk, newest first.
            </p>
          </div>
          <div className={styles.headActions}>
            <button type="button" className="btn btn--sm" onClick={() => void load()} disabled={refreshing}>
              <Icon name="sparkle" size={16} /> {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => onLock()}>
              <Icon name="lock" size={16} /> Lock
            </button>
          </div>
        </header>

        <ul className={styles.tiles} aria-label="Summary">
          {tiles.map((t) => (
            <li key={t.label} className={styles.tile} data-tone={t.tone}>
              <span className={styles.tileIcon} aria-hidden="true">
                <Icon name={t.icon} size={22} />
              </span>
              <span className={styles.tileValue}>{t.value}</span>
              <span className={styles.tileLabel}>
                {t.label}
                {t.note && <span className={styles.tileNote}>{t.note}</span>}
              </span>
            </li>
          ))}
        </ul>

        {loadError && (
          <div className={`notice notice--red ${styles.loadError}`} role="alert">
            <Icon name="info" size={20} /> <span>{loadError}</span>
            <button type="button" className="link" onClick={() => void load()}>
              Try again
            </button>
          </div>
        )}

        {orders === null && !loadError ? (
          <p className={styles.loading} role="status">
            Opening the order book…
          </p>
        ) : orders && orders.length === 0 ? (
          <div className={`card ${styles.empty}`}>
            <Turtle size={110} fill="var(--butter-soft)" />
            <h2 className="h3">No orders yet</h2>
            <p className="muted">No orders yet. Place a demo order from the shop to see it here.</p>
            <Link to="/shop" className="btn btn--primary">
              Go to the shop <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        ) : orders ? (
          <div className={styles.board}>
            <div className={styles.listCol} ref={listRef}>
              <div className={styles.tools}>
                <div className={styles.search}>
                  <label htmlFor="studio-search" className="visually-hidden">
                    Search orders
                  </label>
                  <Icon name="search" size={18} className={styles.searchIcon} />
                  <input
                    id="studio-search"
                    className="input"
                    type="search"
                    placeholder="Search name, email or order #"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className={styles.chips} role="group" aria-label="Filter by status">
                  {filters.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      className={`chip ${styles.chip}`}
                      aria-pressed={filter === f.value}
                      onClick={() => setFilter(f.value)}
                    >
                      {f.label} <span className={styles.chipCount}>{counts[f.value] ?? 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className={`small muted ${styles.resultCount}`} role="status">
                {visible.length === orders.length ? `${orders.length} orders` : `Showing ${visible.length} of ${orders.length} orders`}
              </p>

              {visible.length === 0 ? (
                <div className={styles.noMatch}>
                  <p>No orders match.</p>
                  <button
                    type="button"
                    className="link"
                    onClick={() => {
                      setFilter('all');
                      setQuery('');
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <ul className={styles.list}>
                  {visible.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        className={styles.row}
                        data-order-row={o.id}
                        aria-current={o.id === selectedId ? 'true' : undefined}
                        onClick={() => select(o.id)}
                      >
                        <span className={styles.rowTop}>
                          <span className={styles.rowId}>{o.id}</span>
                          <StatusPill status={o.status} />
                        </span>
                        <span className={styles.rowName}>
                          {o.customer.name}
                          {o.lines.some((l) => l.config.isGift) && <Icon name="gift" size={15} label="Gift" />}
                          {o.artistNote && <Icon name="edit" size={15} label="Has a note" />}
                        </span>
                        <span className={styles.rowMeta}>
                          <span>{lineSummary(o)}</span>
                          <span>
                            {formatDate(o.createdAt)} · <strong>{dollars(o.total)}</strong>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.detailCol} ref={detailRef}>
              {selected ? (
                <div className={`card ${styles.detailCard}`}>
                  <OrderDetail
                    key={selected.id}
                    order={selected}
                    pass={pass}
                    onUpdated={onUpdated}
                    onUnauthorized={() => onLock('That passcode stopped working. Please enter it again.')}
                    onBack={backToList}
                  />
                </div>
              ) : (
                <div className={`card ${styles.pickOne}`}>
                  <Turtle size={80} fill="var(--sky-soft)" />
                  <p className="muted">Pick an order to see the full brief.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
