import { Link } from "wouter";

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  textOnly?: boolean; // New prop for auth pages
}

export default function Logo({ className = "", size = 'md', clickable = true, textOnly = false }: LogoProps) {
  const sizes = {
    sm: {
      container: "text-lg",
      logo: "h-5 w-5",
    },
    md: {
      container: "text-2xl",
      logo: "h-6 w-6",
    },
    lg: {
      container: "text-4xl",
      logo: "h-24 w-24", // Large standalone size for auth pages
    },
  };

  const currentSize = sizes[size];

  const LogoContent = () => {
    // For auth pages - show only the logo image
    if (textOnly) {
      return (
        <div className={`flex justify-center ${className}`}>
          <img 
            src="/clean-flip-logo.png" 
            alt="Clean & Flip" 
            className={currentSize?.logo || sizes.lg.logo}
          />
        </div>
      );
    }

    // For navigation and other locations - show logo + text
    return (
      <div className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}>
        <img 
          src="/clean-flip-logo.png" 
          alt="Clean & Flip Logo" 
          className={currentSize?.logo || sizes.md.logo}
        />
        <span className={`font-bebas ${currentSize?.container || sizes.md.container} text-white tracking-wider`}>
          CLEAN & FLIP
        </span>
      </div>
    );
  };

  if (!clickable) {
    return <LogoContent />;
  }

  return (
    <Link href="/">
      <LogoContent />
    </Link>
  );
}
