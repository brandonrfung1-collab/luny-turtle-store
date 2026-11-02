import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { site } from '../data/site';
import { useCart } from '../state/cart';
import { Icon } from './Icons';
import { Turtle, Wordmark } from './TurtleLogo';
import styles from './Layout.module.css';

const nav = [
  { to: '/shop', label: 'Commission' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
];

export function Layout() {
  const { pathname } = useLocation();

  // Scroll to top on route change (but not on hash links).
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  const hideAnnouncement = pathname.startsWith('/studio') || pathname.startsWith('/checkout');

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {!hideAnnouncement && <AnnouncementBar />}
      <Header />
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function AnnouncementBar() {
  return (
    <div className={styles.announce}>
      <div className={`container ${styles.announceInner}`}>
        <Icon name="sparkle" size={16} />
        <span>
          <strong>Holiday commissions are open!</strong> <span className={styles.announceExtra}>A few spots left this season · </span>
          <Link to="/shop/christmas-tree" className={styles.announceLink}>
            See the Christmas tree portrait
          </Link>
        </span>
        <Icon name="sparkle" size={16} />
      </div>
    </div>
  );
}

function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <Link to="/" className={styles.logo} aria-label="Luny Turtle home">
          <Wordmark />
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link to="/shop" className={`btn btn--primary btn--sm ${styles.ctaDesktop}`}>
            Start a commission
          </Link>
          <Link to="/cart" className={styles.cartBtn} aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
            <Icon name="bag" size={24} />
            {count > 0 && <span className={styles.cartCount}>{count}</span>}
          </Link>
          <button
            type="button"
            className={styles.menuBtn}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'close' : 'menu'} size={26} />
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className={styles.mobileNav}>
          <nav className="container" aria-label="Mobile">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.navActive : ''}`}>
                {n.label}
              </NavLink>
            ))}
            <NavLink to="/track" className={styles.mobileLink}>
              Track an order
            </NavLink>
            <Link to="/shop" className="btn btn--primary btn--block" style={{ marginTop: 12 }}>
              Start a commission
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className={`${styles.footer} plaid-green`}>
      <div className={`container ${styles.footerInner}`}>
        <div className={styles.footerBrand}>
          <Wordmark size="sm" />
          <p className="small muted" style={{ marginTop: 12 }}>
            Hand-drawn portraits of the people (and pets) you love. {site.medium}, made by {site.artistName}, {site.role}.
          </p>
          <a className={styles.insta} href={site.instagramUrl} target="_blank" rel="noreferrer">
            <Icon name="instagram" size={20} /> {site.instagramHandle}
          </a>
        </div>

        <div className={styles.footerCols}>
          <div>
            <h3 className={styles.footerHead}>Shop</h3>
            <ul>
              <li>
                <Link to="/shop/full-portrait">Full-body portrait</Link>
              </li>
              <li>
                <Link to="/shop/close-up-portrait">Close-up portrait</Link>
              </li>
              <li>
                <Link to="/shop/christmas-tree">Christmas tree portrait</Link>
              </li>
              <li>
                <Link to="/shop/ornament">Ornament drawing</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={styles.footerHead}>Hello</h3>
            <ul>
              <li>
                <Link to="/gallery">Gallery</Link>
              </li>
              <li>
                <Link to="/about">About Esther</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
              <li>
                <Link to="/track">Track an order</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className={`container ${styles.footerBottom}`}>
        <span className={styles.demoPill}>
          <Icon name="info" size={16} /> Demo site
        </span>
        <span className="tiny">{site.demoNotice}</span>
        <span className={styles.footerSpacer} />
        <Link to="/studio" className="tiny">
          Artist studio
        </Link>
        <span className="tiny muted">
          <Turtle size={22} /> © {new Date().getFullYear()} {site.artistName}
        </span>
      </div>
    </footer>
  );
}
