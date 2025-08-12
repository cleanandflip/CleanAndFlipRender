import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";

export type Option = { value: string; label: string };

type Props = {
  value?: string;
  onChange: (val: string) => void;
  options: Option[] | string[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  label?: string;
  required?: boolean;
  allowCustom?: boolean;
  "aria-label"?: string;
};

function StandardDropdown({
  value = "",
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  id,
  name,
  label,
  required,
  allowCustom = false,
  ...a11y
}: Props) {
  const [isCustomInput, setIsCustomInput] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");

  // Normalize options to ensure consistent format
  const normalizedOptions: Option[] = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Check if current value exists in options
  const valueExistsInOptions = normalizedOptions.some(opt => opt.value === value);
  const shouldShowCustomInput = allowCustom && (!valueExistsInOptions || isCustomInput);

  React.useEffect(() => {
    if (allowCustom && value && !valueExistsInOptions) {
      setCustomValue(value);
      setIsCustomInput(true);
    }
  }, [value, valueExistsInOptions, allowCustom]);

  const handleSelectChange = (newValue: string) => {
    if (newValue === "__custom__") {
      setIsCustomInput(true);
      setCustomValue("");
    } else {
      setIsCustomInput(false);
      onChange(newValue);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomValue(newValue);
    onChange(newValue);
  };

  const displayPlaceholder = `${placeholder}${required ? " *" : ""}`;

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}{required && " *"}
        </Label>
      )}
      
      {shouldShowCustomInput ? (
        <div className="space-y-2">
          <Input
            id={id}
            name={name}
            value={customValue}
            onChange={handleCustomInputChange}
            placeholder={allowCustom ? "Enter custom value..." : placeholder}
            disabled={disabled}
            aria-label={a11y["aria-label"]}
          />
          {allowCustom && (
            <button
              type="button"
              onClick={() => {
                setIsCustomInput(false);
                setCustomValue("");
                onChange("");
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Choose from list instead
            </button>
          )}
        </div>
      ) : (
        <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
          <SelectTrigger id={id} aria-label={a11y["aria-label"]}>
            <SelectValue placeholder={displayPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {normalizedOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
            {allowCustom && (
              <SelectItem value="__custom__">
                <div className="flex items-center gap-2">
                  <span>Enter custom value...</span>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export default StandardDropdown;