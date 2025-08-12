import React from "react";
import LayerPortal, { LAYER } from "./LayerPortal";
import { useFloating, offset, flip, size, autoUpdate } from "@floating-ui/react";

export type Option = { label: string; value: string };

export default function UnifiedDropdown({
  value, onChange, options, placeholder = "Select…", width,
}: {
  value?: string; onChange: (v: string)=>void; options: Option[]; placeholder?: string; width?: number|string;
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);

  const { refs, floatingStyles, update } = useFloating({
    placement: "bottom-start",
    middleware: [
      offset(8),
      flip(),
      size({
        apply({ rects, elements }: { rects: any; elements: any }) {
          // Match trigger width by default
          const w = typeof width !== "undefined" ? width : rects.reference.width;
          Object.assign(elements.floating.style, { width: `${w}px`, maxHeight: "288px" });
        },
      }),
    ],
  });

  React.useLayoutEffect(() => {
    if (!open) return;
    if (!refs.reference.current) return;
    return autoUpdate(refs.reference.current, refs.floating.current!, update);
  }, [open, refs.reference, refs.floating, update]);

  const selected = options.find(o=>o.value===value);

  return (
    <>
      <button
        ref={(el)=>{
          btnRef.current=el; 
          if (refs.setReference) refs.setReference(el);
        }}
        type="button"
        onClick={()=>setOpen(v=>!v)}
        className="inline-flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 h-10 text-[15px] text-white/90 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
        style={{ width: typeof width !== "undefined" ? width : undefined }}
      >
        <span className={selected ? "" : "text-white/40"}>
          {selected?.label ?? placeholder}
        </span>
        <svg width="16" height="16" className="ml-2 opacity-70" viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
      </button>

      {open && (
        <LayerPortal z={LAYER.dropdown}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="pointer-events-auto rounded-xl border border-white/10 bg-[#121822]/95 backdrop-blur-md shadow-2xl overflow-auto"
            role="listbox"
          >
            {options.map((o)=>(
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="w-full text-left px-3 h-9 flex items-center text-white/90 hover:bg-white/[0.06] active:bg-white/[0.10] transition"
                role="option"
                aria-selected={o.value===value}
              >
                <span className="truncate">{o.label}</span>
                {o.value===value && <span className="ml-auto opacity-70">✓</span>}
              </button>
            ))}
          </div>
        </LayerPortal>
      )}
    </>
  );
}