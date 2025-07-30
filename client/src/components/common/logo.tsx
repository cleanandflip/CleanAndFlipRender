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
      logo: "h-8 w-8 logo-glow", // Footer logo with glow
    },
    md: {
      container: "text-2xl",
      logo: "h-10 w-10 logo-glow", // Navigation logo - 40px with glow
    },
    lg: {
      container: "text-4xl",
      logo: "h-20 w-20 logo-glow-large", // Auth page logo - 80px with large glow
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
            style={{ minHeight: '80px', minWidth: '80px' }}
          />
        </div>
      );
    }

    // For navigation and other locations - show logo + text
    return (
      <div className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${className}`}>
        <img 
          src="/clean-flip-logo.png" 
          alt="Clean & Flip Logo" 
          className={currentSize?.logo || sizes.md.logo}
          style={{ minHeight: size === 'lg' ? '80px' : size === 'md' ? '40px' : '32px', minWidth: size === 'lg' ? '80px' : size === 'md' ? '40px' : '32px' }}
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
