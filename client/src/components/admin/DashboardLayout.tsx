import { ReactNode, useState } from 'react';
import { globalDesignSystem as theme } from '@/styles/design-system/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Filter, Download, RefreshCw, Grid, List, ArrowUpDown, ChevronDown } from 'lucide-react';

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
              <div className="glass glass-hover rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="gap-2 h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="glass glass-hover rounded-lg p-1">
                    <Button variant="ghost" size="sm" className="gap-2 h-8 transition-colors duration-300 hover:bg-accent hover:text-accent-foreground">
                      <Download className="w-4 h-4" />
                      Export
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-border bg-card">
                  <DropdownMenuItem onClick={() => onExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Search and Filters Bar */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch(e.target.value);
                }}
                className="pl-10"
                style={{
                  backgroundColor: theme.colors.bg.primary,
                  borderColor: theme.colors.border.default,
                  color: theme.colors.text.primary
                }}
              />
            </div>
            
            <div className="glass glass-hover rounded-lg p-1">
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 relative h-8 transition-colors duration-300 hover:bg-accent hover:text-accent-foreground"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>

            {viewMode === 'both' && onViewChange && (
              <div className="flex gap-1">
                <div className="glass glass-hover rounded-lg p-1">
                  <Button
                    variant={currentView === 'list' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onViewChange('list')}
                    className="h-8 transition-colors duration-300"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <div className="glass glass-hover rounded-lg p-1">
                  <Button
                    variant={currentView === 'grid' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onViewChange('grid')}
                    className="h-8 transition-colors duration-300"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {sortOptions && onSort && (
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-text-muted" />
                <Select onValueChange={onSort}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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