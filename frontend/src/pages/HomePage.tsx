import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { fetchJobs } from '../api/jobs';
import { FilterPanel } from '../components/FilterPanel/FilterPanel';
import { JobCard } from '../components/JobCard/JobCard';
import { SearchBar } from '../components/SearchBar/SearchBar';
import type { JobListItem } from '../types/job';
import styles from './HomePage.module.scss';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [salaryMin, setSalaryMin] = useState(searchParams.get('salary_min') ?? '');
  const [salaryMax, setSalaryMax] = useState(searchParams.get('salary_max') ?? '');
  const [location, setLocation] = useState(searchParams.get('location') ?? '');
  const [source, setSource] = useState(searchParams.get('source') ?? '');
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get('page') ?? '1');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchJobs({
        q: searchParams.get('q') || undefined,
        salary_min: searchParams.get('salary_min') ? Number(searchParams.get('salary_min')) : undefined,
        salary_max: searchParams.get('salary_max') ? Number(searchParams.get('salary_max')) : undefined,
        location: searchParams.get('location') || undefined,
        source: searchParams.get('source') || undefined,
        page,
        limit: 20,
      });
      setJobs(response.items);
      setTotal(response.total);
    } catch {
      setError('Unable to load jobs. Make sure the API is running.');
    } finally {
      setLoading(false);
    }
  }, [page, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadJobs();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [loadJobs]);

  const applyFilters = () => {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (salaryMin) next.set('salary_min', salaryMin);
    if (salaryMax) next.set('salary_max', salaryMax);
    if (location) next.set('location', location);
    if (source) next.set('source', source);
    next.set('page', '1');
    setSearchParams(next);
  };

  const activeFilters = useMemo(() => {
    const chips: string[] = [];
    if (searchParams.get('q')) chips.push(`"${searchParams.get('q')}"`);
    if (searchParams.get('salary_min')) chips.push(`Min ${searchParams.get('salary_min')}`);
    if (searchParams.get('salary_max')) chips.push(`Max ${searchParams.get('salary_max')}`);
    if (searchParams.get('location')) chips.push(searchParams.get('location')!);
    if (searchParams.get('source')) chips.push(searchParams.get('source')!);
    return chips;
  }, [searchParams]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Find your next role in Singapore</h1>
        <p>Search aggregated listings and track your applications in one place.</p>
        <SearchBar value={query} onChange={setQuery} onSubmit={applyFilters} />
      </section>

      <div className={styles.layout}>
        <FilterPanel
          salaryMin={salaryMin}
          salaryMax={salaryMax}
          location={location}
          source={source}
          onSalaryMinChange={setSalaryMin}
          onSalaryMaxChange={setSalaryMax}
          onLocationChange={setLocation}
          onSourceChange={setSource}
          onApply={applyFilters}
        />

        <section className={styles.results}>
          <div className={styles.summary}>
            <strong>{loading ? 'Searching...' : `Showing ${jobs.length} of ${total} jobs`}</strong>
            {activeFilters.length > 0 && (
              <div className={styles.chips}>
                {activeFilters.map((chip) => (
                  <span key={chip} className={styles.chip}>{chip}</span>
                ))}
              </div>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {loading ? (
            <div className={styles.skeletons}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={styles.skeleton} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className={styles.empty}>
              <h2>No jobs found</h2>
              <p>Try broadening your search or adjusting your filters.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {jobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
