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
    const currentPath = window.location.pathname;
    
    // Save current state if needed
    if (preserveState && href.startsWith('/products/')) {
      // This link goes to a product detail, so save products page state
      if (currentPath === '/products') {
        NavigationStateManager.updatePreviousPath(currentPath);
      }
    } else if (!href.startsWith('/products')) {
      // Clear products state when navigating away from products
      NavigationStateManager.clearState('/products');
      NavigationStateManager.updatePreviousPath(currentPath);
    } else {
      // For any other navigation, update previous path
      NavigationStateManager.updatePreviousPath(currentPath);
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