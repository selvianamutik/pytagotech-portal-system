/**
 * Hasil standar seluruh service (satu bentuk untuk mock maupun API nyata).
 */
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}
