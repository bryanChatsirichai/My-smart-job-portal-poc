import type { ApplicationStatus, JobDetail, JobListItem, TrackedApplication } from '../types/job';

const STORAGE_KEY = 'jobPortal_trackedApplications';

function readAll(): TrackedApplication[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TrackedApplication[];
  } catch {
    return [];
  }
}

function writeAll(items: TrackedApplication[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getAll(): TrackedApplication[] {
  return readAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getByJobId(jobId: string): TrackedApplication | undefined {
  return readAll().find((item) => item.jobId === jobId);
}

export function save(job: JobListItem | JobDetail, status: ApplicationStatus = 'applied'): TrackedApplication {
  const existing = getByJobId(job.id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const record: TrackedApplication = {
    id: crypto.randomUUID(),
    jobId: job.id,
    status,
    appliedAt: now,
    updatedAt: now,
    jobSnapshot: {
      title: job.title,
      companyName: job.company_name,
      source: job.source,
      applyUrl: job.apply_url,
      location: {
        district: job.location.district ?? undefined,
        region: job.location.region ?? undefined,
      },
      salaryMin: job.salary_min ?? null,
      salaryMax: job.salary_max ?? null,
    },
  };

  writeAll([record, ...readAll()]);
  return record;
}

export function updateStatus(id: string, status: ApplicationStatus): TrackedApplication | undefined {
  const items = readAll();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return undefined;

  items[index] = {
    ...items[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  writeAll(items);
  return items[index];
}

export function updateNotes(id: string, notes: string): TrackedApplication | undefined {
  const items = readAll();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return undefined;

  items[index] = {
    ...items[index],
    notes,
    updatedAt: new Date().toISOString(),
  };
  writeAll(items);
  return items[index];
}

export function remove(id: string): void {
  writeAll(readAll().filter((item) => item.id !== id));
}

export function getStats(): Record<ApplicationStatus | 'total', number> {
  const items = readAll();
  const stats = {
    total: items.length,
    saved: 0,
    applied: 0,
    interview: 0,
    rejected: 0,
    accepted: 0,
    withdrawn: 0,
  };

  items.forEach((item) => {
    stats[item.status] += 1;
  });

  return stats;
}
