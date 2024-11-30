import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputSize?: "sm" | "default" | "lg"
  variant?: "default" | "glass" | "filled" | "outline"
  error?: boolean
  status?: "success" | "warning" | "error"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      inputSize = "default",
      variant = "default",
      error,
      status,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-8 text-sm px-3",
      default: "h-10 text-base px-4",
      lg: "h-12 text-lg px-5",
    }

    const variantClasses = {
      default: "bg-background border border-border hover:border-border-hover",
      glass:
        "glass-effect border border-border/30 hover:border-border-hover/50 backdrop-blur-md",
      filled: "bg-surface-100 border-0 hover:bg-surface-200",
      outline:
        "bg-transparent border-2 border-border hover:border-border-hover",
    }

    const statusClasses = {
      success:
        "border-[hsl(var(--success))] focus:border-[hsl(var(--success))] focus:ring-[hsl(var(--success))/20]",
      warning:
        "border-[hsl(var(--warning))] focus:border-[hsl(var(--warning))] focus:ring-[hsl(var(--warning))/20]",
      error:
        "border-[hsl(var(--error))] focus:border-[hsl(var(--error))] focus:ring-[hsl(var(--error))/20]",
    }

    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "w-full rounded-[var(--radius-lg)]",
          "font-medium text-foreground/90",
          "placeholder:text-foreground/50",

          // Interactive states
          "transition-all duration-200 ease-in-out",
          "hover:shadow-sm",

          // Focus states
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          "focus:border-primary focus:shadow-md",

          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          "disabled:border-neutral-200/50 disabled:bg-neutral-100/50",
          "disabled:hover:border-neutral-200/50 disabled:hover:shadow-none",

          // Read-only state
          "read-only:cursor-default read-only:bg-neutral-100/30",
          "read-only:hover:border-neutral-200 read-only:hover:shadow-none",

          // File input
          "file:border-0 file:bg-primary/10",
          "file:text-sm file:font-medium file:text-primary",
          "file:mr-2 file:rounded-md file:px-3 file:py-2",
          "file:hover:bg-primary/20",
          "file:transition-colors file:duration-200",

          // Dynamic classes
          sizeClasses[inputSize],
          variantClasses[variant],
          status && statusClasses[status],
          error && statusClasses.error,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
