// CHECKPOINT MANAGER MODAL - View and rollback database checkpoints
import { useState } from 'react';
import { X, Clock, RotateCcw, Calendar, MessageSquare } from 'lucide-react';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { globalDesignSystem as theme } from '@/styles/design-system/theme';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface CheckpointManagerModalProps {
  branch: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Checkpoint {
  id: string;
  label: string;
  notes: string;
  branch: string;
  created_at: string;
}

export function CheckpointManagerModal({ branch, isOpen, onClose }: CheckpointManagerModalProps) {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Lock scroll when modal is open
  useScrollLock(isOpen);

  // Fetch checkpoints
  const { data: checkpoints = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/db/' + branch + '/checkpoints'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/db/${branch}/checkpoints`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch checkpoints');
      return res.json();
    },
    enabled: isOpen && !!branch,
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async ({ checkpointId, confirmPhrase }: { checkpointId: string; confirmPhrase: string }) => {
      const res = await fetch(`/api/admin/db/${branch}/rollback/${checkpointId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmPhrase })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Rollback failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Rollback Successful",
        description: data.message,
        variant: "default",
      });
      setShowRollbackConfirm(false);
      setSelectedCheckpoint(null);
      setConfirmPhrase('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/db'] });
    },
    onError: (error: any) => {
      toast({
        title: "Rollback Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleRollback = () => {
    if (!selectedCheckpoint) return;
    rollbackMutation.mutate({
      checkpointId: selectedCheckpoint.id,
      confirmPhrase
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl mx-4 my-8 max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden border"
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
              <Clock className="h-5 w-5" style={{ color: theme.colors.brand.green }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                Database Checkpoints
              </h2>
              <p className="text-sm" style={{ color: theme.colors.text.muted }}>
                Branch: {branch === 'dev' ? 'Development' : 'Production'} • {checkpoints.length} checkpoints
              </p>
            </div>
          </div>
          
          <UnifiedButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-checkpoint-manager"
          >
            <X className="h-4 w-4" />
          </UnifiedButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.brand.blue }}></div>
            </div>
          ) : checkpoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Clock className="h-16 w-16 mb-4" style={{ color: theme.colors.text.muted }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                No Checkpoints Found
              </h3>
              <p className="text-sm" style={{ color: theme.colors.text.muted }}>
                Create checkpoints to restore your database to previous states
              </p>
            </div>
          ) : !showRollbackConfirm ? (
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
              <div className="space-y-4">
                {checkpoints.map((checkpoint: Checkpoint) => (
                  <div 
                    key={checkpoint.id}
                    className="p-4 rounded-lg border hover:border-blue-500/50 transition-colors cursor-pointer"
                    style={{ 
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default 
                    }}
                    onClick={() => setSelectedCheckpoint(checkpoint)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Clock className="h-4 w-4" style={{ color: theme.colors.brand.green }} />
                          <h3 className="font-medium" style={{ color: theme.colors.text.primary }}>
                            {checkpoint.label}
                          </h3>
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: theme.colors.brand.blueLight,
                              color: theme.colors.brand.blue 
                            }}
                          >
                            {checkpoint.branch}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm mb-2" style={{ color: theme.colors.text.muted }}>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(checkpoint.created_at)}</span>
                          </div>
                        </div>
                        
                        {checkpoint.notes && (
                          <div className="flex items-start space-x-2 text-sm">
                            <MessageSquare className="h-3 w-3 mt-1" style={{ color: theme.colors.text.muted }} />
                            <p style={{ color: theme.colors.text.secondary }}>
                              {checkpoint.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <UnifiedButton
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedCheckpoint(checkpoint);
                          setShowRollbackConfirm(true);
                        }}
                        data-testid={`button-rollback-${checkpoint.id}`}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Rollback
                      </UnifiedButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Rollback confirmation screen
            <div className="p-6 flex items-center justify-center min-h-[400px]">
              <div className="max-w-md text-center">
                <div 
                  className="p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.status.warning + '20' }}
                >
                  <RotateCcw className="h-8 w-8" style={{ color: theme.colors.status.warning }} />
                </div>
                
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>
                  Confirm Database Rollback
                </h3>
                
                <p className="text-sm mb-4" style={{ color: theme.colors.text.muted }}>
                  This will rollback your database to checkpoint "{selectedCheckpoint?.label}". This action cannot be undone.
                </p>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                    Type "ROLLBACK {branch.toUpperCase()}" to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-center font-mono"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    placeholder={`ROLLBACK ${branch.toUpperCase()}`}
                    data-testid="input-rollback-confirm"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <UnifiedButton
                    variant="secondary"
                    onClick={() => {
                      setShowRollbackConfirm(false);
                      setConfirmPhrase('');
                    }}
                    className="flex-1"
                    data-testid="button-cancel-rollback"
                  >
                    Cancel
                  </UnifiedButton>
                  <UnifiedButton
                    variant="danger"
                    onClick={handleRollback}
                    disabled={confirmPhrase !== `ROLLBACK ${branch.toUpperCase()}` || rollbackMutation.isPending}
                    className="flex-1"
                    data-testid="button-confirm-rollback"
                  >
                    {rollbackMutation.isPending ? 'Rolling back...' : 'Confirm Rollback'}
                  </UnifiedButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}