import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Complete text visibility overhaul - high contrast textarea styling
        "w-full px-4 py-3 min-h-[120px] text-white text-lg bg-gray-800/50 border-2 border-gray-400 rounded-lg placeholder:text-gray-300 placeholder:text-base focus:border-white focus:bg-gray-800 hover:border-gray-300 transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-lg resize-vertical",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
