import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Senior-friendly high-visibility textarea styling
        "w-full p-4 min-h-[120px] text-lg text-white bg-gray-900 border-2 border-white rounded-lg placeholder:text-gray-300 placeholder:text-base focus:border-3 focus:border-yellow-400 focus:outline-none hover:border-gray-200 transition-colors font-medium disabled:cursor-not-allowed disabled:opacity-50 shadow-lg resize-vertical",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
