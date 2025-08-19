import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Table, 
  Archive, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle, 
  XCircle,
  Eye,
  Play
} from 'lucide-react';

interface DatabaseBranch {
  key: 'dev' | 'prod';
  name?: string;
  url: string;
}

interface TableInfo {
  table_schema: string;
  table_name: string;
  table_type: string;
  total_bytes: number;
  row_count_estimate: number;
}

interface TableDetails {
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
  indexes: Array<{
    index_name: string;
    definition: string;
    is_unique: boolean;
    is_primary: boolean;
  }>;
  rowCount: number;
}

interface Migration {
  id: number;
  name: string;
  run_on: string;
}

export function SimpleDatabaseTab() {
  const [selectedBranch, setSelectedBranch] = useState<'dev' | 'prod'>('prod');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedSchema, setSelectedSchema] = useState<string>('public');
  const [showTableDetails, setShowTableDetails] = useState(false);
  const [showCheckpointDialog, setShowCheckpointDialog] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [migrationDirection, setMigrationDirection] = useState<'up' | 'down'>('up');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database branches
  const { data: branches } = useQuery({
    queryKey: ['/api/admin/db/branches'],
    staleTime: 60000,
  });

  // Fetch tables
  const { data: tables = [], isLoading: loadingTables } = useQuery({
    queryKey: ['/api/admin/db', selectedBranch, 'tables'],
    enabled: !!selectedBranch,
  });

  // Fetch table details
  const { data: tableDetails } = useQuery<TableDetails>({
    queryKey: ['/api/admin/db', selectedBranch, 'tables', selectedSchema, selectedTable],
    enabled: !!selectedBranch && !!selectedTable && showTableDetails,
  });

  // Fetch migrations
  const { data: migrations = [] } = useQuery<Migration[]>({
    queryKey: ['/api/admin/db', selectedBranch, 'migrations'],
    enabled: !!selectedBranch,
  });

  // Fetch checkpoints
  const { data: checkpoints = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/db', selectedBranch, 'checkpoints'],
    enabled: !!selectedBranch,
  });

  // Create checkpoint mutation
  const checkpointMutation = useMutation({
    mutationFn: async ({ branch, label }: { branch: string; label: string }) => {
      const response = await fetch(`/api/admin/db/${branch}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      });
      if (!response.ok) {
        throw new Error('Checkpoint creation failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Checkpoint Created", description: "Database checkpoint created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/db', selectedBranch, 'checkpoints'] });
      setShowCheckpointDialog(false);
      setCheckpointLabel('');
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create checkpoint", variant: "destructive" });
    },
  });

  // Migration mutation
  const migrationMutation = useMutation({
    mutationFn: async ({ branch, direction, confirm }: { branch: string; direction: 'up' | 'down'; confirm?: string }) => {
      const body = confirm ? { confirm } : {};
      const response = await fetch(`/api/admin/db/${branch}/migrate?dir=${direction}&steps=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        throw new Error('Migration failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Migration Completed", description: data.output || "Migration executed successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/db', selectedBranch, 'migrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/db', selectedBranch, 'tables'] });
      setShowMigrationDialog(false);
      setConfirmationPhrase('');
    },
    onError: () => {
      toast({ title: "Migration Failed", description: "Migration execution failed", variant: "destructive" });
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleTableClick = (table: TableInfo) => {
    setSelectedTable(table.table_name);
    setSelectedSchema(table.table_schema);
    setShowTableDetails(true);
  };

  const handleMigration = () => {
    const needsConfirmation = selectedBranch === 'prod' && migrationDirection === 'down';
    const expectedPhrase = needsConfirmation ? 'ROLLBACK 1' : '';
    
    if (needsConfirmation && confirmationPhrase !== expectedPhrase) {
      toast({
        title: "Confirmation Required",
        description: `Type "${expectedPhrase}" to confirm production rollback`,
        variant: "destructive",
      });
      return;
    }
    
    migrationMutation.mutate({ 
      branch: selectedBranch, 
      direction: migrationDirection,
      confirm: needsConfirmation ? confirmationPhrase : undefined
    });
  };

  return (
    <div className="p-6 space-y-6" data-testid="database-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6" />
            Database Management
          </h1>
          <p className="text-gray-400 mt-1">
            Manage database branches, tables, and migrations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={selectedBranch === 'dev' ? 'default' : 'destructive'}>
            {selectedBranch === 'dev' ? 'Development' : 'Production'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Branch Selection */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Database Branches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {branches?.map((branch: DatabaseBranch) => (
                <button
                  key={branch.key}
                  onClick={() => setSelectedBranch(branch.key)}
                  className={`w-full p-3 rounded border text-left transition-colors ${
                    selectedBranch === branch.key 
                      ? 'border-blue-500 bg-blue-900/20 text-blue-400' 
                      : 'border-gray-600 hover:border-gray-500 text-gray-300'
                  }`}
                  data-testid={`branch-${branch.key}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">{branch.key}</div>
                      <div className="text-xs text-gray-500">
                        {branch.url === 'configured' ? 'Connected' : 'Not configured'}
                      </div>
                    </div>
                    {branch.url === 'configured' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dialog open={showCheckpointDialog} onOpenChange={setShowCheckpointDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="create-checkpoint">
                    <Archive className="w-4 h-4 mr-2" />
                    Create Checkpoint
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Checkpoint</DialogTitle>
                    <DialogDescription>Create a restore point for the {selectedBranch} database</DialogDescription>
                  </DialogHeader>
                  <div>
                    <Label htmlFor="checkpoint-label">Label</Label>
                    <Input
                      id="checkpoint-label"
                      placeholder="e.g., pre-migration-2024"
                      value={checkpointLabel}
                      onChange={(e) => setCheckpointLabel(e.target.value)}
                      data-testid="input-checkpoint-label"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCheckpointDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => checkpointMutation.mutate({ branch: selectedBranch, label: checkpointLabel })}
                      disabled={checkpointMutation.isPending || !checkpointLabel.trim()}
                      data-testid="button-create-checkpoint"
                    >
                      {checkpointMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="run-migration">
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Run Migration
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Run Migration</DialogTitle>
                    <DialogDescription>Apply or rollback migrations on {selectedBranch}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Direction</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant={migrationDirection === 'up' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setMigrationDirection('up')}
                          data-testid="migration-up"
                        >
                          <ArrowUp className="w-4 h-4 mr-1" />
                          Up
                        </Button>
                        <Button
                          variant={migrationDirection === 'down' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setMigrationDirection('down')}
                          data-testid="migration-down"
                        >
                          <ArrowDown className="w-4 h-4 mr-1" />
                          Down
                        </Button>
                      </div>
                    </div>
                    
                    {selectedBranch === 'prod' && migrationDirection === 'down' && (
                      <div>
                        <Label>Type "ROLLBACK 1" to confirm</Label>
                        <Input
                          placeholder="ROLLBACK 1"
                          value={confirmationPhrase}
                          onChange={(e) => setConfirmationPhrase(e.target.value)}
                          data-testid="input-rollback-confirm"
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowMigrationDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleMigration}
                      disabled={migrationMutation.isPending}
                      variant={migrationDirection === 'down' && selectedBranch === 'prod' ? 'destructive' : 'default'}
                      data-testid="button-execute-migration"
                    >
                      {migrationMutation.isPending ? 'Running...' : `Run ${migrationDirection.toUpperCase()}`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tables List */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Table className="w-5 h-5" />
                Database Tables ({tables.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTables ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {tables.map((table: TableInfo) => (
                    <div
                      key={`${table.table_schema}.${table.table_name}`}
                      className="p-3 bg-gray-700/50 rounded border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors"
                      onClick={() => handleTableClick(table)}
                      data-testid={`table-${table.table_name}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Table className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-white">{table.table_name}</div>
                            <div className="text-sm text-gray-400">{table.table_schema} • {table.table_type}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">
                            {new Intl.NumberFormat().format(table.row_count_estimate)} rows
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatBytes(table.total_bytes)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tables.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No tables found in {selectedBranch} database
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Migration History */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Migrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {migrations.slice(0, 5).map((migration: Migration) => (
                    <div key={migration.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
                      <div>
                        <div className="font-medium text-white text-sm">{migration.name}</div>
                        <div className="text-xs text-gray-400">ID: {migration.id}</div>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        {new Date(migration.run_on).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {migrations.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      No migrations found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Checkpoints */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Checkpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {checkpoints.slice(0, 5).map((checkpoint: any) => (
                    <div key={checkpoint.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
                      <div>
                        <div className="font-medium text-white text-sm">{checkpoint.label}</div>
                        <div className="text-xs text-gray-400">By: {checkpoint.created_by}</div>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        {new Date(checkpoint.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {checkpoints.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      No checkpoints found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Table Details Modal */}
      <Dialog open={showTableDetails} onOpenChange={setShowTableDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Table Details: {selectedTable}</DialogTitle>
          </DialogHeader>
          {tableDetails && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <h4 className="font-medium mb-2">Columns ({tableDetails.columns.length})</h4>
                <div className="space-y-1">
                  {tableDetails.columns.map((column) => (
                    <div key={column.column_name} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{column.column_name}</span>
                        <Badge variant="outline" className="text-xs">{column.data_type}</Badge>
                      </div>
                      <div className="flex gap-2">
                        {column.is_nullable === 'NO' && <Badge variant="secondary" className="text-xs">NOT NULL</Badge>}
                        {column.column_default && <Badge variant="outline" className="text-xs">DEFAULT</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Indexes ({tableDetails.indexes.length})</h4>
                <div className="space-y-1">
                  {tableDetails.indexes.map((index) => (
                    <div key={index.index_name} className="py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{index.index_name}</span>
                        <div className="flex gap-2">
                          {index.is_primary && <Badge className="text-xs">PRIMARY</Badge>}
                          {index.is_unique && !index.is_primary && <Badge variant="secondary" className="text-xs">UNIQUE</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}