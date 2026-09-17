import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { getSourceDisplayName } from '../../utils/format';
import { Button } from '../ui/Button/Button';
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
  const navigate = useNavigate();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      window.setTimeout(() => {
        const firstFocusable = dialog.querySelector<HTMLElement>(
          'button, [href], input, select, textarea',
        );
        firstFocusable?.focus();
      }, 0);
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const sourceName = getSourceDisplayName(source);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      aria-labelledby="track-modal-title"
    >
      <div className={styles.content}>
        <h2 id="track-modal-title">Track this application?</h2>
        {alreadyTracked ? (
          <>
            <p>This job is already in your dashboard.</p>
            <div className={styles.actions}>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  onClose();
                  navigate('/dashboard');
                }}
              >
                Go to dashboard
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <>
            <p>
              Would you like to save this job to your dashboard so you can keep track of your
              application on {sourceName}?
            </p>
            <div className={styles.actions}>
              <Button type="button" variant="primary" onClick={onConfirm}>
                Yes, track it
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                No thanks
              </Button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
