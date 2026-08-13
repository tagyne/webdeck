import * as React from "react";

import { cn } from "../../lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-2xl border border-[--color-line] bg-white px-4 py-3 text-sm text-[--color-ink] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[--color-signal] focus:ring-2 focus:ring-[rgba(194,65,12,0.15)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
