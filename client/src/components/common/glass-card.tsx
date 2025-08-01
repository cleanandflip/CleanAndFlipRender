import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassCard({ children, className = "", hover = false }: GlassCardProps) {
  return (
    <div className={cn(
      "bg-card",
      hover && "bg-card-hover",
      className
    )}>
      {children}
    </div>
  );
}
