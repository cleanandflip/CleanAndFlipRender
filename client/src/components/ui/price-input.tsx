import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PriceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10">
          $
        </span>
        <Input
          type="number"
          step="0.01"
          min="0"
          {...props}
          ref={ref}
          value={value || ""}
          onChange={onChange}
          className={cn("pl-8", className)}
        />
      </div>
    );
  }
);

PriceInput.displayName = "PriceInput";