import { useCallback, useState } from "react";

interface UseAsyncState<T> {
  loading: boolean;
  error: string | null;
  result: T | null;
  progress: number;
  run: (fn: (onProgress: (p: number) => void) => Promise<T>) => Promise<void>;
  reset: () => void;
}

export function useAsync<T>(): UseAsyncState<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const [progress, setProgress] = useState(0);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
    setProgress(0);
  }, []);

  const run = useCallback(
    async (fn: (onProgress: (p: number) => void) => Promise<T>) => {
      setLoading(true);
      setError(null);
      setResult(null);
      setProgress(0);
      try {
        const value = await fn(setProgress);
        setResult(value);
        setProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, result, progress, run, reset };
}
