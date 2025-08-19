// UNIFIED DATA TABLE COMPONENT
import { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Search, Filter, 
  Download, RefreshCw, MoreVertical, Eye, Edit, Trash 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onRowClick?: (item: T) => void;
  actions?: {
    onView?: (item: T) => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  loading?: boolean;
  searchQuery?: string;
}

export function UnifiedDataTable<T extends { id?: string | number; table_name?: string }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onSearch,
  onRefresh,
  onExport,
  onRowClick,
  searchQuery: controlledSearchQuery,
  actions,
  pagination,
  loading = false
}: DataTableProps<T>) {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const effectiveSearchQuery = controlledSearchQuery ?? localSearchQuery;
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(item => item.id)));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  return (
    <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl backdrop-blur overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={effectiveSearchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (controlledSearchQuery !== undefined && onSearch) {
                      onSearch(value);
                    } else {
                      setLocalSearchQuery(value);
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="pl-10 pr-4 py-2 bg-[#0f172a]/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-80"
                />
              </div>
            )}
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4 text-gray-400", loading && "animate-spin")} />
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-600 bg-transparent"
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={cn(
                    "px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider",
                    column.sortable && "cursor-pointer hover:text-white"
                  )}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={item.id || item.table_name || index}
                  className={cn(
                    "border-b border-gray-800/50",
                    "hover:bg-white/5 transition-colors",
                    selectedRows.has(item.id || item.table_name || index) && "bg-blue-500/10"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.id || item.table_name || index)}
                      onChange={() => handleSelectRow(item.id || item.table_name || index)}
                      className="rounded border-gray-600 bg-transparent"
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={column.key as string} className="px-6 py-4 text-gray-300">
                      {column.render 
                        ? column.render(item)
                        : (item[column.key as keyof T] as React.ReactNode)
                      }
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {actions.onView && (
                          <button
                            onClick={() => actions.onView!(item)}
                            className="p-1.5 hover:bg-white/5 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                        {actions.onEdit && (
                          <button
                            onClick={() => actions.onEdit!(item)}
                            className="p-1.5 hover:bg-white/5 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                        {actions.onDelete && (
                          <button
                            onClick={() => actions.onDelete!(item)}
                            className="p-1.5 hover:bg-white/5 rounded transition-colors"
                          >
                            <Trash className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}