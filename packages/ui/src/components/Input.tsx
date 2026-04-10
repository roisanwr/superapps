import * as React from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftElement,
  rightElement,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftElement && (
          <span className="absolute left-3 text-text-muted">{leftElement}</span>
        )}
        <input
          id={inputId}
          className={clsx(
            "w-full h-10 rounded border border-border bg-surface-alt px-3 text-sm text-text",
            "placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
            "transition-all duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-danger focus:ring-danger/30",
            leftElement && "pl-9",
            rightElement && "pr-9",
            className
          )}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3 text-text-muted">{rightElement}</span>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function TextArea({ label, error, hint, className, id, ...props }: TextAreaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          "w-full min-h-24 rounded border border-border bg-surface-alt px-3 py-2 text-sm text-text",
          "placeholder:text-text-muted resize-y",
          "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
          "transition-all duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-danger focus:ring-danger/30",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
