import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownItem, DropdownDivider } from './DropdownComponents';
import { User, ShoppingCart, Package, Settings, LogOut } from 'lucide-react';
import { ROUTES } from '@/config/routes';

interface UnifiedUserDropdownProps {
  user: any;
  logoutMutation: any;
  handleNavigation: (href: string, e?: React.MouseEvent) => void;
}

export function UnifiedUserDropdown({ user, logoutMutation, handleNavigation }: UnifiedUserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = (href: string) => {
    setIsOpen(false);
    handleNavigation(href);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logoutMutation.mutate();
  };

  const triggerButton = (
    <Button
      variant="outline"
      size="sm"
      className="h-8 flex-shrink-0"
    >
      <User size={16} />
    </Button>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <div onClick={() => setIsOpen(!isOpen)}>
          {triggerButton}
        </div>
      }
      align="end"
      className="w-64"
    >
      {/* User Info Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <User size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.firstName ? user.email : 'Clean & Flip Member'}
            </p>
          </div>
          {user.isAdmin && (
            <span className="text-xs bg-muted px-2 py-1 rounded text-foreground font-medium">
              ADMIN
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="py-2">
        <DropdownItem
          onSelect={() => handleItemClick(ROUTES.DASHBOARD)}
          icon={<User className="h-4 w-4" />}
        >
          My Dashboard
        </DropdownItem>
        
        <DropdownItem
          onSelect={() => handleItemClick(ROUTES.ORDERS)}
          icon={<ShoppingCart className="h-4 w-4" />}
        >
          Order History
        </DropdownItem>
        
        <DropdownItem
          onSelect={() => handleItemClick(`${ROUTES.DASHBOARD}?tab=submissions`)}
          icon={<Package className="h-4 w-4" />}
        >
          My Submissions
        </DropdownItem>

        {(user.role === 'developer' || user.role === 'admin' || user.isAdmin) && (
          <DropdownItem
            onSelect={() => handleItemClick(ROUTES.ADMIN)}
            icon={<Settings className="h-4 w-4" />}
          >
            Developer Dashboard
          </DropdownItem>
        )}
      </div>

      <DropdownDivider />
      
      {/* Logout */}
      <div className="py-2">
        <DropdownItem
          onSelect={handleLogout}
          icon={<LogOut className="h-4 w-4" />}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          Sign Out
        </DropdownItem>
      </div>
    </Dropdown>
  );
}