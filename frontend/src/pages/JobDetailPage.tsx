import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { fetchJobById } from '../api/jobs';
import { ApplyButton } from '../components/ApplyButton/ApplyButton';
import { JobDescription } from '../components/JobDescription/JobDescription';
import { SourceBadge } from '../components/SourceBadge/SourceBadge';
import { TrackApplicationModal } from '../components/TrackApplicationModal/TrackApplicationModal';
import { Card } from '../components/ui/Card/Card';
import { Pill } from '../components/ui/Pill/Pill';
import { useTrackedApplications } from '../hooks/useTrackedApplications';
import type { JobDetail } from '../types/job';
import { formatDate, formatSalary } from '../utils/format';
import styles from './JobDetailPage.module.scss';

function CalendarIcon() {
  return (
    <svg className={styles.metaIcon} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M2 6.5h12M5 1.5v2M11 1.5v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className={styles.metaIcon} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 14s4.5-3.5 4.5-7a4.5 4.5 0 1 0-9 0c0 3.5 4.5 7 4.5 7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="8" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className={styles.metaIcon} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="5" width="12" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M5.5 5V4a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 10.5 4v1" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

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

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleTrack = () => {
    if (!job) return;
    if (!isTracked(job.id)) {
      save(job, 'applied');
      setToast('Application tracked!');
    }
    setShowTrackModal(false);
  };

  if (loading) {
    return (
      <div className={styles.state} role="status">
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className={styles.state} role="alert">
        <p>{error ?? 'Job not found.'}</p>
      </div>
    );
  }

  const location = job.location.district || job.location.region || job.location.address || 'Singapore';
  const salary = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency ?? 'SGD',
    job.salary_period,
  );

  return (
    <div className={styles.page}>
      <Card className={styles.main} variant="flat">
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h1 className={styles.title}>{job.title}</h1>
            <p className={styles.company}>{job.company_name}</p>
          </div>
          <SourceBadge source={job.source} />
        </div>

        <p className={styles.salary}>{salary}</p>

        <ul className={styles.meta}>
          <li>
            <LocationIcon />
            {location}
          </li>
          <li>
            <CalendarIcon />
            Posted {formatDate(job.posted_date)}
          </li>
          {job.employment_type && (
            <li>
              <BriefcaseIcon />
              {job.employment_type}
            </li>
          )}
          {job.seniority_level && (
            <li>{job.seniority_level}</li>
          )}
        </ul>

        {job.skills.length > 0 && (
          <div className={styles.skills}>
            {job.skills.map((skill) => (
              <Pill key={skill} removable={false}>{skill}</Pill>
            ))}
          </div>
        )}

        <section className={styles.description}>
          <h2>Job description</h2>
          <JobDescription description={job.description} />
        </section>
      </Card>

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

      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
