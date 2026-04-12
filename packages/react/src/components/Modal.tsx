import React from 'react';
import { cx } from '../utils';

export type ModalSize = 'sm' | 'lg' | 'full';

export interface ModalProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  /** React ref to the <dialog> element — use dialogRef.current.showModal() to open */
  dialogRef?: React.RefObject<HTMLDialogElement>;
  size?: ModalSize;
  danger?: boolean;
  title?: string;
  /** Footer slot — typically action buttons */
  footer?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

/**
 * Modal dialog based on native <dialog>.
 *
 * ```tsx
 * const ref = useRef<HTMLDialogElement>(null);
 *
 * <Button onClick={() => ref.current?.showModal()}>Open</Button>
 *
 * <Modal dialogRef={ref} title="Confirm" danger
 *   footer={
 *     <>
 *       <Button variant="surface" onClick={() => ref.current?.close()}>Cancel</Button>
 *       <Button variant="danger">Delete</Button>
 *     </>
 *   }
 * >
 *   This action cannot be undone.
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  dialogRef,
  size,
  danger,
  title,
  footer,
  onClose,
  className,
  children,
  ...props
}) => {
  const internalRef = React.useRef<HTMLDialogElement>(null);
  const ref = dialogRef || internalRef;

  // Close on backdrop click
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClick = (e: MouseEvent) => {
      if (e.target === el) { el.close(); onClose?.(); }
    };
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [ref, onClose]);

  return (
    <dialog
      ref={ref}
      className={cx('vt-modal', size && `vt-modal--${size}`, danger && 'vt-modal--danger', className)}
      onClose={onClose}
      {...props}
    >
      {title && (
        <div className="vt-modal__header">
          <h2 className="vt-modal__title">{title}</h2>
          <button
            className="vt-modal__close"
            aria-label="Close"
            onClick={() => { ref.current?.close(); onClose?.(); }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
      <div className="vt-modal__body">{children}</div>
      {footer && <div className="vt-modal__footer">{footer}</div>}
    </dialog>
  );
};
Modal.displayName = 'Modal';
