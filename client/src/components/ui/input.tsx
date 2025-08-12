import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full rounded-xl bg-transparent",
          "border-2 border-[var(--border-subtle)]",
          "hover:border-[var(--border-hover)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent",
          "aria-[invalid=true]:border-[var(--border-error)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--border-error)]",
          "placeholder:text-white/40 transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "px-3 py-2 text-sm h-10",
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
