import styles from './SourceBadge.module.scss';
import { getSourceDisplayName } from '../../utils/format';

const SOURCE_CLASS: Record<string, string> = {
  mycareersfuture: styles.mycareersfuture,
  linkedin: styles.linkedin,
  adzuna: styles.adzuna,
  jobicy: styles.jobicy,
};

export function SourceBadge({ source }: { source: string }) {
  const sourceClass = SOURCE_CLASS[source] ?? styles.default;
  const classes = [styles.badge, sourceClass].join(' ');

  return <span className={classes}>{getSourceDisplayName(source)}</span>;
}
