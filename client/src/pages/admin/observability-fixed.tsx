import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { obsApi, type Issue, type ErrorEvent } from "@/api/observability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertTriangle, CheckCircle, XCircle, Clock, Users, Activity, TrendingUp, AlertCircle } from "lucide-react";
import { toDateSafe, fmtDateTime } from "@/lib/dates";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import UnifiedDropdown, { type Option as DropdownOption } from "@/components/ui/UnifiedDropdown";

// Unified dropdown options
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
  { label: "Unresolved", value: "false" },
  { label: "Resolved", value: "true" },
];

const TIME_RANGES: DropdownOption[] = [
  { label: "Last 24h", value: "1" },
  { label: "Last 7d", value: "7" },
  { label: "Last 30d", value: "30" },
];

export default function ObservabilityPage() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string>("error"); // Default to error only
  const [env, setEnv] = useState<string>("");
  const [resolved, setResolved] = useState(false);
  const [showTestEvents, setShowTestEvents] = useState(false);
  const [showIgnored, setShowIgnored] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("1");
  const limit = 20;

  const queryClient = useQueryClient();

  // Issues query with defensive data handling
  const { data: issuesData, isLoading } = useQuery({
    queryKey: ["obs:issues", q, level, env, resolved, page, limit],
    queryFn: () => obsApi.issues({ 
      q, 
      level: level || undefined, 
      env: env || undefined, 
      resolved, 
      page, 
      limit 
    }),
    placeholderData: (prev) => prev,
  });

  // Issue details query
  const { data: issueDetails } = useQuery({
    queryKey: ["obs:issue", selectedIssue],
    queryFn: () => selectedIssue ? obsApi.issue(selectedIssue) : null,
    enabled: !!selectedIssue,
  });

  // Issue events query
  const { data: issueEvents } = useQuery({
    queryKey: ["obs:issue-events", selectedIssue],
    queryFn: () => selectedIssue ? obsApi.events(selectedIssue) : null,
    enabled: !!selectedIssue,
  });

  // Error trends query
  const { data: seriesData } = useQuery({
    queryKey: ["obs:series", timeRange],
    queryFn: () => obsApi.series(parseInt(timeRange)),
  });

  // Mutations
  const resolveMutation = useMutation({
    mutationFn: (fingerprint: string) => 
      fetch(`/api/observability/issues/${fingerprint}/resolve`, { 
        method: 'PUT',
        credentials: 'include'
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obs:issues"] });
      setSelectedIssue(null);
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: ({ fingerprint, ignored }: { fingerprint: string; ignored: boolean }) =>
      fetch(`/api/observability/issues/${fingerprint}/${ignored ? 'ignore' : 'unignore'}`, { 
        method: 'PUT',
        credentials: 'include'
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obs:issues"] });
      setSelectedIssue(null);
    },
  });

  // Safe data access
  const items = Array.isArray(issuesData?.items) ? issuesData.items : [];
  const series = Array.isArray(seriesData) ? seriesData : [];

  // Transform series data for chart
  const chartData = series.map((r: any) => {
    const time = toDateSafe(r.hour);
    return {
      time: time ? time.getTime() : 0,
      timeStr: time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      count: Number(r.count) || 0
    };
  }).filter((point: any) => point.time > 0);

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "error": return "destructive";
      case "warn": return "outline";
      case "info": return "secondary";
      default: return "default";
    }
  };

  const getStatusIcon = (issue: Issue) => {
    if (issue.resolved) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (issue.ignored) return <XCircle className="h-4 w-4 text-gray-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };



  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Error Tracking</h1>
        <div className="flex items-center gap-2">
          <Dropdown
            value={timeRange}
            onChange={setTimeRange}
            options={TIME_RANGES}
            placeholder="Time Range"
          />
        </div>
      </div>

      {/* Error trends chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Error Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timeStr" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(label) => `Time: ${label}`}
                    formatter={(value) => [`${value}`, 'Errors']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                <p className="text-2xl font-bold">{issuesData?.total || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors Today</p>
                <p className="text-2xl font-bold">{chartData.reduce((sum, d) => sum + d.count, 0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{items.filter(i => i.resolved).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{items.filter(i => !i.resolved).length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search errors..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 min-w-64"
            />
            <Dropdown
              value={level}
              onChange={setLevel}
              options={LEVELS}
              placeholder="Level"
            />
            <Dropdown
              value={env}
              onChange={setEnv}
              options={ENVS}
              placeholder="Environment"
            />
            <Dropdown
              value={resolved ? "true" : "false"}
              onChange={(v) => setResolved(v === "true")}
              options={STATUSES}
              placeholder="Status"
            />
          </div>
        </CardContent>
      </Card>

      {/* Issues table */}
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No issues found
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((issue: Issue) => {
                const lastSeen = toDateSafe(issue.lastSeen);
                return (
                  <div
                    key={issue.fingerprint}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedIssue(issue.fingerprint)}
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(issue)}
                      <div>
                        <div className="font-medium">{issue.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {issue.fingerprint}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getLevelBadgeColor(issue.level)}>
                        {issue.level}
                      </Badge>
                      <div className="text-sm text-right">
                        <div className="font-medium">{issue.count}x</div>
                        <div className="text-muted-foreground">
                          {fmtDateTime(lastSeen)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue details sheet */}
      <Sheet open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <SheetContent className="w-[600px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Issue Details</SheetTitle>
          </SheetHeader>
          {issueDetails && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Overview</h3>
                <div className="space-y-2 text-sm">
                  <div>Title: {issueDetails.issue.title}</div>
                  <div>Service: {(issueDetails.issue as any).service || 'client'}</div>
                  <div>Level: <Badge variant={getLevelBadgeColor(issueDetails.issue.level)}>{issueDetails.issue.level}</Badge></div>
                  <div>Count: {issueDetails.issue.count}</div>
                  <div>First seen: {fmtDateTime(toDateSafe(issueDetails.issue.firstSeen))}</div>
                  <div>Last seen: {fmtDateTime(toDateSafe(issueDetails.issue.lastSeen))}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => resolveMutation.mutate(selectedIssue!)}
                  disabled={resolveMutation.isPending}
                  variant={issueDetails.issue.resolved ? "outline" : "default"}
                >
                  {issueDetails.issue.resolved ? "Resolved" : "Mark Resolved"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => ignoreMutation.mutate({ 
                    fingerprint: selectedIssue!, 
                    ignored: !issueDetails.issue.ignored 
                  })}
                  disabled={ignoreMutation.isPending}
                >
                  {ignoreMutation.isPending 
                    ? (issueDetails.issue.ignored ? "Unignoring..." : "Ignoring...") 
                    : (issueDetails.issue.ignored ? "Unignore" : "Ignore")}
                </Button>
              </div>

              {issueEvents && issueEvents.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Recent Events</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {issueEvents.slice(0, 10).map((event: ErrorEvent, i: number) => (
                      <div key={i} className="p-3 bg-muted rounded text-sm">
                        <div className="font-medium">{event.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {fmtDateTime(toDateSafe(event.createdAt))}
                        </div>
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