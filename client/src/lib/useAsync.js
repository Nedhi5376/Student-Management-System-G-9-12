import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async function and exposes { data, loading, error, run }.
 *
 * - Re-runs automatically when any value in `deps` changes.
 * - Keeps the previous `data` on a failed refetch, so the UI is not wiped out
 *   by a transient network error; `error` is set for the caller to surface.
 */
export function useAsync(loader, deps = []) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const [state, setState] = useState({ data: null, loading: true, error: null });

  const run = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await loaderRef.current();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error }));
      throw error;
    }
  }, []);

  useEffect(() => {
    run();
    // `deps` drives re-fetching; the loader identity is irrelevant via ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, run };
}