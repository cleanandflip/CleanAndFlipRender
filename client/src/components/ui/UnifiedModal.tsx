/**
 * UNIFIED MODAL COMPONENT - PHASE 10: MODAL/DIALOG STANDARDIZATION
 * Standardized modal component following design system specifications
 * August 10, 2025 - Professional UI Modernization
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODALS, INTERACTIONS } from '@/config/dimensions';
import { UnifiedButton } from './UnifiedButton';

interface UnifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const UnifiedModal: React.FC<UnifiedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = 'md',
  className
}) => {
  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, isOpen, onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const getSizeClasses = () => {
    const sizeClasses = {
      sm: 'max-w-sm',      // 384px
      md: 'max-w-lg',      // 512px - MODALS.container.maxWidth
      lg: 'max-w-2xl',     // 672px
      xl: 'max-w-4xl',     // 896px
      full: 'max-w-[95vw]' // Nearly full screen
    };
    return sizeClasses[size];
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              // Base modal styling - following MODALS.container specs
              'relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700',
              'p-6 m-4 w-full max-h-[90vh] overflow-y-auto',
              getSizeClasses(),
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between mb-6 min-h-[56px]">
                {title && (
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <UnifiedButton
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-4 h-4" />}
                    onClick={onClose}
                    className="ml-auto"
                    aria-label="Close modal"
                  />
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="space-y-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render portal if in browser
  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

// Modal Footer component for consistent button layouts
interface UnifiedModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'justify';
  children: React.ReactNode;
}

export const UnifiedModalFooter: React.FC<UnifiedModalFooterProps> = ({
  align = 'right',
  className,
  children,
  ...props
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    justify: 'justify-between'
  };

  return (
    <div
      className={cn(
        'flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6',
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Modal Content component for consistent spacing
interface UnifiedModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const UnifiedModalContent: React.FC<UnifiedModalContentProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn('space-y-4 py-4', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default UnifiedModal;