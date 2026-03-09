// Input: styled text input with label
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text
          placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20
          transition-colors ${error ? 'border-jb-danger' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-jb-danger">{error}</p>}
    </div>
  );
}
