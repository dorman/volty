import React from 'react';
import { cx } from '../utils';

export interface TabsProps {
  /** Tab definitions */
  items: Array<{ label: string; panel: React.ReactNode; disabled?: boolean }>;
  /** Controlled active index */
  activeIndex?: number;
  defaultIndex?: number;
  onChange?: (index: number) => void;
  variant?: 'pills';
  className?: string;
}

/**
 * Accessible tabbed interface with keyboard navigation.
 *
 * ```tsx
 * <Tabs items={[
 *   { label: 'Overview', panel: <p>Overview content</p> },
 *   { label: 'Settings', panel: <p>Settings content</p> },
 * ]} />
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
  items,
  activeIndex: controlledIndex,
  defaultIndex = 0,
  onChange,
  variant,
  className,
}) => {
  const [internalIndex, setInternalIndex] = React.useState(defaultIndex);
  const active = controlledIndex !== undefined ? controlledIndex : internalIndex;
  const uid = React.useId();

  function select(i: number) {
    if (controlledIndex === undefined) setInternalIndex(i);
    onChange?.(i);
  }

  function handleKeyDown(e: React.KeyboardEvent, i: number) {
    const enabledItems = items.map((item, idx) => ({ ...item, idx })).filter(item => !item.disabled);
    const currentPos = enabledItems.findIndex(item => item.idx === i);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = enabledItems[(currentPos + 1) % enabledItems.length];
      if (next) { select(next.idx); }
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = enabledItems[(currentPos - 1 + enabledItems.length) % enabledItems.length];
      if (prev) { select(prev.idx); }
    }
    if (e.key === 'Home') { e.preventDefault(); select(enabledItems[0]?.idx ?? 0); }
    if (e.key === 'End')  { e.preventDefault(); select(enabledItems[enabledItems.length - 1]?.idx ?? 0); }
  }

  return (
    <div className={cx('vt-tabs', variant && `vt-tabs--${variant}`, className)}>
      <div className="vt-tabs__list" role="tablist">
        {items.map((item, i) => (
          <button
            key={i}
            className="vt-tabs__trigger"
            role="tab"
            aria-selected={active === i}
            aria-controls={`${uid}-panel-${i}`}
            id={`${uid}-tab-${i}`}
            tabIndex={active === i ? 0 : -1}
            disabled={item.disabled}
            onClick={() => !item.disabled && select(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          className="vt-tabs__panel"
          id={`${uid}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${i}`}
          hidden={active !== i}
        >
          {item.panel}
        </div>
      ))}
    </div>
  );
};
Tabs.displayName = 'Tabs';
