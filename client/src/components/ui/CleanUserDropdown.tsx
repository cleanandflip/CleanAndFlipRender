import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ShieldCheck, Package, Heart } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.email.split('@')[0];

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 focus:outline-none"
        style={{
          background: 'rgba(75, 85, 99, 0.4)',
          border: '1px solid rgba(156, 163, 175, 0.4)',
          color: 'white',
          fontWeight: '500'
        }}
      >
        <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={16} className="text-gray-400" />
          )}
        </div>
        <span className="hidden sm:inline-block font-medium text-white">
          {displayName}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div 
            className="absolute top-full right-0 mt-2 z-50 w-64 rounded-lg overflow-hidden"
            style={{
              background: 'rgba(75, 85, 99, 0.4)',
              border: '1px solid rgba(156, 163, 175, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            {/* User Info Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{displayName}</div>
                  <div className="text-sm text-gray-400 truncate">{user.email}</div>
                </div>
                {user.isAdmin && (
                  <div className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    ADMIN
                  </div>
                )}
              </div>
            </div>

            <div className="p-2 space-y-1">
              <button
                onClick={() => handleItemClick(() => onNavigate('/orders'))}
                className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-white/10 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center">
                  <Package size={16} className="text-gray-400" />
                </div>
                <span className="text-white font-medium">My Orders</span>
              </button>
              
              <button
                onClick={() => handleItemClick(() => onNavigate('/wishlist'))}
                className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-white/10 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center">
                  <Heart size={16} className="text-gray-400" />
                </div>
                <span className="text-white font-medium">Wishlist</span>
              </button>
              
              <button
                onClick={() => handleItemClick(() => onNavigate('/settings'))}
                className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-white/10 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center">
                  <Settings size={16} className="text-gray-400" />
                </div>
                <span className="text-white font-medium">Settings</span>
              </button>

              {user.isAdmin && (
                <button
                  onClick={() => handleItemClick(() => onNavigate('/admin'))}
                  className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-white/10 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center">
                    <ShieldCheck size={16} className="text-gray-400" />
                  </div>
                  <span className="text-white font-medium">Admin Dashboard</span>
                </button>
              )}

              <div className="border-t border-white/10 pt-2 mt-2">
                <button
                  onClick={() => handleItemClick(onLogout)}
                  className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-red-500/20 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center">
                    <LogOut size={16} className="text-red-400" />
                  </div>
                  <span className="text-red-400 font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}