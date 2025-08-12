import { createPortal } from "react-dom";
import React from "react";

export const LAYER = {
  dropdown: 60, // above headers/cards/toasts
};

export default function LayerPortal({
  children,
  z = LAYER.dropdown,
}: { children: React.ReactNode; z?: number }) {
  const el = React.useMemo(() => {
    const d = document.createElement("div");
    d.style.position = "fixed";
    d.style.inset = "0";
    d.style.pointerEvents = "none"; // only menu captures events
    d.style.zIndex = String(z);
    return d;
  }, [z]);

  React.useEffect(() => {
    document.body.appendChild(el);
    return () => void document.body.removeChild(el);
  }, [el]);

  return createPortal(children, el);
}