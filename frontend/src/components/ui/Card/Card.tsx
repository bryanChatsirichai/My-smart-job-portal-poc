import type { HTMLAttributes, ReactNode } from 'react';

import styles from './Card.module.scss';

export type CardVariant = 'flat' | 'elevated' | 'interactive';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
}

export function Card({
  children,
  className,
  variant = 'flat',
  ...props
}: CardProps) {
  const classes = [styles.card, styles[variant], className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
