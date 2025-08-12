import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "w-full min-h-[80px] rounded-lg border bg-background border-border text-foreground",
        "placeholder:opacity-50",
        "focus:ring-2 focus:ring-primary/60 focus:border-transparent",
        "transition-[background,box-shadow] duration-150 field-hover-anim",
        "hover:bg-muted/20",
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
