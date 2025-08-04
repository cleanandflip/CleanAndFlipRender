import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { SimpleDropdown, SimpleDropdownItem } from './SimpleDropdown';
import { Button } from './button';

interface SelectOption {
  value: string;
  label: string;
}

interface CleanSelectDropdownProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CleanSelectDropdown({ 
  options, 
  value, 
  placeholder = "Select...",
  onValueChange,
  className = "",
  disabled = false
}: CleanSelectDropdownProps) {
  const selectedOption = options.find(option => option.value === value);
  
  return (
    <SimpleDropdown
      trigger={
        <Button
          variant="outline"
          className={`justify-between gap-2 ${className}`}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        </Button>
      }
      align="start"
    >
      {options.map((option) => (
        <SimpleDropdownItem
          key={option.value}
          onClick={() => onValueChange(option.value)}
          className={value === option.value ? 'bg-accent' : ''}
        >
          <span className="flex-1">{option.label}</span>
          {value === option.value && (
            <Check className="w-4 h-4 text-primary" />
          )}
        </SimpleDropdownItem>
      ))}
    </SimpleDropdown>
  );
}