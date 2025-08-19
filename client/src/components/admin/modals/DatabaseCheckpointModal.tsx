// DATABASE CHECKPOINT CREATION MODAL
import { useState, useEffect } from 'react';
import { X, Download, RefreshCw } from 'lucide-react';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { globalDesignSystem as theme } from '@/styles/design-system/theme';
import { useScrollLock } from '@/hooks/useScrollLock';

interface DatabaseCheckpointModalProps {
  branch: string;
  isOpen: boolean;
  onClose: () => void;
  onCheckpointCreated: () => void;
}

export function DatabaseCheckpointModal({ branch, isOpen, onClose, onCheckpointCreated }: DatabaseCheckpointModalProps) {
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [checkpointNotes, setCheckpointNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Lock scroll when modal is open
  useScrollLock(isOpen);

  const createCheckpoint = async () => {
    if (!checkpointLabel.trim()) return;
    
    setIsCreating(true);
    
    try {
      const response = await fetch(`/api/admin/db/${branch}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          label: checkpointLabel,
          notes: checkpointNotes 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Checkpoint creation failed');
      }
      
      const result = await response.json();
      console.log('Checkpoint created successfully:', result);
      
      // Close modal and refresh data
      handleClose();
      onCheckpointCreated();
    } catch (err: any) {
      console.error('Checkpoint creation failed:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setCheckpointLabel('');
    setCheckpointNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg mx-4 my-8 max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden border"
        style={{ 
          backgroundColor: theme.colors.bg.primary,
          borderColor: theme.colors.border.default
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: theme.colors.border.default }}
        >
          <div className="flex items-center space-x-4">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: theme.colors.bg.secondary }}
            >
              <Download className="h-5 w-5" style={{ color: theme.colors.brand.purple }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                Create Database Checkpoint
              </h2>
              <p className="text-sm" style={{ color: theme.colors.text.muted }}>
                Create a backup checkpoint for {branch === 'dev' ? 'Development' : 'Production'} database
              </p>
            </div>
          </div>
          
          <UnifiedButton
            variant="ghost"
            size="sm"
            onClick={handleClose}
            data-testid="button-close-checkpoint-modal"
          >
            <X className="h-4 w-4" />
          </UnifiedButton>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Checkpoint Label */}
          <div className="space-y-2">
            <label 
              htmlFor="checkpoint-label" 
              className="text-sm font-medium"
              style={{ color: theme.colors.text.secondary }}
            >
              Checkpoint Label *
            </label>
            <input
              id="checkpoint-label"
              type="text"
              value={checkpointLabel}
              onChange={(e) => setCheckpointLabel(e.target.value)}
              placeholder="e.g., Pre-deployment backup"
              className="w-full px-4 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: theme.colors.bg.secondary,
                borderColor: theme.colors.border.default,
                color: theme.colors.text.primary
              }}
              data-testid="input-checkpoint-label"
            />
          </div>

          {/* Checkpoint Notes */}
          <div className="space-y-2">
            <label 
              htmlFor="checkpoint-notes" 
              className="text-sm font-medium"
              style={{ color: theme.colors.text.secondary }}
            >
              Notes (Optional)
            </label>
            <textarea
              id="checkpoint-notes"
              value={checkpointNotes}
              onChange={(e) => setCheckpointNotes(e.target.value)}
              placeholder="Add any notes about this checkpoint..."
              className="w-full px-4 py-2 rounded-lg border text-sm h-24 resize-none"
              style={{
                backgroundColor: theme.colors.bg.secondary,
                borderColor: theme.colors.border.default,
                color: theme.colors.text.primary
              }}
              data-testid="textarea-checkpoint-notes"
            />
          </div>

          {/* Warning Note */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: theme.colors.status.warning + '20',
              borderColor: theme.colors.status.warning 
            }}
          >
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              <strong>Note:</strong> Creating a checkpoint will capture the current state of the {branch === 'dev' ? 'development' : 'production'} database. 
              This process may take a few moments depending on database size.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-end space-x-3 p-6 border-t"
          style={{ borderColor: theme.colors.border.default }}
        >
          <UnifiedButton
            variant="ghost"
            onClick={handleClose}
            disabled={isCreating}
            data-testid="button-cancel-checkpoint"
          >
            Cancel
          </UnifiedButton>
          
          <UnifiedButton
            variant="primary"
            onClick={createCheckpoint}
            disabled={!checkpointLabel.trim() || isCreating}
            data-testid="button-create-checkpoint"
          >
            {isCreating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Create Checkpoint
              </>
            )}
          </UnifiedButton>
        </div>
      </div>
    </div>
  );
}