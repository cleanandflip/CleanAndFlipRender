import React from "react";
import { createPortal } from "react-dom";

export type DropdownOption = { value: string; label: string; disabled?: boolean };
type Coords = { top:number; left:number; width:number };

export default function Dropdown({
  value = "",
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  id,
  name,
  fullWidth,
  size = "md",
  error,
  className = "",
}: {
  value?: string | null;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  error?: string | null;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<Coords | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const current = options.find(o => o.value === value) || null;

  const sizeCls = size === "sm" ? "h-9 text-sm px-3"
                 : size === "lg" ? "h-12 text-base px-4"
                 : "h-10 text-sm px-3.5";

  const isPlaceholder = !current;
  const triggerCls = [
    "inline-flex items-center justify-between rounded-lg border",
    "bg-background border-border text-foreground",
    "hover:bg-muted/20 transition-[background,box-shadow] duration-150 field-hover-anim",
    "focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent",
    "disabled:opacity-60 disabled:cursor-not-allowed",
    sizeCls, fullWidth ? "w-full" : "w-[min(90vw,320px)]", className,
    isPlaceholder ? "opacity-90" : "",
  ].join(" ");

  const calc = () => {
    const el = triggerRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 8 + window.scrollY, left: r.left + window.scrollX, width: r.width });
  };

  const openMenu = () => { if (disabled) return; setOpen(true); calc(); setTimeout(() => listRef.current?.focus(), 0); };
  const closeMenu = () => { setOpen(false); triggerRef.current?.focus(); };

  React.useEffect(() => {
    if (!open) return;
    const onAway = (e: MouseEvent) => {
      if (!triggerRef.current || !listRef.current) return;
      if (!triggerRef.current.contains(e.target as Node) && !listRef.current.contains(e.target as Node)) closeMenu();
    };
    const onScroll = () => calc();
    const onResize = () => calc();
    document.addEventListener("mousedown", onAway);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onAway);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (["Enter"," ","ArrowDown"].includes(e.key)) { e.preventDefault(); openMenu(); }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); closeMenu(); }
  };

  const menu = open && coords ? createPortal(
    <div
      style={{ position:"absolute", top:coords.top, left:coords.left, width:coords.width, zIndex:60 }}
      className="transition duration-200"
    >
      <div className="rounded-xl border bg-popover text-popover-foreground shadow-xl max-h-64 overflow-y-auto">
        <ul ref={listRef} tabIndex={-1} role="listbox" aria-labelledby={id} onKeyDown={onListKey} className="py-1 outline-none">
          {options.length === 0 && <li className="px-3 py-2 text-sm opacity-80">No options</li>}
          {options.map(opt => {
            const selected = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => { if (!opt.disabled) { onChange(opt.value); closeMenu(); } }}
                  disabled={opt.disabled}
                  className={[
                    "w-full text-left px-3 py-2.5 flex items-center gap-2 rounded-md select-none",
                    "transition-[background,transform,opacity] duration-150 ease-out",
                    "hover:bg-muted/60 hover:translate-x-[1px]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                    opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                >
                  <span className="truncate">{opt.label}</span>
                  {selected && <span className="ml-auto opacity-80">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className={fullWidth ? "w-full" : "inline-block"}>
      <button
        ref={triggerRef}
        id={id} name={name}
        type="button" disabled={disabled}
        aria-haspopup="listbox" aria-expanded={open}
        className={triggerCls + (error ? " ring-2 ring-destructive/60 border-transparent" : "")}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKey}
      >
        <span className={`truncate ${isPlaceholder ? "opacity-[var(--placeholder-opacity)]" : ""}`}>
          {current?.label ?? placeholder}
        </span>
        <span className="ml-3 opacity-70" aria-hidden>▾</span>
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      {menu}
    </div>
  );
}