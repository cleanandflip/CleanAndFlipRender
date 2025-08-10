import { useState } from 'react';
import { Search, Loader2, AlertTriangle, Bug, AlertCircle, Info } from 'lucide-react';
import { UnifiedButton } from './UnifiedButton';

interface ScanResult {
  severity: 'critical' | 'error' | 'warning' | 'info';
  error_type: string;
  message: string;
  file_path: string;
  line_number: number;
  line_content?: string;
}

interface ScanSummary {
  totalErrors: number;
  critical: number;
  errors: number;
  warnings: number;
  info: number;
  results: ScanResult[];
  scanDuration: number;
  scannedFiles: number;
}

export const CodebaseScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanSummary | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const scanCodebase = async () => {
    setScanning(true);
    try {
      const response = await fetch('/api/admin/codebase-scanner/scan-codebase', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to scan codebase');
      }
      
      const results = await response.json();
      setScanResults(results);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'error': return <Bug className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
      default: return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredResults = scanResults?.results.filter(result => 
    selectedSeverity === 'all' || result.severity === selectedSeverity
  ) || [];

  return (
    <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl backdrop-blur p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-gray-200 font-semibold text-lg">Codebase Security Scanner</h3>
          <p className="text-gray-400 text-sm mt-1">
            Scan your entire codebase for security issues, code smells, and potential bugs
          </p>
        </div>
        
        <UnifiedButton
          variant="primary"
          size="sm"
          onClick={scanCodebase}
          disabled={scanning}
          className="flex items-center space-x-2"
        >
          {scanning ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Scan Codebase</span>
            </>
          )}
        </UnifiedButton>
      </div>

      {scanResults && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <div className="text-gray-200 font-bold text-xl">{scanResults.totalErrors}</div>
              <div className="text-xs text-gray-400">Total Issues</div>
            </div>
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <div className="text-red-400 font-bold text-xl">{scanResults.critical}</div>
              <div className="text-xs text-gray-400">Critical</div>
            </div>
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <div className="text-red-400 font-bold text-xl">{scanResults.errors}</div>
              <div className="text-xs text-gray-400">Errors</div>
            </div>
            <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
              <div className="text-yellow-400 font-bold text-xl">{scanResults.warnings}</div>
              <div className="text-xs text-gray-400">Warnings</div>
            </div>
            <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
              <div className="text-blue-400 font-bold text-xl">{scanResults.info}</div>
              <div className="text-xs text-gray-400">Info</div>
            </div>
          </div>

          {/* Scan Meta Info */}
          <div className="flex items-center justify-between text-sm text-gray-400 bg-gray-800/30 p-3 rounded-lg">
            <span>Scanned {scanResults.scannedFiles} files in {scanResults.scanDuration}ms</span>
            <div className="flex items-center space-x-4">
              <span>Filter by severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-xs"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="error">Errors</option>
                <option value="warning">Warnings</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>

          {/* Results List */}
          {filteredResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 hover:border-gray-600/50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(result.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(result.severity)}`}>
                          {result.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {result.error_type}
                        </span>
                      </div>
                      
                      <h4 className="text-gray-200 text-sm font-medium mb-1">
                        {result.message}
                      </h4>
                      
                      <div className="text-xs text-gray-400 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">{result.file_path}:{result.line_number}</span>
                        </div>
                        {result.line_content && (
                          <div className="bg-black/30 rounded p-2 font-mono text-xs text-gray-300 overflow-x-auto">
                            {result.line_content}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredResults.length === 0 && scanResults.totalErrors > 0 && (
            <div className="text-center text-gray-400 py-8">
              No issues found for the selected severity level.
            </div>
          )}

          {scanResults.totalErrors === 0 && (
            <div className="text-center text-green-400 py-8 bg-green-500/10 rounded-lg border border-green-500/20">
              🎉 No issues found! Your codebase looks clean.
            </div>
          )}
        </div>
      )}
    </div>
  );
};