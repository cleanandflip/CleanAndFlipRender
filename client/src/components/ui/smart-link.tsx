import { ReactNode, MouseEvent } from 'react';
import { useLocation } from 'wouter';
import { useNavigationState } from '@/hooks/useNavigationState';

interface SmartLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  preserveState?: boolean;
  onClick?: () => void;
}

export function SmartLink({ 
  to, 
  children, 
  className, 
  preserveState = true,
  onClick 
}: SmartLinkProps) {
  const [location, navigate] = useLocation();
  const { saveState } = useNavigationState(location);
  
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    
    if (preserveState) {
      // Save current state before navigating
      saveState({
        scrollPosition: window.scrollY,
        activeTab: document.querySelector('[role="tab"][aria-selected="true"]')?.getAttribute('data-tab') || undefined,
        filters: getActiveFilters(),
        expandedItems: getExpandedItems()
      });
    }
    
    // Call custom onClick if provided
    onClick?.();
    
    // Navigate to new page
    navigate(to);
  };
  
  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

// Helper functions
function getActiveFilters() {
  const filters: any = {};
  document.querySelectorAll('[data-filter]:checked').forEach((input: any) => {
    filters[input.name] = input.value;
  });
  return filters;
}

function getExpandedItems() {
  const expanded: string[] = [];
  document.querySelectorAll('[data-expanded="true"]').forEach((el) => {
    const id = el.getAttribute('data-item-id');
    if (id) expanded.push(id);
  });
  return expanded;
}