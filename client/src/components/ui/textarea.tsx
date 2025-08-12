import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "w-full min-h-[80px] rounded-xl bg-transparent",
        "border-2 border-[var(--border-subtle)]",
        "hover:border-[var(--border-hover)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent",
        "aria-[invalid=true]:border-[var(--border-error)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--border-error)]",
        "placeholder:text-white/40 transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "px-3 py-2 text-sm resize-vertical",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
