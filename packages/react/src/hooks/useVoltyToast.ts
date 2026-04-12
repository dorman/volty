import { useCallback } from 'react';
import type { ToastOptions } from '../types';

/**
 * Hook that returns a `toast` function for firing Volty toast notifications.
 *
 * ```tsx
 * function SaveButton() {
 *   const { toast } = useVoltyToast();
 *   return (
 *     <button onClick={() => toast({ message: 'Saved!', variant: 'success' })}>
 *       Save
 *     </button>
 *   );
 * }
 * ```
 */
export function useVoltyToast() {
  const toast = useCallback((opts: string | ToastOptions) => {
    if (!window.Volty?.toast) {
      console.warn('@volty/react: window.Volty.toast not found. Make sure volty.js is loaded.');
      return;
    }
    return window.Volty.toast(opts);
  }, []);

  return { toast } as const;
}
