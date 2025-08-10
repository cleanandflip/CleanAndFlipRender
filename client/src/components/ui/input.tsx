import * as React from "react"
import { cn } from "@/lib/utils"
import { forms, interactions } from "@/config/dimensions"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Use standardized dimensions from config
          `flex ${forms.input.height} w-full ${forms.input.borderRadius} border border-input bg-input ${forms.input.padding} py-2 ${forms.input.fontSize} text-input-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary placeholder:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${interactions.disabled.opacity} ${interactions.disabled.cursor} touch-manipulation`,
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
