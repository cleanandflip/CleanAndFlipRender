import * as React from "react";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import Dropdown, { DropdownOption, DropdownProps } from "@/components/ui/Dropdown";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

type DropdownFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  required?: boolean;
} & Omit<DropdownProps, "value" | "onChange">;

export default function DropdownField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  required = false,
  ...dropdownProps
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
              {...dropdownProps}
              value={field.value || null}
              onChange={field.onChange}
              error={fieldState.error?.message || null}
              id={name}
              name={name}
              ariaLabel={label}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}