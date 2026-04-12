import React from 'react';
import { cx } from '../utils';
import type { BadgeVariant } from '../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Inline status badge.
 *
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Degraded</Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({ variant, className, children, ...props }) => (
  <span className={cx('vt-badge', variant && `vt-badge--${variant}`, className)} {...props}>
    {children}
  </span>
);
Badge.displayName = 'Badge';
