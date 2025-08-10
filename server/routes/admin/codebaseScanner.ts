import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuth, requireRole } from '../../auth';
import { ErrorLogger } from '../../services/errorLogger';

const router = Router();

// Middleware - require developer role
router.use(requireAuth);
router.use(requireRole('developer'));

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

router.post('/scan-codebase', async (req, res) => {
  try {
    const startTime = Date.now();
    const results: ScanResult[] = [];
    let scannedFiles = 0;

    console.log('🔍 Starting codebase scan...');

    // Scan function
    const scanDirectory = async (dir: string, relativePath = ''): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name);
        
        // Skip node_modules, .git, build directories
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', '.replit'].includes(entry.name)) {
            await scanDirectory(fullPath, relativeFilePath);
          }
        } else if (entry.name.match(/\.(ts|tsx|js|jsx|vue|py|php|rb|java|c|cpp|cs)$/)) {
          scannedFiles++;
          await scanFile(fullPath, relativeFilePath);
        }
      }
    };

    // File scanning logic
    const scanFile = async (filePath: string, relativeFilePath: string): Promise<void> => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          const lineNumber = index + 1;
          const trimmedLine = line.trim();
          
          // 1. Check for console.log statements
          if (trimmedLine.includes('console.log') && !trimmedLine.startsWith('//')) {
            results.push({
              severity: 'info',
              error_type: 'console_log',
              message: 'Console.log statement found - should be removed in production',
              file_path: relativeFilePath,
              line_number: lineNumber,
              line_content: trimmedLine
            });
          }
          
          // 2. Check for TODO/FIXME comments
          if (trimmedLine.includes('TODO') || trimmedLine.includes('FIXME')) {
            results.push({
              severity: 'warning',
              error_type: 'todo_comment',
              message: 'TODO/FIXME comment found',
              file_path: relativeFilePath,
              line_number: lineNumber,
              line_content: trimmedLine
            });
          }
          
          // 3. Check for hardcoded credentials/secrets
          const secretPatterns = [
            /password\s*=\s*['""][^'""]+['""](?!.*process\.env)/i,
            /api[_-]?key\s*=\s*['""][^'""]+['""](?!.*process\.env)/i,
            /secret\s*=\s*['""][^'""]+['""](?!.*process\.env)/i,
            /token\s*=\s*['""][^'""]+['""](?!.*process\.env)/i,
          ];
          
          secretPatterns.forEach((pattern) => {
            if (pattern.test(trimmedLine) && !trimmedLine.startsWith('//')) {
              results.push({
                severity: 'critical',
                error_type: 'hardcoded_secret',
                message: 'Potential hardcoded secret detected',
                file_path: relativeFilePath,
                line_number: lineNumber,
                line_content: '[REDACTED FOR SECURITY]'
              });
            }
          });
          
          // 4. Check for unsafe eval usage
          if (trimmedLine.includes('eval(') && !trimmedLine.startsWith('//')) {
            results.push({
              severity: 'critical',
              error_type: 'unsafe_eval',
              message: 'Unsafe eval() usage detected',
              file_path: relativeFilePath,
              line_number: lineNumber,
              line_content: trimmedLine
            });
          }
          
          // 5. Check for SQL injection vulnerabilities
          const sqlPatterns = [
            /query\s*\(\s*[`'"][^`'"]*\$\{[^}]+\}/i,
            /execute\s*\(\s*[`'"][^`'"]*\+/i,
          ];
          
          sqlPatterns.forEach((pattern) => {
            if (pattern.test(trimmedLine) && !trimmedLine.startsWith('//')) {
              results.push({
                severity: 'critical',
                error_type: 'sql_injection_risk',
                message: 'Potential SQL injection vulnerability',
                file_path: relativeFilePath,
                line_number: lineNumber,
                line_content: trimmedLine
              });
            }
          });
          
          // 6. Check for missing error handling
          if (trimmedLine.includes('await ') && !content.includes('try') && !content.includes('catch')) {
            results.push({
              severity: 'warning',
              error_type: 'missing_error_handling',
              message: 'Async operation without error handling',
              file_path: relativeFilePath,
              line_number: lineNumber,
              line_content: trimmedLine
            });
          }
          
          // 7. Check for deprecated React patterns
          if (filePath.includes('.tsx') || filePath.includes('.jsx')) {
            if (trimmedLine.includes('componentWillMount') || trimmedLine.includes('componentWillReceiveProps')) {
              results.push({
                severity: 'warning',
                error_type: 'deprecated_react',
                message: 'Deprecated React lifecycle method',
                file_path: relativeFilePath,
                line_number: lineNumber,
                line_content: trimmedLine
              });
            }
          }
          
          // 8. Check for performance issues
          if (trimmedLine.includes('document.getElementById') && trimmedLine.includes('loop')) {
            results.push({
              severity: 'warning',
              error_type: 'performance_issue',
              message: 'DOM query in loop - potential performance issue',
              file_path: relativeFilePath,
              line_number: lineNumber,
              line_content: trimmedLine
            });
          }
        });
        
      } catch (error) {
        console.error(`Error scanning file ${filePath}:`, error);
      }
    };

    // Start scanning from project root
    await scanDirectory(process.cwd());

    // Calculate summary
    const summary: ScanSummary = {
      totalErrors: results.length,
      critical: results.filter(r => r.severity === 'critical').length,
      errors: results.filter(r => r.severity === 'error').length,
      warnings: results.filter(r => r.severity === 'warning').length,
      info: results.filter(r => r.severity === 'info').length,
      results: results.sort((a, b) => {
        const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      scanDuration: Date.now() - startTime,
      scannedFiles
    };

    console.log(`✅ Codebase scan completed: ${results.length} issues found in ${scannedFiles} files`);

    // Log critical issues to error system
    results.filter(r => r.severity === 'critical').forEach(result => {
      ErrorLogger.logError({
        severity: 'critical',
        error_type: 'codebase_scan_critical',
        message: `Critical issue found: ${result.message}`,
        file_path: result.file_path,
        line_number: result.line_number,
        environment: process.env.NODE_ENV || 'development'
      });
    });

    res.json(summary);
    
  } catch (error) {
    console.error('Codebase scan error:', error);
    res.status(500).json({
      error: 'Failed to scan codebase',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get scan history
router.get('/scan-history', async (req, res) => {
  try {
    // Get recent scan results from error logs
    const scanResults = await ErrorLogger.getErrorsWithFilters({
      error_type: 'codebase_scan_critical'
    }, {
      page: 1,
      limit: 50,
      timeRange: '7d'
    });

    res.json(scanResults);
  } catch (error) {
    console.error('Failed to get scan history:', error);
    res.status(500).json({ error: 'Failed to get scan history' });
  }
});

export default router;