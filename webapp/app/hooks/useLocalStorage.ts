import { useState, useEffect, useCallback } from "react";

/**
 * A generic, SSR-safe localStorage hook for Remix.
 *
 * During server-side rendering and initial hydration, `defaultValue` is used
 * so there is no hydration mismatch. After the component mounts on the client,
 * the persisted value (if any) is read from localStorage. Subsequent changes
 * are automatically written back.
 *
 * The write effect is intentionally gated behind the `initialized` flag so that
 * we never overwrite a stored value with the default on first render — the read
 * always wins on mount.
 *
 * @param key          localStorage key (should be unique per piece of state)
 * @param defaultValue value used on the server and when nothing is stored yet
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // `initialized` becomes true only after the client has read from localStorage.
  // Using state (not a ref) so the write effect re-evaluates after the read
  // completes, guaranteeing the stored value is in `value` before we write.
  const [initialized, setInitialized] = useState(false);
  const [value, setValue] = useState<T>(defaultValue);

  // ── Read ───────────────────────────────────────────────────────────────────
  // Runs once per key on the client. Updates `value` if something is stored,
  // then marks initialization complete.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // Ignore JSON parse errors or storage access errors (e.g. private mode).
    }
    setInitialized(true);
  }, [key]);

  // ── Write ──────────────────────────────────────────────────────────────────
  // Persists `value` whenever it changes, but only after `initialized` is true.
  // This prevents writing the default value on the first render before the read
  // has completed (both effects run in definition order after mount; by the time
  // the write effect sees `initialized === true`, React has already flushed the
  // read and the correct value is in state).
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota-exceeded or other storage errors.
    }
  }, [key, value, initialized]);

  // Stable setter that supports both direct values and updater functions,
  // matching the React setState signature.
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue(prev =>
        typeof next === "function" ? (next as (p: T) => T)(prev) : next
      );
    },
    [] // setValue from useState is guaranteed stable
  );

  return [value, set];
}
