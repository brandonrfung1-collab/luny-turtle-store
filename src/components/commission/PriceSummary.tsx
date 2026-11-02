import type { RefObject } from 'react';
import type { CommissionConfig, Product } from '../../data/types';
import { money } from '../../lib/format';
import { priceBreakdown, priceFor } from '../../lib/pricing';
import { Icon } from '../Icons';
import { figuresLabel } from './content';
import styles from './Builder.module.css';

interface PriceSummaryProps {
  product: Product;
  config: CommissionConfig;
  submitLabel: string;
  submitRef: RefObject<HTMLButtonElement>;
  errorCount: number;
  editing: boolean;
}

/** Receipt-style summary with the live total and the submit button. */
export function PriceSummary({ product, config, submitLabel, submitRef, errorCount, editing }: PriceSummaryProps) {
  const lines = priceBreakdown(config);
  const total = priceFor(config);

  return (
    <div className={`card ${styles.summary}`}>
      <div className={styles.summaryHead}>
        <h2 className={styles.summaryTitle}>Your drawing</h2>
        {!product.priceConfirmed && <span className="badge">Demo price</span>}
      </div>
      <p className={styles.summaryMeta}>
        {product.name} · {product.size}
        {product.hasFigures && <> · {figuresLabel(config)}</>}
      </p>

      <dl className={styles.lines}>
        {lines.map((l) => {
          const isShipping = l.label === 'Shipping';
          return (
            <div key={l.label} className={styles.line}>
              <dt>{l.label}</dt>
              <dd className={isShipping ? styles.free : undefined}>
                {isShipping && l.amount === 0 ? (
                  <>
                    <Icon name="truck" size={16} /> Included
                  </>
                ) : (
                  money(l.amount)
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total</span>
        <span key={total} className={styles.total}>
          ${total}
        </span>
      </div>

      {errorCount > 0 && (
        <p className={`notice notice--red ${styles.summaryErrors}`} role="status">
          <Icon name="info" size={18} />
          <span>
            Almost there! {errorCount === 1 ? 'One thing needs' : `${errorCount} things need`} a little love above.
          </span>
        </p>
      )}

      <button ref={submitRef} type="submit" className="btn btn--primary btn--lg btn--block">
        <Icon name={editing ? 'check' : 'bag'} size={20} />
        {submitLabel}
      </button>

      <ul className={styles.assurances}>
        <li>
          <Icon name="pencil" size={16} /> You'll approve a pencil sketch before any ink goes down.
        </li>
        <li>
          <Icon name="heart" size={16} /> Each drawing is an original, made just for you.
        </li>
      </ul>
    </div>
  );
}
