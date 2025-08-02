import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Senior-friendly high-visibility button base styling
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 shadow-lg hover:scale-105",
  {
    variants: {
      variant: {
        default: "bg-blue-500 text-white text-xl px-8 py-4 border-2 border-white hover:bg-blue-400",
        destructive:
          "bg-red-500 text-white text-xl px-8 py-4 border-2 border-white hover:bg-red-400",
        outline:
          "border-2 border-white bg-transparent text-white text-xl px-8 py-4 hover:bg-white hover:text-gray-900",
        secondary:
          "bg-gray-600 text-white text-xl px-8 py-4 border-2 border-white hover:bg-gray-500",
        ghost: "text-white text-xl px-8 py-4 hover:bg-white/10",
        link: "text-blue-400 text-xl underline-offset-4 hover:underline hover:text-blue-300",
        success: "bg-green-500 text-white text-xl font-bold hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all px-8 py-4 border-2 border-white",
      },
      size: {
        default: "h-14 px-8 py-4 text-xl",
        sm: "h-12 px-6 py-3 text-lg",
        lg: "h-16 px-10 py-5 text-2xl",
        icon: "h-14 w-14 text-xl",
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
