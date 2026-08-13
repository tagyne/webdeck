import * as React from "react";

import { cn } from "../../lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variantClassName: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[--color-ink] text-white hover:bg-slate-900 disabled:bg-slate-400",
  secondary:
    "bg-white text-[--color-ink] border border-[--color-line] hover:bg-slate-50 disabled:bg-white/70",
  ghost:
    "bg-white/10 text-white hover:bg-white/20 disabled:bg-white/10",
  danger:
    "bg-[#b91c1c] text-white hover:bg-[#991b1b] disabled:bg-[#fca5a5]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = "button", variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-signal] focus-visible:ring-offset-2 disabled:cursor-not-allowed",
          variantClassName[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
