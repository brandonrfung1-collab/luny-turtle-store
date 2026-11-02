import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { occasionLabels, occasionsFor } from '../../data/products';
import type { CartItem, CommissionConfig, Occasion, Product, ReferencePhoto } from '../../data/types';
import { figureCount, priceFor } from '../../lib/pricing';
import { useCart } from '../../state/cart';
import { Icon } from '../Icons';
import { AddedToast } from './AddedToast';
import { defaultConfig, figuresHelper, sceneCopy } from './content';
import { PhotoUploader } from './PhotoUploader';
import { PriceSummary } from './PriceSummary';
import { Stepper } from './Stepper';
import styles from './Builder.module.css';

type ErrorKey = 'figures' | 'scene' | 'ornaments';
type Errors = Partial<Record<ErrorKey, string>>;
const ERROR_ORDER: ErrorKey[] = ['figures', 'scene', 'ornaments'];
const MIN_SCENE = 10;

function validate(product: Product, c: CommissionConfig): Errors {
  const errors: Errors = {};
  if (product.hasFigures && figureCount(c) < 1) {
    errors.figures = 'Add at least one person or pet, so Esther knows who is in the drawing.';
  }
  if (c.referencePhotos.length === 0 && c.sceneIdea.trim().length < MIN_SCENE) {
    const what = sceneCopy[product.slug].what;
    errors.scene =
      what === 'what'
        ? `Add a photo of the ornament or describe it in a few words (${MIN_SCENE}+ characters), so Esther knows what to draw.`
        : `Add a reference photo or describe your scene in a few words (${MIN_SCENE}+ characters), so Esther knows who to draw.`;
  }
  if (product.needsOrnamentList && c.ornaments.trim().length < 3) {
    errors.ornaments = 'List a few ornaments or things you love, so Esther can decorate your tree.';
  }
  return errors;
}

/** What actually goes into the cart: trimmed text, nothing left over from hidden fields. */
function finalize(product: Product, c: CommissionConfig): CommissionConfig {
  return {
    ...c,
    productSlug: product.slug,
    people: product.hasFigures ? c.people : 0,
    pets: product.hasFigures ? c.pets : 0,
    sceneIdea: c.sceneIdea.trim(),
    textToInclude: c.textToInclude.trim(),
    ornaments: product.needsOrnamentList ? c.ornaments.trim() : '',
    notes: c.notes.trim(),
    giftNote: c.isGift ? c.giftNote.trim() : '',
  };
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Cycles through example placeholders while the field is empty and not focused. */
function useRotating(list: string[], paused: boolean, ms = 3200) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (paused || list.length < 2) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % list.length), ms);
    return () => window.clearInterval(t);
  }, [paused, list.length, ms]);
  return list[i % list.length];
}

interface BuilderProps {
  product: Product;
  /** when set, the builder edits this cart item instead of adding a new one */
  editItem?: CartItem;
  /** reports the live total (the product page shows it on the drawing's price tag) */
  onTotalChange?: (total: number) => void;
}

