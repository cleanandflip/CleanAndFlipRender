import React, { ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafePortal } from '@/hooks/useSafePortal';

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  alignOffset?: number;
  modal?: boolean;
}

export function Dropdown({
  isOpen,
  onClose,
  trigger,
  children,
  className = '',
  align = 'start',
  side = 'bottom',
  sideOffset = 8,
  alignOffset = 0,
  modal = false
}: DropdownProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMobile, setIsMobile] = useState(false);
  
  // Safe portal hook to prevent removeChild errors
  const { portalRoot, isReady } = useSafePortal();

  // Update position when opening
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      setIsMobile(viewportWidth < 768);
      
      // Calculate dropdown width
      const dropdownWidth = isMobile 
        ? viewportWidth - 32 
        : Math.min(Math.max(rect.width * 1.2, 300), 500);
      
      let left = rect.left;
      let top = rect.bottom + sideOffset;
      
      // Adjust for alignment
      if (align === 'center') {
        left = rect.left + (rect.width / 2) - (dropdownWidth / 2);
      } else if (align === 'end') {
        left = rect.right - dropdownWidth;
      }
      
      // Ensure dropdown doesn't go off-screen
      if (!isMobile) {
        if (left + dropdownWidth > viewportWidth) {
          left = viewportWidth - dropdownWidth - 16;
        }
        left = Math.max(16, left);
        
        const maxDropdownHeight = 400;
        if (top + maxDropdownHeight > viewportHeight) {
          top = rect.top - maxDropdownHeight - sideOffset;
        }
      } else {
        left = 16;
        top = 72; // Fixed position below header on mobile
      }
      
      setPosition({ top, left, width: dropdownWidth });
    }
  }, [align, sideOffset, isMobile]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && 
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      if (isMobile && modal) {
        document.body.classList.add('dropdown-modal-open');
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        if (isMobile && modal) {
          document.body.classList.remove('dropdown-modal-open');
        }
      };
    }
  }, [isOpen, isMobile, modal, onClose]);

  const dropdown = isReady && portalRoot && createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          key="dropdown"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`fixed z-[999999] ${className}`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            transformOrigin: '0 0',
          }}
        >
          <div className={`dropdown-container ${isMobile ? 'dropdown-container-mobile' : ''}`}>
            <div className="dropdown-scrollbar overflow-y-auto max-h-[70vh]">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot
  );

  return (
    <>
      <div ref={triggerRef} className="relative">
        {trigger}
      </div>
      {dropdown}
    </>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onSelect?: () => void;
  className?: string;
  selected?: boolean;
  icon?: ReactNode;
}

export function DropdownItem({ 
  children, 
  onSelect, 
  className = '', 
  selected = false,
  icon 
}: DropdownItemProps) {
  return (
    <button
      type="button"
      className={`dropdown-item ${selected ? 'selected' : ''} ${className}`}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect?.();
      }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </button>
  );
}

interface DropdownSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function DropdownSection({ title, icon, children }: DropdownSectionProps) {
  return (
    <div>
      <div className="dropdown-section-header">
        {icon && <span className="text-text-muted">{icon}</span>}
        <span className="dropdown-section-title">{title}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

export function DropdownDivider() {
  return <div className="dropdown-divider" />;
}

interface DropdownLoadingProps {
  text?: string;
  icon?: ReactNode;
}

export function DropdownLoading({ text = "Loading...", icon }: DropdownLoadingProps) {
  return (
    <div className="dropdown-loading">
      <div className="spinner">
        {icon || <div className="w-8 h-8 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />}
      </div>
      <p className="text">{text}</p>
    </div>
  );
}

interface DropdownEmptyProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function DropdownEmpty({ title, subtitle, icon }: DropdownEmptyProps) {
  return (
    <div className="dropdown-empty">
      {icon && <div className="icon">{icon}</div>}
      <p className="title">{title}</p>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </div>
  );
}

interface DropdownErrorProps {
  title: string;
  subtitle?: string;
}

export function DropdownError({ title, subtitle }: DropdownErrorProps) {
  return (
    <div className="dropdown-error">
      <p className="title">{title}</p>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </div>
  );
}