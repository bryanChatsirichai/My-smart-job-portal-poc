import { forwardRef, type SelectHTMLAttributes } from 'react';

import styles from './Select.module.scss';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, ...props },
  ref,
) {
  const classes = [styles.select, className].filter(Boolean).join(' ');

  return <select ref={ref} className={classes} {...props} />;
});
