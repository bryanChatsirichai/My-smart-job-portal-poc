import type { ApplicationStatus, TrackedApplication } from '../types/job';

export const PIPELINE_STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'interview',
  'rejected',
  'accepted',
  'withdrawn',
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  accepted: 'Accepted',
  withdrawn: 'Withdrawn',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: '#8b9aab',
  applied: '#2563eb',
  interview: '#7c3aed',
  rejected: '#dc2626',
  accepted: '#16a34a',
  withdrawn: '#64748b',
};

export const SOURCE_COLORS: Record<string, string> = {
  mycareersfuture: '#006b5e',
  linkedin: '#0a66c2',
  adzuna: '#279b37',
  jobicy: '#6b4fbb',
};

export interface PipelineDatum {
  status: ApplicationStatus;
  label: string;
  count: number;
  color: string;
}

export interface SourceDatum {
  source: string;
  label: string;
  count: number;
  color: string;
}

export interface TimelineDatum {
  week: string;
  label: string;
  count: number;
}

function formatSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    mycareersfuture: 'MyCareersFuture',
    linkedin: 'LinkedIn',
    adzuna: 'Adzuna',
    jobicy: 'Jobicy',
  };
  return labels[source] ?? source;
}

function getWeekKey(date: Date): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start.toISOString().slice(0, 10);
}

function formatWeekLabel(weekKey: string): string {
  const date = new Date(`${weekKey}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getPipelineCounts(items: TrackedApplication[]): PipelineDatum[] {
  const counts = Object.fromEntries(
    PIPELINE_STATUSES.map((status) => [status, 0]),
  ) as Record<ApplicationStatus, number>;

  items.forEach((item) => {
    counts[item.status] += 1;
  });

  return PIPELINE_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: counts[status],
    color: STATUS_COLORS[status],
  }));
}

export function getSourceBreakdown(items: TrackedApplication[]): SourceDatum[] {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const source = item.jobSnapshot.source;
    counts.set(source, (counts.get(source) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([source, count]) => ({
      source,
      label: formatSourceLabel(source),
      count,
      color: SOURCE_COLORS[source] ?? '#3d5a80',
    }))
    .sort((a, b) => b.count - a.count);
}

export function getApplicationsOverTime(items: TrackedApplication[]): TimelineDatum[] {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const week = getWeekKey(new Date(item.appliedAt));
    counts.set(week, (counts.get(week) ?? 0) + 1);
  });

  const sortedWeeks = Array.from(counts.keys()).sort();

  return sortedWeeks.map((week) => ({
    week,
    label: formatWeekLabel(week),
    count: counts.get(week) ?? 0,
  }));
}

export function salaryOverlapsRange(
  salaryMin: number | null | undefined,
  salaryMax: number | null | undefined,
  filterMin: number | null,
  filterMax: number | null,
): boolean {
  const jobMin = salaryMin ?? 0;
  const jobMax = salaryMax ?? salaryMin ?? Number.MAX_SAFE_INTEGER;

  if (filterMin !== null && jobMax < filterMin) return false;
  if (filterMax !== null && jobMin > filterMax) return false;
  return true;
}
