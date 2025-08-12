// src/components/ui/Dropdown.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  label: string;
  value: string; // IMPORTANT: we standardize on string values across the app
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | null;                 // controlled value (string or null)
  onChange: (value: string) => void;    // will be called with a string
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  menuClassName = "",
  id,
  name,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // normalize: value must be string or null
  const current = typeof value === "string" ? value : null;
  const selectedOption = options.find((opt) => opt.value === current) ?? null;

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }
  }, [isOpen]);

  // Position menu (prevents clipping)
  const updateMenuPos = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuPos({ left: r.left + window.scrollX, top: r.bottom + window.scrollY + 6, width: r.width });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateMenuPos();
    const onScroll = () => updateMenuPos();
    const onResize = () => updateMenuPos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize, true);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize, true);
    };
  }, [isOpen, updateMenuPos]);

  // Minimal keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[data-option]") ?? []);
      const idx = Math.max(0, items.findIndex((n) => n === document.activeElement));
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        (items[idx + 1] ?? items[0])?.focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        (items[idx - 1] ?? items[items.length - 1])?.focus();
      }
      if (e.key === "Enter") {
        (document.activeElement as HTMLButtonElement | null)?.click();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        name={name}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={[
          "flex items-center justify-between w-full",
          "px-3 py-2 text-sm rounded-md",
          "border border-white/10",
          "bg-slate-800/70 hover:bg-slate-800",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/60",
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedOption ? "text-slate-100" : "text-white/45"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ position: "absolute", left: menuPos.left, top: menuPos.top, width: menuPos.width, zIndex: 60 }}
            className={[
              "rounded-md border border-white/10",
              "bg-[#121822]/95 backdrop-blur",
              "shadow-xl shadow-black/30",
              "max-h-60 overflow-auto",
              "animate-[fadeIn_120ms_ease-out]",
              menuClassName || "",
            ].join(" ")}
          >
            {options.map((option) => {
              const isSelected = option.value === current;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-option
                  onClick={() => {
                    onChange(option.value); // ← ensures selection works everywhere
                    setIsOpen(false);
                  }}
                  className={[
                    "w-full px-3 py-2 text-sm text-left transition-colors",
                    isSelected ? "bg-blue-500/10 text-blue-300" : "text-slate-100 hover:bg-white/5",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}