// ENHANCED USER MODAL WITH ANIMATIONS
import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Check, AlertCircle, User, Mail, Lock, MapPin, Shield, Wifi } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useWebSocketState } from '@/hooks/useWebSocketState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

interface UserModalProps {
  user?: any;
  onClose: () => void;
  onSave: () => void;
}

export function EnhancedUserModal({ user, onClose, onSave }: UserModalProps) {
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { ready, subscribe, lastMessage } = useWebSocketState();
  
  // Lock body scroll while modal is open
  useScrollLock(true);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    role: 'user',
    isActive: true
  });

  const [initialData, setInitialData] = useState<typeof formData | null>(null);

  useEffect(() => {
    if (user) {
      const data = {
        email: user.email || '',
        password: '', // Never pre-fill password
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        street: user.street || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        role: user.role || 'user',
        isActive: user.isActive !== undefined ? user.isActive : true
      };
      setFormData(data);
      setInitialData(data);
    } else {
      setInitialData(formData);
    }
  }, [user]);

  // Unsaved changes protection
  const unsavedChanges = useUnsavedChanges({
    hasChanges: initialData ? JSON.stringify(formData) !== JSON.stringify(initialData) : false,
    message: 'You have unsaved user changes. Would you like to save them before closing?'
  });

  // Disable Replit's beforeunload when modal is open
  useEffect(() => {
    // Override Replit's beforeunload handler
    const originalBeforeUnload = window.onbeforeunload;
    window.onbeforeunload = null;
    
    return () => {
      window.onbeforeunload = originalBeforeUnload;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClose = () => {
    if (!unsavedChanges.confirmNavigation(() => onClose())) {
      // Navigation was prevented, dialog is showing
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (email, first name, last name)",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!user && !formData.password) {
      toast({
        title: "Validation Error", 
        description: "Password is required for new users",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const endpoint = user 
        ? `/api/admin/users/${user.id}`
        : '/api/admin/users';
      
      const method = user ? 'PUT' : 'POST';
      
      // Don't send password if it's empty (for updates)
      const submitData: any = { ...formData };
      if (user && !submitData.password) {
        delete submitData.password;
      }
      
      // Submitting user data (password hidden)
      
      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify(submitData),
        credentials: 'include'
      });

      if (res.ok) {
        const result = await res.json();
        toast({
          title: "Success!",
          description: user ? 'User updated successfully' : 'User created successfully',
        });
        
        // Best-effort WebSocket notification (optional, non-blocking)
        try {
          if (ready && typeof subscribe === "function") {
            console.log('User update notification:', {
              userId: user?.id || result.user?.id,
              action: user ? 'update' : 'create',
              email: formData.email
            });
          }
        } catch (error) {
          console.log('WebSocket notification failed (non-critical):', error);
        }
        
        onSave();
        onClose();
      } else {
        const error = await res.json();
        throw new Error(error.error || error.message || 'Failed to save user');
      }
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || 'Failed to save user',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div 
        ref={modalRef}
        className="bg-[#1e293b] border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-[#1e293b] to-[#2d3748]">
          <div>
            <h2 className="text-xl font-bold text-white">
              {user ? 'Edit User' : 'Create New User'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {user ? `Editing: ${user.firstName} ${user.lastName}` : 'Add a new user account'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unsavedChanges.showDialog && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-400">Unsaved changes</span>
              </div>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-[#0f172a]/50">
          <div className="p-6 space-y-8">
            {/* Account Information */}
            <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Account Information
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Password {!user && <span className="text-red-400">*</span>}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={user ? "Leave blank to keep current" : "Enter password"}
                      required={!user}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="John"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Doe"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                Address Information
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Anytown"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>

            {/* User Role */}
            <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                User Role
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Role Level
                </label>
                <div className="relative">
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700/50 rounded-lg text-white 
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                             hover:border-gray-600/70 hover:bg-[#1e293b]/30
                             transition-all duration-300 ease-out
                             appearance-none cursor-pointer
                             shadow-sm hover:shadow-md"
                  >
                    <option value="user" className="bg-[#0f172a] text-white py-2 hover:bg-blue-500/20">
                      User
                    </option>
                    <option value="developer" className="bg-[#0f172a] text-white py-2 hover:bg-blue-500/20">
                      Developer
                    </option>
                  </select>
                  
                  {/* Enhanced Dropdown Arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${formData.role === 'developer' ? 'bg-blue-400' : 'bg-green-400'} animate-pulse`}></div>
                    <span className="text-xs font-medium text-gray-300">
                      {formData.role === 'developer' ? 'Developer Access' : 'Standard User'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {formData.role === 'developer' 
                      ? 'Full access to admin dashboard, system management, user controls, and all platform features' 
                      : 'Standard user access for shopping, account management, and basic platform features'
                    }
                  </p>
                </div>
                
                {/* Account Status Toggle */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Account Status
                  </label>
                  <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-green-400' : 'bg-gray-400'} animate-pulse`}></div>
                      <div>
                        <span className="text-sm font-medium text-gray-300">
                          {formData.isActive ? 'Active Account' : 'Inactive Account'}
                        </span>
                        <p className="text-xs text-gray-400">
                          {formData.isActive 
                            ? 'User can log in and access all platform features' 
                            : 'User account is disabled and cannot access the platform'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                        ${formData.isActive ? 'bg-green-500' : 'bg-gray-600'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
                          ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-700 bg-[#1e293b]/80 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {(initialData && JSON.stringify(formData) !== JSON.stringify(initialData)) && (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span>You have unsaved changes</span>
                </>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-gray-700 rounded-lg transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!formData.email || !formData.firstName || !formData.lastName)}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 btn-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {user ? 'Update User' : 'Create User'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Unsaved Changes Dialog */}
      <ConfirmDialog
        isOpen={unsavedChanges.showDialog}
        title="Unsaved User Changes"
        message="You have unsaved user changes. Would you like to save them before closing?"
        onSave={() => unsavedChanges.handleSave(() => {
          handleSubmit();
        })}
        onDiscard={unsavedChanges.handleDiscard}
        onCancel={unsavedChanges.handleCancel}
        showSave={true}
      />
    </div>
  );
}