import React from 'react';
import { cx } from '../utils';
import type { SpinnerSize, SemanticVariant } from '../types';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  variant?: SemanticVariant;
  label?: string;
  className?: string;
}

/**
 * CSS spinner for loading states.
 *
 * ```tsx
 * <Spinner />
 * <Spinner size="sm" variant="success" />
 * <Spinner size="lg" label="Saving…" />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({ size, variant, label = 'Loading', className, ...props }) => (
  <span
    className={cx('vt-spinner', size && `vt-spinner--${size}`, variant && `vt-spinner--${variant}`, className)}
    role="status"
    aria-label={label}
    {...props}
  />
);
Spinner.displayName = 'Spinner';
