// DATABASE SQL QUERY EXECUTION MODAL
import { useState } from 'react';
import { X, Terminal, Play, RefreshCw, AlertTriangle } from 'lucide-react';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { globalDesignSystem as theme } from '@/styles/design-system/theme';

interface DatabaseQueryModalProps {
  branch: string;
  isOpen: boolean;
  onClose: () => void;
  onQueryExecuted: () => void;
}

export function DatabaseQueryModal({ branch, isOpen, onClose, onQueryExecuted }: DatabaseQueryModalProps) {
  const [sqlQuery, setSqlQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    if (!sqlQuery.trim()) return;
    
    setIsExecuting(true);
    setError(null);
    setQueryResult(null);
    
    try {
      const response = await fetch(`/api/admin/db/${branch}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: sqlQuery }),
      });
      
      if (!response.ok) {
        throw new Error('Query execution failed');
      }
      
      const result = await response.json();
      setQueryResult(result);
      onQueryExecuted();
    } catch (err: any) {
      setError(err.message || 'Query execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    setSqlQuery('');
    setQueryResult(null);
    setError(null);
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
        className="relative w-full max-w-4xl max-h-[90vh] m-4 rounded-xl shadow-2xl overflow-hidden border"
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
              <Terminal className="h-5 w-5" style={{ color: theme.colors.brand.green }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                SQL Query Console
              </h2>
              <p className="text-sm" style={{ color: theme.colors.text.muted }}>
                Execute SQL queries on {branch === 'dev' ? 'Development' : 'Production'} database
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: theme.colors.brand.greenLight,
                color: theme.colors.brand.green 
              }}
            >
              {branch === 'dev' ? 'Development' : 'Production'}
            </span>
            <UnifiedButton
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-testid="button-close-query-modal"
            >
              <X className="h-4 w-4" />
            </UnifiedButton>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-8rem)]">
          {/* Query Input */}
          <div className="p-6 border-b" style={{ borderColor: theme.colors.border.default }}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                  SQL Query
                </label>
                <UnifiedButton
                  variant="primary"
                  size="sm"
                  onClick={executeQuery}
                  disabled={!sqlQuery.trim() || isExecuting}
                  data-testid="button-execute-sql"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute Query
                    </>
                  )}
                </UnifiedButton>
              </div>
              
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="Enter your SQL query here... (e.g., SELECT * FROM products LIMIT 10)"
                className="w-full h-32 px-4 py-3 rounded-lg border font-mono text-sm resize-none"
                style={{
                  backgroundColor: theme.colors.bg.secondary,
                  borderColor: theme.colors.border.default,
                  color: theme.colors.text.primary
                }}
                data-testid="textarea-sql-query"
              />
              
              {/* Quick Query Examples */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium" style={{ color: theme.colors.text.muted }}>
                  Quick examples:
                </span>
                {[
                  'SELECT * FROM products LIMIT 5;',
                  'SELECT COUNT(*) FROM users;',
                  'SHOW TABLES;'
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setSqlQuery(example)}
                    className="px-2 py-1 rounded text-xs font-mono hover:bg-gray-700/50 transition-colors"
                    style={{ color: theme.colors.brand.blue }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto p-6">
            {error && (
              <div 
                className="p-4 rounded-lg border mb-4"
                style={{ 
                  backgroundColor: theme.colors.status.error + '20',
                  borderColor: theme.colors.status.error 
                }}
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5" style={{ color: theme.colors.status.error }} />
                  <div>
                    <h4 className="font-medium" style={{ color: theme.colors.status.error }}>
                      Query Error
                    </h4>
                    <p className="text-sm mt-1" style={{ color: theme.colors.text.secondary }}>
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {queryResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium" style={{ color: theme.colors.text.primary }}>
                    Query Results
                  </h3>
                  {queryResult.rows && (
                    <span className="text-sm" style={{ color: theme.colors.text.muted }}>
                      {queryResult.rows.length} rows returned
                    </span>
                  )}
                </div>
                
                <div 
                  className="p-4 rounded-lg border overflow-auto"
                  style={{ 
                    backgroundColor: theme.colors.bg.secondary,
                    borderColor: theme.colors.border.default 
                  }}
                >
                  <pre 
                    className="text-xs font-mono whitespace-pre-wrap"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {JSON.stringify(queryResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {!queryResult && !error && !isExecuting && (
              <div className="text-center py-12">
                <Terminal className="h-12 w-12 mx-auto mb-4" style={{ color: theme.colors.text.muted }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                  Ready to Execute SQL
                </h3>
                <p className="text-sm" style={{ color: theme.colors.text.muted }}>
                  Enter a SQL query above and click "Execute Query" to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}