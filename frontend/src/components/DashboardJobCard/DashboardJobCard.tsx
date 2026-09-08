import { Link } from 'react-router-dom';

import type { ApplicationStatus, TrackedApplication } from '../../types/job';
import { formatDate, formatSalary, getSourceDisplayName } from '../../utils/format';
import { ApplicationStatusBadge } from '../ApplicationStatusBadge/ApplicationStatusBadge';
import { SourceBadge } from '../SourceBadge/SourceBadge';
import styles from './DashboardJobCard.module.scss';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'saved',
  'applied',
  'interview',
  'rejected',
  'accepted',
  'withdrawn',
];

interface DashboardJobCardProps {
  item: TrackedApplication;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
}

export function DashboardJobCard({
  item,
  onStatusChange,
  onNotesChange,
  onRemove,
}: DashboardJobCardProps) {
  const location =
    item.jobSnapshot.location?.district ||
    item.jobSnapshot.location?.region ||
    'Singapore';

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3>{item.jobSnapshot.title}</h3>
          <p>{item.jobSnapshot.companyName}</p>
        </div>
        <ApplicationStatusBadge status={item.status} />
      </div>

      <div className={styles.meta}>
        <SourceBadge source={item.jobSnapshot.source} />
        <span>{location}</span>
        <span>
          {formatSalary(
            item.jobSnapshot.salaryMin,
            item.jobSnapshot.salaryMax,
            'SGD',
          )}
        </span>
        <span>Tracked {formatDate(item.appliedAt)}</span>
      </div>

      <label className={styles.statusField}>
        Status
        <select
          value={item.status}
          onChange={(event) => onStatusChange(item.id, event.target.value as ApplicationStatus)}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </label>

      <label className={styles.notesField}>
        Notes
        <textarea
          value={item.notes ?? ''}
          placeholder="Add interview notes or follow-up reminders"
          onChange={(event) => onNotesChange(item.id, event.target.value)}
        />
      </label>

      <div className={styles.actions}>
        <Link to={`/jobs/${item.jobId}`}>View job</Link>
        <a href={item.jobSnapshot.applyUrl} target="_blank" rel="noopener noreferrer">
          Open on {getSourceDisplayName(item.jobSnapshot.source)}
        </a>
        <button type="button" onClick={() => onRemove(item.id)}>Remove</button>
      </div>
    </article>
  );
}
