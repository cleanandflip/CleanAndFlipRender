// ENHANCED DATABASE ADMIN - SINGLE SOURCE OF TRUTH
import { useState, useEffect } from 'react';
import { Database, RefreshCw, GitBranch, Save, RotateCcw, Eye, Terminal, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion } from "framer-motion";

type Branch = "dev" | "prod";

interface DatabaseInfo {
  name: string;
  tables: Array<{
    schema: string;
    name: string;
    full_name: string;
    row_count: number;
    columns: Array<{
      name: string;
      type: string;
      is_nullable: string;
      default_value: string | null;
    }>;
  }>;
  connectionStatus: "connected" | "error";
  error?: string;
}

interface Checkpoint {
  id: string;
  branch: string;
  label: string;
  schema_name: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export function EnhancedDatabaseTab() {
  // === STATE ===
  const [selectedBranch, setSelectedBranch] = useState<Branch>("dev");
  const [direction, setDirection] = useState<"dev_to_prod" | "prod_to_dev">("dev_to_prod");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [progress, setProgress] = useState<{phase?: string; table?: string; total?: number} | null>(null);
  const [newCkptLabel, setNewCkptLabel] = useState("manual");
  const [branchForCkpt, setBranchForCkpt] = useState<Branch>("dev");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users LIMIT 10;");
  const [queryResults, setQueryResults] = useState<any>(null);
  
  const { toast } = useToast();
  const qc = useQueryClient();

  // === QUERIES ===
  
  // Fetch database info for both branches
  const { data: dbInfo, isLoading: dbInfoLoading, refetch: refetchDbInfo } = useQuery({
    queryKey: ['/api/admin/database/info'],
    queryFn: async () => {
      const res = await fetch('/api/admin/database/info', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch database info');
      return res.json();
    }
  });

  // Fetch checkpoints for selected branch
  const ckptQuery = useQuery({
    queryKey: ["ckpts", branchForCkpt],
    queryFn: async () => {
      const r = await fetch(`/api/admin/db/${branchForCkpt}/checkpoints`, { credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    }
  });

  // === MUTATIONS ===
  
  // Create checkpoint
  const makeCkpt = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/admin/db/${branchForCkpt}/checkpoint`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ label: newCkptLabel })
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Checkpoint created" });
      qc.invalidateQueries({ queryKey: ["ckpts", branchForCkpt] });
      setNewCkptLabel("manual");
    },
    onError: (err: any) => {
      toast({ title: "Failed to create checkpoint", description: String(err), variant: "destructive" });
    }
  });

  // Rollback to checkpoint
  const doRollback = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/db/${branchForCkpt}/rollback/${id}`, {
        method: "POST", credentials: "include"
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Rolled back successfully" });
      qc.invalidateQueries({ queryKey: ['/api/admin/database/info'] });
    },
    onError: (err: any) => {
      toast({ title: "Rollback failed", description: String(err), variant: "destructive" });
    }
  });

  // Database sync
  const syncMutation = useMutation({
    mutationFn: async () => {
      const body: any = { direction };
      if (direction === "dev_to_prod") body.confirmText = confirmText;
      const res = await fetch(`/api/admin/db/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Sync complete", description: `Checkpoint: ${data.checkpointId}` });
      setConfirmOpen(false);
      setConfirmText("");
      setProgress({ phase: "Done" });
      qc.invalidateQueries({ queryKey: ['/api/admin/database/info'] });
      qc.invalidateQueries({ queryKey: ["ckpts"] });
    },
    onError: (err: any) => {
      toast({ title: "Sync failed", description: String(err), variant: "destructive" });
      setProgress({ phase: "Error" });
    }
  });

  // SQL Query execution
  const executeQuery = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/database/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          database: selectedBranch === "dev" ? "development" : "production",
          query: sqlQuery 
        })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      setQueryResults(data);
      toast({ title: "Query executed", description: `${data.rowCount} rows returned` });
    },
    onError: (err: any) => {
      toast({ title: "Query failed", description: String(err), variant: "destructive" });
    }
  });

  // === RENDER ===
  const currentDb = selectedBranch === "dev" ? dbInfo?.development : dbInfo?.production;
  const isConnected = currentDb?.connectionStatus === "connected";

  return (
    <div className="space-y-6" data-testid="enhanced-database-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Database Administration</h2>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetchDbInfo()}
          data-testid="button-refresh-db"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Branch Selector */}
      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Database Branches
          </h3>
          <Select value={selectedBranch} onValueChange={(v: Branch) => setSelectedBranch(v)}>
            <SelectTrigger className="w-[180px]" data-testid="select-branch">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">Development (Lucky-Poem)</SelectItem>
              <SelectItem value="prod">Production (Muddy-Moon)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 mb-4">
          {isConnected ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Connected' : currentDb?.error || 'Disconnected'}
          </span>
        </div>

        {/* Tables Overview */}
        {isConnected && currentDb?.tables && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentDb.tables.slice(0, 8).map((table: any) => (
              <div 
                key={table.full_name}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedTable(table.name)}
                data-testid={`table-card-${table.name}`}
              >
                <div className="font-medium text-sm">{table.name}</div>
                <div className="text-xs text-gray-500">{table.row_count} rows</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync Databases */}
      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Databases
          </h3>
          <Select value={direction} onValueChange={(v: any) => setDirection(v)}>
            <SelectTrigger className="w-[220px]" data-testid="select-sync-direction">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev_to_prod">Development → Production</SelectItem>
              <SelectItem value="prod_to_dev">Production → Development</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setConfirmOpen(true)}
            disabled={syncMutation.isPending}
            data-testid="button-sync-databases"
          >
            {direction === "dev_to_prod" ? "Sync Dev → Prod" : "Sync Prod → Dev"}
          </Button>

          {progress?.phase && (
            <motion.div
              key={progress.phase + (progress.table || "")}
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground"
            >
              {progress.phase}
              {progress.table ? `: ${progress.table}` : ""}
              {typeof progress.total === "number" ? ` (${progress.total})` : ""}
            </motion.div>
          )}
        </div>
      </div>

      {/* Checkpoints */}
      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Save className="h-5 w-5" />
            Checkpoints
          </h3>
          <Select value={branchForCkpt} onValueChange={(v: Branch) => setBranchForCkpt(v)}>
            <SelectTrigger className="w-[140px]" data-testid="select-checkpoint-branch">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">Development</SelectItem>
              <SelectItem value="prod">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 mb-4">
          <Input 
            className="w-[240px]" 
            value={newCkptLabel} 
            onChange={e => setNewCkptLabel(e.target.value)} 
            placeholder="Checkpoint label"
            data-testid="input-checkpoint-label"
          />
          <Button 
            onClick={() => makeCkpt.mutate()}
            disabled={makeCkpt.isPending || !newCkptLabel.trim()}
            data-testid="button-create-checkpoint"
          >
            Create Checkpoint
          </Button>
        </div>

        <div className="space-y-2">
          {ckptQuery.data?.checkpoints?.map((c: Checkpoint) => (
            <div key={c.id} className="flex items-center justify-between border rounded-xl p-3">
              <div className="text-sm">
                <div className="font-medium">{c.label}</div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    const r = await fetch(`/api/admin/db/${branchForCkpt}/checkpoints/${c.id}/diff`, { 
                      credentials: "include" 
                    });
                    const json = await r.json();
                    console.table(json.diff);
                    toast({ title: "Diff logged to console" });
                  }}
                  data-testid={`button-diff-${c.id}`}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Diff
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => doRollback.mutate(c.id)}
                  disabled={doRollback.isPending}
                  data-testid={`button-rollback-${c.id}`}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Rollback
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SQL Console */}
      <div className="rounded-2xl border p-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Terminal className="h-5 w-5" />
          SQL Console ({selectedBranch === "dev" ? "Development" : "Production"})
        </h3>
        
        <div className="space-y-3">
          <textarea
            className="w-full h-32 p-3 border rounded font-mono text-sm"
            value={sqlQuery}
            onChange={e => setSqlQuery(e.target.value)}
            placeholder="Enter SQL query..."
            data-testid="textarea-sql-query"
          />
          
          <Button 
            onClick={() => executeQuery.mutate()}
            disabled={executeQuery.isPending || !sqlQuery.trim()}
            data-testid="button-execute-query"
          >
            Execute Query
          </Button>

          {queryResults && (
            <div className="mt-4 p-3 bg-gray-50 rounded border">
              <div className="text-sm font-medium mb-2">
                Results: {queryResults.rowCount} rows in {queryResults.duration}ms
              </div>
              {queryResults.rows && queryResults.rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        {queryResults.columns?.map((col: string) => (
                          <th key={col} className="text-left p-1 border-b font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.rows.slice(0, 10).map((row: any, i: number) => (
                        <tr key={i}>
                          {queryResults.columns?.map((col: string) => (
                            <td key={col} className="p-1 border-b">
                              {String(row[col] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {queryResults.rows.length > 10 && (
                    <div className="text-xs text-gray-500 mt-2">
                      Showing first 10 rows of {queryResults.rows.length}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sync Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent data-testid="dialog-sync-confirmation">
          <DialogHeader>
            <DialogTitle>
              {direction === "dev_to_prod" ? "Confirm Dev → Prod Sync" : "Confirm Prod → Dev Sync"}
            </DialogTitle>
          </DialogHeader>

          {direction === "dev_to_prod" ? (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  ⚠️ This will overwrite <strong>Production</strong> with <strong>Development</strong> data.
                  A checkpoint of Production is created automatically so you can roll back.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Type <code>SYNC PRODUCTION</code> to continue:
                </label>
                <Input 
                  value={confirmText} 
                  onChange={e => setConfirmText(e.target.value)} 
                  placeholder="SYNC PRODUCTION"
                  data-testid="input-sync-confirmation"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                This will overwrite <strong>Development</strong> with <strong>Production</strong> data.
                A checkpoint of Development is created automatically.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={
                syncMutation.isPending || 
                (direction === "dev_to_prod" && confirmText !== "SYNC PRODUCTION")
              }
              data-testid="button-confirm-sync"
            >
              {syncMutation.isPending ? "Syncing..." : "Sync Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}