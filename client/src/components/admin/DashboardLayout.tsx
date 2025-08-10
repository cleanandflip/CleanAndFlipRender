import { ReactNode, useState } from 'react';
import { globalDesignSystem as theme } from '@/styles/design-system/theme';
import { Card } from '@/components/ui/card';
import { UnifiedButton } from '@/components/ui/UnifiedButton';
import { UnifiedInput } from '@/components/ui/UnifiedInput';
import { StandardDropdown } from "@/components/ui";
import { Search, Filter, RefreshCw, Grid, List, ArrowUpDown } from 'lucide-react';
import { HEIGHTS, CONTAINERS } from '@/config/dimensions';

interface DashboardLayoutProps {
  title: string;
  description?: string;
  totalCount: number;
  searchPlaceholder: string;
  onSearch: (query: string) => void;
  onRefresh: () => void;
  onExport: (format: 'csv' | 'pdf') => void;
  filters: ReactNode;
  actions?: ReactNode;
  viewMode?: 'list' | 'grid' | 'both';
  currentView?: 'list' | 'grid';
  onViewChange?: (view: 'list' | 'grid') => void;
  sortOptions?: Array<{ value: string; label: string }>;
  onSort?: (sort: string) => void;
  children: ReactNode;
  isLoading?: boolean;
  activeFiltersCount?: number;
}

export function DashboardLayout({
  title,
  description,
  totalCount,
  searchPlaceholder,
  onSearch,
  onRefresh,
  onExport,
  filters,
  actions,
  viewMode = 'list',
  currentView = 'list',
  onViewChange,
  sortOptions,
  onSort,
  children,
  isLoading = false,
  activeFiltersCount = 0
}: DashboardLayoutProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div 
        className="border-b bg-secondary/80 sticky top-0 z-40"
        style={{ borderColor: theme.colors.border.default }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white bebas-neue">{title}</h1>
              {description && (
                <p className="text-text-muted mt-1">{description}</p>
              )}
              <p className="text-sm text-text-muted mt-1">
                {totalCount.toLocaleString()} total items
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {actions}
              <UnifiedButton
                variant="secondary"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                icon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
              >
                Refresh
              </UnifiedButton>
              
              <StandardDropdown
                options={[
                  { value: 'csv', label: 'Export as CSV' },
                  { value: 'pdf', label: 'Export as PDF' }
                ]}
                value=""
                placeholder="Export"
                onChange={(format) => onExport((Array.isArray(format) ? format[0] : format) as 'csv' | 'pdf')}
                className="h-8"
              />
            </div>
          </div>
          
          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-4">
            <div className="flex-1 sm:max-w-md">
              <UnifiedInput
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch(e.target.value);
                }}
                icon={<Search />}
                iconPosition="left"
              />
            </div>
            
            <UnifiedButton
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter />}
              className="relative"
            >
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  {activeFiltersCount}
                </span>
              )}
            </UnifiedButton>

            <div className="flex flex-wrap gap-2 sm:gap-1">
              {viewMode === 'both' && onViewChange && (
                <div className="flex gap-1">
                  <UnifiedButton
                    variant={currentView === 'list' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => onViewChange('list')}
                    icon={<List />}
                  />
                  <UnifiedButton
                    variant={currentView === 'grid' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => onViewChange('grid')}
                    icon={<Grid />}
                  />
                </div>
              )}
            </div>

            {sortOptions && onSort && (
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-text-muted" />
                <StandardDropdown
                  options={sortOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                  value=""
                  onChange={(value) => onSort(Array.isArray(value) ? value[0] : value)}
                  placeholder="Sort by..."
                  className="w-40"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div 
          className="border-b p-4"
          style={{ borderColor: theme.colors.border.default }}
        >
          <Card className="p-4">
            {filters}
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}