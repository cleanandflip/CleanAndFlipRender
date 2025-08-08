// NATIVE CONFIRMATION DIALOG
import { createPortal } from 'react-dom';
import { AlertTriangle, Save, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onSave?: () => void;
  onDiscard?: () => void;
  onCancel?: () => void;
  showSave?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title = 'Unsaved Changes',
  message = 'You have unsaved changes. What would you like to do?',
  onSave,
  onDiscard,
  onCancel,
  showSave = true
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-[#1e293b] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-300">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={onDiscard}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg transition-colors"
          >
            Discard Changes
          </button>
          
          {showSave && onSave && (
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}