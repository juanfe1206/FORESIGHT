"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

export type GlowButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  type?: "submit" | "button";
  loading?: boolean;
};

const baseClassName =
  "inline-flex min-h-10 min-w-[16rem] items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-heading text-body font-semibold text-bg transition-shadow duration-1000 ease-out " +
  "shadow-none hover:shadow-[0_0_24px_rgba(0,212,170,0.45)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
  "disabled:cursor-not-allowed disabled:hover:shadow-none";

/**
 * Primary CTA with accent fill, hover glow (not color-only), and width-stable loading state (FR3, UX-DR4).
 */
export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(function GlowButton(
  { children, className, disabled, loading = false, type = "button", ...rest },
  ref,
) {
  const isBusy = Boolean(loading);
  const mergedClassName = [baseClassName, className].filter(Boolean).join(" ");

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={isBusy}
      className={mergedClassName}
      {...rest}
    >
      {loading ? (
        <>
          <span
            className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-bg/30 border-t-bg"
            aria-hidden
          />
          <span>Working…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});
