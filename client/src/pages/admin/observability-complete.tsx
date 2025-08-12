import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obsApi } from "@/api/observability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, XCircle, Search, TrendingUp } from "lucide-react";

interface Issue {
  fingerprint: string;
  title: string;
  level: "error" | "warn" | "info";
  firstSeen: string;
  lastSeen: string;
  count: number;
  resolved: boolean;
  ignored: boolean;
  envs: Record<string, number>;
}

interface ErrorEvent {
  eventId: string;
  createdAt: string;
  message: string;
  level: string;
  env: string;
  service: string;
  url?: string;
  stack?: string[];
  extra?: any;
}

const LEVELS = [
  { label: "All Levels", value: "all" },
  { label: "Error", value: "error" },
  { label: "Warning", value: "warn" },
  { label: "Info", value: "info" },
];

const ENVS = [
  { label: "All Environments", value: "all" },
  { label: "Production", value: "production" },
  { label: "Development", value: "development" },
];

const STATUSES = [
  { label: "Unresolved", value: "false" },
  { label: "Resolved", value: "true" },
];

function toDateSafe(dateStr?: string): Date | null {
  if (!dateStr) return null;
  try {
    return new Date(dateStr);
  } catch {
    return null;
  }
}

function fmtDateTime(date: Date | null): string {
  if (!date) return "Unknown";
  return date.toLocaleString();
}

export default function ObservabilityPage() {
  const queryClient = useQueryClient();

  // Filters state - defaults to show critical issues first
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<"all"|"error"|"warn"|"info">("error");
  const [env, setEnv] = useState<"all"|"production"|"development">("all");
  const [resolved, setResolved] = useState(false);
  const [ignored, setIgnored] = useState(false);
  const [showTestEvents, setShowTestEvents] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("24");

  // Debounced search
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  // Issues query with filters
  const { data: issuesData, isLoading } = useQuery({
    queryKey: ["obs:issues", debouncedQ, level, env, resolved, ignored, page],
    queryFn: () => obsApi.issues({
      q: debouncedQ, 
      level: level === "all" ? undefined : level, 
      env: env === "all" ? undefined : env,
      resolved,
      ignored,
      page,
      limit: 20
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

  // Chart data query
  const { data: seriesData } = useQuery({
    queryKey: ["obs:series", timeRange],
    queryFn: () => obsApi.series(parseInt(timeRange)),
  });

  // Mutations for actions
  const resolveMutation = useMutation({
    mutationFn: (fp: string) => obsApi.resolve(fp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obs:issues"] });
      queryClient.invalidateQueries({ queryKey: ["obs:issue", selectedIssue] });
      setSelectedIssue(null);
    },
  });

  const reopenMutation = useMutation({
    mutationFn: (fp: string) => obsApi.reopen(fp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obs:issues"] });
      queryClient.invalidateQueries({ queryKey: ["obs:issue", selectedIssue] });
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: (fp: string) => obsApi.ignore(fp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obs:issues"] });
      setSelectedIssue(null);
    },
  });

  const unignoreMutation = useMutation({
    mutationFn: (fp: string) => obsApi.unignore(fp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obs:issues"] });
    },
  });

  // Safe data access
  const items = Array.isArray(issuesData?.items) ? issuesData.items : [];
  const series = Array.isArray(seriesData) ? seriesData : [];

  // Transform chart data
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

  // Filter out test events from display unless explicitly requested
  const displayItems = showTestEvents ? items : items.filter((item: Issue) => {
    return !item.title.toLowerCase().includes('test');
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header & Metrics */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Observability</h1>
        <div className="flex gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-sm text-muted-foreground">Active Issues</div>
                <div className="text-lg font-bold">{items.filter(i => !i.resolved && !i.ignored).length}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm text-muted-foreground">Total Events</div>
                <div className="text-lg font-bold">{items.reduce((sum, i) => sum + i.count, 0)}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <Label>Level:</Label>
              <Select value={level} onValueChange={(value) => setLevel(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-center">
              <Label>Environment:</Label>
              <Select value={env} onValueChange={(value) => setEnv(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  {ENVS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-center">
              <Label>Status:</Label>
              <Select value={resolved.toString()} onValueChange={(value) => setResolved(value === "true")}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-ignored"
                checked={ignored}
                onChange={(e) => setIgnored(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="show-ignored">Show ignored</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-test"
                checked={showTestEvents}
                onChange={(e) => setShowTestEvents(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="show-test">Show test events</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>Issues ({displayItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No issues found
            </div>
          ) : (
            <div className="space-y-2">
              {displayItems.map((issue: Issue) => {
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

      {/* Issue Details Sheet */}
      <Sheet open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <SheetContent className="w-[600px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Issue Details</SheetTitle>
          </SheetHeader>
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
                  <Button
                    onClick={() => resolveMutation.mutate(selectedIssue!)}
                    disabled={resolveMutation.isPending}
                  >
                    {resolveMutation.isPending ? "Resolving..." : "Mark Resolved"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => reopenMutation.mutate(selectedIssue!)}
                    disabled={reopenMutation.isPending}
                  >
                    {reopenMutation.isPending ? "Reopening..." : "Reopen"}
                  </Button>
                )}

                {!issueDetails.issue.ignored ? (
                  <Button
                    variant="outline"
                    onClick={() => ignoreMutation.mutate(selectedIssue!)}
                    disabled={ignoreMutation.isPending}
                  >
                    {ignoreMutation.isPending ? "Ignoring..." : "Ignore"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => unignoreMutation.mutate(selectedIssue!)}
                    disabled={unignoreMutation.isPending}
                  >
                    {unignoreMutation.isPending ? "Unignoring..." : "Unignore"}
                  </Button>
                )}
              </div>

              {issueEvents && issueEvents.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Recent Events</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {issueEvents.slice(0, 10).map((event: ErrorEvent, i: number) => (
                      <div key={i} className="p-3 bg-muted rounded text-sm">
                        <div className="font-medium">{event.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {fmtDateTime(toDateSafe(event.createdAt))} • {event.env} • {event.service}
                        </div>
                        {event.stack && event.stack.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1 font-mono">
                            {event.stack[0]}
                          </div>
                        )}
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