import { Link } from "wouter";
import { NavigationStateManager } from "@/lib/navigation-state";

interface SmartLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  preserveState?: boolean;
}

export function SmartLink({ href, children, className, onClick, preserveState = false }: SmartLinkProps) {
  const handleClick = () => {
    // Save current state if needed
    if (preserveState && href.startsWith('/products/')) {
      // This link goes to a product detail, so save products page state
      const currentPath = window.location.pathname;
      if (currentPath === '/products') {
        NavigationStateManager.updatePreviousPath(currentPath);
      }
    } else if (!href.startsWith('/products')) {
      // Clear products state when navigating away from products
      NavigationStateManager.clearState('/products');
    }
    
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}