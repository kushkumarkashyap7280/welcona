"use client";

import { useRef, useCallback, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const focusInput = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1));
      inputsRef.current[clamped]?.focus();
    },
    [length]
  );

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (!/^\d$/.test(char)) return;
      const arr = digits.slice();
      arr[index] = char;
      onChange(arr.join(""));
      if (index < length - 1) focusInput(index + 1);
    },
    [digits, length, onChange, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const arr = digits.slice();
        if (arr[index]) {
          arr[index] = "";
          onChange(arr.join(""));
        } else if (index > 0) {
          arr[index - 1] = "";
          onChange(arr.join(""));
          focusInput(index - 1);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [digits, length, onChange, focusInput]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);
      if (pasted.length > 0) {
        onChange(pasted.padEnd(length, "").slice(0, length));
        focusInput(Math.min(pasted.length, length - 1));
      }
    },
    [length, onChange, focusInput]
  );

  return (
    <div className="flex items-center justify-between gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoComplete="one-time-code"
          className="h-14 w-full max-w-[3.5rem] rounded-xl border border-border bg-background text-center text-xl font-mono font-semibold outline-none transition-all placeholder:text-muted-foreground/30 focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          onChange={(e) => handleChange(i, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
