import { ReactNode, useMemo, useState } from 'react';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, RefreshCw, Search, Eye, Pencil, Trash2 } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (row: any) => ReactNode;
}

interface Actions<T> {
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface UnifiedDataTableProps<T extends { id: string }> {
  columns: Column[];
  data: T[];
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  loading?: boolean;
  actions?: Actions<T>;
  pagination?: Pagination;
}

export function UnifiedDataTable<T extends { id: string }>({
  columns,
  data,
  searchPlaceholder,
  onSearch,
  onRefresh,
  onExport,
  loading,
  actions,
  pagination,
}: UnifiedDataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortedData, setSortedData] = useState<T[]>(data);

  // Keep data in sync when source updates
  const tableData = useMemo(() => data, [data]);

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSort = (column: string, order: 'asc' | 'desc') => {
    const sorted = [...tableData].sort((a: any, b: any) => {
      const av = a[column];
      const bv = b[column];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return order === 'asc' ? av - bv : bv - av;
      }
      return order === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    setSortedData(sorted);
  };

  const effectiveData = sortedData.length === tableData.length ? tableData : sortedData;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder={searchPlaceholder || 'Search...'}
            className="pl-9"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
        {onRefresh && (
          <Button variant="secondary" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        )}
        {onExport && (
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        )}
      </div>

      <DataTable
        columns={[
          { key: 'select', label: '', width: '40px' },
          ...columns,
          { key: 'actions', label: 'Actions', width: '180px' },
        ]}
        data={effectiveData}
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSort={handleSort}
        isLoading={!!loading}
        actions={(row) => (
          <div className="flex items-center gap-2">
            {actions?.onView && (
              <Button size="sm" variant="ghost" onClick={() => actions.onView?.(row)}>
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {actions?.onEdit && (
              <Button size="sm" variant="ghost" onClick={() => actions.onEdit?.(row)}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {actions?.onDelete && (
              <Button size="sm" variant="ghost" onClick={() => actions.onDelete?.(row)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      />

      {pagination && (
        <div className="flex items-center justify-end gap-2 text-sm text-gray-400">
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.currentPage <= 1}
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default UnifiedDataTable;
