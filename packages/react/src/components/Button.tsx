import React from 'react';
import { cx } from '../utils';
import type { ButtonVariant, ButtonSize } from '../types';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size variant */
  size?: ButtonSize;
  /** Renders as an anchor tag when provided */
  href?: string;
  /** Icon-only button (square, equal padding) */
  icon?: boolean;
  /** Extra CSS classes */
  className?: string;
}

/**
 * Volty button component.
 *
 * ```tsx
 * <Button>Primary</Button>
 * <Button variant="outline" size="sm">Outline</Button>
 * <Button variant="danger" href="/delete">Delete</Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, href, icon, className, children, ...props }, ref) => {
    const classes = cx(
      'vt-btn',
      variant && `vt-btn--${variant}`,
      size    && `vt-btn--${size}`,
      icon    && 'vt-btn--icon',
      className,
    );

    if (href) {
      return (
        <a href={href} className={classes}>
          {children}
        </a>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
