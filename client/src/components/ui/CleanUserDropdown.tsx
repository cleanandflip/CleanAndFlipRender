import React from 'react';
import { User, Settings, LogOut, ShieldCheck, Package, Heart } from 'lucide-react';
import { SimpleDropdown, SimpleDropdownItem, SimpleDropdownSection } from './SimpleDropdown';
import { Button } from './button';

interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  isAdmin?: boolean;
  avatar?: string;
}

interface CleanUserDropdownProps {
  user: UserData;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function CleanUserDropdown({ user, onNavigate, onLogout }: CleanUserDropdownProps) {
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.email.split('@')[0];

  return (
    <SimpleDropdown
      trigger={
        <Button variant="ghost" size="sm" className="flex items-center gap-2 h-9 px-2">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={16} className="text-muted-foreground" />
            )}
          </div>
          <span className="hidden sm:inline-block font-medium">
            {displayName}
          </span>
        </Button>
      }
      align="end"
    >
      <div className="user-info-header">
        <div className="flex items-center">
          <div className="user-avatar">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{displayName}</div>
            <div className="user-email">{user.email}</div>
          </div>
          {user.isAdmin && (
            <div className="admin-badge">Admin</div>
          )}
        </div>
      </div>

      <SimpleDropdownSection>
        <SimpleDropdownItem
          icon={<Package size={16} />}
          onClick={() => onNavigate('/orders')}
        >
          My Orders
        </SimpleDropdownItem>
        <SimpleDropdownItem
          icon={<Heart size={16} />}
          onClick={() => onNavigate('/wishlist')}
        >
          Wishlist
        </SimpleDropdownItem>
        <SimpleDropdownItem
          icon={<Settings size={16} />}
          onClick={() => onNavigate('/settings')}
        >
          Settings
        </SimpleDropdownItem>
      </SimpleDropdownSection>

      {user.isAdmin && (
        <SimpleDropdownSection>
          <SimpleDropdownItem
            icon={<ShieldCheck size={16} />}
            onClick={() => onNavigate('/admin')}
          >
            Admin Dashboard
          </SimpleDropdownItem>
        </SimpleDropdownSection>
      )}

      <SimpleDropdownSection>
        <SimpleDropdownItem
          icon={<LogOut size={16} />}
          onClick={onLogout}
          className="danger"
        >
          Sign Out
        </SimpleDropdownItem>
      </SimpleDropdownSection>
    </SimpleDropdown>
  );
}