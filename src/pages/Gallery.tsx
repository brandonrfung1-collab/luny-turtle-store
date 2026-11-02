import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { Lightbox } from '../components/pages/Lightbox';
import { categoryLabels, galleryArt, galleryCategories, inCategory, ratio } from '../components/pages/artHelpers';
import { site } from '../data/site';
import type { ArtCategory, Artwork } from '../data/types';
import styles from './Gallery.module.css';
import { usePageTitle } from '../components/pages/usePageTitle';

type Filter = ArtCategory | 'all';

const isCategory = (v: string | null): v is ArtCategory => v !== null && (galleryCategories as string[]).includes(v);

/** Column count for the masonry layout, following the viewport width. */
function useColumnCount() {
  const pick = () => (window.innerWidth >= 1100 ? 4 : window.innerWidth >= 720 ? 3 : 2);
  const [n, setN] = useState(pick);
  useEffect(() => {
    const onResize = () => setN(pick());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return n;
}

/** Deterministic little tilt per drawing, so the wall feels hand-placed. */
function tiltFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 7) - 3) * 0.5; // -1.5 .. 1.5 deg
}

/** Puts each item in the currently shortest column (by aspect ratio), keeping reading order roughly row by row. */
function toColumns(items: Artwork[], n: number) {
  const cols: Artwork[][] = Array.from({ length: n }, () => []);
  const heights = new Array(n).fill(0);
  for (const a of items) {
    let best = 0;
    for (let i = 1; i < n; i++) if (heights[i] < heights[best] - 0.05) best = i;
    cols[best].push(a);
    heights[best] += 1 / ratio(a) + 0.12; // + title/gap allowance
  }
  return cols;
}

