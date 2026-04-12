import React from 'react';
import { cx } from '../utils';
import type { AlertVariant } from '../types';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  solid?: boolean;
  title?: string;
  /** Controlled open state */
  open?: boolean;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Inline alert banner.
 *
 * ```tsx
 * <Alert variant="success" title="Deployed">Version 2.0 is live.</Alert>
 * <Alert variant="danger" title="Error" onDismiss={() => setShow(false)}>Payment failed.</Alert>
 * ```
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  solid,
  title,
  open,
  onDismiss,
  className,
  children,
  ...props
}) => {
  if (open === false) return null;

  return (
    <div
      className={cx('vt-alert', variant && `vt-alert--${variant}`, solid && 'vt-alert--solid', className)}
      role="alert"
      {...props}
    >
      <div className="vt-alert__body">
        {title && <p className="vt-alert__title">{title}</p>}
        {children && <p className="vt-alert__desc">{children}</p>}
      </div>
      {onDismiss && (
        <button className="vt-alert__dismiss" aria-label="Dismiss" onClick={onDismiss}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
};
Alert.displayName = 'Alert';
