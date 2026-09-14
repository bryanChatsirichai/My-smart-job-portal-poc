import { formatJobDescription } from '../../utils/jobDescription';
import styles from './JobDescription.module.scss';

type JobDescriptionProps = {
  description?: string | null;
};

export function JobDescription({ description }: JobDescriptionProps) {
  if (!description?.trim()) {
    return <p className={styles.empty}>No description available.</p>;
  }

  const html = formatJobDescription(description);

  return (
    <div
      className={styles.body}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
