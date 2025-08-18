import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Database, Play, Table, Users, Settings, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface DatabaseInfo {
  name: string;
  tables: TableInfo[];
  connectionStatus: 'connected' | 'error' | 'checking';
  error?: string;
}

interface TableInfo {
  name: string;
  rowCount: number;
  schema: string;
  columns: ColumnInfo[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
}

interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  duration: number;
}

export default function DatabaseAdmin() {
  const [selectedDatabase, setSelectedDatabase] = useState<'development' | 'production'>('development');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM users LIMIT 10;');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database info
  const { data: databases, isLoading: loadingDatabases } = useQuery({
    queryKey: ['/api/admin/databases'],
    staleTime: 30000, // 30 seconds
  });

  // Execute SQL query mutation
  const executeSqlMutation = useMutation({
    mutationFn: async ({ database, query }: { database: string; query: string }) => {
      const response = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database, query })
      });
      if (!response.ok) throw new Error(await response.text());
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

  // Get table data mutation
  const getTableDataMutation = useMutation({
    mutationFn: async ({ database, table, limit = 100 }: { database: string; table: string; limit?: number }) => {
      const response = await fetch('/api/admin/database/table-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database, table, limit })
      });
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    },
    onSuccess: (data) => {
      setQueryResult(data);
      setQueryError('');
    },
    onError: (error: any) => {
      setQueryError(error.message || 'Failed to fetch table data');
      setQueryResult(null);
    },
  });

  const currentDb: DatabaseInfo | undefined = databases?.[selectedDatabase];

  const handleExecuteQuery = () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a SQL query to execute",
        variant: "destructive",
      });
      return;
    }
    executeSqlMutation.mutate({ database: selectedDatabase, query: sqlQuery });
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setSqlQuery(`SELECT * FROM ${tableName} LIMIT 10;`);
    getTableDataMutation.mutate({ database: selectedDatabase, table: tableName, limit: 10 });
  };

  const renderConnectionStatus = (status: string, error?: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Checking...</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" data-testid="database-admin-page">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-8 h-8" />
            Database Administration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your development and production databases
          </p>
        </div>

        {loadingDatabases ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Database Selection Sidebar */}
            <div className="lg:col-span-1">
              <Card data-testid="database-selector">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Databases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Active Database</Label>
                    <select 
                      value={selectedDatabase} 
                      onChange={(e) => setSelectedDatabase(e.target.value as 'development' | 'production')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600"
                      data-testid="database-select"
                    >
                      <option value="development" data-testid="select-development">
                        Development (lucky-poetry)
                      </option>
                      <option value="production" data-testid="select-production">
                        Production (muddy-moon)
                      </option>
                    </select>
                  </div>

                  {currentDb && (
                    <div className="space-y-3">
                      <div>
                        <Label>Connection Status</Label>
                        <div className="mt-1">
                          {renderConnectionStatus(currentDb.connectionStatus, currentDb.error)}
                        </div>
                      </div>

                      {currentDb.error && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {currentDb.error}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div>
                        <Label className="flex items-center gap-2">
                          <Table className="w-4 h-4" />
                          Tables ({currentDb.tables?.length || 0})
                        </Label>
                        <ScrollArea className="h-40 w-full border rounded-md mt-2">
                          <div className="p-2">
                            {currentDb.tables?.map((table: TableInfo) => (
                              <button
                                key={table.name}
                                onClick={() => handleTableSelect(table.name)}
                                className={`w-full text-left p-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                  selectedTable === table.name ? 'bg-blue-100 dark:bg-blue-900' : ''
                                }`}
                                data-testid={`table-${table.name}`}
                              >
                                <div className="font-medium">{table.name}</div>
                                <div className="text-xs text-gray-500">{table.rowCount} rows</div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="query" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="query" data-testid="tab-query">SQL Query</TabsTrigger>
                  <TabsTrigger value="table" data-testid="tab-table">Table Browser</TabsTrigger>
                  <TabsTrigger value="schema" data-testid="tab-schema">Schema</TabsTrigger>
                </TabsList>

                {/* SQL Query Tab */}
                <TabsContent value="query" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Play className="w-5 h-5" />
                        SQL Query Editor
                      </CardTitle>
                      <CardDescription>
                        Execute SQL queries against {selectedDatabase} database
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>SQL Query</Label>
                        <Textarea
                          value={sqlQuery}
                          onChange={(e) => setSqlQuery(e.target.value)}
                          placeholder="SELECT * FROM users LIMIT 10;"
                          className="font-mono text-sm h-32"
                          data-testid="sql-query-input"
                        />
                      </div>
                      <Button 
                        onClick={handleExecuteQuery} 
                        disabled={executeSqlMutation.isPending}
                        data-testid="execute-query-button"
                      >
                        {executeSqlMutation.isPending ? 'Executing...' : 'Execute Query'}
                      </Button>
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
                            <ScrollArea className="w-full">
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300 text-sm">
                                  <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800">
                                      {queryResult.columns.map((col) => (
                                        <th key={col} className="border border-gray-300 px-3 py-2 text-left font-medium">
                                          {col}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {queryResult.rows.map((row, i) => (
                                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        {queryResult.columns.map((col) => (
                                          <td key={col} className="border border-gray-300 px-3 py-2 max-w-xs truncate">
                                            {row[col] !== null ? String(row[col]) : <span className="text-gray-400">NULL</span>}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </ScrollArea>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Table Browser Tab */}
                <TabsContent value="table" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Table Browser</CardTitle>
                      <CardDescription>
                        Browse table data with pagination
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedTable ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Label>Table: </Label>
                            <Badge variant="outline">{selectedTable}</Badge>
                            <Button 
                              size="sm" 
                              onClick={() => getTableDataMutation.mutate({ database: selectedDatabase, table: selectedTable, limit: 100 })}
                              disabled={getTableDataMutation.isPending}
                              data-testid="refresh-table-button"
                            >
                              Refresh
                            </Button>
                          </div>
                          {/* Results displayed using same component as query tab */}
                          {queryResult && (
                            <ScrollArea className="w-full">
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300 text-sm">
                                  <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800">
                                      {queryResult.columns.map((col) => (
                                        <th key={col} className="border border-gray-300 px-3 py-2 text-left font-medium">
                                          {col}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {queryResult.rows.map((row, i) => (
                                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        {queryResult.columns.map((col) => (
                                          <td key={col} className="border border-gray-300 px-3 py-2 max-w-xs truncate">
                                            {row[col] !== null ? String(row[col]) : <span className="text-gray-400">NULL</span>}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </ScrollArea>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">Select a table from the sidebar to browse its data</p>
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
                        View table structures and relationships
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentDb?.tables?.length ? (
                        <div className="space-y-4">
                          {currentDb.tables.map((table: TableInfo) => (
                            <div key={table.name} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-lg">{table.name}</h3>
                                <Badge variant="secondary">{table.rowCount} rows</Badge>
                              </div>
                              <div className="grid gap-2">
                                {table.columns?.map((column: ColumnInfo) => (
                                  <div key={column.name} className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-800 rounded">
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium text-sm">{column.name}</span>
                                      <Badge variant="outline" className="text-xs">{column.type}</Badge>
                                    </div>
                                    <div className="flex gap-2">
                                      {!column.nullable && <Badge variant="secondary" className="text-xs">NOT NULL</Badge>}
                                      {column.default && <Badge variant="outline" className="text-xs">DEFAULT</Badge>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No tables found or database not connected</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}