import * as React from "react";

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

export default function StandardDropdown({
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
  const normalizedOptions: Option[] = (options || []).map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Check if current value exists in options
  const valueExistsInOptions = normalizedOptions.some(opt => opt.value === value);
  const shouldShowCustomInput = allowCustom && value && !valueExistsInOptions && isCustomInput;

  React.useEffect(() => {
    if (allowCustom && value && !valueExistsInOptions) {
      setCustomValue(value);
      setIsCustomInput(true);
    }
  }, [value, valueExistsInOptions, allowCustom]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
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
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}{required && " *"}
        </label>
      )}
      
      {shouldShowCustomInput ? (
        <div className="space-y-2">
          <input
            id={id}
            name={name}
            type="text"
            value={customValue}
            onChange={handleCustomInputChange}
            placeholder="Enter custom value..."
            disabled={disabled}
            aria-label={a11y["aria-label"]}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => {
              setIsCustomInput(false);
              setCustomValue("");
              onChange("");
            }}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Choose from list instead
          </button>
        </div>
      ) : (
        <select
          id={id}
          name={name}
          value={value}
          onChange={handleSelectChange}
          disabled={disabled}
          {...a11y}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {!value && <option value="">{displayPlaceholder}</option>}
          {normalizedOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {allowCustom && (
            <option value="__custom__">Enter custom value...</option>
          )}
        </select>
      )}
    </div>
  );
}