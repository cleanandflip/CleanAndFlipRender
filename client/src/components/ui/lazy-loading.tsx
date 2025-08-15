import { lazy, Suspense, ComponentType } from "react";
import { Button } from "@/components/ui/button";

// Generic lazy loading wrapper
export const LazyWrapper = <T extends Record<string, any>>({
  children,
  fallback,
  className
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}) => (
  <Suspense fallback={fallback || <div className={className}>Loading...</div>}>
    {children}
  </Suspense>
);

// Lazy loading button wrapper for navigation
export const LazyNavigationButton = ({
  href,
  children,
  className,
  disabled = false,
  variant = "default",
  size = "default"
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}) => (
  <Suspense fallback={<Button disabled={true} className={className} variant={variant} size={size}>Loading...</Button>}>
    <a href={href}>
      <Button disabled={disabled} className={className} variant={variant} size={size}>
        {children}
      </Button>
    </a>
  </Suspense>
);

// Lazy component factory
export function createLazyComponent<T extends Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return (props: T) => (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
}