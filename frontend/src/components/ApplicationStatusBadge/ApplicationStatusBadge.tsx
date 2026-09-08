import type { ApplicationStatus } from '../../types/job';
import styles from './ApplicationStatusBadge.module.scss';

const LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  accepted: 'Accepted',
  withdrawn: 'Withdrawn',
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`${styles.badge} ${styles[status]}`}>{LABELS[status]}</span>;
}
