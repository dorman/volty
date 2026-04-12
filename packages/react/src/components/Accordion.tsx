import React from 'react';
import { cx } from '../utils';

export interface AccordionItemDef {
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItemDef[];
  className?: string;
}

/**
 * Collapsible accordion built on native <details>. Zero JS.
 *
 * ```tsx
 * <Accordion items={[
 *   { title: 'What is Volty?', content: 'A modern CSS library.' },
 *   { title: 'Is it free?',   content: 'Core is MIT licensed.', defaultOpen: true },
 * ]} />
 * ```
 */
export const Accordion: React.FC<AccordionProps> = ({ items, className }) => (
  <div className={cx('vt-accordion', className)}>
    {items.map((item, i) => (
      <details key={i} className="vt-accordion__item" open={item.defaultOpen}>
        <summary className="vt-accordion__trigger">{item.title}</summary>
        <div className="vt-accordion__body">{item.content}</div>
      </details>
    ))}
  </div>
);
Accordion.displayName = 'Accordion';
