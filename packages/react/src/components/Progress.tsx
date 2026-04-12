import React from 'react';
import { cx } from '../utils';
import type { ProgressVariant } from '../types';

export interface ProgressProps extends React.ProgressHTMLAttributes<HTMLProgressElement> {
  variant?: ProgressVariant;
  size?: 'sm' | 'lg';
  indeterminate?: boolean;
  label?: string;
  showValue?: boolean;
  className?: string;
}

/**
 * Styled native progress bar.
 *
 * ```tsx
 * <Progress value={60} max={100} label="Uploading…" showValue />
 * <Progress variant="success" value={100} />
 * <Progress indeterminate />
 * ```
 */
export const Progress: React.FC<ProgressProps> = ({
  variant,
  size,
  indeterminate,
  label,
  showValue,
  className,
  value,
  max = 100,
  ...props
}) => {
  const pct = value !== undefined && max ? Math.round((Number(value) / Number(max)) * 100) : null;

  return (
    <>
      {(label || showValue) && (
        <div className="vt-progress-wrap">
          {label    && <span className="vt-progress-wrap__label">{label}</span>}
          {showValue && pct !== null && <span className="vt-progress-wrap__value">{pct}%</span>}
        </div>
      )}
      <progress
        className={cx(
          'vt-progress',
          variant     && `vt-progress--${variant}`,
          size        && `vt-progress--${size}`,
          indeterminate && 'vt-progress--indeterminate',
          className,
        )}
        value={indeterminate ? undefined : value}
        max={max}
        aria-label={label || 'Progress'}
        {...props}
      />
    </>
  );
};
Progress.displayName = 'Progress';
