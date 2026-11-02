import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { Turtle } from '../components/TurtleLogo';
import { DoodleDashes, DoodleSparkle, DoodleStar } from '../components/pages/Doodles';
import styles from './NotFound.module.css';
import { usePageTitle } from '../components/pages/usePageTitle';

export default function NotFound() {
  usePageTitle('Page not found · Luny Turtle');
  return (
    <section className="section">
      <div className={`container container--narrow ${styles.wrap}`}>
        <div className={styles.scene} aria-hidden="true">
          <span className={styles.trail}>
            <span />
            <span />
            <span />
          </span>
          <Turtle size={170} fill="var(--sage-soft)" className={styles.turtle} />
          <span className={styles.qmark}>?</span>
          <DoodleStar className={`${styles.doodle} ${styles.dStar}`} size={34} />
          <DoodleSparkle className={`${styles.doodle} ${styles.dSparkle}`} size={26} />
          <DoodleDashes className={`${styles.doodle} ${styles.dDashes}`} size={30} />
        </div>
        <p className="eyebrow">Page not found (404)</p>
        <h1 className="h1">Oops, this page wandered off</h1>
        <p className="lead">
          Slow and steady usually gets there, but this page doesn't seem to exist. Let's get you back on track.
        </p>
        <div className={styles.ctas}>
          <Link to="/" className="btn btn--lg">
            <Icon name="arrowLeft" size={20} /> Back home
          </Link>
          <Link to="/shop" className="btn btn--primary btn--lg">
            Start a commission
          </Link>
        </div>
        <p className={styles.more}>
          Or wander over to the <Link to="/gallery" className="link">gallery</Link> or the <Link to="/faq" className="link">FAQ</Link>.
        </p>
      </div>
    </section>
  );
}
