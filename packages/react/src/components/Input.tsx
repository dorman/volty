import React from 'react';
import { cx } from '../utils';

export type InputSize = 'sm' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  error?: boolean;
  className?: string;
}

/**
 * Text input. Wrap in a Field for label + hint layout.
 *
 * ```tsx
 * <Field>
 *   <Field.Label htmlFor="email">Email</Field.Label>
 *   <Input id="email" type="email" placeholder="you@example.com" />
 *   <Field.Hint>We'll never share your email.</Field.Hint>
 * </Field>
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ size, error, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cx('vt-input', size && `vt-input--${size}`, error && 'vt-input--error', className)}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

// ─── Field layout components ─────────────────────────────────────────────────

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> { className?: string }
export interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { className?: string }
export interface FieldHintProps  extends React.HTMLAttributes<HTMLSpanElement> { className?: string }
export interface FieldErrorProps extends React.HTMLAttributes<HTMLSpanElement> { className?: string }

/**
 * Form field layout wrapper.
 *
 * ```tsx
 * <Field>
 *   <Field.Label htmlFor="name">Name</Field.Label>
 *   <Input id="name" />
 *   <Field.Error>Name is required.</Field.Error>
 * </Field>
 * ```
 */
export const Field: React.FC<FieldProps> & {
  Label: React.FC<FieldLabelProps>;
  Hint:  React.FC<FieldHintProps>;
  Error: React.FC<FieldErrorProps>;
} = ({ className, children, ...props }) => (
  <div className={cx('vt-field', className)} {...props}>{children}</div>
);

Field.Label = ({ className, children, ...props }) => (
  <label className={cx('vt-label', className)} {...props}>{children}</label>
);
Field.Hint = ({ className, children, ...props }) => (
  <span className={cx('vt-field-hint', className)} {...props}>{children}</span>
);
Field.Error = ({ className, children, ...props }) => (
  <span className={cx('vt-field-error', className)} {...props}>{children}</span>
);

Field.displayName        = 'Field';
Field.Label.displayName  = 'Field.Label';
Field.Hint.displayName   = 'Field.Hint';
Field.Error.displayName  = 'Field.Error';
