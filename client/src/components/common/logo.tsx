import { Link } from "wouter";

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

export default function Logo({ className = "", size = 'md', clickable = true }: LogoProps) {
  const sizes = {
    sm: {
      container: "text-lg",
      symbol: "w-8 h-4",
      plate: "w-4 h-4 border-2",
    },
    md: {
      container: "text-2xl",
      symbol: "w-12 h-6",
      plate: "w-6 h-6 border-2",
    },
    lg: {
      container: "text-4xl",
      symbol: "w-16 h-8",
      plate: "w-8 h-8 border-3",
    },
  };

  const currentSize = sizes[size];

  const LogoContent = () => (
    <div className={`logo-infinity hover:opacity-80 transition-opacity ${className}`}>
      <div className={`infinity-symbol ${currentSize?.symbol || sizes.md.symbol}`}>
        <div className={`plate-left ${currentSize?.plate || sizes.md.plate}`}></div>
        <div className={`plate-right ${currentSize?.plate || sizes.md.plate}`}></div>
      </div>
      <span className={`font-bebas ${currentSize?.container || sizes.md.container} text-white tracking-wider`}>
        CLEAN & FLIP
      </span>
    </div>
  );

  if (!clickable) {
    return <LogoContent />;
  }

  return (
    <Link href="/">
      <LogoContent />
    </Link>
  );
}
