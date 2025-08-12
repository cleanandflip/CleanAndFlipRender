import * as React from "react";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import Dropdown, { DropdownOption } from "@/components/ui/Dropdown";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

type DropdownFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  required?: boolean;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function DropdownField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  required = false,
  options,
  placeholder,
  disabled,
  fullWidth = true,
  size = "md",
  className
}: DropdownFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          {label && (
            <FormLabel className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <Dropdown
              options={options}
              value={field.value || null}
              onChange={field.onChange}
              id={name}
              name={name}
              placeholder={placeholder}
              disabled={disabled}
              className={className}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}