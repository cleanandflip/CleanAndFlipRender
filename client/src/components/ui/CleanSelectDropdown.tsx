import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(option => option.value === value);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleOptionSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 rounded-lg text-left transition-all duration-200 focus:outline-none flex items-center justify-between group",
          disabled 
            ? "cursor-not-allowed opacity-50" 
            : "cursor-pointer"
        )}
        style={{
          background: 'rgba(75, 85, 99, 0.4)',
          border: '1px solid rgba(156, 163, 175, 0.4)',
          color: 'white',
          fontWeight: '500'
        }}
      >
        <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180",
            !disabled && "group-hover:text-white"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div 
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-lg overflow-hidden"
            style={{
              background: 'rgba(75, 85, 99, 0.4)',
              border: '1px solid rgba(156, 163, 175, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            <div className="p-2 space-y-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center justify-between",
                    value === option.value 
                      ? "bg-blue-500/30 text-white" 
                      : "hover:bg-white/10 text-white"
                  )}
                >
                  <span className="font-medium">{option.label}</span>
                  {value === option.value && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}