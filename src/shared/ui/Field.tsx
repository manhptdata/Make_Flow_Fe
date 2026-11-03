import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function Input({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input className="field mt-1.5" {...props} />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select className="field mt-1.5" {...props}>
        {children}
      </select>
    </label>
  );
}