export function CommissionBuilder({ product, editItem, onTotalChange }: BuilderProps) {
  const uid = useId();
  const navigate = useNavigate();
  const { addItem, updateItem } = useCart();

  const [config, setConfig] = useState<CommissionConfig>(() =>
    editItem ? { ...defaultConfig(product), ...editItem.config, productSlug: product.slug } : defaultConfig(product),
  );
  const [attempted, setAttempted] = useState(false);
  const [added, setAdded] = useState<{ key: number; config: CommissionConfig } | null>(null);
  const [sceneFocused, setSceneFocused] = useState(false);
  const [summaryState, setSummaryState] = useState<'below' | 'visible' | 'above'>('below');

  const figuresRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<HTMLTextAreaElement>(null);
  const ornamentsRef = useRef<HTMLTextAreaElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const copy = sceneCopy[product.slug];
  const occasions = occasionsFor[product.slug];
  const total = priceFor(config);
  const figures = figureCount(config);
  const errors = useMemo(() => (attempted ? validate(product, config) : {}), [attempted, product, config]);
  const errorCount = Object.keys(errors).length;
  const scenePlaceholder = useRotating(copy.placeholders, sceneFocused || config.sceneIdea.length > 0);

  const set = <K extends keyof CommissionConfig>(key: K, value: CommissionConfig[K]) => setConfig((c) => ({ ...c, [key]: value }));

  useEffect(() => {
    onTotalChange?.(total);
  }, [total, onTotalChange]);

  // The mobile bar shows while the price summary is still further down the page.
  useEffect(() => {
    const el = summaryRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSummaryState('visible');
        else setSummaryState(entry.boundingClientRect.top > 0 ? 'below' : 'above');
      },
      { rootMargin: '0px 0px -84px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    const errs = validate(product, config);
    const first = ERROR_ORDER.find((k) => errs[k]);
    if (first) {
      const target = { figures: figuresRef, scene: sceneRef, ornaments: ornamentsRef }[first].current;
      if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        target.focus({ preventScroll: true });
      }
      return;
    }
    const clean = finalize(product, config);
    if (editItem) {
      updateItem(editItem.id, clean);
      navigate('/cart', { state: { savedId: editItem.id } });
      return;
    }
    addItem(clean);
    setAdded({ key: Date.now(), config: clean });
  }

  const addPhotos = (photos: ReferencePhoto[]) => setConfig((c) => ({ ...c, referencePhotos: [...c.referencePhotos, ...photos] }));
  const removePhoto = (id: string) => setConfig((c) => ({ ...c, referencePhotos: c.referencePhotos.filter((p) => p.id !== id) }));

  // Number the sections that are actually shown.
  let n = 0;
  const next = () => ++n;

  const sceneErrId = `${uid}-scene-err`;
  const figErrId = `${uid}-fig-err`;
  const ornErrId = `${uid}-orn-err`;
  const submitLabel = editItem ? 'Save changes' : 'Add to cart';

  return (
    <form className={styles.builder} onSubmit={onSubmit} noValidate aria-label={`Design your ${product.name.toLowerCase()}`}>
      {editItem && (
        <div className="notice notice--blue">
          <Icon name="edit" size={20} />
          <span>
            <strong>You're editing a drawing in your cart.</strong> Make your changes, then save.{' '}
            <Link to="/cart" className="link">
              Back to cart
            </Link>
          </span>
        </div>
      )}

      {occasions.length > 1 && (
        <Section n={next()} title="What's the occasion?">
          <div className={styles.chips} role="radiogroup" aria-label="Occasion">
            {occasions.map((o) => (
              <OccasionChip key={o} name={`${uid}-occasion`} value={o} checked={config.occasion === o} onChange={() => set('occasion', o)} />
            ))}
          </div>
        </Section>
      )}

      {product.hasFigures && (
        <Section n={next()} title="Who's in the drawing?" hint="Each person or pet counts as one figure.">
          <div className={styles.steppers}>
            <Stepper
              ref={figuresRef}
              label="People"
              noun="person"
              icon="people"
              value={config.people}
              canIncrease={figures < product.maxFigures}
              onChange={(v) => set('people', Math.max(0, Math.min(v, product.maxFigures - config.pets)))}
              invalid={!!errors.figures}
              describedBy={errors.figures ? figErrId : undefined}
            />
            <Stepper
              label="Pets"
              noun="pet"
              icon="paw"
              value={config.pets}
              canIncrease={figures < product.maxFigures}
              onChange={(v) => set('pets', Math.max(0, Math.min(v, product.maxFigures - config.people)))}
              invalid={!!errors.figures}
              describedBy={errors.figures ? figErrId : undefined}
            />
          </div>
          {!(figures === 0 && errors.figures) && (
            <p className={`${styles.figHelper} ${figures > product.includedFigures || figures === 0 ? styles.figHelperExtra : ''}`} aria-live="polite">
              <Icon name={figures === 0 ? 'info' : figures > product.includedFigures ? 'plus' : 'check'} size={16} strokeWidth={figures === 0 ? 2.4 : 3} />
              {figuresHelper(product, figures)}
            </p>
          )}
          {figures >= product.maxFigures && (
            <p className="hint">
              {product.maxFigures} figures is the most this drawing fits. Have a bigger crew? Mention it in your notes.
            </p>
          )}
          {errors.figures && <ErrorText id={figErrId}>{errors.figures}</ErrorText>}
        </Section>
      )}

      <Section n={next()} title={copy.title}>
        <div className="field">
          <label className="label" htmlFor={`${uid}-scene`}>
            {copy.label}
          </label>
          <textarea
            ref={sceneRef}
            id={`${uid}-scene`}
            className="textarea"
            rows={4}
            maxLength={1500}
            value={config.sceneIdea}
            placeholder={`e.g. ${scenePlaceholder}`}
            onChange={(e) => set('sceneIdea', e.target.value)}
            onFocus={() => setSceneFocused(true)}
            onBlur={() => setSceneFocused(false)}
            aria-invalid={!!errors.scene || undefined}
            aria-describedby={[`${uid}-scene-hint`, errors.scene ? sceneErrId : ''].filter(Boolean).join(' ')}
          />
          {errors.scene && <ErrorText id={sceneErrId}>{errors.scene}</ErrorText>}
          <p id={`${uid}-scene-hint`} className="hint">
            {copy.hint}
          </p>
        </div>
      </Section>

      <Section
        n={next()}
        title="Reference photos"
        hint={product.slug === 'ornament' ? 'A photo, a description above, or both.' : 'Photos, a description above, or both. Whatever you have!'}
      >
        <PhotoUploader
          photos={config.referencePhotos}
          onAdd={addPhotos}
          onRemove={removePhoto}
          invalid={!!errors.scene}
          describedBy={errors.scene ? sceneErrId : undefined}
          subject={product.slug === 'ornament' ? 'ornament' : 'people'}
        />
      </Section>

      {product.needsOrnamentList && (
        <Section n={next()} title="Ornaments for the tree">
          <div className="field">
            <label className="label" htmlFor={`${uid}-orn`}>
              Your favorite ornaments
            </label>
            <textarea
              ref={ornamentsRef}
              id={`${uid}-orn`}
              className="textarea"
              rows={4}
              maxLength={1500}
              value={config.ornaments}
              placeholder="e.g. a tiny bagel, a soccer ball, the ramen bowl from our first date, a guitar, a little Eiffel Tower"
              onChange={(e) => set('ornaments', e.target.value)}
              aria-invalid={!!errors.ornaments || undefined}
              aria-describedby={[`${uid}-orn-hint`, errors.ornaments ? ornErrId : ''].filter(Boolean).join(' ')}
            />
            {errors.ornaments && <ErrorText id={ornErrId}>{errors.ornaments}</ErrorText>}
            <p id={`${uid}-orn-hint`} className="hint">
              List your favorite ornaments, or just things you love. Don't have a tree or ornaments? Share some things you like and
              I'll be happy to imagine a comfy cozy Christmas tree for you.
            </p>
          </div>
        </Section>
      )}

      <Section n={next()} title="The little details" optional>
        <div className={styles.fieldStack}>
          <div className="field">
            <label className="label" htmlFor={`${uid}-text`}>
              Text to include
            </label>
            <input
              id={`${uid}-text`}
              className="input"
              maxLength={200}
              value={config.textToInclude}
              placeholder={product.slug === 'ornament' ? 'e.g. "Our first Christmas, 2026"' : 'e.g. "Sarah & Min, est. 2019"'}
              onChange={(e) => set('textToInclude', e.target.value)}
              onKeyDown={(e) => {
                // Enter in a one-line field shouldn't drop a drawing into the cart by surprise.
                if (e.key === 'Enter') e.preventDefault();
              }}
              aria-describedby={`${uid}-text-hint`}
            />
            <p id={`${uid}-text-hint`} className="hint">
              Names, a date, a school, a little phrase. I'll letter it into the drawing.
            </p>
          </div>
          <div className="field">
            <label className="label" htmlFor={`${uid}-notes`}>
              Notes for Esther
            </label>
            <textarea
              id={`${uid}-notes`}
              className="textarea"
              rows={3}
              maxLength={2000}
              value={config.notes}
              placeholder={
                product.hasFigures
                  ? 'e.g. My husband always wears his green beanie. Our corgi is named Mochi and has one floppy ear.'
                  : 'e.g. The taxi should have a little wreath on the front.'
              }
              onChange={(e) => set('notes', e.target.value)}
              aria-describedby={`${uid}-notes-hint`}
            />
            <p id={`${uid}-notes-hint`} className="hint">
              {product.hasFigures ? 'Personalities, outfits, pet names, favorite colors: anything that makes them, them.' : 'Colors, little details, the story behind it.'}
            </p>
          </div>
        </div>
      </Section>

      <Section n={next()} title="Is it a gift?" optional>
        <label className={`checkbox ${styles.giftToggle}`}>
          <input type="checkbox" checked={config.isGift} onChange={(e) => set('isGift', e.target.checked)} />
          <span>
            <span className={styles.giftTitle}>
              <Icon name="gift" size={20} /> Yes, this drawing is a gift
            </span>
            <span className="hint">So I know to keep it a surprise. You can ship it straight to the lucky giftee at checkout.</span>
          </span>
        </label>
        {config.isGift && (
          <div className={`field pop-in ${styles.giftNote}`}>
            <label className="label" htmlFor={`${uid}-gift`}>
              Gift note <span className={styles.optional}>optional</span>
            </label>
            <textarea
              id={`${uid}-gift`}
              className="textarea"
              rows={3}
              maxLength={600}
              value={config.giftNote}
              placeholder="e.g. Happy 5th anniversary, my love! Can't wait for 50 more."
              onChange={(e) => set('giftNote', e.target.value)}
              aria-describedby={`${uid}-gift-hint`}
            />
            <p id={`${uid}-gift-hint`} className="hint">
              Who it's for, a message you'd like included, or a date you're hoping for.
            </p>
          </div>
        )}
      </Section>

      <div ref={summaryRef} className={styles.summaryAnchor}>
        <PriceSummary
          product={product}
          config={config}
          submitLabel={submitLabel}
          submitRef={submitRef}
          errorCount={errorCount}
          editing={!!editItem}
        />
      </div>

      {/* Mobile: live total + add button while the summary is still below. */}
      <div className={`${styles.mobileBar} ${summaryState === 'below' && !added ? styles.mobileBarShown : ''}`} aria-hidden={summaryState !== 'below' || !!added}>
        <div className={styles.mobileBarInner}>
          <div className={styles.mobileTotal}>
            <span className={styles.mobileTotalLabel}>Total</span>
            <span key={total} className={styles.mobileTotalValue}>
              ${total}
            </span>
          </div>
          <button type="submit" className="btn btn--primary" tabIndex={summaryState === 'below' && !added ? 0 : -1}>
            {editItem ? 'Save changes' : 'Add to cart'}
          </button>
        </div>
      </div>

      {added && (
        <AddedToast
          key={added.key}
          product={product}
          config={added.config}
          onClose={() => {
            setAdded(null);
            submitRef.current?.focus({ preventScroll: true });
          }}
        />
      )}
    </form>
  );
}

function Section({ n, title, hint, optional, children }: { n: number; title: string; hint?: string; optional?: boolean; children: ReactNode }) {
  const id = useId();
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.sectionHead}>
        <span className={styles.num} aria-hidden="true">
          {n}
        </span>
        <div>
          <h2 id={id} className={styles.sectionTitle}>
            {title}
            {optional && <span className={styles.optional}>optional</span>}
          </h2>
          {hint && <p className={styles.sectionHint}>{hint}</p>}
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function OccasionChip({ name, value, checked, onChange }: { name: string; value: Occasion; checked: boolean; onChange: () => void }) {
  return (
    <label className={styles.chipLabel}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className={styles.chipInput} />
      <span className={`chip ${checked ? 'chip--active' : ''} ${styles.chip}`}>
        {checked && <Icon name="check" size={15} strokeWidth={3} />}
        {occasionLabels[value]}
      </span>
    </label>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className={`error-text ${styles.error}`} role="alert">
      <Icon name="info" size={16} strokeWidth={2.6} />
      {children}
    </p>
  );
}
