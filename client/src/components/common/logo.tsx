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

    // For navigation and other locations - enhanced gradient logo with glow
    return (
      <div className={`flex items-center gap-3 group cursor-pointer ${className}`}>
        <div className="relative">
          {/* Gradient glow effect background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
          
          {/* Logo container with gradient background */}
          <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg hover-lift">
            <img 
              src="/clean-flip-logo-final.png" 
              alt="Clean & Flip Logo" 
              className={`brightness-0 invert ${size === 'lg' ? 'h-24 w-24' : size === 'md' ? 'h-10 w-10' : 'h-8 w-8'}`}
              style={{ minHeight: size === 'lg' ? '96px' : size === 'md' ? '40px' : '32px', minWidth: size === 'lg' ? '96px' : size === 'md' ? '40px' : '32px' }}
            />
          </div>
        </div>
        
        <div className="hidden sm:block">
          <div className={`font-bebas ${currentSize?.container || sizes.md.container} text-white tracking-wider group-hover:text-blue-300 transition-colors`}>
            CLEAN & FLIP
          </div>
          {size === 'md' && (
            <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
              Premium Sports Gear
            </div>
          )}
        </div>
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
