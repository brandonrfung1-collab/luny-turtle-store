import { useMemo } from 'react';
import styles from './Confetti.module.css';

const colors = ['var(--tomato)', 'var(--sage)', 'var(--sky)', 'var(--butter)', 'var(--blush)', 'var(--pumpkin)'];

// Seeded so the pattern is stable between renders.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/** A one-time shower of tiny hearts and stars. Decorative; hidden for prefers-reduced-motion. */
export function Confetti({ count = 34 }: { count?: number }) {
  const pieces = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: count }, (_, i) => ({
      left: r() * 100,
      delay: r() * 1.4,
      duration: 2.6 + r() * 1.8,
      size: 10 + r() * 12,
      drift: (r() - 0.5) * 120,
      spin: (r() - 0.5) * 540,
      color: colors[i % colors.length],
      shape: i % 3 === 0 ? 'star' : 'heart',
    }));
  }, [count]);

  return (
    <div className={styles.confetti} aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={styles.piece}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            color: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--drift' as string]: `${p.drift}px`,
            ['--spin' as string]: `${p.spin}deg`,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="100%"
            height="100%"
            fill="currentColor"
            stroke="var(--ink)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          >
            {p.shape === 'star' ? (
              <path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.7l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8L12 2.8Z" />
            ) : (
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
            )}
          </svg>
        </span>
      ))}
    </div>
  );
}
