import { orderStatusFlow, orderStatusLabels } from '../../lib/api';
import type { Order, OrderStatus } from '../../data/types';
import { formatDate } from '../../lib/format';
import { Icon } from '../Icons';
import styles from './StatusTimeline.module.css';

const descriptions: Record<OrderStatus, string> = {
  received: 'Your order is in. I read every detail and look through your photos.',
  sketching: 'I brainstorm little thumbnails, then draw a pencil sketch.',
  'awaiting-approval': 'Your pencil sketch is ready to look over. Ask for any changes before ink goes down.',
  'inking-coloring': 'Inking and coloring by hand, finished with my signature turtle.',
  shipped: 'Packed with care and on its way to you. Shipping is included.',
  delivered: 'Your drawing has arrived. I hope it brings lots of joy!',
};

/** When each status was (last) reached, from the order's history. */
function reachedAt(order: Order, status: OrderStatus): string | undefined {
  for (let i = order.statusHistory.length - 1; i >= 0; i--) {
    if (order.statusHistory[i].status === status) return order.statusHistory[i].at;
  }
  return undefined;
}

export function StatusTimeline({ order }: { order: Order }) {
  const current = Math.max(0, orderStatusFlow.indexOf(order.status));
  return (
    <ol className={styles.timeline}>
      {orderStatusFlow.map((status, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'upcoming';
        const at = state === 'upcoming' ? undefined : reachedAt(order, status);
        return (
          <li key={status} className={styles.step} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
            <span className={styles.dot} aria-hidden="true">
              {state === 'done' ? (
                <Icon name="check" size={16} strokeWidth={3} />
              ) : state === 'current' ? (
                <span className={styles.pulse} />
              ) : null}
            </span>
            <div className={styles.body}>
              <div className={styles.titleRow}>
                <span className={styles.label}>{orderStatusLabels[status]}</span>
                {state === 'current' && <span className="badge badge--red">Now</span>}
                {at && (
                  <time className={styles.date} dateTime={at}>
                    {formatDate(at)}
                  </time>
                )}
                <span className="visually-hidden">
                  {state === 'done' ? '(done)' : state === 'current' ? '(current step)' : '(coming up)'}
                </span>
              </div>
              {state !== 'done' && <p className={styles.desc}>{descriptions[status]}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