export default function Gallery() {
  usePageTitle('Gallery · Luny Turtle');
  const [params, setParams] = useSearchParams();
  const all = useMemo(galleryArt, []);
  const columns = useColumnCount();
  const tileRefs = useRef(new Map<string, HTMLButtonElement>());
  const chipRefs = useRef(new Map<Filter, HTMLButtonElement>());

  const cParam = params.get('c');
  const filter: Filter = isCategory(cParam) ? cParam : 'all';
  const items = useMemo(() => (filter === 'all' ? all : all.filter((a) => inCategory(a, filter))), [all, filter]);

  const counts = useMemo(() => {
    const m = new Map<ArtCategory, number>();
    for (const c of galleryCategories) m.set(c, all.filter((a) => inCategory(a, c)).length);
    return m;
  }, [all]);

  // The open drawing lives in the URL (?art=id) so a drawing can be linked to directly.
  const openId = params.get('art');
  const inFilter = openId ? items.findIndex((a) => a.id === openId) : -1;
  // A linked drawing outside the current filter still opens, browsing the whole gallery.
  const lightboxItems = inFilter >= 0 ? items : all;
  const lightboxIndex = inFilter >= 0 ? inFilter : openId ? all.findIndex((a) => a.id === openId) : -1;

  const update = useCallback(
    (next: { c?: Filter; art?: string | null }) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next.c !== undefined) {
            if (next.c === 'all') p.delete('c');
            else p.set('c', next.c);
          }
          if (next.art !== undefined) {
            if (next.art) p.set('art', next.art);
            else p.delete('art');
          }
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setFilter = (c: Filter) => update({ c, art: null });

  // Where focus goes once the lightbox has closed (the page behind it is inert until then).
  const focusAfterClose = useRef<(() => void) | null>(null);
  const isOpen = lightboxIndex >= 0;
  useEffect(() => {
    if (isOpen || !focusAfterClose.current) return;
    focusAfterClose.current();
    focusAfterClose.current = null;
  }, [isOpen]);

  const closeLightbox = () => {
    const id = openId;
    // Return focus to the drawing that was showing (or the gallery heading if it is not on screen).
    focusAfterClose.current = () => {
      const tile = id ? tileRefs.current.get(id) : undefined;
      if (tile) tile.focus();
      else document.getElementById('gallery-title')?.focus();
    };
    update({ art: null });
  };

  const pickCategory = (c: ArtCategory) => {
    focusAfterClose.current = () => chipRefs.current.get(c)?.focus();
    update({ c, art: null });
  };

  const cols = toColumns(items, columns);
  const filterLabel = filter === 'all' ? 'all drawings' : categoryLabels[filter];
  const chips: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: all.length },
    ...galleryCategories.map((c) => ({ key: c, label: categoryLabels[c], count: counts.get(c) ?? 0 })).filter((c) => c.count > 0),
  ];

  return (
    <>
      <section className={styles.head}>
        <div className="container">
          <p className="eyebrow">The gallery</p>
          <h1 id="gallery-title" className="h1" tabIndex={-1}>
            Somebody's favorite people, drawn with love
          </h1>
          <p className="lead">
            Couples, families, friends, weddings, pets and the occasional ghost onesie, all in ink and colored pencil. Tap any
            drawing to see it up close.
          </p>
        </div>
      </section>

      <section className={styles.body} aria-labelledby="gallery-title">
        <div className="container">
          <div className={styles.filters} role="group" aria-label="Filter drawings by subject">
            {chips.map((c) => (
              <button
                key={c.key}
                ref={(el) => {
                  if (el) chipRefs.current.set(c.key, el);
                  else chipRefs.current.delete(c.key);
                }}
                type="button"
                className={`chip ${styles.chip}`}
                aria-pressed={filter === c.key}
                onClick={() => setFilter(c.key)}
              >
                {c.label}
                <span className={styles.chipCount}>
                  <span className="visually-hidden">(</span>
                  {c.count}
                  <span className="visually-hidden">)</span>
                </span>
              </button>
            ))}
          </div>

          <p className="visually-hidden" aria-live="polite">
            Showing {items.length} {items.length === 1 ? 'drawing' : 'drawings'}: {filterLabel}
          </p>

          {items.length === 0 ? (
            <div className={`card card-pad ${styles.empty}`}>
              <p className="h3">No drawings here yet</p>
              <p className="muted">Try another filter, or peek at {site.instagramHandle} for the newest pieces.</p>
              <button type="button" className="btn btn--sm" onClick={() => setFilter('all')}>
                Show all drawings
              </button>
            </div>
          ) : (
            <div className={styles.wall} style={{ ['--cols' as string]: columns }}>
              {cols.map((col, ci) => (
                <ul key={ci} className={styles.col}>
                  {col.map((a) => (
                    <li key={a.id}>
                      <button
                        ref={(el) => {
                          if (el) tileRefs.current.set(a.id, el);
                          else tileRefs.current.delete(a.id);
                        }}
                        type="button"
                        className={styles.tile}
                        onClick={() => update({ art: a.id })}
                        aria-haspopup="dialog"
                      >
                        <span className={`sticker ${styles.tileSticker}`} style={{ ['--tilt' as string]: `${tiltFor(a.id)}deg` }}>
                          <img src={a.src} alt={a.alt} width={a.width} height={a.height} loading="lazy" decoding="async" />
                          {a.kind === 'process' && <span className={`badge badge--blue ${styles.sketchBadge}`}>Sketch</span>}
                        </span>
                        <span className={styles.tileTitle}>{a.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          )}

          <div className={`plaid-pink ${styles.cta}`}>
            <div>
              <h2 className="h2">Want one of your own?</h2>
              <p className="muted">
                Pick a drawing type, share a few photos, and I'll send you a pencil sketch before any ink goes down.
              </p>
            </div>
            <div className={styles.ctaBtns}>
              <Link to="/shop" className="btn btn--primary btn--lg">
                Start a commission <Icon name="arrowRight" size={20} />
              </Link>
              <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="btn btn--lg">
                <Icon name="instagram" size={20} /> More on Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      {isOpen && (
        <Lightbox
          items={lightboxItems}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={(i) => update({ art: lightboxItems[i]?.id ?? null })}
          onPickCategory={pickCategory}
        />
      )}
    </>
  );
}
