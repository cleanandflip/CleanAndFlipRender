// src/components/ui/RHFDropdown.tsx
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import Dropdown, { DropdownOption } from "./Dropdown";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
};

export function RHFDropdown<T extends FieldValues>({ control, name, options, placeholder, className }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Dropdown
          value={field.value == null ? null : String(field.value)}
          onChange={(v) => field.onChange(v)}  // <-- not an event, just the string
          options={options}
          placeholder={placeholder}
          className={className}
        />
      )}
    />
  );
}