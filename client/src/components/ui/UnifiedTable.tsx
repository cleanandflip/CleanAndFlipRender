/**
 * UNIFIED TABLE COMPONENT - PHASE 9: TABLE STANDARDIZATION
 * Standardized table component following design system specifications
 * August 10, 2025 - Professional UI Modernization
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TABLES, HEIGHTS } from '@/config/dimensions';

interface UnifiedTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  variant?: 'default' | 'bordered' | 'striped';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const UnifiedTable = React.forwardRef<HTMLTableElement, UnifiedTableProps>(({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}, ref) => {
  const getTableClasses = () => {
    const baseClasses = 'w-full border-collapse';
    
    const variantClasses = {
      default: 'bg-white dark:bg-gray-800',
      bordered: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden',
      striped: 'bg-white dark:bg-gray-800'
    };

    return cn(
      baseClasses,
      variantClasses[variant],
      className
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg">
      <table
        ref={ref}
        className={getTableClasses()}
        {...props}
      >
        {children}
      </table>
    </div>
  );
});

UnifiedTable.displayName = "UnifiedTable";

// Table Header component
interface UnifiedTableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const UnifiedTableHeader = React.forwardRef<HTMLTableSectionElement, UnifiedTableHeaderProps>(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <thead
      ref={ref}
      className={cn('bg-gray-50 dark:bg-gray-700', className)}
      {...props}
    >
      {children}
    </thead>
  );
});

UnifiedTableHeader.displayName = "UnifiedTableHeader";

// Table Body component
interface UnifiedTableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  striped?: boolean;
}

export const UnifiedTableBody = React.forwardRef<HTMLTableSectionElement, UnifiedTableBodyProps>(({
  striped = false,
  className,
  children,
  ...props
}, ref) => {
  return (
    <tbody
      ref={ref}
      className={cn(
        striped && '[&>tr:nth-child(even)]:bg-gray-50 dark:[&>tr:nth-child(even)]:bg-gray-700/50',
        className
      )}
      {...props}
    >
      {children}
    </tbody>
  );
});

UnifiedTableBody.displayName = "UnifiedTableBody";

// Table Row component
interface UnifiedTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hover?: boolean;
  selected?: boolean;
  children: React.ReactNode;
}

export const UnifiedTableRow = React.forwardRef<HTMLTableRowElement, UnifiedTableRowProps>(({
  hover = true,
  selected = false,
  className,
  children,
  ...props
}, ref) => {
  const getRowClasses = () => {
    const baseClasses = 'border-b border-gray-200 dark:border-gray-700 transition-colors';
    
    // EXACT height specification: h-13 (52px) for all table rows
    const heightClass = 'h-13'; // TABLES.row.height enforcement
    
    const hoverClasses = hover ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : '';
    const selectedClasses = selected ? 'bg-blue-50 dark:bg-blue-900/20' : '';

    return cn(
      baseClasses,
      heightClass,
      hoverClasses,
      selectedClasses,
      className
    );
  };

  return (
    <tr
      ref={ref}
      className={getRowClasses()}
      {...props}
    >
      {children}
    </tr>
  );
});

UnifiedTableRow.displayName = "UnifiedTableRow";

// Table Header Cell component
interface UnifiedTableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export const UnifiedTableHeaderCell = React.forwardRef<HTMLTableHeaderCellElement, UnifiedTableHeaderCellProps>(({
  sortable = false,
  sortDirection = null,
  align = 'left',
  className,
  children,
  ...props
}, ref) => {
  const getHeaderCellClasses = () => {
    const baseClasses = 'px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white';
    
    // EXACT height specification: h-12 (48px) for table headers
    const heightClass = 'h-12'; // TABLES.header.height enforcement
    
    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };
    
    const sortableClasses = sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none' : '';

    return cn(
      baseClasses,
      heightClass,
      alignClasses[align],
      sortableClasses,
      className
    );
  };

  return (
    <th
      ref={ref}
      className={getHeaderCellClasses()}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <div className="flex flex-col">
            <div className={cn('w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-transparent', 
              sortDirection === 'asc' ? 'border-b-gray-600 dark:border-b-gray-300' : 'border-b-gray-300 dark:border-b-gray-600'
            )} />
            <div className={cn('w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-transparent mt-0.5',
              sortDirection === 'desc' ? 'border-t-gray-600 dark:border-t-gray-300' : 'border-t-gray-300 dark:border-t-gray-600'
            )} />
          </div>
        )}
      </div>
    </th>
  );
});

UnifiedTableHeaderCell.displayName = "UnifiedTableHeaderCell";

// Table Cell component
interface UnifiedTableCellProps extends React.TdHTMLAttributes<HTMLTableDataCellElement> {
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export const UnifiedTableCell = React.forwardRef<HTMLTableDataCellElement, UnifiedTableCellProps>(({
  align = 'left',
  className,
  children,
  ...props
}, ref) => {
  const getCellClasses = () => {
    // Following TABLES.cell specifications
    const baseClasses = 'py-3 px-4 text-sm text-gray-900 dark:text-gray-100 align-middle';
    
    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };

    return cn(
      baseClasses,
      alignClasses[align],
      className
    );
  };

  return (
    <td
      ref={ref}
      className={getCellClasses()}
      {...props}
    >
      {children}
    </td>
  );
});

UnifiedTableCell.displayName = "UnifiedTableCell";

// Table Action Cell component for buttons
interface UnifiedTableActionCellProps extends React.TdHTMLAttributes<HTMLTableDataCellElement> {
  children: React.ReactNode;
}

export const UnifiedTableActionCell = React.forwardRef<HTMLTableDataCellElement, UnifiedTableActionCellProps>(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <td
      ref={ref}
      className={cn('py-3 px-4 text-right', className)}
      {...props}
    >
      <div className="flex items-center justify-end gap-2">
        {children}
      </div>
    </td>
  );
});

UnifiedTableActionCell.displayName = "UnifiedTableActionCell";

export default UnifiedTable;