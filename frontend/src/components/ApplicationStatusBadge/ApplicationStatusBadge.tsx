import type { ApplicationStatus } from '../../types/job';
import { Badge } from '../ui/Badge/Badge';

const LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  accepted: 'Accepted',
  withdrawn: 'Withdrawn',
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant="status" status={status}>
      {LABELS[status]}
    </Badge>
  );
}
