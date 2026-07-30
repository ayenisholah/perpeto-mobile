import { useCallback, useEffect, useRef, useState } from "react";

export interface Resource<T> {
  readonly data: T | undefined;
  readonly loading: boolean;
  /** The thrown value, not a message — `ErrorState` needs the original to classify it. */
  readonly error: unknown;
  /** True once the last successful load is older than `staleAfterMs`. */
  readonly stale: boolean;
  readonly loadedAt: number | undefined;
  readonly reload: () => Promise<void>;
}

interface Options {
  /** Omit to opt out of staleness entirely. */
  readonly staleAfterMs?: number;
}

const STALENESS_TICK_MS = 15_000;

/**
 * One loader for every read surface. It exists so each screen gets the same
 * set of states — loading, empty, error, stale — that `docs/ENGINEERING.md`
 * requires of any new surface, and so failures surface instead of being
 * swallowed the way `SecurityCenter` used to swallow them.
 *
 * `load` must be referentially stable; wrap it in `useCallback` at the call
 * site or the effect will refetch on every render.
 */
export function useResource<T>(load: () => Promise<T>, options: Options = {}): Resource<T> {
  const { staleAfterMs } = options;
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(undefined);
  const [loadedAt, setLoadedAt] = useState<number>();
  const [now, setNow] = useState(() => Date.now());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await load();
      if (!mounted.current) return;
      setData(next);
      setError(undefined);
      setLoadedAt(Date.now());
    } catch (cause) {
      if (!mounted.current) return;
      // The previous `data` is deliberately kept so the surface can keep
      // showing it, marked stale, rather than blanking on a transient failure.
      setError(cause);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    // Deferred by a microtask so the initial `setLoading(true)` does not run
    // synchronously inside the effect body and cascade a second render.
    queueMicrotask(() => void reload());
  }, [reload]);

  useEffect(() => {
    if (staleAfterMs === undefined) return undefined;
    const timer = setInterval(() => setNow(Date.now()), STALENESS_TICK_MS);
    return () => clearInterval(timer);
  }, [staleAfterMs]);

  const stale =
    staleAfterMs !== undefined && loadedAt !== undefined && now - loadedAt > staleAfterMs;

  return { data, loading, error, stale, loadedAt, reload };
}
