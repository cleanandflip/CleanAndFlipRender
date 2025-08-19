// COMPLETE DATABASE ADMIN REWRITE - SIMPLE, ACCURATE, RELIABLE
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  Database, 
  Table as TableIcon, 
  Play, 
  Download, 
  RefreshCw, 
  Eye, 
  Settings, 
  Terminal, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  GitBranch,
  History,
  Zap
} from 'lucide-react';

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

interface Checkpoint {
  id: string;
  branch: string;
  label: string;
  schema_name: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

interface CheckpointDiff {
  table_name: string;
  current_count: number;
  checkpoint_count: number;
  delta: number;
}

export function DatabaseTabRewritten() {
  // State
  const [selectedBranch, setSelectedBranch] = useState<string>('dev');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sync state
  const [direction, setDirection] = useState<"dev_to_prod" | "prod_to_dev">("dev_to_prod");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [progress, setProgress] = useState<{phase?: string; table?: string; total?: number} | null>(null);
  
  // Checkpoint state
  const [newCkptLabel, setNewCkptLabel] = useState("manual");
  const [newCkptNotes, setNewCkptNotes] = useState("");
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [rollbackConfirm, setRollbackConfirm] = useState("");
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);

  const { toast } = useToast();
  const qc = useQueryClient();

  // Queries
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['/api/admin/db/branches'],
    queryFn: async () => {
      const res = await fetch('/api/admin/db/branches', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json();
    }
  });

  const { data: tables = [], isLoading: tablesLoading, refetch: refetchTables } = useQuery<DatabaseTable[]>({
    queryKey: ['/api/admin/db/' + selectedBranch + '/tables'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/db/${selectedBranch}/tables`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tables');
      return res.json();
    },
    enabled: !!selectedBranch,
  });

  const { data: checkpointsResponse, refetch: refetchCheckpoints } = useQuery({
    queryKey: ['checkpoints-v2', selectedBranch],
    queryFn: async () => {
      const r = await fetch(`/api/admin/db/${selectedBranch}/checkpoints-v2`, { credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    enabled: !!selectedBranch
  });

  const checkpoints = checkpointsResponse?.checkpoints || [];

  const { data: diffData } = useQuery({
    queryKey: ['checkpoint-diff', selectedCheckpoint?.id],
    queryFn: async () => {
      const r = await fetch(`/api/admin/db/${selectedBranch}/checkpoints-v2/${selectedCheckpoint!.id}/diff`, { credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    enabled: !!selectedCheckpoint?.id
  });

  // Mutations
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
      setProgress(null);
      // Refresh both branches
      qc.invalidateQueries({ queryKey: ['/api/admin/db/dev/tables'] });
      qc.invalidateQueries({ queryKey: ['/api/admin/db/prod/tables'] });
      qc.invalidateQueries({ queryKey: ['checkpoints-v2'] });
    },
    onError: (err: any) => {
      toast({ title: "Sync failed", description: String(err), variant: "destructive" });
      setProgress(null);
    }
  });

  const createCheckpointMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/admin/db/${selectedBranch}/checkpoint-v2`, {
        method: "POST", 
        credentials: "include",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ label: newCkptLabel, notes: newCkptNotes })
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Checkpoint created successfully" });
      setNewCkptLabel("manual");
      setNewCkptNotes("");
      refetchCheckpoints();
    },
    onError: (err: any) => {
      toast({ title: "Failed to create checkpoint", description: String(err), variant: "destructive" });
    }
  });

  const rollbackMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/admin/db/${selectedBranch}/rollback-v2/${selectedCheckpoint!.id}`, {
        method: "POST", 
        credentials: "include",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ confirmPhrase: rollbackConfirm })
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Rollback completed successfully" });
      setShowRollbackModal(false);
      setRollbackConfirm("");
      setSelectedCheckpoint(null);
      refetchTables();
      refetchCheckpoints();
    },
    onError: (err: any) => {
      toast({ title: "Rollback failed", description: String(err), variant: "destructive" });
    }
  });

  // Filter tables
  const filteredTables = tables.filter(table =>
    table.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.table_schema.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format numbers
  const formatBytes = (bytes: string) => {
    const b = parseInt(bytes) || 0;
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: string) => {
    return parseInt(num || '0').toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Administration</h2>
          <p className="text-muted-foreground">Manage development and production databases</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Database className="h-3 w-3" />
            {branches.length} Branches
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sync">Database Sync</TabsTrigger>
          <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
          <TabsTrigger value="query">Query Console</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Database Overview</CardTitle>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.key} value={branch.key}>
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          {branch.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline" size="sm" onClick={() => refetchTables()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {tablesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading tables...</div>
                  ) : filteredTables.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No tables found</div>
                  ) : (
                    filteredTables.map(table => (
                      <div key={`${table.table_schema}.${table.table_name}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <TableIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{table.table_name}</p>
                            <p className="text-sm text-muted-foreground">{table.table_schema}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{formatNumber(table.row_count_estimate)} rows</span>
                          <span>{formatBytes(table.total_bytes)}</span>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Database Synchronization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Sync Direction</Label>
                <Select value={direction} onValueChange={(v: any) => setDirection(v)}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dev_to_prod">Development → Production</SelectItem>
                    <SelectItem value="prod_to_dev">Production → Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to sync</p>
                  <p className="text-sm text-muted-foreground">
                    {direction === "dev_to_prod" ? "Copy Development data to Production" : "Copy Production data to Development"}
                  </p>
                </div>
                <Button onClick={() => setConfirmOpen(true)} disabled={syncMutation.isPending}>
                  {syncMutation.isPending ? "Syncing..." : "Start Sync"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {progress?.phase && (
                <motion.div
                  key={progress.phase + (progress.table || "")}
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="font-medium">{progress.phase}</span>
                  </div>
                  {progress.table && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Table: {progress.table} {typeof progress.total === "number" ? `(${progress.total} rows)` : ""}
                    </p>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checkpoints Tab */}
        <TabsContent value="checkpoints" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Create Checkpoint */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Create Checkpoint
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input 
                    value={newCkptLabel} 
                    onChange={e => setNewCkptLabel(e.target.value)}
                    placeholder="checkpoint-label"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea 
                    value={newCkptNotes} 
                    onChange={e => setNewCkptNotes(e.target.value)}
                    placeholder="Description of this checkpoint..."
                    rows={2}
                  />
                </div>
                <Button 
                  onClick={() => createCheckpointMutation.mutate()} 
                  disabled={!newCkptLabel || createCheckpointMutation.isPending}
                  className="w-full"
                >
                  {createCheckpointMutation.isPending ? "Creating..." : "Create Checkpoint"}
                </Button>
              </CardContent>
            </Card>

            {/* Checkpoint List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Available Checkpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {checkpoints.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No checkpoints yet</p>
                    ) : (
                      checkpoints.map((ckpt: Checkpoint) => (
                        <div key={ckpt.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{ckpt.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(ckpt.created_at).toLocaleString()} • {ckpt.created_by}
                            </p>
                            {ckpt.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{ckpt.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedCheckpoint(ckpt);
                                setShowDiffModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedCheckpoint(ckpt);
                                setShowRollbackModal(true);
                              }}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Query Console Tab */}
        <TabsContent value="query">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                SQL Query Console
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Query console coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sync Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {direction === "dev_to_prod" ? "Confirm Dev → Prod Sync" : "Confirm Prod → Dev Sync"}
            </DialogTitle>
          </DialogHeader>

          {direction === "dev_to_prod" ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Production Warning</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  This will completely replace Production data with Development data.
                  A safety checkpoint will be created automatically.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Type <code>SYNC PRODUCTION</code> to confirm</Label>
                <Input 
                  value={confirmText} 
                  onChange={e => setConfirmText(e.target.value)} 
                  placeholder="SYNC PRODUCTION" 
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will replace Development data with Production data.
                A safety checkpoint will be created automatically.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={direction === "dev_to_prod" && confirmText !== "SYNC PRODUCTION"}
            >
              {syncMutation.isPending ? "Syncing..." : "Confirm Sync"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback Confirmation Modal */}
      <Dialog open={showRollbackModal} onOpenChange={setShowRollbackModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback to Checkpoint</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Destructive Operation</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                This will replace all current data with checkpoint: {selectedCheckpoint?.label}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Type <code>ROLLBACK {selectedBranch.toUpperCase()}</code> to confirm</Label>
              <Input 
                value={rollbackConfirm} 
                onChange={e => setRollbackConfirm(e.target.value)} 
                placeholder={`ROLLBACK ${selectedBranch.toUpperCase()}`}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRollbackModal(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rollbackMutation.mutate()}
              disabled={rollbackConfirm !== `ROLLBACK ${selectedBranch.toUpperCase()}`}
            >
              {rollbackMutation.isPending ? "Rolling back..." : "Confirm Rollback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diff Modal */}
      <Dialog open={showDiffModal} onOpenChange={setShowDiffModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Checkpoint Diff: {selectedCheckpoint?.label}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {diffData?.diff?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No differences found</p>
              ) : (
                diffData?.diff?.map((diff: CheckpointDiff) => (
                  <div key={diff.table_name} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{diff.table_name}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Current: {diff.current_count}</span>
                      <span>Checkpoint: {diff.checkpoint_count}</span>
                      <Badge variant={diff.delta > 0 ? "default" : diff.delta < 0 ? "destructive" : "secondary"}>
                        {diff.delta > 0 ? "+" : ""}{diff.delta}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDiffModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}