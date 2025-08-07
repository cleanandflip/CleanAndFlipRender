import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ThemedModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl'
};

export const ThemedModal: React.FC<ThemedModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = 'lg'
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          'max-h-[90vh] overflow-y-auto bg-card border border-border text-card-foreground',
          sizeClasses[size],
          className
        )}
      >
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-foreground font-bebas text-xl tracking-wider">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="pt-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemedModal;