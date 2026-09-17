import { Link } from 'react-router-dom';

import type { ApplicationStatus, TrackedApplication } from '../../types/job';
import { formatDate, formatSalary, getSourceDisplayName } from '../../utils/format';
import { ApplicationStatusBadge } from '../ApplicationStatusBadge/ApplicationStatusBadge';
import { SourceBadge } from '../SourceBadge/SourceBadge';
import { Button } from '../ui/Button/Button';
import { Card } from '../ui/Card/Card';
import { Select } from '../ui/Select/Select';
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

  const statusClass = styles[item.status] ?? '';

  return (
    <Card className={[styles.card, statusClass].filter(Boolean).join(' ')} variant="flat">
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{item.jobSnapshot.title}</h3>
          <p className={styles.company}>{item.jobSnapshot.companyName}</p>
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

      <label className={styles.field} htmlFor={`status-${item.id}`}>
        <span className={styles.fieldLabel}>Status</span>
        <Select
          id={`status-${item.id}`}
          value={item.status}
          onChange={(event) => onStatusChange(item.id, event.target.value as ApplicationStatus)}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </Select>
      </label>

      <label className={styles.field} htmlFor={`notes-${item.id}`}>
        <span className={styles.fieldLabel}>Notes</span>
        <textarea
          id={`notes-${item.id}`}
          className={styles.textarea}
          value={item.notes ?? ''}
          placeholder="Add interview notes or follow-up reminders"
          onChange={(event) => onNotesChange(item.id, event.target.value)}
        />
      </label>

      <div className={styles.actions}>
        <Link to={`/jobs/${item.jobId}`} className={styles.link}>
          View job
        </Link>
        <a
          href={item.jobSnapshot.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Open on {getSourceDisplayName(item.jobSnapshot.source)}
        </a>
        <Button type="button" variant="ghost" className={styles.remove} onClick={() => onRemove(item.id)}>
          Remove
        </Button>
      </div>
    </Card>
  );
}
