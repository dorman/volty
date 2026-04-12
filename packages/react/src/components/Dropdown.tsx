import React from 'react';
import { cx } from '../utils';
import type { DropdownItem } from '../types';

export interface DropdownProps {
  /** The trigger element (usually a Button) */
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'end';
  className?: string;
}

/**
 * Dropdown menu with keyboard navigation and outside-click dismissal.
 *
 * ```tsx
 * <Dropdown
 *   trigger={<Button variant="surface">Options ▾</Button>}
 *   items={[
 *     { type: 'item', label: 'Edit',   onClick: () => {} },
 *     { type: 'item', label: 'Clone',  onClick: () => {} },
 *     { type: 'separator' },
 *     { type: 'item', label: 'Delete', danger: true, onClick: () => {} },
 *   ]}
 * />
 * ```
 */
export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'start', className }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); }
  };

  return (
    <div
      ref={ref}
      className={cx('vt-dropdown', align === 'end' && 'vt-dropdown--end', className)}
      onKeyDown={handleKeyDown}
    >
      <div onClick={() => setOpen(o => !o)} style={{ display: 'contents' }}>
        {trigger}
      </div>
      {!open ? null : (
        <div className="vt-dropdown__menu">
          {items.map((item, i) => {
            if (item.type === 'separator') return <div key={i} className="vt-dropdown__separator" />;
            if (item.type === 'label') return <span key={i} className="vt-dropdown__label">{item.label}</span>;
            return (
              <button
                key={i}
                className={cx('vt-dropdown__item', item.danger && 'vt-dropdown__item--danger')}
                disabled={item.disabled}
                onClick={() => { item.onClick?.(); setOpen(false); }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
Dropdown.displayName = 'Dropdown';
