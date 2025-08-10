import * as React from "react"
import { cn } from "@/lib/utils"
import { forms, interactions } from "@/config/dimensions"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Use standardized dimensions from config
        `flex ${forms.textarea.minHeight} w-full ${forms.textarea.borderRadius} border border-input bg-input ${forms.textarea.padding} ${forms.input.fontSize} text-input-foreground ring-offset-background placeholder:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${interactions.disabled.cursor} ${interactions.disabled.opacity} md:text-sm`,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
