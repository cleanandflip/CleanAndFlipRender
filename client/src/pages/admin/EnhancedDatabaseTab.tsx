// DATABASE MANAGEMENT TAB WITH UNIFIED THEME
import { useState, useEffect } from 'react';
import { Database, Table as TableIcon, Play, Download, RefreshCw, Eye, Settings, Terminal, Clock, AlertTriangle } from 'lucide-react';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { DatabaseTableModal } from '@/components/admin/modals/DatabaseTableModal';
import { DatabaseQueryModal } from '@/components/admin/modals/DatabaseQueryModal';
import { DatabaseCheckpointModal } from '@/components/admin/modals/DatabaseCheckpointModal';
import { CheckpointManagerModal } from '@/components/admin/modals/CheckpointManagerModal';
import { useWebSocketState } from '@/hooks/useWebSocketState';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { globalDesignSystem as theme } from '@/styles/design-system/theme';

interface Branch {
  key: string;
  name: string;
  url: string;
}

interface DatabaseTable {
  table_schema: string;
  table_name: string;
  table_type: string;
  total_bytes: string;
  row_count_estimate: string;
}

interface Migration {
  id: number;
  name: string;
  run_on: string;
}

interface Checkpoint {
  id: string;
  label: string;
  created_by: string;
  created_at: string;
  notes?: string;
}

