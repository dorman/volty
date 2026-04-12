import React from 'react';
import { cx } from '../utils';

export type SkeletonVariant = 'text' | 'circle' | 'card' | 'avatar' | 'button';

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Shimmer loading placeholder.
 *
 * ```tsx
 * <Skeleton variant="text" width="60%" />
 * <Skeleton variant="circle" width={40} />
 * <Skeleton variant="card" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({ variant = 'text', width, height, className, style, ...props }) => (
  <span
    className={cx('vt-skeleton', `vt-skeleton--${variant}`, className)}
    style={{
      width:  width  !== undefined ? (typeof width  === 'number' ? `${width}px`  : width)  : undefined,
      height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      ...style,
    }}
    {...props}
  />
);
Skeleton.displayName = 'Skeleton';
