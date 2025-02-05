import { useState, useCallback, useEffect } from "react";

// Define the type for an async function
type AsyncFunction<T, P extends unknown[] = unknown[]> = (
  ...params: P
) => Promise<T>;

// Define the return type for the hooks
type UseAsyncReturn<T, P extends unknown[]> = {
  loading: boolean;
  error: Error | undefined;
  value: T | undefined;
  execute: (...params: P) => Promise<T>;
};

// Define the return type for useAsync (without execute)
type UseAsyncOnlyReturn<T, P extends unknown[]> = Omit<
  UseAsyncReturn<T, P>,
  "execute"
>;

// Main hook for automatic execution
export const useAsync = <T, P extends unknown[] = unknown[]>(
  func: AsyncFunction<T, P>,
  dependencies: unknown[] = [],
): UseAsyncOnlyReturn<T, P> => {
  const { loading, error, value, execute } = useAsyncInternal(
    func,
    dependencies,
    true,
  );

  // Automatically execute the function when dependencies change
  useEffect(() => {
    execute();
  }, [execute]);

  return { loading, error, value };
};

// Hook for manual execution
export const useAsyncFn = <T, P extends unknown[] = unknown[]>(
  func: AsyncFunction<T, P>,
  dependencies: unknown[] = [],
): UseAsyncReturn<T, P> => {
  return useAsyncInternal(func, dependencies, false);
};

// Internal implementation of the async hook
const useAsyncInternal = <T, P extends unknown[] = unknown[]>(
  func: AsyncFunction<T, P>,
  dependencies: unknown[] = [],
  initialLoading: boolean = false,
): UseAsyncReturn<T, P> => {
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [value, setValue] = useState<T | undefined>(undefined);

  // Memoize the execute function to prevent unnecessary re-renders
  const execute = useCallback(
    async (...params: P) => {
      setLoading(true);
      try {
        const data = await func(...params);
        setValue(data);
        setError(undefined);
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setError(err);
        setValue(undefined);
        return Promise.reject(err);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies,
  );

  return { loading, error, value, execute };
};
