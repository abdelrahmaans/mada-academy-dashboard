import { useRef } from "react";

/**
 * usePersistFn instead of useCallback to reduce cognitive load
 */
export function usePersistFn<T extends (...args: never[]) => unknown>(fn: T): T {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T | null>(null);
  if (!persistFn.current) {
    persistFn.current = function (this: unknown, ...args: unknown[]) {
      return (fnRef.current as unknown as (...a: unknown[]) => unknown).apply(this, args);
    } as unknown as T;
  }

  return persistFn.current;
}
