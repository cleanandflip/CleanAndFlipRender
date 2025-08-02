import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export default function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <Badge 
      variant="secondary" 
      className="bg-slate-600/20 text-slate-300 border-slate-500/30 pr-1 flex items-center gap-1"
    >
      {label}
      <button 
        onClick={onRemove}
        className="ml-1 hover:text-red-400 transition-colors p-0.5 rounded-sm hover:bg-red-400/20"
      >
        <X size={14} />
      </button>
    </Badge>
  );
}