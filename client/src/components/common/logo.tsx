import { Link } from "wouter";

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  clickable?: boolean;
}

export default function Logo({ className = "", size = 'md', clickable = true }: LogoProps) {
  const sizes = {
    sm: "h-8 w-auto",      // Navigation mobile
    md: "h-10 w-auto",     // Navigation desktop
    lg: "h-32 w-auto",     // Auth pages
    xl: "h-40 w-auto",     // Hero sections
  };

  const logoClass = `${sizes[size]} hover:opacity-80 transition-opacity duration-200 ${className}`;

  const LogoContent = () => (
    <img
      src="/images/logo.png"
      alt="Clean & Flip"
      className={logoClass}
    />
  );

  if (!clickable) {
    return <LogoContent />;
  }

  return (
    <Link href="/" className="inline-block">
      <LogoContent />
    </Link>
  );
}
