import type { OrderStatus } from '../../data/types';
import { orderStatusLabels } from '../../lib/api';
import styles from './StatusPill.module.css';

const short: Record<OrderStatus, string> = {
  received: 'New',
  sketching: 'Sketching',
  'awaiting-approval': 'Awaiting approval',
  'inking-coloring': 'Inking + coloring',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

/** Colored status label for the studio. `long` uses the customer-facing wording. */
export function StatusPill({ status, long = false }: { status: OrderStatus; long?: boolean }) {
  return (
    <span className={styles.pill} data-status={status}>
      <span className={styles.dot} aria-hidden="true" />
      {long ? orderStatusLabels[status] : short[status]}
    </span>
  );
}

export const statusShortLabel = (s: OrderStatus) => short[s];
