import { useCallback, useEffect, useState } from 'react';

import * as trackingService from '../services/trackingService';
import type { ApplicationStatus, TrackedApplication } from '../types/job';

export function useTrackedApplications() {
  const [items, setItems] = useState<TrackedApplication[]>([]);
  const [stats, setStats] = useState(trackingService.getStats());

  const refresh = useCallback(() => {
    setItems(trackingService.getAll());
    setStats(trackingService.getStats());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    (id: string, status: ApplicationStatus) => {
      trackingService.updateStatus(id, status);
      refresh();
    },
    [refresh],
  );

  const updateNotes = useCallback(
    (id: string, notes: string) => {
      trackingService.updateNotes(id, notes);
      refresh();
    },
    [refresh],
  );

  const removeItem = useCallback(
    (id: string) => {
      trackingService.remove(id);
      refresh();
    },
    [refresh],
  );

  return {
    items,
    stats,
    refresh,
    updateStatus,
    updateNotes,
    removeItem,
    isTracked: (jobId: string) => Boolean(trackingService.getByJobId(jobId)),
    save: trackingService.save,
  };
}
