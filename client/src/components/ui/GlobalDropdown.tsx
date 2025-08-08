// DEPRECATED: Use StandardDropdown from @/components/ui instead
// This file provides backward compatibility

import { StandardDropdown, type DropdownOption } from './UnifiedDropdown';

export interface DropdownItem {
  label: string;
  value: string;
  onClick?: () => void;
}

export interface DropdownLabel {
  label: string;
}

export interface DropdownSeparator {
  separator: true;
}

interface GlobalDropdownProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  children: React.ReactNode;
  trigger: React.ReactNode;
}

export function GlobalDropdown({ 
  isOpen, 
  onOpenChange, 
  align = 'start',
  children, 
  trigger 
}: GlobalDropdownProps) {
  return (
    <div className="relative">
      <div onClick={() => onOpenChange(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 z-[999999] min-w-[200px]" 
             style={{
               background: 'rgba(31, 41, 55, 0.95)',
               border: '1px solid rgba(156, 163, 175, 0.4)',
               borderRadius: '8px',
               backdropFilter: 'blur(12px)'
             }}>
          {children}
        </div>
      )}
    </div>
  );
}

export const DropdownItem = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <div 
    className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
    onClick={onClick}
  >
    {children}
  </div>
);

export const DropdownLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 py-2 text-sm text-gray-400 font-medium">
    {children}
  </div>
);

export const DropdownSeparator = () => (
  <div className="h-px bg-gray-700 my-1"></div>
);