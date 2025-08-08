import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Settings, Package, LogOut } from "lucide-react";
import { ROUTES } from "@/config/routes";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean | null;
}

interface CleanDropdownProps {
  user: User;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function CleanDropdown({ user, onNavigate, onLogout }: CleanDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="bg-secondary border border-primary/30 w-10 h-10 flex-shrink-0 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
        >
          <User size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-gray-900/98 border border-gray-600/50 backdrop-blur-sm"
      >
        <DropdownMenuItem 
          onClick={() => onNavigate(ROUTES.DASHBOARD)}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        {user.isAdmin && (
          <DropdownMenuItem 
            onClick={() => onNavigate(ROUTES.ADMIN)}
            className="text-white hover:bg-white/10 cursor-pointer"
          >
            <Package className="mr-2 h-4 w-4" />
            Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-gray-600/50" />
        <DropdownMenuItem 
          onClick={onLogout}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}