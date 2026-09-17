import { Link, NavLink } from 'react-router-dom';

import { useTrackedApplications } from '../../hooks/useTrackedApplications';
import styles from './Layout.module.scss';

export function Layout({ children }: { children: React.ReactNode }) {
  const { stats } = useTrackedApplications();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark} aria-hidden="true" />
            JobFinder SG
          </Link>
          <nav className={styles.nav} aria-label="Main">
            <NavLink to="/" className={({ isActive }) => (isActive ? styles.active : undefined)} end>
              Search
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? styles.active : undefined)}
            >
              My Applications
              {stats.total > 0 && (
                <span className={styles.navBadge} aria-label={`${stats.total} tracked applications`}>
                  {stats.total}
                </span>
              )}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className={styles.main} id="main-content">
        {children}
      </main>
    </div>
  );
}
