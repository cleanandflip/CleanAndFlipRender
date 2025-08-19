import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Database,
  Table,
  Play,
  Download,
  Upload,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';

interface Branch {
  key: string;
  name: string;
  url: string;
}

interface Table {
  table_name: string;
  schema_name: string;
  row_count: number;
  size_pretty: string;
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

export default function EnhancedDatabaseTab() {
  const { toast } = useToast();
  const [selectedBranch, setSelectedBranch] = useState<string>('dev');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedSchema, setSelectedSchema] = useState<string>('public');
  const [showTableDetails, setShowTableDetails] = useState<boolean>(false);
  const [checkpointLabel, setCheckpointLabel] = useState<string>('');
  const [checkpointNotes, setCheckpointNotes] = useState<string>('');
  const [showCheckpointDialog, setShowCheckpointDialog] = useState<boolean>(false);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [showQueryDialog, setShowQueryDialog] = useState<boolean>(false);

  // Fetch branches
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['/api/admin/db/branches'],
  });

  // Fetch tables for selected branch
  const { data: tables = [], isLoading: tablesLoading } = useQuery<Table[]>({
    queryKey: ['/api/admin/db/' + selectedBranch + '/tables'],
    enabled: !!selectedBranch,
  });

  // Fetch table details
  const { data: tableDetails } = useQuery<{
    columns: Array<{ column_name: string; data_type: string; }>;
    indexes: Array<any>;
    rowCount: number;
  }>({
    queryKey: ['/api/admin/db/' + selectedBranch + '/tables/' + selectedSchema + '/' + selectedTable],
    enabled: !!selectedBranch && !!selectedTable && showTableDetails,
  });

  // Fetch migrations
  const { data: migrations = [] } = useQuery<Migration[]>({
    queryKey: ['/api/admin/db/' + selectedBranch + '/migrations'],
    enabled: !!selectedBranch,
  });

  // Fetch checkpoints
  const { data: checkpoints = [] } = useQuery<Checkpoint[]>({
    queryKey: ['/api/admin/db/' + selectedBranch + '/checkpoints'],
    enabled: !!selectedBranch,
  });

  // Create checkpoint mutation
  const createCheckpoint = useMutation({
    mutationFn: async ({ label, notes }: { label: string; notes?: string }) => {
      const response = await fetch(`/api/admin/db/${selectedBranch}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, notes }),
      });
      if (!response.ok) {
        throw new Error('Checkpoint creation failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Checkpoint Created", description: "Database checkpoint created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/db/' + selectedBranch + '/checkpoints'] });
      setShowCheckpointDialog(false);
      setCheckpointLabel('');
      setCheckpointNotes('');
    },
    onError: (error: Error) => {
      toast({ 
        title: "Checkpoint Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Execute SQL query mutation
  const executeQuery = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/admin/db/${selectedBranch}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        throw new Error('Query execution failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Query Executed", description: "SQL query completed successfully" });
      console.log('Query results:', data);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Query Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleTableClick = (table: Table) => {
    setSelectedTable(table.table_name);
    setSelectedSchema(table.schema_name);
    setShowTableDetails(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Database className="h-6 w-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Database Management</h2>
        <div className="flex gap-2">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-48 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select branch</option>
            {branches.map((branch) => (
              <option key={branch.key} value={branch.key}>
                {branch.name}
              </option>
            ))}
          </select>
          
          <Dialog open={showCheckpointDialog} onOpenChange={setShowCheckpointDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Create Checkpoint
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Database Checkpoint</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="checkpoint-label">Checkpoint Label</Label>
                  <Input
                    id="checkpoint-label"
                    value={checkpointLabel}
                    onChange={(e) => setCheckpointLabel(e.target.value)}
                    placeholder="Enter checkpoint name..."
                  />
                </div>
                <div>
                  <Label htmlFor="checkpoint-notes">Notes (Optional)</Label>
                  <Textarea
                    id="checkpoint-notes"
                    value={checkpointNotes}
                    onChange={(e) => setCheckpointNotes(e.target.value)}
                    placeholder="Add notes about this checkpoint..."
                  />
                </div>
                <Button 
                  onClick={() => createCheckpoint.mutate({ label: checkpointLabel, notes: checkpointNotes })}
                  disabled={!checkpointLabel || createCheckpoint.isPending}
                >
                  {createCheckpoint.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Create Checkpoint
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showQueryDialog} onOpenChange={setShowQueryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Run Query
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Execute SQL Query</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sql-query">SQL Query</Label>
                  <Textarea
                    id="sql-query"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="SELECT * FROM..."
                    rows={8}
                    className="font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => executeQuery.mutate(sqlQuery)}
                    disabled={!sqlQuery || executeQuery.isPending}
                  >
                    {executeQuery.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    Execute Query
                  </Button>
                  <Button variant="outline" onClick={() => setSqlQuery('')}>
                    Clear
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tables">
            <Table className="h-4 w-4 mr-2" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="migrations">
            <Clock className="h-4 w-4 mr-2" />
            Migrations
          </TabsTrigger>
          <TabsTrigger value="checkpoints">
            <Download className="h-4 w-4 mr-2" />
            Checkpoints
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Settings className="h-4 w-4 mr-2" />
            Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables ({tables.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {tablesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                  <span className="ml-2 text-gray-400">Loading tables...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.map((table) => (
                    <div
                      key={`${table.schema_name}.${table.table_name}`}
                      className="p-4 border border-gray-700 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                      onClick={() => handleTableClick(table)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{table.table_name}</h3>
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <div>Schema: {table.schema_name}</div>
                        <div>Rows: {table.row_count?.toLocaleString() || 'N/A'}</div>
                        <div>Size: {table.size_pretty || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {showTableDetails && tableDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Table Details: {selectedTable}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Columns</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {tableDetails.columns?.map((column) => (
                        <div key={column.column_name} className="p-2 bg-gray-800 rounded">
                          <div className="font-medium">{column.column_name}</div>
                          <div className="text-sm text-gray-400">{column.data_type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Row Count</h4>
                    <Badge variant="outline">{tableDetails.rowCount?.toLocaleString()} rows</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="migrations">
          <Card>
            <CardHeader>
              <CardTitle>Migration History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {migrations.map((migration) => (
                  <div key={migration.id} className="flex items-center justify-between p-3 border border-gray-700 rounded">
                    <div>
                      <div className="font-medium text-white">{migration.name}</div>
                      <div className="text-sm text-gray-400">ID: {migration.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        {new Date(migration.run_on).toLocaleDateString()}
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkpoints">
          <Card>
            <CardHeader>
              <CardTitle>Database Checkpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checkpoints.map((checkpoint) => (
                  <div key={checkpoint.id} className="flex items-center justify-between p-3 border border-gray-700 rounded">
                    <div>
                      <div className="font-medium text-white">{checkpoint.label}</div>
                      <div className="text-sm text-gray-400">By: {checkpoint.created_by}</div>
                      {checkpoint.notes && (
                        <div className="text-sm text-gray-500 mt-1">{checkpoint.notes}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        {new Date(checkpoint.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {checkpoints.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No checkpoints created yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Database Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Connection Status</h3>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400">Connected</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Total Tables</h3>
                  <div className="text-2xl font-bold text-blue-400">{tables.length}</div>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Branch</h3>
                  <Badge variant="outline">{selectedBranch}</Badge>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Checkpoints</h3>
                  <div className="text-2xl font-bold text-green-400">{checkpoints.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}