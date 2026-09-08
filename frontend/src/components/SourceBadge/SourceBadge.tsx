import styles from './SourceBadge.module.scss';
import { getSourceDisplayName } from '../../utils/format';

export function SourceBadge({ source }: { source: string }) {
  return <span className={styles.badge}>{getSourceDisplayName(source)}</span>;
}
