/**
 * Realistic component fixture for integration tests.
 * Tailwind classes: some redundant (p-4 + pt-4), merge suggestion (pt-4 + pb-4 → py-4).
 */
import * as React from "react";

type ButtonProps = {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
};

export function Button({ variant = "primary", children }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 pt-4 pb-4 px-4 py-2",
    secondary:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 p-4 pt-4"
  };
  const className = `${base} ${variants[variant]}`;
  return <button type="button" className={className}>{children}</button>;
}
