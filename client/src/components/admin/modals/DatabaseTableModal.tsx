// DATABASE TABLE DETAILS MODAL
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Table as TableIcon, Database, Eye, RefreshCw } from 'lucide-react';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { globalDesignSystem as theme } from '@/styles/design-system/theme';
import { useScrollLock } from '@/hooks/useScrollLock';

interface DatabaseTableModalProps {
  table: {
    table_schema: string;
    table_name: string;
    table_type: string;
    total_bytes: string;
    row_count_estimate: string;
  };
  branch: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable?: string;
  column_default?: string;
}

interface TableIndex {
  indexname: string;
  indexdef: string;
}

export function DatabaseTableModal({ table, branch, isOpen, onClose }: DatabaseTableModalProps) {
  const [activeTab, setActiveTab] = useState<'structure' | 'indexes' | 'data'>('structure');
  
  // Lock scroll when modal is open
  useScrollLock(isOpen);

  // Fetch table details
  const { data: tableDetails, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/db/' + branch + '/tables/' + table.table_schema + '/' + table.table_name],
    queryFn: async () => {
      const res = await fetch(`/api/admin/db/${branch}/tables/${table.table_schema}/${table.table_name}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch table details');
      return res.json();
    },
    enabled: isOpen && !!branch && !!table,
  });

  // Fetch table data preview
  const { data: tableData, isLoading: dataLoading } = useQuery({
    queryKey: ['/api/admin/db/' + branch + '/table-data', table.table_name],
    queryFn: async () => {
      const res = await fetch(`/api/admin/db/${branch}/table-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          table: table.table_name,
          schema: table.table_schema,
          limit: 10,
          offset: 0
        })
      });
      if (!res.ok) throw new Error('Failed to fetch table data');
      return res.json();
    },
    enabled: isOpen && activeTab === 'data' && !!branch && !!table,
  });

  if (!isOpen) return null;

  const columns: TableColumn[] = tableDetails?.columns || [];
  const indexes: TableIndex[] = tableDetails?.indexes || [];
  const dataRows = tableData?.rows || [];
  const dataColumns = tableData?.columns || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
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
              <TableIcon className="h-5 w-5" style={{ color: theme.colors.brand.blue }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                {table.table_name}
              </h2>
              <p className="text-sm" style={{ color: theme.colors.text.muted }}>
                Schema: {table.table_schema} • Type: {table.table_type}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: theme.colors.brand.blueLight,
                color: theme.colors.brand.blue 
              }}
            >
              {branch === 'dev' ? 'Development' : 'Production'}
            </span>
            <UnifiedButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-table-modal"
            >
              <X className="h-4 w-4" />
            </UnifiedButton>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-8rem)]">
          {/* Tabs */}
          <div 
            className="flex border-b"
            style={{ borderColor: theme.colors.border.default }}
          >
            {[
              { key: 'structure', label: 'Table Structure', icon: Database },
              { key: 'indexes', label: 'Indexes', icon: Eye },
              { key: 'data', label: 'Data Preview', icon: TableIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'border-b-2 text-blue-400 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                data-testid={`tab-${key}`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <RefreshCw className="h-6 w-6 animate-spin" style={{ color: theme.colors.text.muted }} />
                <span className="ml-2" style={{ color: theme.colors.text.muted }}>
                  Loading table details...
                </span>
              </div>
            ) : (
              <>
                {/* Structure Tab */}
                {activeTab === 'structure' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium" style={{ color: theme.colors.text.primary }}>
                        Columns ({columns.length})
                      </h3>
                      <div className="flex items-center space-x-4 text-sm" style={{ color: theme.colors.text.muted }}>
                        <span>Rows: {table.row_count_estimate === '-1' ? 'Unknown' : table.row_count_estimate}</span>
                        <span>Size: {(parseInt(table.total_bytes) / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b" style={{ borderColor: theme.colors.border.default }}>
                            <th className="text-left py-3 px-4 font-medium" style={{ color: theme.colors.text.secondary }}>
                              Column Name
                            </th>
                            <th className="text-left py-3 px-4 font-medium" style={{ color: theme.colors.text.secondary }}>
                              Data Type
                            </th>
                            <th className="text-left py-3 px-4 font-medium" style={{ color: theme.colors.text.secondary }}>
                              Nullable
                            </th>
                            <th className="text-left py-3 px-4 font-medium" style={{ color: theme.colors.text.secondary }}>
                              Default
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {columns.map((column, index) => (
                            <tr 
                              key={index}
                              className="border-b hover:bg-gray-800/50"
                              style={{ borderColor: theme.colors.border.default }}
                            >
                              <td className="py-3 px-4">
                                <span className="font-mono text-sm" style={{ color: theme.colors.text.primary }}>
                                  {column.column_name}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span 
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{ 
                                    backgroundColor: theme.colors.brand.purpleLight,
                                    color: theme.colors.brand.purple 
                                  }}
                                >
                                  {column.data_type}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span 
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    column.is_nullable === 'YES' 
                                      ? 'bg-yellow-500/10 text-yellow-400' 
                                      : 'bg-red-500/10 text-red-400'
                                  }`}
                                >
                                  {column.is_nullable === 'YES' ? 'Nullable' : 'Not Null'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-mono text-sm" style={{ color: theme.colors.text.muted }}>
                                  {column.column_default || 'None'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Indexes Tab */}
                {activeTab === 'indexes' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium" style={{ color: theme.colors.text.primary }}>
                      Indexes ({indexes.length})
                    </h3>
                    
                    {indexes.length > 0 ? (
                      <div className="space-y-3">
                        {indexes.map((index, i) => (
                          <div 
                            key={i}
                            className="p-4 rounded-lg border"
                            style={{ 
                              backgroundColor: theme.colors.bg.secondary,
                              borderColor: theme.colors.border.default 
                            }}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <Eye className="h-4 w-4" style={{ color: theme.colors.brand.green }} />
                              <span className="font-medium" style={{ color: theme.colors.text.primary }}>
                                {index.indexname}
                              </span>
                            </div>
                            <code 
                              className="text-xs font-mono block p-2 rounded"
                              style={{ 
                                backgroundColor: theme.colors.bg.primary,
                                color: theme.colors.text.muted 
                              }}
                            >
                              {index.indexdef}
                            </code>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Eye className="h-8 w-8 mx-auto mb-2" style={{ color: theme.colors.text.muted }} />
                        <p style={{ color: theme.colors.text.muted }}>No indexes found</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Data Tab */}
                {activeTab === 'data' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium" style={{ color: theme.colors.text.primary }}>
                        Data Preview ({dataRows.length} rows)
                      </h3>
                      {dataLoading && (
                        <div className="flex items-center space-x-2 text-sm" style={{ color: theme.colors.text.muted }}>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Loading data...</span>
                        </div>
                      )}
                    </div>
                    
                    {dataRows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b" style={{ borderColor: theme.colors.border.default }}>
                              {dataColumns.map((column: any, index: number) => (
                                <th 
                                  key={index}
                                  className="text-left py-3 px-4 font-medium" 
                                  style={{ color: theme.colors.text.secondary }}
                                >
                                  {column.column_name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dataRows.map((row: any, rowIndex: number) => (
                              <tr 
                                key={rowIndex}
                                className="border-b hover:bg-gray-800/50"
                                style={{ borderColor: theme.colors.border.default }}
                              >
                                {dataColumns.map((column: any, colIndex: number) => (
                                  <td key={colIndex} className="py-3 px-4">
                                    <span className="text-sm font-mono" style={{ color: theme.colors.text.primary }}>
                                      {row[column.column_name] !== null ? 
                                        String(row[column.column_name]) : 
                                        <span style={{ color: theme.colors.text.muted }}>NULL</span>
                                      }
                                    </span>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : !dataLoading ? (
                      <div className="text-center py-8">
                        <TableIcon className="h-8 w-8 mx-auto mb-2" style={{ color: theme.colors.text.muted }} />
                        <p style={{ color: theme.colors.text.muted }}>
                          No data found in this table
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}