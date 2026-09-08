import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { fetchJobById } from '../api/jobs';
import { ApplyButton } from '../components/ApplyButton/ApplyButton';
import { SourceBadge } from '../components/SourceBadge/SourceBadge';
import { TrackApplicationModal } from '../components/TrackApplicationModal/TrackApplicationModal';
import { useTrackedApplications } from '../hooks/useTrackedApplications';
import type { JobDetail } from '../types/job';
import { formatDate, formatSalary } from '../utils/format';
import styles from './JobDetailPage.module.scss';

export function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { isTracked, save } = useTrackedApplications();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchJobById(id)
      .then(setJob)
      .catch(() => setError('Unable to load this job.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTrack = () => {
    if (!job) return;
    if (!isTracked(job.id)) {
      save(job, 'applied');
      setToast('Application tracked!');
    }
    setShowTrackModal(false);
  };

  if (loading) return <div className={styles.state}>Loading job details...</div>;
  if (error || !job) return <div className={styles.state}>{error ?? 'Job not found.'}</div>;

  const location = job.location.district || job.location.region || job.location.address || 'Singapore';

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1>{job.title}</h1>
            <p>{job.company_name}</p>
          </div>
          <SourceBadge source={job.source} />
        </div>

        <div className={styles.meta}>
          <span>{location}</span>
          <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency ?? 'SGD', job.salary_period)}</span>
          <span>Posted {formatDate(job.posted_date)}</span>
          {job.employment_type && <span>{job.employment_type}</span>}
          {job.seniority_level && <span>{job.seniority_level}</span>}
        </div>

        {job.skills.length > 0 && (
          <div className={styles.skills}>
            {job.skills.map((skill) => <span key={skill}>{skill}</span>)}
          </div>
        )}

        <section className={styles.description}>
          <h2>Job description</h2>
          <p>{job.description}</p>
        </section>
      </div>

      <aside className={styles.sidebar}>
        <ApplyButton job={job} onApply={() => setShowTrackModal(true)} />
      </aside>

      <TrackApplicationModal
        open={showTrackModal}
        source={job.source}
        alreadyTracked={isTracked(job.id)}
        onConfirm={handleTrack}
        onClose={() => setShowTrackModal(false)}
      />

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
