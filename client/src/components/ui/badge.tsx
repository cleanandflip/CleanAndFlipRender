import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { typography, spacing, interactions } from "@/config/dimensions"

const badgeVariants = cva(
  `inline-flex items-center rounded-full border ${typography.tiny} font-semibold ${interactions.hover.transition} focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`,
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-2.5 py-0.5",
        secondary:
          "border-transparent bg-card text-secondary-foreground hover:bg-card/80 px-2.5 py-0.5",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 px-2.5 py-0.5",
        outline: "text-primary px-2.5 py-0.5",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-0.5",
        lg: "px-3 py-1"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
