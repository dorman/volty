import { useState, useCallback } from 'react';
import type { Brand } from '../types';

/**
 * Hook for reading and setting the Volty brand color.
 *
 * ```tsx
 * function BrandPicker() {
 *   const { brand, setBrand } = useVoltyBrand();
 *   return (
 *     <select value={brand ?? ''} onChange={e => setBrand(e.target.value as Brand || null)}>
 *       <option value="">Default</option>
 *       <option value="violet">Violet</option>
 *       <option value="emerald">Emerald</option>
 *     </select>
 *   );
 * }
 * ```
 */
export function useVoltyBrand() {
  const [brand, setBrandState] = useState<Brand | null>(() => window.Volty?.getBrand() as Brand | null ?? null);

  const setBrand = useCallback((next: Brand | null) => {
    window.Volty?.setBrand(next);
    setBrandState(next);
  }, []);

  return { brand, setBrand } as const;
}
