// src/pages/observability.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obsApi, type Issue, type ErrorEvent } from "@/api/observability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertTriangle, CheckCircle, XCircle, Activity, AlertCircle, TrendingUp } from "lucide-react";
import Dropdown, { type DropdownOption } from "@/components/ui/Dropdown";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function toDateSafe(dateStr?: string): Date | null { if (!dateStr) return null; const d = new Date(dateStr); return isNaN(d.getTime()) ? null : d; }
function fmtDateTime(date: Date | null): string { return date ? date.toLocaleString() : "Unknown"; }

const LEVELS: DropdownOption[] = [
  { label: "All levels", value: "" },
  { label: "Error", value: "error" },
  { label: "Warn", value: "warn" },
  { label: "Info", value: "info" },
];
const ENVS: DropdownOption[] = [
  { label: "All envs", value: "" },
  { label: "Production", value: "production" },
  { label: "Development", value: "development" },
];
const STATUSES: DropdownOption[] = [
  { label: "All", value: "all" },
  { label: "Unresolved", value: "unresolved" },
  { label: "Resolved", value: "resolved" },
];
const TIME_RANGES: DropdownOption[] = [
  { label: "Last 24h", value: "1" },
  { label: "Last 7d", value: "7" },
  { label: "Last 30d", value: "30" },
];

