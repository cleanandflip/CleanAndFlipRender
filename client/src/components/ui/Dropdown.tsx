import * as React from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type DropdownOption = { 
  value: string; 
  label: string; 
  disabled?: boolean 
};

export type DropdownProps = {
  value?: string | null;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  ariaLabel?: string;
  // Optional niceties
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  error?: string | null;
  // Async mode (for fetch-on-open lists)
  loading?: boolean;
};

export default function Dropdown({
  value = null,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
  id,
  name,
  ariaLabel,
  fullWidth = false,
  size = "md",
  error = null,
  loading = false
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Size variants
  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-base",
    lg: "h-12 px-5 text-lg"
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(selectedOption ? options.indexOf(selectedOption) : 0);
        } else if (focusedIndex >= 0) {
          const option = options[focusedIndex];
          if (option && !option.disabled) {
            onChange(option.value);
            setIsOpen(false);
          }
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(selectedOption ? options.indexOf(selectedOption) : 0);
        } else {
          setFocusedIndex(prev => {
            let next = prev + 1;
            while (next < options.length && options[next]?.disabled) next++;
            return next < options.length ? next : prev;
          });
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => {
            let next = prev - 1;
            while (next >= 0 && options[next]?.disabled) next--;
            return next >= 0 ? next : prev;
          });
        }
        break;
      case "Home":
        e.preventDefault();
        if (isOpen) {
          let next = 0;
          while (next < options.length && options[next]?.disabled) next++;
          if (next < options.length) setFocusedIndex(next);
        }
        break;
      case "End":
        e.preventDefault();
        if (isOpen) {
          let next = options.length - 1;
          while (next >= 0 && options[next]?.disabled) next--;
          if (next >= 0) setFocusedIndex(next);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
    }
  };

  // Handle click outside
  React.useEffect(() => {
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

  // Handle option click
  const handleOptionClick = (option: DropdownOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} className={cn("relative", fullWidth ? "w-full" : "w-auto")}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        name={name}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          // Improved trigger sizing and spacing
          "inline-flex w-full items-center justify-between rounded-lg border transition-colors duration-200",
          "bg-background text-foreground",
          "border-input",
          // Focus states with proper ring
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-destructive focus:ring-destructive/60 focus:border-transparent",
          sizeClasses[size],
          fullWidth ? "w-full" : "min-w-[200px]"
        )}
      >
        <span className={cn(
          "block truncate text-left",
          !selectedOption && "text-muted-foreground"
        )}>
          {selectedOption?.label || placeholder}
        </span>
        
        <span className="pointer-events-none flex items-center">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown 
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )} 
            />
          )}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-labelledby={id}
          style={{
            width: 'var(--radix-select-trigger-width, 100%)',
            minWidth: fullWidth ? '100%' : '14rem'
          }}
          className={cn(
            // Proper positioning and z-index
            "absolute z-[60] top-full mt-2 max-h-[56vh] overflow-y-auto rounded-xl border shadow-xl",
            "bg-popover text-popover-foreground border-border",
            // Animation classes
            "dropdown-menu",
            "scroll-smooth"
          )}
          data-state="open"
        >
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Loading..." : "No options available"}
            </div>
          ) : (
            options.map((option, index) => (
              <div
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                className={cn(
                  // Improved item padding and hit area
                  "dropdown-item relative cursor-pointer select-none py-2.5 px-3 text-sm transition-colors",
                  option.disabled && "opacity-50 cursor-not-allowed",
                  !option.disabled && "hover:bg-accent hover:text-accent-foreground",
                  focusedIndex === index && "bg-accent text-accent-foreground",
                  value === option.value && "bg-primary/10 text-primary font-medium",
                  // First/last item rounded corners
                  index === 0 && "rounded-t-xl",
                  index === options.length - 1 && "rounded-b-xl"
                )}
                onClick={() => handleOptionClick(option)}
              >
                <div className="flex items-center">
                  <span className="block truncate">{option.label}</span>
                  {value === option.value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}