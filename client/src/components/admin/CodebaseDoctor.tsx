import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Eye, 
  FileText, 
  PlayCircle, 
  RefreshCw, 
  Shield, 
  Zap,
  Bug,
  Code,
  Search,
  TrendingUp,
  Clock
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CodebaseHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  keyIssues: string[];
  lastScan?: string;
}

interface FindingsSummary {
  totalFindings: number;
  criticalIssues: number;
  warnings: number;
  suggestions: number;
}

interface CategoryData {
  count: number;
  critical: number;
  items: EnhancedFinding[];
}

interface EnhancedFinding {
  id: string;
  title: string;
  severity: 'PASS' | 'WARN' | 'FAIL';
  file?: string;
  line?: number;
  details?: string;
  suggestion?: string;
  category: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'trivial' | 'easy' | 'medium' | 'hard';
  priority: number;
  timestamp: string;
}

interface CodebaseAnalysisResult {
  timestamp: string;
  summary: FindingsSummary;
  categories: { [key: string]: CategoryData };
  trends: {
    improvementFromLastScan: number;
    newIssues: number;
    resolvedIssues: number;
  };
}

export function CodebaseDoctor() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [analysisOptions, setAnalysisOptions] = useState({
    includePerformance: true,
    includeSecurity: true,
    includeCodeQuality: true,
    outputToDatabase: false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get health check data
  const { data: health, isLoading: healthLoading } = useQuery<CodebaseHealth>({
    queryKey: ['/api/admin/codebase/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get last scan results
  const { data: lastScan, isLoading: scanLoading } = useQuery<CodebaseAnalysisResult>({
    queryKey: ['/api/admin/codebase/last-scan'],
    retry: false,
  });

  // Get scan history
  const { data: scanHistory } = useQuery({
    queryKey: ['/api/admin/codebase/history'],
    retry: false,
  });

  // Run analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/codebase/analyze', 'POST', analysisOptions);
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Codebase analysis completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/codebase/last-scan'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/codebase/health'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/codebase/history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error?.message || "Failed to run codebase analysis",
        variant: "destructive",
      });
    },
  });

  // Download report mutation
  const downloadMutation = useMutation({
    mutationFn: async (format: 'json' | 'markdown') => {
      const response = await fetch(`/api/admin/codebase/report?format=${format}`);
      if (!response.ok) throw new Error('Failed to download report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codebase-report.${format === 'markdown' ? 'md' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Report Downloaded",
        description: "Codebase report has been downloaded successfully",
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'FAIL': return 'bg-red-500';
      case 'WARN': return 'bg-yellow-500';
      case 'PASS': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6 p-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bug className="w-6 h-6" />
            Advanced Codebase Doctor
          </h2>
          <p className="text-gray-400">
            Comprehensive code analysis and health monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => analysisMutation.mutate()}
            disabled={analysisMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {analysisMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-2" />
            )}
            Run Analysis
          </Button>
          
          {lastScan && (
            <>
              <Button
                variant="outline"
                onClick={() => downloadMutation.mutate('json')}
                disabled={downloadMutation.isPending}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadMutation.mutate('markdown')}
                disabled={downloadMutation.isPending}
              >
                <FileText className="w-4 h-4 mr-2" />
                Markdown
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              {healthLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                getStatusIcon(health?.status || 'unknown')
              )}
              Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">
              {health?.score || 0}/100
            </div>
            <Progress value={health?.score || 0} className="mb-2" />
            <div className="text-xs text-gray-400">
              {health?.status?.toUpperCase() || 'UNKNOWN'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400 mb-2">
              {lastScan?.summary.criticalIssues || 0}
            </div>
            <div className="text-xs text-gray-400">
              Requiring immediate attention
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400 mb-2">
              {lastScan?.summary.warnings || 0}
            </div>
            <div className="text-xs text-gray-400">
              Should be addressed
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {(lastScan?.trends?.improvementFromLastScan ?? 0) > 0 ? '+' : ''}{lastScan?.trends?.improvementFromLastScan ?? 0}
            </div>
            <div className="text-xs text-gray-400">
              Since last scan
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Options */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Analysis Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={analysisOptions.includeSecurity}
                onChange={(e) => setAnalysisOptions(prev => ({ 
                  ...prev, 
                  includeSecurity: e.target.checked 
                }))}
                className="rounded border-gray-600 bg-gray-700"
              />
              <Shield className="w-4 h-4" />
              <span>Security Analysis</span>
            </label>
            
            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={analysisOptions.includePerformance}
                onChange={(e) => setAnalysisOptions(prev => ({ 
                  ...prev, 
                  includePerformance: e.target.checked 
                }))}
                className="rounded border-gray-600 bg-gray-700"
              />
              <Zap className="w-4 h-4" />
              <span>Performance Check</span>
            </label>
            
            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={analysisOptions.includeCodeQuality}
                onChange={(e) => setAnalysisOptions(prev => ({ 
                  ...prev, 
                  includeCodeQuality: e.target.checked 
                }))}
                className="rounded border-gray-600 bg-gray-700"
              />
              <Code className="w-4 h-4" />
              <span>Code Quality</span>
            </label>

            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={analysisOptions.outputToDatabase}
                onChange={(e) => setAnalysisOptions(prev => ({ 
                  ...prev, 
                  outputToDatabase: e.target.checked 
                }))}
                className="rounded border-gray-600 bg-gray-700"
              />
              <span>Save to Error Logs</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {lastScan && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Latest Analysis Results</CardTitle>
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatTimestamp(lastScan.timestamp)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-4 w-full bg-gray-700">
                <TabsTrigger value="overview" className="text-white">Overview</TabsTrigger>
                <TabsTrigger value="categories" className="text-white">By Category</TabsTrigger>
                <TabsTrigger value="priority" className="text-white">By Priority</TabsTrigger>
                <TabsTrigger value="trends" className="text-white">Trends</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-xl font-bold text-white">{lastScan.summary.totalFindings}</div>
                    <div className="text-sm text-gray-400">Total Findings</div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-xl font-bold text-red-400">{lastScan.summary.criticalIssues}</div>
                    <div className="text-sm text-gray-400">Critical</div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-xl font-bold text-yellow-400">{lastScan.summary.warnings}</div>
                    <div className="text-sm text-gray-400">Warnings</div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-xl font-bold text-blue-400">{lastScan.summary.suggestions}</div>
                    <div className="text-sm text-gray-400">Suggestions</div>
                  </div>
                </div>

                {health?.keyIssues && health.keyIssues.length > 0 && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <h4 className="text-red-400 font-semibold mb-2">Key Issues Requiring Attention:</h4>
                    <ul className="list-disc list-inside text-red-300 space-y-1">
                      {health.keyIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(lastScan.categories).map(([category, data]) => (
                    <Card key={category} className="bg-gray-700 border-gray-600">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white capitalize text-lg">
                            {category.replace('-', ' ')}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {data.count} issues
                            </Badge>
                            {data.critical > 0 && (
                              <Badge variant="destructive">
                                {data.critical} critical
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {data.items.slice(0, 5).map((finding, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                              <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(finding.severity)}`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium">{finding.title}</div>
                                {finding.file && (
                                  <div className="text-sm text-gray-400">
                                    {finding.file}:{finding.line || 1}
                                  </div>
                                )}
                                {finding.details && (
                                  <div className="text-sm text-gray-300 mt-1">{finding.details}</div>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className={`text-xs ${getImpactColor(finding.impact)}`}>
                                    {finding.impact} impact
                                  </Badge>
                                  <Badge variant="outline" className="text-xs text-gray-400">
                                    {finding.effort} effort
                                  </Badge>
                                  <Badge variant="outline" className="text-xs text-purple-400">
                                    Priority: {finding.priority}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                          {data.items.length > 5 && (
                            <div className="text-sm text-gray-400 text-center">
                              And {data.items.length - 5} more...
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="priority" className="space-y-4">
                <div className="space-y-4">
                  {Object.values(lastScan.categories)
                    .flatMap(cat => cat.items)
                    .sort((a, b) => b.priority - a.priority)
                    .slice(0, 10)
                    .map((finding, index) => (
                      <Card key={index} className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl font-bold text-purple-400">
                              #{index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-medium">{finding.title}</div>
                              <div className="text-sm text-gray-400 mt-1">
                                Category: {finding.category.replace('-', ' ')}
                              </div>
                              {finding.file && (
                                <div className="text-sm text-gray-400">
                                  {finding.file}:{finding.line || 1}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className={`text-xs ${getSeverityColor(finding.severity)}`}>
                                  {finding.severity}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${getImpactColor(finding.impact)}`}>
                                  {finding.impact}
                                </Badge>
                                <Badge variant="outline" className="text-xs text-purple-400">
                                  Priority: {finding.priority}
                                </Badge>
                              </div>
                              {finding.suggestion && (
                                <div className="text-sm text-blue-400 mt-2">
                                  💡 {finding.suggestion}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {lastScan.trends.resolvedIssues}
                        </div>
                        <div className="text-sm text-gray-400">Resolved Issues</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {lastScan.trends.newIssues}
                        </div>
                        <div className="text-sm text-gray-400">New Issues</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          (lastScan?.trends?.improvementFromLastScan ?? 0) > 0 
                            ? 'text-green-400' 
                            : (lastScan?.trends?.improvementFromLastScan ?? 0) < 0 
                              ? 'text-red-400' 
                              : 'text-gray-400'
                        }`}>
                          {(lastScan?.trends?.improvementFromLastScan ?? 0) > 0 ? '+' : ''}
                          {lastScan?.trends?.improvementFromLastScan ?? 0}
                        </div>
                        <div className="text-sm text-gray-400">Net Change</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {scanHistory && Array.isArray(scanHistory) && scanHistory.length > 1 && (
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white">Scan History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(scanHistory as any[]).slice(-5).map((scan: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                            <div className="text-sm text-gray-300">
                              {formatTimestamp(scan.timestamp)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {scan.summary.totalFindings} findings
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* No data state */}
      {!lastScan && !scanLoading && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <Search className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Analysis Data</h3>
            <p className="text-gray-400 mb-4">
              Run your first codebase analysis to get comprehensive insights about your code health.
            </p>
            <Button
              onClick={() => analysisMutation.mutate()}
              disabled={analysisMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {analysisMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4 mr-2" />
              )}
              Run First Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}