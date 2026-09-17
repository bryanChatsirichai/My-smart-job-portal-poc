import { forwardRef, type InputHTMLAttributes } from 'react';

import styles from './Input.module.scss';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, inputSize = 'md', type = 'text', ...props },
  ref,
) {
  const classes = [styles.input, styles[inputSize], className].filter(Boolean).join(' ');

  return <input ref={ref} type={type} className={classes} {...props} />;
});
