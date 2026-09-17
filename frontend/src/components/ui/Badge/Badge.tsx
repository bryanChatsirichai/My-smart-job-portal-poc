import type { HTMLAttributes, ReactNode } from 'react';

import styles from './Badge.module.scss';

export type BadgeVariant = 'source' | 'status';
export type SourceKey = 'mycareersfuture' | 'linkedin' | 'adzuna' | 'jobicy' | 'default';
export type StatusKey =
  | 'applied'
  | 'interview'
  | 'rejected'
  | 'accepted'
  | 'saved'
  | 'withdrawn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  source?: SourceKey | string;
  status?: StatusKey;
}

function normalizeSource(source?: string): SourceKey {
  const key = source?.toLowerCase() ?? 'default';
  if (key === 'mycareersfuture' || key === 'linkedin' || key === 'adzuna' || key === 'jobicy') {
    return key;
  }
  return 'default';
}

export function Badge({
  children,
  className,
  variant = 'source',
  source,
  status,
  ...props
}: BadgeProps) {
  const toneClass =
    variant === 'status' && status
      ? styles[`status-${status}`]
      : styles[`source-${normalizeSource(source)}`];

  const classes = [styles.badge, styles[variant], toneClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
