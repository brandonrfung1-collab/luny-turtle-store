import { forwardRef, useId } from 'react';
import { Icon, type IconName } from '../Icons';
import styles from './Builder.module.css';

interface StepperProps {
  label: string;
  /** singular noun for button labels, e.g. "person" */
  noun: string;
  icon: IconName;
  value: number;
  min?: number;
  /** false disables the + button (e.g. the drawing is full) */
  canIncrease: boolean;
  onChange: (next: number) => void;
  describedBy?: string;
  invalid?: boolean;
}

/** A big friendly − [n] + control. The + button is the ref target (used to focus on errors). */
export const Stepper = forwardRef<HTMLButtonElement, StepperProps>(function Stepper(
  { label, noun, icon, value, min = 0, canIncrease, onChange, describedBy, invalid },
  plusRef,
) {
  const id = useId();
  return (
    <div className={`${styles.stepper} ${invalid ? styles.stepperInvalid : ''}`} role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy}>
      <span className={styles.stepperIcon} aria-hidden="true">
        <Icon name={icon} size={26} />
      </span>
      <span id={`${id}-label`} className={styles.stepperLabel}>
        {label}
      </span>
      <div className={styles.stepperControls}>
        <button
          type="button"
          className={styles.stepperBtn}
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`One less ${noun}`}
        >
          <Icon name="minus" size={18} strokeWidth={3} />
        </button>
        <output className={styles.stepperValue} aria-live="polite" aria-label={`${label}: ${value}`}>
          <span key={value} className={styles.stepperNum}>
            {value}
          </span>
        </output>
        <button
          ref={plusRef}
          type="button"
          className={styles.stepperBtn}
          onClick={() => onChange(value + 1)}
          disabled={!canIncrease}
          aria-label={`One more ${noun}`}
        >
          <Icon name="plus" size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
});
