import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { obsApi, type Issue, type ErrorEvent } from "@/api/observability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertTriangle, CheckCircle, XCircle, Clock, Users, Activity } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function ObservabilityPage() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string | undefined>();
  const [env, setEnv] = useState<string | undefined>();
  const [resolved, setResolved] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("1");
  const limit = 20;

  const queryClient = useQueryClient();

  // Issues query
  const { data: issuesData, isLoading } = useQuery({
    queryKey: ["issues", q, level, env, resolved, page, limit],
    queryFn: () => obsApi.issues({ q, level, env, resolved, page, limit }),
  });

  // Issue details query
  const { data: issueDetails } = useQuery({
    queryKey: ["issue", selectedIssue],
    queryFn: () => selectedIssue ? obsApi.issue(selectedIssue) : null,
    enabled: !!selectedIssue,
  });

  // Issue events query
  const { data: issueEvents } = useQuery({
    queryKey: ["issue-events", selectedIssue],
    queryFn: () => selectedIssue ? obsApi.events(selectedIssue) : null,
    enabled: !!selectedIssue,
  });

  // Error trends query
  const { data: seriesData } = useQuery({
    queryKey: ["error-series", timeRange],
    queryFn: () => obsApi.series(parseInt(timeRange)),
  });

  // Mutations
  const resolveMutation = useMutation({
    mutationFn: obsApi.resolve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue", selectedIssue] });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: obsApi.reopen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue", selectedIssue] });
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: obsApi.ignore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue", selectedIssue] });
    },
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Error Tracking</h1>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7d</SelectItem>
              <SelectItem value="30">Last 30d</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error trends chart placeholder */}
      {seriesData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Error Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {seriesData.length} data points over the last {timeRange} day{timeRange !== "1" ? "s" : ""}
            </div>
          </CardContent>
        </Card>
      )}

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
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={env} onValueChange={setEnv}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Envs</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={resolved ? "default" : "outline"}
              onClick={() => setResolved(!resolved)}
              className="min-w-24"
            >
              {resolved ? "Resolved" : "Unresolved"}
            </Button>
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
          ) : !issuesData?.items.length ? (
            <div className="text-center py-8 text-muted-foreground">No issues found</div>
          ) : (
            <div className="space-y-2">
              {issuesData.items.map((issue) => (
                <div
                  key={issue.fingerprint}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent/50"
                  onClick={() => setSelectedIssue(issue.fingerprint)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(issue)}
                      <Badge variant={getLevelBadgeColor(issue.level)}>
                        {issue.level.toUpperCase()}
                      </Badge>
                      <span className="font-medium truncate">{issue.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last seen: {format(parseISO(issue.lastSeen), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {issue.count}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {issue.affectedUsers}
                    </div>
                    {Object.entries(issue.envs).map(([env, count]) => (
                      <Badge key={env} variant="outline" className="text-xs">
                        {env}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {issuesData && issuesData.total > limit && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, issuesData.total)} of {issuesData.total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * limit >= issuesData.total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue details drawer */}
      <Sheet open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {issueDetails && getStatusIcon(issueDetails)}
              Issue Details
            </SheetTitle>
          </SheetHeader>
          
          {issueDetails && (
            <div className="mt-6 space-y-6">
              {/* Issue header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getLevelBadgeColor(issueDetails.level)}>
                    {issueDetails.level.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold mb-2">{issueDetails.title}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>First seen: {format(parseISO(issueDetails.firstSeen), 'MMM d, yyyy h:mm a')}</p>
                  <p>Last seen: {format(parseISO(issueDetails.lastSeen), 'MMM d, yyyy h:mm a')}</p>
                  <p>Total occurrences: {issueDetails.count}</p>
                  <p>Affected users: {issueDetails.affectedUsers}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!issueDetails.resolved ? (
                  <Button
                    onClick={() => resolveMutation.mutate(issueDetails.fingerprint)}
                    disabled={resolveMutation.isPending}
                  >
                    Mark Resolved
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => reopenMutation.mutate(issueDetails.fingerprint)}
                    disabled={reopenMutation.isPending}
                  >
                    Reopen
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => ignoreMutation.mutate(issueDetails.fingerprint)}
                  disabled={ignoreMutation.isPending}
                >
                  {issueDetails.ignored ? "Unignore" : "Ignore"}
                </Button>
              </div>

              {/* Recent events */}
              <div>
                <h4 className="font-semibold mb-3">Recent Events</h4>
                {issueEvents?.length ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {issueEvents.map((event) => (
                      <Card key={event.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{event.service}</span>
                            <span className="text-muted-foreground">
                              {format(parseISO(event.createdAt), 'MMM d, yyyy h:mm:ss a')}
                            </span>
                          </div>
                          <p className="text-sm">{event.message}</p>
                          {event.url && (
                            <p className="text-xs text-muted-foreground">URL: {event.url}</p>
                          )}
                          {event.stack && event.stack.length > 0 && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground">Stack trace</summary>
                              <pre className="mt-2 whitespace-pre-wrap break-all bg-muted p-2 rounded">
                                {event.stack.join('\n')}
                              </pre>
                            </details>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No events found</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}