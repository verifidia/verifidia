"use client";

import { useRef, type ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const OTP_LENGTH = 6;
const OTP_SLOTS = ["slot-1", "slot-2", "slot-3", "slot-4", "slot-5", "slot-6"] as const;

export function OtpInput({ value, onChange }: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const safeValue = value.slice(0, OTP_LENGTH).padEnd(OTP_LENGTH, " ");

  const setChar = (index: number, nextChar: string) => {
    const chars = safeValue.split("");
    chars[index] = nextChar;
    onChange(chars.join("").replace(/\s/g, ""));
  };

  const handleInputChange = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) {
      setChar(index, " ");
      return;
    }

    setChar(index, digits[0]);

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, key: string) => {
    if (key !== "Backspace") {
      return;
    }

    setChar(index, " ");

    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted.length !== OTP_LENGTH) {
      return;
    }

    event.preventDefault();
    onChange(pasted);
    inputRefs.current[OTP_LENGTH - 1]?.focus();
  };

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {OTP_SLOTS.map((slot, index) => (
        <input
          aria-label={`OTP digit ${index + 1}`}
          className={cn(
            "size-11 rounded-md border border-input bg-background text-center text-lg font-semibold",
            "transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          )}
          inputMode="numeric"
          key={slot}
          maxLength={1}
          onChange={(event) => handleInputChange(index, event.target.value)}
          onFocus={(event) => event.target.select()}
          onKeyDown={(event) => handleKeyDown(index, event.key)}
          pattern="[0-9]*"
          ref={(node) => {
            inputRefs.current[index] = node;
          }}
          type="text"
          value={safeValue[index] === " " ? "" : safeValue[index]}
        />
      ))}
    </div>
  );
}
