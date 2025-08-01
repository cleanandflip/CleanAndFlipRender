import { ReactNode, useState } from 'react';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-glass-border bg-background/80 backdrop-blur sticky top-0 z-40">
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
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="gap-2 glass border-glass-border"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 glass border-glass-border">
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-glass-border">
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
                className="pl-10 glass border-glass-border"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 glass border-glass-border relative"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            
            {/* View Toggle */}
            {viewMode === 'both' && onViewChange && (
              <div className="flex items-center gap-1 glass rounded-lg p-1">
                <Button
                  variant={currentView === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('list')}
                  className="glass"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={currentView === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('grid')}
                  className="glass"
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {/* Sort Options */}
            {sortOptions && onSort && (
              <Select onValueChange={onSort}>
                <SelectTrigger className="w-[180px] glass border-glass-border">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="glass border-glass-border">
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* Filters Section */}
          {showFilters && (
            <div className="mt-4 p-4 glass rounded-lg border border-glass-border">
              {filters}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}