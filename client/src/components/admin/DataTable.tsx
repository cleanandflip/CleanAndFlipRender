import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (row: any) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column[];
  data: T[];
  selectedRows: Set<string>;
  onSelectRow: (id: string) => void;
  onSort: (column: string, order: 'asc' | 'desc') => void;
  actions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  selectedRows,
  onSelectRow,
  onSort,
  actions,
  onRowClick,
  isLoading = false
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    const newOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortOrder(newOrder);
    onSort(column, newOrder);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      // Deselect all
      data.forEach(row => onSelectRow(row.id));
    } else {
      // Select all
      data.forEach(row => {
        if (!selectedRows.has(row.id)) {
          onSelectRow(row.id);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-secondary rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-700 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary rounded-lg overflow-hidden" style={{ transform: 'none', filter: 'none', perspective: 'none', contain: 'none' }}>
      <div className="overflow-x-auto" style={{ transform: 'none', filter: 'none' }}>
        <table className="w-full">
          <thead className="bg-gray-800/50 border-b border-bg-secondary-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-sm font-medium text-text-muted ${
                    column.sortable ? 'cursor-pointer hover:text-primary' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.key === 'select' ? (
                      <input
                        type="checkbox"
                        checked={selectedRows.size === data.length && data.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
                      />
                    ) : (
                      column.label
                    )}
                    {column.sortable && (
                      <ArrowUpDown 
                        className={`w-3 h-3 transition-colors ${
                          sortColumn === column.key ? 'text-primary' : 'text-gray-500'
                        }`} 
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-bg-secondary-border hover:bg-gray-800/30 transition-colors cursor-pointer ${
                    selectedRows.has(row.id) ? 'bg-primary/10 border-primary/20' : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm">
                      {column.key === 'select' ? (
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            onSelectRow(row.id);
                          }}
                          className="rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
                        />
                      ) : column.key === 'actions' ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          {actions?.(row)}
                        </div>
                      ) : column.render ? (
                        column.render(row)
                      ) : (
                        row[column.key as keyof T] as ReactNode
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}