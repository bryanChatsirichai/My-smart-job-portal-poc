import { useMemo, useState } from 'react';

import { DashboardJobCard } from '../components/DashboardJobCard/DashboardJobCard';
import { useTrackedApplications } from '../hooks/useTrackedApplications';
import type { ApplicationStatus } from '../types/job';
import styles from './DashboardPage.module.scss';

const FILTERS: Array<ApplicationStatus | 'all'> = [
  'all',
  'applied',
  'interview',
  'rejected',
  'accepted',
  'saved',
  'withdrawn',
];

export function DashboardPage() {
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const { items, stats, updateStatus, updateNotes, removeItem } = useTrackedApplications();

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>My Applications</h1>
          <p className={styles.subtitle}>Saved in this browser</p>
        </div>
        <div className={styles.stats}>
          <span>{stats.total} tracked</span>
          <span>{stats.applied} applied</span>
          <span>{stats.interview} interview</span>
          <span>{stats.accepted} accepted</span>
        </div>
      </header>

      <div className={styles.filters}>
        {FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            className={filter === status ? styles.active : undefined}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className={styles.empty}>
          <h2>No tracked applications yet</h2>
          <p>Apply to a job and choose to track it to see it here.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredItems.map((item) => (
            <DashboardJobCard
              key={item.id}
              item={item}
              onStatusChange={updateStatus}
              onNotesChange={updateNotes}
              onRemove={removeItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
