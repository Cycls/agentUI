import { useRef, useCallback } from "react";

export const OTPInput = ({ value = "", onChange, disabled = false, autoFocus = true, length = 6 }) => {
  const inputsRef = useRef([]);

  const focusInput = (index) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleChange = useCallback(
    (index, e) => {
      const char = e.target.value.replace(/\D/g, "").slice(-1);
      const chars = value.split("");
      while (chars.length < length) chars.push("");
      chars[index] = char;
      const next = chars.join("").slice(0, length);
      onChange(next);

      if (char && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [value, onChange, length]
  );

  const handleKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Backspace") {
        if (!value[index] && index > 0) {
          e.preventDefault();
          const chars = value.split("");
          while (chars.length < length) chars.push("");
          chars[index - 1] = "";
          onChange(chars.join("").slice(0, length));
          focusInput(index - 1);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [value, onChange, length]
  );

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted) {
        onChange(pasted.padEnd(length, "").slice(0, length));
        focusInput(Math.min(pasted.length, length - 1));
      }
    },
    [onChange, length]
  );

  return (
    <div className="flex gap-3 justify-center py-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          className="w-[52px] h-[60px] text-center text-2xl font-semibold rounded-xl border-2 outline-none transition-all duration-200 theme-transition otp-input"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
};
