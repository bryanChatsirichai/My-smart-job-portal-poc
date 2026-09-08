import { Link } from 'react-router-dom';

import type { JobListItem } from '../../types/job';
import { formatDate, formatSalary } from '../../utils/format';
import { SourceBadge } from '../SourceBadge/SourceBadge';
import styles from './JobCard.module.scss';

export function JobCard({ job }: { job: JobListItem }) {
  const location = job.location.district || job.location.region || 'Singapore';

  return (
    <Link to={`/jobs/${job.id}`} className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{job.title}</h3>
          <p className={styles.company}>{job.company_name}</p>
        </div>
        <SourceBadge source={job.source} />
      </div>
      <div className={styles.meta}>
        <span>{location}</span>
        <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency ?? 'SGD', job.salary_period)}</span>
        <span>{formatDate(job.posted_date)}</span>
      </div>
    </Link>
  );
}
