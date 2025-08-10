import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  "btn touch-manipulation", // Prevent double-tap zoom
  {
    variants: {
      variant: {
        default: "btn-primary",
        primary: "btn-primary",
        secondary: "btn-secondary",
        destructive: "btn-danger",
        outline: "btn-outline",
        ghost: "btn-ghost",
        link: "btn-ghost underline-offset-4 hover:underline",
        glass: "btn-glass",
        danger: "btn-danger",
        success: "btn-success",
      },
      size: {
        default: "btn-md h-10 sm:h-9 px-4 sm:px-3 py-2 text-base sm:text-sm",
        sm: "btn-sm h-9 sm:h-8 px-3 sm:px-2 text-sm sm:text-xs",
        lg: "btn-lg h-12 sm:h-11 px-6 sm:px-8 text-base",
        icon: "btn-sm w-10 sm:w-9 h-10 sm:h-9 p-0",
        mobile: "h-12 px-4 py-3 text-base w-full", // Mobile-optimized large button
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
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, icon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), loading && 'btn-loading')}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="btn-icon">{icon}</span>
        ) : null}
        {!loading && children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }