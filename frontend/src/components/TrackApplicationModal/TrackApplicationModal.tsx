import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { getSourceDisplayName } from '../../utils/format';
import styles from './TrackApplicationModal.module.scss';

interface TrackApplicationModalProps {
  open: boolean;
  source: string;
  alreadyTracked: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function TrackApplicationModal({
  open,
  source,
  alreadyTracked,
  onConfirm,
  onClose,
}: TrackApplicationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose}>
      <div className={styles.content}>
        <h2>Track this application?</h2>
        {alreadyTracked ? (
          <>
            <p>This job is already in your dashboard.</p>
            <div className={styles.actions}>
              <Link to="/dashboard" className={styles.primary}>Go to dashboard</Link>
              <button type="button" onClick={onClose}>Close</button>
            </div>
          </>
        ) : (
          <>
            <p>
              Would you like to save this job to your dashboard so you can keep track of your
              application on {getSourceDisplayName(source)}?
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={onConfirm}>Yes, track it</button>
              <button type="button" onClick={onClose}>No thanks</button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
