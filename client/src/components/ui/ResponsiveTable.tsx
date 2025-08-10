import React from 'react';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  onRowClick?: (item: any) => void;
  className?: string;
  loading?: boolean;
}

export function ResponsiveTable({ 
  data, 
  columns, 
  onRowClick, 
  className,
  loading = false 
}: ResponsiveTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Desktop skeleton */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th key={col.key} className="text-left py-3 px-4">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile skeleton */}
        <div className="md:hidden space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 space-y-3">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "text-left py-3 px-4 font-medium text-muted-foreground",
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                className={cn(
                  "border-b border-border transition-colors",
                  onRowClick && "hover:bg-muted/50 cursor-pointer"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("py-3 px-4", column.className)}
                  >
                    {column.render 
                      ? column.render(item[column.key], item)
                      : item[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards - Visible on mobile */}
      <div className="md:hidden space-y-4">
        {data.map((item, index) => (
          <div
            key={index}
            className={cn(
              "bg-card rounded-lg p-4 shadow-sm border border-border",
              onRowClick && "hover:bg-muted/50 cursor-pointer active:bg-muted transition-colors"
            )}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground font-medium">
                  {column.label}
                </span>
                <span className="font-medium text-right ml-4 flex-1">
                  {column.render 
                    ? column.render(item[column.key], item)
                    : item[column.key]
                  }
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {data.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}
    </div>
  );
}

export default ResponsiveTable;