import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Complete text visibility overhaul - high contrast styling
          "w-full px-4 py-3 text-white text-lg bg-gray-800/50 border-2 border-gray-400 rounded-lg placeholder:text-gray-300 placeholder:text-base focus:border-white focus:bg-gray-800 hover:border-gray-300 transition-all disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-lg file:font-medium file:text-white shadow-lg",
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
