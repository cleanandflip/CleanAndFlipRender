import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Senior-friendly high-visibility styling
          "w-full p-4 h-14 text-lg text-white bg-gray-900 border-2 border-white rounded-lg placeholder:text-gray-300 placeholder:text-base focus:border-3 focus:border-yellow-400 focus:outline-none hover:border-gray-200 transition-colors font-medium disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-lg file:font-medium file:text-white shadow-lg",
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
