import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './Pill.module.scss';

export interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onRemove?: () => void;
  removable?: boolean;
}

export function Pill({
  children,
  className,
  onRemove,
  removable = Boolean(onRemove),
  onClick,
  type = 'button',
  ...props
}: PillProps) {
  const classes = [styles.pill, className].filter(Boolean).join(' ');

  if (removable && onRemove) {
    return (
      <span className={classes}>
        <span className={styles.label}>{children}</span>
        <button
          type="button"
          className={styles.remove}
          onClick={onRemove}
          aria-label={`Remove ${typeof children === 'string' ? children : 'filter'}`}
        >
          ×
        </button>
      </span>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
