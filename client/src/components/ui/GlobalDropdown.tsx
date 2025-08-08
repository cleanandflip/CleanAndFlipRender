import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

interface GlobalDropdownProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export function GlobalDropdown({ 
  isOpen, 
  onOpenChange, 
  trigger, 
  children, 
  className = '',
  align = 'end'
}: GlobalDropdownProps) {
  const [isReady, setIsReady] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
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

      {/* Safe Portal Dropdown */}
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
                className="rounded-lg overflow-hidden max-h-96 overflow-y-auto shadow-2xl border"
                style={{
                  position: 'fixed',
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  zIndex: 999999,
                  background: 'rgba(30, 41, 59, 0.95)',
                  borderColor: 'rgba(71, 85, 105, 0.6)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
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

// Additional utility for dropdown items with consistent styling
interface DropdownItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function DropdownItem({ onClick, children, className = '', disabled = false }: DropdownItemProps) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        px-4 py-3 text-white hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/30 cursor-pointer transition-all duration-200 flex items-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Separator component for dropdown sections
export function DropdownSeparator({ className = '' }: { className?: string }) {
  return <div className={`border-t border-slate-600/40 my-1 ${className}`} />;
}

// Label component for dropdown sections
interface DropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownLabel({ children, className = '' }: DropdownLabelProps) {
  return (
    <div className={`px-4 py-3 text-white font-semibold text-sm border-b border-slate-600/40 ${className}`}>
      {children}
    </div>
  );
}