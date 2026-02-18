import { useState, useRef, useEffect, useCallback } from "react";

// ── Safe math expression evaluator ──────────────────────────────────────────
// Recursive-descent parser supporting + - * / ^ (no eval!)
//
// Grammar:
//   expr           → additive
//   additive       → multiplicative (('+' | '-') multiplicative)*
//   multiplicative → unary (('*' | '/') unary)*
//   unary          → ('-' unary) | exponent
//   exponent       → atom ('^' unary)?        // right-associative
//   atom           → NUMBER | '(' expr ')'

interface Parser {
  input: string;
  pos: number;
}

function skipWhitespace(p: Parser) {
  while (p.pos < p.input.length && p.input[p.pos] === " ") p.pos++;
}

function parseNumber(p: Parser): number | null {
  skipWhitespace(p);
  const start = p.pos;

  // optional leading dot (e.g. ".5")
  if (p.pos < p.input.length && p.input[p.pos] === ".") {
    p.pos++;
  }

  // digits
  while (
    p.pos < p.input.length &&
    p.input[p.pos] >= "0" &&
    p.input[p.pos] <= "9"
  ) {
    p.pos++;
  }

  // decimal point (if we didn't already consume a leading dot)
  if (
    p.pos < p.input.length &&
    p.input[p.pos] === "." &&
    !p.input.substring(start, p.pos).includes(".")
  ) {
    p.pos++;
    while (
      p.pos < p.input.length &&
      p.input[p.pos] >= "0" &&
      p.input[p.pos] <= "9"
    ) {
      p.pos++;
    }
  }

  if (p.pos === start) return null;
  const num = parseFloat(p.input.substring(start, p.pos));
  return isNaN(num) ? null : num;
}

function parseAtom(p: Parser): number | null {
  skipWhitespace(p);

  // Parenthesized sub-expression
  if (p.pos < p.input.length && p.input[p.pos] === "(") {
    p.pos++; // consume '('
    const val = parseAdditive(p);
    skipWhitespace(p);
    if (p.pos < p.input.length && p.input[p.pos] === ")") {
      p.pos++; // consume ')'
    } else {
      return null; // mismatched paren
    }
    return val;
  }

  return parseNumber(p);
}

function parseUnary(p: Parser): number | null {
  skipWhitespace(p);
  if (p.pos < p.input.length && p.input[p.pos] === "-") {
    p.pos++;
    const val = parseUnary(p);
    return val === null ? null : -val;
  }
  return parseExponent(p);
}

function parseExponent(p: Parser): number | null {
  const base = parseAtom(p);
  if (base === null) return null;

  skipWhitespace(p);
  if (p.pos < p.input.length && p.input[p.pos] === "^") {
    p.pos++;
    const exp = parseUnary(p); // right-associative via unary
    if (exp === null) return null;
    return Math.pow(base, exp);
  }

  return base;
}

function parseMultiplicative(p: Parser): number | null {
  let left = parseUnary(p);
  if (left === null) return null;

  while (true) {
    skipWhitespace(p);
    if (p.pos >= p.input.length) break;
    const op = p.input[p.pos];
    if (op !== "*" && op !== "/") break;
    p.pos++;
    const right = parseUnary(p);
    if (right === null) return null;
    left = op === "*" ? left * right : left / right;
  }

  return left;
}

function parseAdditive(p: Parser): number | null {
  let left = parseMultiplicative(p);
  if (left === null) return null;

  while (true) {
    skipWhitespace(p);
    if (p.pos >= p.input.length) break;
    const op = p.input[p.pos];
    if (op !== "+" && op !== "-") break;
    p.pos++;
    const right = parseMultiplicative(p);
    if (right === null) return null;
    left = op === "+" ? left + right : left - right;
  }

  return left;
}

/**
 * Safely evaluate a math expression string.
 * Supports: + - * / ^ ( )
 * Returns the numeric result, or `null` if the expression is invalid.
 */
function evaluateExpression(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  const p: Parser = { input: trimmed, pos: 0 };
  const result = parseAdditive(p);

  skipWhitespace(p);
  // If we didn't consume the entire input, it's malformed
  if (p.pos !== p.input.length) return null;

  if (result === null || !isFinite(result)) return null;
  return result;
}

// ── Component ───────────────────────────────────────────────────────────────

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
 * A custom number input with decrement/increment buttons, free-text editing,
 * and inline math expression support (+ - * / ^).
 *
 * Layout: [ − ] [ input ] [ + ]
 *
 * - Users can type anything into the input freely, including math expressions.
 * - On blur or Enter the expression is evaluated:
 *   - If valid, the computed result is committed and displayed.
 *   - If invalid, it reverts to the last committed value.
 * - On re-focus the original expression is restored so the user can edit it.
 * - Up/Down arrow keys increment/decrement by `step` when the input is focused.
 * - The −/+ buttons also increment/decrement by `step`.
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

  // Stores the raw expression the user typed (before evaluation).
  // Cleared when the value is changed via nudge or external prop.
  const expressionRef = useRef<string | null>(null);
  // Stores the numeric result that the expression produced, so we can
  // distinguish "value changed because we committed" from "value changed externally".
  const expressionResultRef = useRef<number | null>(null);

  // Sync display value from prop when NOT focused (external changes)
  useEffect(() => {
    if (!isFocusedRef.current) {
      setDisplayValue(String(value));
      // Only clear the expression if the value changed externally
      // (i.e. it no longer matches what our expression produced)
      if (expressionResultRef.current !== value) {
        expressionRef.current = null;
        expressionResultRef.current = null;
      }
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
      const decimals = stepStr.includes(".") ? stepStr.split(".")[1].length : 0;
      return parseFloat(v.toFixed(decimals));
    },
    [step]
  );

  const commit = useCallback(() => {
    const raw = displayValue.trim();

    // Try expression evaluation first, then plain parseFloat as fallback
    const evaluated = evaluateExpression(raw);

    if (evaluated !== null && isFinite(evaluated)) {
      const clamped = clamp(evaluated);
      // Remember the expression only if it's not just a plain number
      const isPlainNumber =
        String(clamped) === raw || String(evaluated) === raw;
      expressionRef.current = isPlainNumber ? null : raw;
      expressionResultRef.current = isPlainNumber ? null : clamped;
      onChange(clamped);
      setDisplayValue(String(clamped));
    } else {
      // Revert to last valid value and clear expression
      expressionRef.current = null;
      expressionResultRef.current = null;
      setDisplayValue(String(value));
    }
  }, [displayValue, value, onChange, clamp]);

  const nudge = useCallback(
    (direction: 1 | -1) => {
      const next = roundToStep(clamp(value + step * direction));
      expressionRef.current = null;
      expressionResultRef.current = null;
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

  const handleFocus = () => {
    isFocusedRef.current = true;
    // Restore the expression the user previously typed (if any)
    if (expressionRef.current !== null) {
      setDisplayValue(expressionRef.current);
    }
    // Select all on next tick so the restored value is in the DOM
    requestAnimationFrame(() => {
      inputRef.current?.select();
    });
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    commit();
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
        onFocus={handleFocus}
        onBlur={handleBlur}
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
