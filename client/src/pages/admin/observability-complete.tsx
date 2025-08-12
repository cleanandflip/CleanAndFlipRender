import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import Dropdown from "@/components/ui/Dropdown";
import { Checkbox } from "@/components/ui/checkbox";
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
  // Filters state
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("error");
  const [env, setEnv] = useState("all");
  const [resolved, setResolved] = useState(false);
  const [ignored, setIgnored] = useState(false);
  const [showTestEvents, setShowTestEvents] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  // Data state
  const [issuesData, setIssuesData] = useState<{ items: Issue[]; total: number } | null>(null);
  const [issueDetails, setIssueDetails] = useState<{ issue: Issue } | null>(null);
  const [issueEvents, setIssueEvents] = useState<ErrorEvent[]>([]);
  const [seriesData, setSeriesData] = useState<Array<{ hour: string; count: number }>>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounced search
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  // Fetch issues
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({
      q: debouncedQ,
      level: level === "all" ? "" : level,
      env: env === "all" ? "" : env,
      resolved: resolved.toString(),
      ignored: ignored.toString(),
      page: page.toString(),
      limit: "20"
    });

    fetch(`/api/observability/issues?${params}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        if (!cancelled) {
          setIssuesData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error("Failed to load issues:", err);
          setError(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [debouncedQ, level, env, resolved, ignored, page]);

  // Fetch issue details
  useEffect(() => {
    if (!selectedIssue) {
      setIssueDetails(null);
      setIssueEvents([]);
      return;
    }

    Promise.all([
      fetch(`/api/observability/issue/${selectedIssue}`, { credentials: "include" }),
      fetch(`/api/observability/events/${selectedIssue}`, { credentials: "include" })
    ])
      .then(([issueRes, eventsRes]) => Promise.all([issueRes.json(), eventsRes.json()]))
      .then(([issue, events]) => {
        setIssueDetails(issue);
        setIssueEvents(events);
      })
      .catch(err => console.error("Failed to load issue details:", err));
  }, [selectedIssue]);

  // Fetch series data
  useEffect(() => {
    fetch("/api/observability/series?days=1", { credentials: "include" })
      .then(r => r.json())
      .then(data => setSeriesData(data))
      .catch(err => console.error("Failed to load series data:", err));
  }, []);

  // Issue actions
  const performAction = async (action: string, fingerprint: string) => {
    setActionLoading(action);
    try {
      const response = await fetch(`/api/observability/${action}/${fingerprint}`, {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        // Refresh issues list
        setIssuesData(prev => prev ? {
          ...prev,
          items: prev.items.map(item => 
            item.fingerprint === fingerprint 
              ? { 
                  ...item, 
                  resolved: action === "resolve" ? true : action === "reopen" ? false : item.resolved,
                  ignored: action === "ignore" ? true : action === "unignore" ? false : item.ignored
                } 
              : item
          )
        } : null);
        
        if (selectedIssue === fingerprint) {
          setSelectedIssue(null);
        }
      }
    } catch (err) {
      console.error(`Failed to ${action} issue:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  // Safe data access
  const items = issuesData?.items || [];

  // Filter out test events from display unless explicitly requested
  const displayItems = showTestEvents ? items : items.filter((item: Issue) => {
    return !item.title.toLowerCase().includes('test');
  });

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
      {/* Header & Metrics */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Error Tracking</h1>
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
              <Dropdown
                options={LEVELS}
                value={level}
                onChange={setLevel}
                className="w-32"
              />
            </div>

            <div className="flex gap-2 items-center">
              <Label>Environment:</Label>
              <Dropdown
                options={ENVS}
                value={env}
                onChange={setEnv}
                className="w-40"
              />
            </div>

            <div className="flex gap-2 items-center">
              <Label>Status:</Label>
              <Dropdown
                options={STATUSES}
                value={resolved.toString()}
                onChange={(value) => setResolved(value === "true")}
                className="w-32"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-ignored"
                checked={ignored}
                onCheckedChange={setIgnored}
              />
              <Label htmlFor="show-ignored">Show ignored</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-test-events"
                checked={showTestEvents}
                onCheckedChange={setShowTestEvents}
              />
              <Label htmlFor="show-test-events">Show test events</Label>
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
          {loading ? (
            <div className="text-center py-8">Loading issues...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Couldn't load issues. Try refreshing the page.
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No issues found for current filters
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
                    onClick={() => performAction("resolve", selectedIssue!)}
                    disabled={actionLoading === "resolve"}
                  >
                    {actionLoading === "resolve" ? "Resolving..." : "Mark Resolved"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => performAction("reopen", selectedIssue!)}
                    disabled={actionLoading === "reopen"}
                  >
                    {actionLoading === "reopen" ? "Reopening..." : "Reopen"}
                  </Button>
                )}

                {!issueDetails.issue.ignored ? (
                  <Button
                    variant="outline"
                    onClick={() => performAction("ignore", selectedIssue!)}
                    disabled={actionLoading === "ignore"}
                  >
                    {actionLoading === "ignore" ? "Ignoring..." : "Ignore"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => performAction("unignore", selectedIssue!)}
                    disabled={actionLoading === "unignore"}
                  >
                    {actionLoading === "unignore" ? "Unignoring..." : "Unignore"}
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
                            {Array.isArray(event.stack) ? event.stack[0] : event.stack}
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