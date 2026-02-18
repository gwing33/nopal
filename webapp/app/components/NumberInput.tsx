import { useState, useRef, useEffect, useCallback } from "react";

interface NumberInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * A custom number input with decrement/increment buttons and free-text editing.
 *
 * Layout: [ - ] [ input ] [ + ]
 *
 * - Users can type anything into the input freely.
 * - On blur or Enter, the value is validated:
 *   - If valid (a finite number respecting min/max), it is committed.
 *   - If invalid, it reverts to the last committed value.
 * - Up/Down arrow keys increment/decrement by `step` when the input is focused.
 * - The -/+ buttons also increment/decrement by `step`.
 */
export function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  className = "",
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(String(value));
  const isFocusedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display value from prop when NOT focused (external changes)
  useEffect(() => {
    if (!isFocusedRef.current) {
      setDisplayValue(String(value));
    }
  }, [value]);

  const clamp = useCallback(
    (v: number): number => {
      let clamped = v;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      return clamped;
    },
    [min, max]
  );

  /** Round to the same number of decimal places as `step` to avoid float drift. */
  const roundToStep = useCallback(
    (v: number): number => {
      const stepStr = String(step);
      const decimals = stepStr.includes(".")
        ? stepStr.split(".")[1].length
        : 0;
      return parseFloat(v.toFixed(decimals));
    },
    [step]
  );

  const commit = useCallback(() => {
    const parsed = parseFloat(displayValue);
    if (isFinite(parsed)) {
      const clamped = clamp(parsed);
      onChange(clamped);
      setDisplayValue(String(clamped));
    } else {
      // Revert to last valid value
      setDisplayValue(String(value));
    }
  }, [displayValue, value, onChange, clamp]);

  const nudge = useCallback(
    (direction: 1 | -1) => {
      const next = roundToStep(clamp(value + step * direction));
      onChange(next);
      setDisplayValue(String(next));
    },
    [value, step, onChange, clamp, roundToStep]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      nudge(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      nudge(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit();
      inputRef.current?.blur();
    }
  };

  const btnBase =
    "flex-shrink-0 w-9 h-full flex items-center justify-center font-bold text-lg select-none " +
    "border border-gray-300 dark:border-[var(--dark-midground)] " +
    "bg-gray-50 dark:bg-[var(--purple)] dark:text-white " +
    "hover:bg-gray-200 dark:hover:bg-[var(--dark-midground)] " +
    "focus:outline-none focus:ring-2 focus:ring-[var(--green)] " +
    "active:bg-gray-300 dark:active:bg-[var(--dark-midground)] transition-colors";

  return (
    <div className={`flex items-stretch h-[42px] ${className}`}>
      {/* Decrement button */}
      <button
        type="button"
        tabIndex={0}
        aria-label="Decrement"
        className={`${btnBase} rounded-l-md border-r-0`}
        onClick={() => nudge(-1)}
      >
        −
      </button>

      {/* Text input */}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={(e) => setDisplayValue(e.target.value)}
        onFocus={() => {
          isFocusedRef.current = true;
          inputRef.current?.select();
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          commit();
        }}
        onKeyDown={handleKeyDown}
        className={
          "w-full min-w-0 px-3 py-2 text-center " +
          "border-y border-gray-300 dark:border-[var(--dark-midground)] " +
          "bg-white dark:bg-[var(--purple)] dark:text-white " +
          "focus:outline-none focus:ring-2 focus:ring-[var(--green)] focus:z-10"
        }
      />

      {/* Increment button */}
      <button
        type="button"
        tabIndex={0}
        aria-label="Increment"
        className={`${btnBase} rounded-r-md border-l-0`}
        onClick={() => nudge(1)}
      >
        +
      </button>
    </div>
  );
}
