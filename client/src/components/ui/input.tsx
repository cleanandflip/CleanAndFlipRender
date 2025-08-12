import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full h-10 rounded-lg border bg-background border-border text-foreground",
          "placeholder:opacity-50",
          "focus:ring-2 focus:ring-primary/60 focus:border-transparent",
          "transition-[background,box-shadow] duration-150 field-hover-anim",
          "hover:bg-muted/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "px-3 py-2 text-sm",
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
