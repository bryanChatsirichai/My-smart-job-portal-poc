import type { JobDetail, JobListItem } from '../../types/job';
import { getSourceDisplayName } from '../../utils/format';
import { Button } from '../ui/Button/Button';
import styles from './ApplyButton.module.scss';

interface ApplyButtonProps {
  job: JobListItem | JobDetail;
  onApply: () => void;
}

export function ApplyButton({ job, onApply }: ApplyButtonProps) {
  const handleClick = () => {
    window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    onApply();
  };

  const sourceName = getSourceDisplayName(job.source);

  return (
    <div className={styles.wrapper}>
      <Button type="button" variant="primary" className={styles.button} onClick={handleClick}>
        Apply on {sourceName}
      </Button>
      <p className={styles.note}>
        Opens {sourceName} in a new tab. Sign in there to apply.
      </p>
    </div>
  );
}