export function EnhancedDatabaseTab() {
  const [selectedBranch, setSelectedBranch] = useState<string>('dev');
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [showCheckpointManager, setShowCheckpointManager] = useState(false);
  const [showCheckpointManager, setShowCheckpointManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { connected, subscribe, ready } = useWebSocketState();
  const queryClient = useQueryClient();

  // Fetch branches
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['/api/admin/db/branches'],
    queryFn: async () => {
      const res = await fetch('/api/admin/db/branches', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json();
    }
  });

  // Fetch tables for selected branch
  const {
    data: tables = [],
    isLoading: tablesLoading,
    refetch: refetchTables
  } = useQuery<DatabaseTable[]>({
    queryKey: ['/api/admin/db/' + selectedBranch + '/tables'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/db/${selectedBranch}/tables`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tables');
      return res.json();
    },
    enabled: !!selectedBranch,
  });

  // Fetch migrations
  const { data: migrations = [] } = useQuery<Migration[]>({
    queryKey: ['/api/admin/db/' + selectedBranch + '/migrations'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/db/${selectedBranch}/migrations`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch migrations');
      return res.json();
    },
    enabled: !!selectedBranch,
  });

  // Fetch checkpoints
  const { data: checkpoints = [] } = useQuery<Checkpoint[]>({
    queryKey: ['/api/admin/db/' + selectedBranch + '/checkpoints'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/db/${selectedBranch}/checkpoints`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch checkpoints');
      return res.json();
    },
    enabled: !!selectedBranch,
  });

  // Setup live sync with WebSocket
  useEffect(() => {
    return subscribe("database:update", (msg) => {
      console.log('🔄 Database live sync: Refreshing data', msg);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/db/' + selectedBranch + '/tables'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/db/' + selectedBranch + '/migrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/db/' + selectedBranch + '/checkpoints'] });
    });
  }, [subscribe, queryClient, selectedBranch]);

  // Filter tables based on search
  const filteredTables = tables.filter(table =>
    table.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.table_schema.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate database statistics
  const stats = {
    totalTables: tables.length,
    totalMigrations: migrations.length,
    totalCheckpoints: checkpoints.length,
    connectedBranch: selectedBranch === 'dev' ? 'Development' : 'Production'
  };

  // Table columns configuration for UnifiedDataTable
  const tableColumns = [
    {
      key: 'table_name',
      label: 'Table Name',
      sortable: true,
      render: (table: DatabaseTable) => (
        <div className="flex items-center space-x-3">
          <TableIcon className="h-4 w-4 text-blue-400" />
          <span className="font-medium text-white">{table.table_name}</span>
        </div>
      )
    },
    {
      key: 'table_schema',
      label: 'Schema',
      sortable: true,
      render: (table: DatabaseTable) => (
        <span className="text-gray-300">{table.table_schema}</span>
      )
    },
    {
      key: 'table_type',
      label: 'Type',
      sortable: true,
      render: (table: DatabaseTable) => (
        <span className="px-2 py-1 bg-blue-500/10 text-blue-300 rounded text-xs">
          {table.table_type}
        </span>
      )
    },
    {
      key: 'row_count_estimate',
      label: 'Rows',
      sortable: true,
      render: (table: DatabaseTable) => (
        <span className="text-gray-300">
          {table.row_count_estimate === '-1' ? 'Unknown' : table.row_count_estimate}
        </span>
      )
    },
    {
      key: 'total_bytes',
      label: 'Size',
      sortable: true,
      render: (table: DatabaseTable) => (
        <span className="text-gray-300">
          {(parseInt(table.total_bytes) / 1024).toFixed(1)} KB
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (table: DatabaseTable) => (
        <div className="flex space-x-2">
          <UnifiedButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTable(table);
              setShowTableModal(true);
            }}
            data-testid={`button-view-table-${table.table_name}`}
          >
            <Eye className="h-3 w-3" />
          </UnifiedButton>
        </div>
      )
    }
  ];

  const handleTableRowClick = (table: DatabaseTable) => {
    setSelectedTable(table);
    setShowTableModal(true);
  };

  return (
    <div className="space-y-8" style={{ backgroundColor: theme.colors.bg.primary }}>
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: theme.colors.bg.secondary }}>
            <Database className="h-8 w-8" style={{ color: theme.colors.brand.blue }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text.primary }}>
              Database Management
            </h1>
            <p className="text-base" style={{ color: theme.colors.text.muted }}>
              Manage database tables, execute queries, and create checkpoints
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Branch Selector */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 rounded-lg border text-sm font-medium min-w-48"
            style={{
              backgroundColor: theme.colors.bg.secondary,
              borderColor: theme.colors.border.default,
              color: theme.colors.text.primary
            }}
            data-testid="select-database-branch"
          >
            <option value="">Select Database Branch</option>
            {branches.map((branch) => (
              <option key={branch.key} value={branch.key}>
                {branch.name}
              </option>
            ))}
          </select>

          {/* Action Buttons */}
          <UnifiedButton
            variant="secondary"
            onClick={() => setShowQueryModal(true)}
            disabled={!selectedBranch}
            data-testid="button-execute-query"
          >
            <Terminal className="h-4 w-4 mr-2" />
            Execute Query
          </UnifiedButton>

          <UnifiedButton
            variant="secondary"
            onClick={() => setShowCheckpointModal(true)}
            disabled={!selectedBranch}
            data-testid="button-create-checkpoint"
          >
            <Download className="h-4 w-4 mr-2" />
            Create Checkpoint
          </UnifiedButton>

          <UnifiedButton
            variant="ghost"
            onClick={() => refetchTables()}
            disabled={tablesLoading}
            data-testid="button-refresh-tables"
          >
            <RefreshCw className={`h-4 w-4 ${tablesLoading ? 'animate-spin' : ''}`} />
          </UnifiedButton>
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 rounded-lg border"
           style={{ 
             backgroundColor: theme.colors.bg.secondary, 
             borderColor: theme.colors.border.default 
           }}>
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
            WebSocket: {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm" style={{ color: theme.colors.text.muted }}>
          <span>Branch: {stats.connectedBranch}</span>
          <span>•</span>
          <span>Tables: {stats.totalTables}</span>
          <span>•</span>
          <span>Migrations: {stats.totalMigrations}</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-4 mt-4">
          <UnifiedButton
            variant="secondary"
            size="sm"
            onClick={() => setShowQueryModal(true)}
            data-testid="button-open-sql-console"
          >
            <Terminal className="h-4 w-4 mr-2" />
            SQL Console
          </UnifiedButton>
          
          <UnifiedButton
            variant="secondary"
            size="sm"
            onClick={() => setShowCheckpointManager(true)}
            data-testid="button-view-rollback"
          >
            <Clock className="h-4 w-4 mr-2" />
            View & Rollback
          </UnifiedButton>
          
          <UnifiedButton
            variant="primary"
            size="sm"
            onClick={() => setShowCheckpointModal(true)}
            data-testid="button-create-checkpoint"
          >
            <Download className="h-4 w-4 mr-2" />
            Create Checkpoint
          </UnifiedButton>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UnifiedMetricCard
          title="Total Tables"
          value={stats.totalTables.toString()}
          icon={TableIcon}
          trend="stable"
          color="blue"
        />
        <UnifiedMetricCard
          title="Database Migrations"
          value={stats.totalMigrations.toString()}
          icon={Settings}
          trend="stable"
          color="purple"
        />
        <UnifiedMetricCard
          title="Checkpoints"
          value={stats.totalCheckpoints.toString()}
          icon={Clock}
          trend="stable"
          color="green"
          onClick={() => setShowCheckpointManager(true)}
        />
        <UnifiedMetricCard
          title="Connection Status"
          value={connected ? "Online" : "Offline"}
          icon={connected ? Database : AlertTriangle}
          trend="stable"
          color={connected ? "green" : "red"}
        />
      </div>

      {/* Database Tables Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
            Database Tables ({filteredTables.length})
          </h2>
          
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 pl-10 rounded-lg border w-64 text-sm"
              style={{
                backgroundColor: theme.colors.bg.secondary,
                borderColor: theme.colors.border.default,
                color: theme.colors.text.primary
              }}
              data-testid="input-search-tables"
            />
            <Database className="absolute left-3 top-2.5 h-4 w-4" style={{ color: theme.colors.text.muted }} />
          </div>
        </div>

        {selectedBranch ? (
          <UnifiedDataTable
            data={filteredTables}
            columns={tableColumns}
            loading={tablesLoading}
            onRowClick={handleTableRowClick}

            searchQuery={searchQuery}
            data-table="database-tables"
          />
        ) : (
          <div className="text-center py-12">
            <Database className="h-12 w-12 mx-auto mb-4" style={{ color: theme.colors.text.muted }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
              Select a Database Branch
            </h3>
            <p className="text-sm" style={{ color: theme.colors.text.muted }}>
              Choose a database branch from the dropdown above to view tables
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedTable && (
        <DatabaseTableModal
          table={selectedTable}
          branch={selectedBranch}
          isOpen={showTableModal}
          onClose={() => {
            setShowTableModal(false);
            setSelectedTable(null);
          }}
        />
      )}

      <DatabaseQueryModal
        branch={selectedBranch}
        isOpen={showQueryModal}
        onClose={() => setShowQueryModal(false)}
        onQueryExecuted={() => {
          refetchTables();
          toast({
            title: "Query Executed",
            description: "SQL query completed successfully"
          });
        }}
      />

      <DatabaseCheckpointModal
        branch={selectedBranch}
        isOpen={showCheckpointModal}
        onClose={() => setShowCheckpointModal(false)}
        onCheckpointCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/admin/db/' + selectedBranch + '/checkpoints'] });
          toast({
            title: "Checkpoint Created",
            description: "Database checkpoint created successfully"
          });
        }}
      />

      {showCheckpointManager && (
        <CheckpointManagerModal
          branch={selectedBranch}
          isOpen={showCheckpointManager}
          onClose={() => setShowCheckpointManager(false)}
        />
      )}

      <CheckpointManagerModal
        branch={selectedBranch}
        isOpen={showCheckpointManager}
        onClose={() => setShowCheckpointManager(false)}
      />
    </div>
  );
}

export default EnhancedDatabaseTab;