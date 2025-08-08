import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationDropdownProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export function NavigationDropdown({ 
  isOpen, 
  onOpenChange, 
  trigger, 
  children, 
  className = '',
  align = 'end'
}: NavigationDropdownProps) {
  const [isReady, setIsReady] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0
  });
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalRoot = typeof document !== 'undefined' ? document.body : null;

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      let left = rect.left + scrollX;
      const width = Math.max(rect.width, 200); // Minimum width of 200px
      
      // Adjust horizontal position based on alignment
      if (align === 'end') {
        left = rect.right + scrollX - width;
      } else if (align === 'center') {
        left = rect.left + scrollX + (rect.width / 2) - (width / 2);
      }
      
      // Ensure dropdown doesn't go off-screen
      const windowWidth = window.innerWidth;
      if (left + width > windowWidth) {
        left = windowWidth - width - 10;
      }
      if (left < 10) {
        left = 10;
      }

      setDropdownPosition({
        top: rect.bottom + scrollY + 8,
        left,
        width
      });
    }
  }, [isOpen, align]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        dropdownRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onOpenChange]);

  const handleTriggerClick = () => {
    onOpenChange(!isOpen);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <div ref={triggerRef} onClick={handleTriggerClick} className="cursor-pointer">
        {trigger}
      </div>

      {/* Safe Portal Dropdown with UnifiedDropdown Theme */}
      {isReady && portalRoot && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20" 
                style={{ zIndex: 999998 }}
                onClick={() => onOpenChange(false)}
              />
              
              {/* Dropdown Content */}
              <motion.div 
                key="dropdown"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                ref={dropdownRef}
                className="rounded-lg overflow-hidden max-h-96 overflow-y-auto scrollbar-hide"
                style={{
                  position: 'fixed',
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  zIndex: 999999,
                  background: 'rgba(75, 85, 99, 0.4)',
                  border: '1px solid rgba(156, 163, 175, 0.4)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              >
                {children}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        portalRoot
      )}
    </div>
  );
}

// Navigation-specific dropdown items with consistent styling
interface NavigationDropdownItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  showSeparator?: boolean;
}

export function NavigationDropdownItem({ onClick, children, className = '', disabled = false, showSeparator = false }: NavigationDropdownItemProps) {
  return (
    <div>
      <div
        onClick={disabled ? undefined : onClick}
        className={cn(
          "px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors duration-150 flex items-center",
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {children}
      </div>
      {showSeparator && (
        <div className="border-t mx-4" style={{ borderColor: '#4B5563' }} />
      )}
    </div>
  );
}

// Separator component for navigation dropdown sections
export function NavigationDropdownSeparator({ className = '' }: { className?: string }) {
  return <div className={`border-t my-1 ${className}`} style={{ borderColor: '#4B5563' }} />;
}

// Label component for navigation dropdown sections
interface NavigationDropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function NavigationDropdownLabel({ children, className = '' }: NavigationDropdownLabelProps) {
  return (
    <div className={`px-4 py-2 text-white font-medium text-sm border-b border-gray-600/50 ${className}`}>
      {children}
    </div>
  );
}