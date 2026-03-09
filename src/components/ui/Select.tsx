// Select: styled dropdown with label
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text
          focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20
          transition-colors appearance-none cursor-pointer ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
