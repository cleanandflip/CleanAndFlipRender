import { Link } from "wouter";
import { ROUTES } from "@/config/routes";

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
      logo: "h-12 w-12 logo-glow", // Footer logo - 48px
    },
    md: {
      container: "text-2xl", 
      logo: "h-16 w-16 logo-glow", // Navigation logo - 64px (much larger)
    },
    lg: {
      container: "text-4xl",
      logo: "h-32 w-32 logo-glow-large", // Auth page logo - 128px (very prominent)
    },
  };

  const currentSize = sizes[size];

  const LogoContent = () => {
    // For auth pages - show only the logo image
    if (textOnly) {
      return (
        <div className={`flex justify-center ${className}`}>
          <img 
            src="/clean-flip-logo-final.png" 
            alt="Clean & Flip" 
            className={`${currentSize?.logo || sizes.lg.logo} brightness-0 invert`}
            style={{ minHeight: '128px', minWidth: '128px' }}
          />
        </div>
      );
    }

    // For navigation and other locations - show logo + text
    return (
      <div className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${className}`}>
        <img 
          src="/clean-flip-logo-final.png" 
          alt="Clean & Flip Logo" 
          className={`${currentSize?.logo || sizes.md.logo} brightness-0 invert`}
          style={{ minHeight: size === 'lg' ? '128px' : size === 'md' ? '64px' : '48px', minWidth: size === 'lg' ? '128px' : size === 'md' ? '64px' : '48px' }}
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
    <Link href={ROUTES.HOME}>
      <LogoContent />
    </Link>
  );
}
