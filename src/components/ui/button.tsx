import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-dark shadow-md",
        destructive: "bg-error text-error-foreground hover:bg-error/90 shadow-md",
        outline: "border-2 border-primary/20 bg-background hover:border-primary/40 hover:bg-primary/5 text-primary shadow-sm",
        secondary: "bg-secondary text-white hover:bg-secondary-dark shadow-md",
        ghost: "hover:bg-primary/5 text-primary hover:text-primary-dark",
        link: "text-primary underline-offset-4 hover:underline font-normal",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-md",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-md",
      },
      size: {
        xs: "h-7 rounded-[var(--radius-sm)] px-2.5 text-xs",
        sm: "h-9 rounded-[var(--radius-md)] px-3.5 text-sm",
        default: "h-11 rounded-[var(--radius-md)] px-5 text-sm",
        lg: "h-13 rounded-[var(--radius-lg)] px-6 text-base",
        xl: "h-15 rounded-[var(--radius-xl)] px-8 text-lg",
        icon: {
          xs: "h-7 w-7 rounded-[var(--radius-sm)]",
          sm: "h-9 w-9 rounded-[var(--radius-md)]",
          default: "h-11 w-11 rounded-[var(--radius-md)]",
          lg: "h-13 w-13 rounded-[var(--radius-lg)]",
          xl: "h-15 w-15 rounded-[var(--radius-xl)]",
        },
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
