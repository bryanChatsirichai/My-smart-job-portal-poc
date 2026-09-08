import type { JobDetail, JobListItem } from '../../types/job';
import { getSourceDisplayName } from '../../utils/format';
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

  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.button} onClick={handleClick}>
        Apply on {getSourceDisplayName(job.source)}
      </button>
      <p className={styles.note}>
        Opens {getSourceDisplayName(job.source)} in a new tab. Sign in there to apply.
      </p>
    </div>
  );
}