export default function ObservabilityPage() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string>("error");
  const [env, setEnv] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [showIgnored, setShowIgnored] = useState<boolean>(false);
  const [showTestEvents, setShowTestEvents] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("1");
  const limit = 20;

  const queryClient = useQueryClient();

  const { data: issuesData, isLoading } = useQuery({
    queryKey: ["obs:issues", q, level, env, status, page, limit, timeRange],
    queryFn: () =>
      obsApi.issues({
        q,
        level: level || undefined,
        env: env || undefined,
        resolved: status === "all" ? undefined : status === "resolved",
        days: parseInt(timeRange, 10),
        page,
        limit,
      }),
    placeholderData: (prev) => prev,
  });

  const { data: issueDetails } = useQuery({
    queryKey: ["obs:issue", selectedIssue],
    queryFn: async () => {
      if (!selectedIssue) return null;
      try { 
        return await obsApi.issue(selectedIssue); 
      } catch {
        const evs = await obsApi.events(selectedIssue, 50);
        if (!Array.isArray(evs) || evs.length === 0) throw new Error("Not found");
        const latest = evs[0];
        return {
          issue: {
            fingerprint: selectedIssue,
            title: latest.message ?? "(no message)",
            level: latest.level ?? "error",
            firstSeen: evs[evs.length - 1].createdAt,
            lastSeen: latest.createdAt,
            count: evs.length,
            resolved: false,
            ignored: false,
            service: latest.service,
          },
        };
      }
    },
    enabled: !!selectedIssue,
  });

  const { data: issueEvents } = useQuery({
    queryKey: ["obs:issue-events", selectedIssue],
    queryFn: () => (selectedIssue ? obsApi.events(selectedIssue) : null),
    enabled: !!selectedIssue,
  });

  const { data: seriesData } = useQuery({
    queryKey: ["obs:series", timeRange],
    queryFn: () => obsApi.series(parseInt(timeRange)),
  });

  const resolveMutation = useMutation({
    mutationFn: (fp: string) => obsApi.resolve(fp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obs:issues"] });
      if (selectedIssue) queryClient.invalidateQueries({ queryKey: ["obs:issue", selectedIssue] });
    },
  });
  const reopenMutation = useMutation({
    mutationFn: (fp: string) => obsApi.reopen(fp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obs:issues"] });
      if (selectedIssue) queryClient.invalidateQueries({ queryKey: ["obs:issue", selectedIssue] });
    },
  });
  const ignoreMutation = useMutation({
    mutationFn: ({ fingerprint, ignored }: { fingerprint: string; ignored: boolean }) =>
      ignored ? obsApi.ignore(fingerprint) : obsApi.unignore(fingerprint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obs:issues"] });
      if (selectedIssue) queryClient.invalidateQueries({ queryKey: ["obs:issue", selectedIssue] });
    },
  });

  const items = Array.isArray(issuesData?.items) ? issuesData.items : [];
  const filteredItems = useMemo(() => {
    return items.filter((it: Issue) => {
      if (!showIgnored && it.ignored) return false;
      if (!showTestEvents && /\btest(ed)?\b/i.test(it.title ?? "")) return false;
      return true;
    });
  }, [items, showIgnored, showTestEvents]);

  const days = parseInt(timeRange, 10);
  const byDay = days > 1;

  const series = Array.isArray(seriesData) ? seriesData : [];
  const chartData = series
    .map((r: any) => {
      const t = new Date(r.ts);
      return {
        label: byDay
          ? t.toLocaleDateString(undefined, { month: "short", day: "numeric" })
          : t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        count: Number(r.count) || 0,
      };
    })
    .filter((d: any) => d.label);

  const errorsInRange = chartData.reduce((s, d) => s + d.count, 0);

  const getLevelBadgeColor = (lvl: string) =>
    lvl === "error" ? "destructive" : lvl === "warn" ? "outline" : lvl === "info" ? "secondary" : "default";

  const getStatusIcon = (issue: Issue) =>
    issue.resolved ? <CheckCircle className="h-4 w-4 text-green-500" /> :
    issue.ignored ? <XCircle className="h-4 w-4 text-gray-500" /> :
                    <AlertTriangle className="h-4 w-4 text-red-500" />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Error Tracking</h1>
        <div className="flex items-center gap-3">
          <Dropdown value={timeRange} onChange={setTimeRange} options={TIME_RANGES} />
          <Button variant="outline" onClick={() => {
            obsApi.ingest({
              service: "client",
              level: "error",
              env: "development",
              message: "Seeded test error – dashboard verification",
              stack: "at ObservabilityPage(seed)",
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: ["obs:series"] });
              queryClient.invalidateQueries({ queryKey: ["obs:issues"] });
            });
          }}>Seed Test Error</Button>
        </div>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Error Trends</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Issues</p><p className="text-2xl font-bold">{issuesData?.total || 0}</p></div><AlertCircle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Errors in Range</p><p className="text-2xl font-bold">{errorsInRange}</p></div><TrendingUp className="h-8 w-8 text-orange-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Resolved</p><p className="text-2xl font-bold">{items.filter((i: Issue) => i.resolved).length}</p></div><CheckCircle className="h-8 w-8 text-green-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold">{items.filter((i: Issue) => !i.resolved && !i.ignored).length}</p></div><AlertTriangle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Input placeholder="Search errors..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-64" />
            <Dropdown value={level} onChange={setLevel} options={LEVELS} placeholder="Level" />
            <Dropdown value={env} onChange={setEnv} options={ENVS} placeholder="Environment" />
            <Dropdown value={status} onChange={setStatus} options={STATUSES} placeholder="Status" />
            <div className="flex items-center gap-2">
              <Checkbox id="toggle-ignored" checked={showIgnored} onCheckedChange={(c) => setShowIgnored(c === true)} />
              <label htmlFor="toggle-ignored" className="text-sm">Show ignored</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="toggle-test" checked={showTestEvents} onCheckedChange={(c) => setShowTestEvents(c === true)} />
              <label htmlFor="toggle-test" className="text-sm">Show test events</label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Issues ({filteredItems.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-3">
              <div>No issues found for current filters.</div>
              <div className="text-xs">
                Tips: switch Status to <span className="font-medium">All</span>,
                enable <span className="font-medium">Show ignored</span>, or
                toggle <span className="font-medium">Show test events</span>.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((issue: Issue) => {
                const lastSeen = toDateSafe(issue.lastSeen);
                return (
                  <div key={issue.fingerprint} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => setSelectedIssue(issue.fingerprint)}>
                    <div className="flex items-center gap-4">
                      {getStatusIcon(issue)}
                      <div>
                        <div className="font-medium">{issue.title}</div>
                        <div className="text-sm text-muted-foreground">{issue.fingerprint}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getLevelBadgeColor(issue.level)}>{issue.level}</Badge>
                      <div className="text-sm text-right">
                        <div className="font-medium">{issue.count}x</div>
                        <div className="text-muted-foreground">{fmtDateTime(lastSeen)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <SheetContent className="w-[600px] sm:w-[600px]">
          <SheetHeader><SheetTitle>Issue Details</SheetTitle></SheetHeader>
          {issueDetails?.issue && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Overview</h3>
                <div className="space-y-2 text-sm">
                  <div>Title: {issueDetails.issue.title}</div>
                  <div>Level: <Badge variant={getLevelBadgeColor(issueDetails.issue.level)}>{issueDetails.issue.level}</Badge></div>
                  <div>Count: {issueDetails.issue.count}</div>
                  <div>First seen: {fmtDateTime(toDateSafe(issueDetails.issue.firstSeen))}</div>
                  <div>Last seen: {fmtDateTime(toDateSafe(issueDetails.issue.lastSeen))}</div>
                  <div>Status: {issueDetails.issue.resolved ? "Resolved" : issueDetails.issue.ignored ? "Ignored" : "Active"}</div>
                </div>
              </div>

              <div className="flex gap-2">
                {!issueDetails.issue.resolved ? (
                  <Button onClick={() => resolveMutation.mutate(selectedIssue!)} disabled={resolveMutation.isPending}>Mark Resolved</Button>
                ) : (
                  <Button variant="outline" onClick={() => reopenMutation.mutate(selectedIssue!)} disabled={reopenMutation.isPending}>Reopen</Button>
                )}
                <Button variant="outline" onClick={() => ignoreMutation.mutate({ fingerprint: selectedIssue!, ignored: !issueDetails.issue.ignored })} disabled={ignoreMutation.isPending}>
                  {issueDetails.issue.ignored ? "Unignore" : "Ignore"}
                </Button>
              </div>

              {!!issueEvents?.length && (
                <div>
                  <h3 className="font-semibold mb-2">Recent Events</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {issueEvents.slice(0, 10).map((event: ErrorEvent, i: number) => (
                      <div key={i} className="p-3 bg-muted rounded text-sm">
                        <div className="font-medium">{event.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">{fmtDateTime(toDateSafe(event.createdAt))} • {event.env} • {event.service}</div>
                        {Array.isArray(event.stack) && event.stack[0] && (<div className="text-xs text-muted-foreground mt-1 font-mono">{event.stack[0]}</div>)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}