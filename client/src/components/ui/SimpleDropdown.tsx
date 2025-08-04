import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface SimpleDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
}

export function SimpleDropdown({ 
  trigger, 
  children, 
  align = 'start',
  sideOffset = 8,
  className = ''
}: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = Math.min(Math.max(rect.width, 200), 400);
      
      let left = rect.left;
      if (align === 'center') {
        left = rect.left + (rect.width / 2) - (dropdownWidth / 2);
      } else if (align === 'end') {
        left = rect.right - dropdownWidth;
      }
      
      // Keep dropdown on screen
      left = Math.max(16, Math.min(left, viewportWidth - dropdownWidth - 16));
      
      setPosition({
        top: rect.bottom + sideOffset,
        left,
        width: dropdownWidth
      });
    }
  }, [isOpen, align, sideOffset]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={`fixed z-[999999] ${className}`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
            }}
          >
            <div className="simple-dropdown-content">
              {children}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

interface SimpleDropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
}

export function SimpleDropdownItem({ 
  children, 
  onClick, 
  icon, 
  className = '' 
}: SimpleDropdownItemProps) {
  return (
    <button
      type="button"
      className={`simple-dropdown-item ${className}`}
      onClick={onClick}
    >
      {icon && <span className="simple-dropdown-icon">{icon}</span>}
      <span className="simple-dropdown-text">{children}</span>
    </button>
  );
}

interface SimpleDropdownSectionProps {
  title?: string;
  children: ReactNode;
}

export function SimpleDropdownSection({ title, children }: SimpleDropdownSectionProps) {
  return (
    <div className="simple-dropdown-section">
      {title && <div className="simple-dropdown-section-title">{title}</div>}
      {children}
    </div>
  );
}