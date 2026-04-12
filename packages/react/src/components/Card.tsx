import React from 'react';
import { cx } from '../utils';

export type CardVariant = 'raised' | 'interactive';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: CardVariant;
  className?: string;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> { className?: string }
export interface CardTitleProps  extends React.HTMLAttributes<HTMLHeadingElement> { as?: 'h1'|'h2'|'h3'|'h4'|'h5'|'h6'; className?: string }
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { className?: string }
export interface CardBodyProps   extends React.HTMLAttributes<HTMLDivElement> { className?: string }
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> { className?: string }

/**
 * Surface card. Compose with Card.Header, Card.Title, Card.Body, Card.Footer.
 *
 * ```tsx
 * <Card variant="raised">
 *   <Card.Header>
 *     <Card.Title>Hello</Card.Title>
 *     <Card.Description>Subtitle</Card.Description>
 *   </Card.Header>
 *   <Card.Body>Content here.</Card.Body>
 *   <Card.Footer>
 *     <Button size="sm">Action</Button>
 *   </Card.Footer>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> & {
  Header:      React.FC<CardHeaderProps>;
  Title:       React.FC<CardTitleProps>;
  Description: React.FC<CardDescriptionProps>;
  Body:        React.FC<CardBodyProps>;
  Footer:      React.FC<CardFooterProps>;
} = ({ variant, className, children, ...props }) => (
  <div className={cx('vt-card', variant && `vt-card--${variant}`, className)} {...props}>
    {children}
  </div>
);

Card.Header = ({ className, children, ...props }) => (
  <div className={cx('vt-card__header', className)} {...props}>{children}</div>
);
Card.Title = ({ as: As = 'h3', className, children, ...props }) => (
  <As className={cx('vt-card__title', className)} {...props}>{children}</As>
);
Card.Description = ({ className, children, ...props }) => (
  <p className={cx('vt-card__description', className)} {...props}>{children}</p>
);
Card.Body = ({ className, children, ...props }) => (
  <div className={cx('vt-card__body', className)} {...props}>{children}</div>
);
Card.Footer = ({ className, children, ...props }) => (
  <div className={cx('vt-card__footer', className)} {...props}>{children}</div>
);

Card.displayName        = 'Card';
Card.Header.displayName = 'Card.Header';
Card.Title.displayName  = 'Card.Title';
Card.Description.displayName = 'Card.Description';
Card.Body.displayName   = 'Card.Body';
Card.Footer.displayName = 'Card.Footer';
