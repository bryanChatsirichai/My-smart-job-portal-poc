import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';

import { DashboardJobCard } from '../components/DashboardJobCard/DashboardJobCard';
import { Pill } from '../components/ui/Pill/Pill';
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

const FILTER_LABELS: Record<ApplicationStatus | 'all', string> = {
  all: 'All',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  accepted: 'Accepted',
  saved: 'Saved',
  withdrawn: 'Withdrawn',
};

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
          <h1 className={styles.title}>My Applications</h1>
          <p className={styles.subtitle}>Saved in this browser</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Tracked</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.applied}</span>
            <span className={styles.statLabel}>Applied</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.interview}</span>
            <span className={styles.statLabel}>Interview</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.accepted}</span>
            <span className={styles.statLabel}>Accepted</span>
          </div>
        </div>
      </header>

      <div className={styles.filtersWrap}>
        <div className={styles.filters} role="group" aria-label="Filter by status">
          {FILTERS.map((status) => (
            <Pill
              key={status}
              className={filter === status ? styles.filterActive : undefined}
              onClick={() => setFilter(status)}
            >
              {FILTER_LABELS[status]}
            </Pill>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className={styles.empty}>
          <h2>No tracked applications yet</h2>
          <p>Apply to a job and choose to track it to see it here.</p>
          <Link to="/" className={styles.searchJobs}>
            Search jobs
          </Link>
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
