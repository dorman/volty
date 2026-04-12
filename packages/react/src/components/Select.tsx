import React from 'react';
import { cx } from '../utils';

export type SelectSize = 'sm' | 'lg';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  size?: SelectSize;
  error?: boolean;
  wrapperClassName?: string;
}

/**
 * Native select wrapper.
 *
 * ```tsx
 * <Field>
 *   <Field.Label htmlFor="role">Role</Field.Label>
 *   <Select id="role">
 *     <option>Select a role…</option>
 *     <option value="admin">Admin</option>
 *   </Select>
 * </Field>
 * ```
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ size, error, wrapperClassName, className, children, ...props }, ref) => (
    <div className={cx('vt-select', size && `vt-select--${size}`, error && 'vt-select--error', wrapperClassName)}>
      <select ref={ref} className={className} {...props}>
        {children}
      </select>
    </div>
  ),
);
Select.displayName = 'Select';
