import React from 'react';
import { cx } from '../utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

/**
 * Toggle switch. CSS-only, no JS.
 *
 * ```tsx
 * <Switch label="Enable notifications" defaultChecked />
 * <Switch label="Dark mode" checked={dark} onChange={e => setDark(e.target.checked)} />
 * ```
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className, id, ...props }, ref) => {
    const switchId = id || React.useId();
    return (
      <label className={cx('vt-switch', className)} htmlFor={switchId}>
        <input ref={ref} type="checkbox" id={switchId} role="switch" {...props} />
        {label && <span>{label}</span>}
      </label>
    );
  },
);
Switch.displayName = 'Switch';
