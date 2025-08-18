import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Play, 
  Table, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  History,
  ArrowUp,
  ArrowDown,
  GitBranch,
  Archive,
  Shield,
  Clock
} from 'lucide-react';

interface DatabaseBranch {
  key: 'dev' | 'prod';
  name: string;
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
    ordinal_position: number;
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

interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  duration: number;
}

export function EnhancedDatabaseTab() {
  const [selectedBranch, setSelectedBranch] = useState<'dev' | 'prod'>('dev');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedSchema, setSelectedSchema] = useState<string>('public');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM users LIMIT 10;');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string>('');
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [showCheckpointDialog, setShowCheckpointDialog] = useState(false);
  const [migrationDirection, setMigrationDirection] = useState<'up' | 'down'>('up');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [checkpointNotes, setCheckpointNotes] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database branches
  const { data: branches, isLoading: loadingBranches } = useQuery({
    queryKey: ['/api/admin/db/branches'],
    staleTime: 60000, // 1 minute
  });

  // Fetch tables for selected branch
  const { data: tables = [], isLoading: loadingTables } = useQuery({
    queryKey: ['/api/admin/db', selectedBranch, 'tables'],
    enabled: !!selectedBranch,
    staleTime: 30000,
  });

  // Fetch table details
  const { data: tableDetails, isLoading: loadingTableDetails } = useQuery<TableDetails>({
    queryKey: ['/api/admin/db', selectedBranch, 'tables', selectedSchema, selectedTable],
    enabled: !!selectedBranch && !!selectedTable && !!selectedSchema,
    staleTime: 30000,
  });

  // Fetch migrations
  const { data: migrations = [], isLoading: loadingMigrations } = useQuery({
    queryKey: ['/api/admin/db', selectedBranch, 'migrations'],
    enabled: !!selectedBranch,
    staleTime: 30000,
  });

  // Execute SQL query mutation
  const executeSqlMutation = useMutation({
    mutationFn: async ({ branch, query }: { branch: string; query: string }) => {
      const response = await fetch(`/api/admin/db/${branch}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Query execution failed');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      setQueryResult(data);
      setQueryError('');
      toast({
        title: "Query Executed",
        description: `Query completed in ${data.duration}ms, returned ${data.rowCount} rows`,
      });
    },
    onError: (error: any) => {
      setQueryError(error.message || 'Query execution failed');
      setQueryResult(null);
      toast({
        title: "Query Failed",
        description: error.message || 'Query execution failed',
        variant: "destructive",
      });
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
        const errorText = await response.text();
        throw new Error(errorText || 'Migration failed');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Migration Completed",
        description: data.output || "Migration executed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/db', selectedBranch, 'migrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/db', selectedBranch, 'tables'] });
      setShowMigrationDialog(false);
      setConfirmationPhrase('');
    },
    onError: (error: any) => {
      toast({
        title: "Migration Failed",
        description: error.message || 'Migration execution failed',
        variant: "destructive",
      });
    },
  });

  // Checkpoint mutation
  const checkpointMutation = useMutation({
    mutationFn: async ({ branch, label, notes }: { branch: string; label: string; notes?: string }) => {
      const response = await fetch(`/api/admin/db/${branch}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, notes })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Checkpoint creation failed');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Checkpoint Created",
        description: data.message || "Database checkpoint created successfully",
      });
      setShowCheckpointDialog(false);
      setCheckpointLabel('');
      setCheckpointNotes('');
    },
    onError: (error: any) => {
      toast({
        title: "Checkpoint Failed",
        description: error.message || 'Checkpoint creation failed',
        variant: "destructive",
      });
    },
  });

  const handleExecuteQuery = () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a SQL query to execute",
        variant: "destructive",
      });
      return;
    }
    executeSqlMutation.mutate({ branch: selectedBranch, query: sqlQuery });
  };

  const handleTableSelect = (tableInfo: TableInfo) => {
    setSelectedTable(tableInfo.table_name);
    setSelectedSchema(tableInfo.table_schema);
    setSqlQuery(`SELECT * FROM ${tableInfo.table_schema}.${tableInfo.table_name} LIMIT 10;`);
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

  const handleCreateCheckpoint = () => {
    if (!checkpointLabel.trim()) {
      toast({
        title: "Label Required",
        description: "Please enter a label for the checkpoint",
        variant: "destructive",
      });
      return;
    }
    
    checkpointMutation.mutate({
      branch: selectedBranch,
      label: checkpointLabel,
      notes: checkpointNotes
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loadingBranches) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6" />
            Enhanced Database Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Full-stack database management with migrations, checkpoints, and rollbacks
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GitBranch className="w-4 h-4" />
                Database Branches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {branches?.map((branch: DatabaseBranch) => (
                <div
                  key={branch.key}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedBranch === branch.key 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedBranch(branch.key)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{branch.name}</div>
                      <div className="text-sm text-gray-500">
                        {branch.url === 'configured' ? 'Connected' : 'Not configured'}
                      </div>
                    </div>
                    {branch.url === 'configured' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-4 h-4" />
                Database Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={showCheckpointDialog} onOpenChange={setShowCheckpointDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Archive className="w-4 h-4 mr-2" />
                    Create Checkpoint
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Database Checkpoint</DialogTitle>
                    <DialogDescription>
                      Create a restore point for the {selectedBranch} database before making changes
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="checkpoint-label">Checkpoint Label *</Label>
                      <Input
                        id="checkpoint-label"
                        placeholder="e.g., pre-user-migration"
                        value={checkpointLabel}
                        onChange={(e) => setCheckpointLabel(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkpoint-notes">Notes (Optional)</Label>
                      <Textarea
                        id="checkpoint-notes"
                        placeholder="Describe what changes you're about to make..."
                        value={checkpointNotes}
                        onChange={(e) => setCheckpointNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCheckpointDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateCheckpoint}
                      disabled={checkpointMutation.isPending}
                    >
                      {checkpointMutation.isPending ? 'Creating...' : 'Create Checkpoint'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Run Migration
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Run Database Migration</DialogTitle>
                    <DialogDescription>
                      Apply or rollback migrations on the {selectedBranch} database
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Direction</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant={migrationDirection === 'up' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setMigrationDirection('up')}
                        >
                          <ArrowUp className="w-4 h-4 mr-1" />
                          Up
                        </Button>
                        <Button
                          variant={migrationDirection === 'down' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setMigrationDirection('down')}
                        >
                          <ArrowDown className="w-4 h-4 mr-1" />
                          Down
                        </Button>
                      </div>
                    </div>
                    
                    {selectedBranch === 'prod' && migrationDirection === 'down' && (
                      <div>
                        <Label htmlFor="confirmation">Type "ROLLBACK 1" to confirm</Label>
                        <Input
                          id="confirmation"
                          placeholder="ROLLBACK 1"
                          value={confirmationPhrase}
                          onChange={(e) => setConfirmationPhrase(e.target.value)}
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
                    >
                      {migrationMutation.isPending ? 'Running...' : `Run ${migrationDirection.toUpperCase()}`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" className="w-full justify-start" disabled>
                <History className="w-4 h-4 mr-2" />
                View Checkpoints
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="tables" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="query">SQL Query</TabsTrigger>
              <TabsTrigger value="migrations">Migrations</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
            </TabsList>

            {/* Tables Tab */}
            <TabsContent value="tables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Database Tables</CardTitle>
                  <CardDescription>
                    Browse tables and data in your {selectedBranch} database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTables ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tables?.map((table: TableInfo) => (
                        <div
                          key={`${table.table_schema}.${table.table_name}`}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedTable === table.table_name 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleTableSelect(table)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Table className="w-4 h-4 text-gray-500" />
                              <div>
                                <div className="font-medium">{table.table_name}</div>
                                <div className="text-sm text-gray-500">
                                  {table.table_schema} • {table.table_type}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {formatNumber(table.row_count_estimate)} rows
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatBytes(table.total_bytes)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Table Details */}
              {selectedTable && (
                <Card>
                  <CardHeader>
                    <CardTitle>Table Details: {selectedTable}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingTableDetails ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : tableDetails ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Columns ({tableDetails.columns.length})</h4>
                          <div className="space-y-2">
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
                          <div className="space-y-2">
                            {tableDetails.indexes.map((index) => (
                              <div key={index.index_name} className="py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{index.index_name}</span>
                                  <div className="flex gap-2">
                                    {index.is_primary && <Badge className="text-xs">PRIMARY</Badge>}
                                    {index.is_unique && !index.is_primary && <Badge variant="secondary" className="text-xs">UNIQUE</Badge>}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">
                                  {index.definition}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* SQL Query Tab */}
            <TabsContent value="query" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>SQL Query Console</CardTitle>
                  <CardDescription>
                    Execute SELECT queries on your {selectedBranch} database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sql-query">SQL Query</Label>
                      <Textarea
                        id="sql-query"
                        placeholder="SELECT * FROM users LIMIT 10;"
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        className="font-mono text-sm h-32 mt-1"
                      />
                    </div>
                    <Button 
                      onClick={handleExecuteQuery} 
                      disabled={executeSqlMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {executeSqlMutation.isPending ? 'Executing...' : 'Execute Query'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Query Results */}
              {(queryResult || queryError) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Query Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {queryError ? (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{queryError}</AlertDescription>
                      </Alert>
                    ) : queryResult ? (
                      <div className="space-y-4">
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>Rows: {queryResult.rowCount}</span>
                          <span>Duration: {queryResult.duration}ms</span>
                        </div>
                        <div className="w-full overflow-x-auto max-h-96 border rounded">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-gray-800">
                                {queryResult.columns.map((col) => (
                                  <th key={col} className="border px-3 py-2 text-left font-medium">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {queryResult.rows.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                  {queryResult.columns.map((col) => (
                                    <td key={col} className="border px-3 py-2 max-w-xs truncate">
                                      {row[col] !== null ? String(row[col]) : <span className="text-gray-400">NULL</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Migrations Tab */}
            <TabsContent value="migrations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Migration History
                  </CardTitle>
                  <CardDescription>
                    Track applied migrations on your {selectedBranch} database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMigrations ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {migrations?.length ? (
                        migrations.map((migration: Migration) => (
                          <div key={migration.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{migration.name}</div>
                              <div className="text-sm text-gray-500">ID: {migration.id}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                {new Date(migration.run_on).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(migration.run_on).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          No migrations found. Create your first migration using the database script.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schema Tab */}
            <TabsContent value="schema" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Database Schema</CardTitle>
                  <CardDescription>
                    View complete schema structure for {selectedBranch} database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-8">
                    Advanced schema visualization coming soon...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}