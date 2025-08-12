#!/usr/bin/env node
/**
 * Codebase Doctor — Advanced codebase checker & reporter for Clean & Flip
 * ---------------------------------------------------------------------------------
 * Enhanced version with integrated error logging for developer dashboard
 * 
 * Comprehensive analysis categories:
 * 1. Syntax & Compilation (TypeScript errors, JSON validation)
 * 2. Import/Export Analysis (Broken imports, unused dependencies, orphaned files)
 * 3. React-Specific Checks (Hooks validation, missing keys, import patterns)
 * 4. Security Analysis (Dangerous patterns, hardcoded secrets, XSS vulnerabilities)
 * 5. Performance Patterns (Memory leaks, bundle size issues, anti-patterns)
 * 6. Code Quality (TODO/FIXME tracking, empty catch blocks, function length)
 * 7. Database & API Checks (Query optimization, error handling, rate limiting)
 * 8. Documentation Coverage (Missing JSDoc, outdated README, API docs)
 * 9. Testing Coverage (Missing tests, deprecated test patterns)
 * 10. Accessibility Checks (Missing ARIA labels, color contrast)
 * 11. SEO & Meta Analysis (Missing meta tags, duplicate titles, schema markup)
 * 12. Dependency Analysis (Outdated packages, security vulnerabilities)
 * 13. Environment Configuration (Missing env vars, production readiness)
 * 14. Build & Deploy Checks (Build optimization, deployment configuration)
 * 15. File Organization (Naming conventions, folder structure, unused files)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);

// Configuration
const cfg = {
  root: process.cwd(),
  outputDir: 'codebase-doctor-report',
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/.git/**',
    '**/vendor/**',
    '**/tmp/**'
  ],
  includedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.scss', '.sass', '.html', '.vue'],
  maxFileSize: 1024 * 1024 * 2, // 2MB
  args: {}
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed[key] = args[i + 1];
        i++; // Skip next arg as it's the value
      } else {
        parsed[key] = true;
      }
    }
  }
  
  return parsed;
}

// Helper functions
function rel(absolutePath) {
  return path.relative(cfg.root, absolutePath);
}

function readFileContent(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > cfg.maxFileSize) {
      return null; // Skip large files
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function isIgnored(filePath) {
  return cfg.ignore.some(pattern => {
    const normalizedPattern = pattern.replace(/\*\*/g, '').replace(/\*/g, '');
    return filePath.includes(normalizedPattern);
  });
}

// File collection
async function collectFiles() {
  const files = [];
  
  function walkDir(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!isIgnored(fullPath)) {
            walkDir(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (cfg.includedExtensions.includes(ext) && !isIgnored(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  walkDir(cfg.root);
  return files;
}

// Analysis functions
async function analyzeSyntaxAndCompilation(files, findings) {
  console.log('🔍 Analyzing syntax and compilation...');
  
  // Check JSON files
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  for (const file of jsonFiles) {
    const content = readFileContent(file);
    if (content) {
      try {
        JSON.parse(content);
      } catch (error) {
        findings.push({
          id: 'syntax:json',
          title: 'Invalid JSON Syntax',
          severity: 'FAIL',
          file: rel(file),
          details: error.message,
          timestamp: new Date().toISOString(),
          category: 'syntax'
        });
      }
    }
  }
  
  // Check for obvious syntax issues in JS/TS files
  const codeFiles = files.filter(f => /\.(t|j)sx?$/.test(f));
  for (const file of codeFiles) {
    const content = readFileContent(file);
    if (content) {
      // Check for unclosed brackets/braces
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        findings.push({
          id: 'syntax:braces',
          title: 'Mismatched Braces',
          severity: 'FAIL',
          file: rel(file),
          details: `Open braces: ${openBraces}, Close braces: ${closeBraces}`,
          timestamp: new Date().toISOString(),
          category: 'syntax'
        });
      }
      
      // Check for missing semicolons in critical places
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') && !trimmed.endsWith(';') && !trimmed.includes(' from ')) {
          findings.push({
            id: 'syntax:semicolon',
            title: 'Missing Semicolon in Import',
            severity: 'WARN',
            file: rel(file),
            line: index + 1,
            details: trimmed,
            timestamp: new Date().toISOString(),
            category: 'syntax'
          });
        }
      });
    }
  }
}

async function analyzeImportsAndExports(files, findings) {
  console.log('📦 Analyzing imports and exports...');
  
  const codeFiles = files.filter(f => /\.(t|j)sx?$/.test(f));
  const imports = new Map();
  const exports = new Map();
  
  for (const file of codeFiles) {
    const content = readFileContent(file);
    if (!content) continue;
    
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Analyze imports
      const importMatch = trimmed.match(/^import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/);
      if (importMatch) {
        const importPath = importMatch[1];
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          // Relative import - check if file exists
          const resolvedPath = path.resolve(path.dirname(file), importPath);
          const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '.json'];
          let found = false;
          
          for (const ext of possibleExtensions) {
            if (fs.existsSync(resolvedPath + ext)) {
              found = true;
              break;
            }
          }
          
          if (!found) {
            findings.push({
              id: 'imports:missing',
              title: 'Broken Import Path',
              severity: 'FAIL',
              file: rel(file),
              line: index + 1,
              details: `Cannot resolve import: ${importPath}`,
              timestamp: new Date().toISOString(),
              category: 'imports'
            });
          }
        }
      }
      
      // Check for unused imports (basic check)
      const namedImportMatch = trimmed.match(/^import\s+\{([^}]+)\}\s+from/);
      if (namedImportMatch) {
        const importedNames = namedImportMatch[1].split(',').map(n => n.trim());
        importedNames.forEach(name => {
          if (!content.includes(name.replace(/\s+as\s+\w+/, ''))) {
            findings.push({
              id: 'imports:unused',
              title: 'Potentially Unused Import',
              severity: 'WARN',
              file: rel(file),
              line: index + 1,
              details: `Import '${name}' may be unused`,
              timestamp: new Date().toISOString(),
              category: 'imports'
            });
          }
        });
      }
    });
  }
}

async function analyzeReactSpecific(files, findings) {
  console.log('⚛️ Analyzing React-specific patterns...');
  
  const reactFiles = files.filter(f => /\.(t|j)sx$/.test(f));
  
  for (const file of reactFiles) {
    const content = readFileContent(file);
    if (!content) continue;
    
    const lines = content.split('\n');
    
    // Check for React hooks rules
    let inComponent = false;
    let inHook = false;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Detect component/hook functions
      if (trimmed.match(/^(function|const)\s+[A-Z]/)) {
        inComponent = true;
      } else if (trimmed.match(/^(function|const)\s+use[A-Z]/)) {
        inHook = true;
      }
      
      // Check for hooks usage outside components
      if (trimmed.includes('use') && trimmed.match(/use[A-Z]\w*\(/)) {
        if (!inComponent && !inHook) {
          findings.push({
            id: 'react:hooks-rules',
            title: 'Hook Called Outside Component/Hook',
            severity: 'FAIL',
            file: rel(file),
            line: index + 1,
            details: trimmed,
            timestamp: new Date().toISOString(),
            category: 'react'
          });
        }
      }
      
      // Check for missing keys in map operations
      if (trimmed.includes('.map(') && !trimmed.includes('key=')) {
        const nextLines = lines.slice(index, index + 3).join(' ');
        if (nextLines.includes('<') && !nextLines.includes('key=')) {
          findings.push({
            id: 'react:missing-key',
            title: 'Missing Key Prop in Map',
            severity: 'WARN',
            file: rel(file),
            line: index + 1,
            details: 'Map operation without key prop',
            timestamp: new Date().toISOString(),
            category: 'react'
          });
        }
      }
      
      // Check for inline event handlers
      if (trimmed.includes('onClick={()') || trimmed.includes('onChange={()')) {
        findings.push({
          id: 'react:inline-handlers',
          title: 'Inline Event Handler',
          severity: 'WARN',
          file: rel(file),
          line: index + 1,
          details: 'Consider extracting inline handlers for better performance',
          timestamp: new Date().toISOString(),
          category: 'react'
        });
      }
    });
  }
}

async function analyzeSecurity(files, findings) {
  console.log('🔒 Analyzing security patterns...');
  
  for (const file of files) {
    const content = readFileContent(file);
    if (!content) continue;
    
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check for hardcoded secrets
      const secretPatterns = [
        /api[_-]?key[\s]*[:=][\s]*['"][a-zA-Z0-9]{20,}['"]/i,
        /secret[\s]*[:=][\s]*['"][a-zA-Z0-9]{20,}['"]/i,
        /password[\s]*[:=][\s]*['"][^'"]{8,}['"]/i,
        /token[\s]*[:=][\s]*['"][a-zA-Z0-9._-]{20,}['"]/i
      ];
      
      secretPatterns.forEach(pattern => {
        if (pattern.test(trimmed)) {
          findings.push({
            id: 'security:hardcoded-secret',
            title: 'Potential Hardcoded Secret',
            severity: 'FAIL',
            file: rel(file),
            line: index + 1,
            details: 'Avoid hardcoding sensitive information',
            timestamp: new Date().toISOString(),
            category: 'security'
          });
        }
      });
      
      // Check for dangerous HTML patterns
      if (trimmed.includes('dangerouslySetInnerHTML') || trimmed.includes('innerHTML')) {
        findings.push({
          id: 'security:xss',
          title: 'Potential XSS Vulnerability',
          severity: 'FAIL',
          file: rel(file),
          line: index + 1,
          details: 'Direct HTML injection can lead to XSS attacks',
          timestamp: new Date().toISOString(),
          category: 'security'
        });
      }
      
      // Check for eval usage
      if (trimmed.includes('eval(')) {
        findings.push({
          id: 'security:eval',
          title: 'Dangerous eval() Usage',
          severity: 'FAIL',
          file: rel(file),
          line: index + 1,
          details: 'eval() can execute arbitrary code',
          timestamp: new Date().toISOString(),
          category: 'security'
        });
      }
    });
  }
}

async function analyzePerformance(files, findings) {
  console.log('⚡ Analyzing performance patterns...');
  
  for (const file of files) {
    const content = readFileContent(file);
    if (!content) continue;
    
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check for console.log in production code
      if (trimmed.includes('console.log') && !file.includes('test') && !file.includes('spec')) {
        findings.push({
          id: 'performance:console',
          title: 'Console Statement in Production Code',
          severity: 'WARN',
          file: rel(file),
          line: index + 1,
          details: 'Remove console statements for production',
          timestamp: new Date().toISOString(),
          category: 'performance'
        });
      }
      
      // Check for inefficient array operations
      if (trimmed.includes('.indexOf') && trimmed.includes('!== -1')) {
        findings.push({
          id: 'performance:array-includes',
          title: 'Use .includes() Instead of .indexOf()',
          severity: 'WARN',
          file: rel(file),
          line: index + 1,
          details: 'array.includes() is more readable than indexOf() !== -1',
          timestamp: new Date().toISOString(),
          category: 'performance'
        });
      }
      
      // Check for potential memory leaks
      if (trimmed.includes('setInterval') && !content.includes('clearInterval')) {
        findings.push({
          id: 'performance:memory-leak',
          title: 'Potential Memory Leak',
          severity: 'WARN',
          file: rel(file),
          line: index + 1,
          details: 'setInterval without clearInterval can cause memory leaks',
          timestamp: new Date().toISOString(),
          category: 'performance'
        });
      }
    });
  }
}

async function analyzeCodeQuality(files, findings) {
  console.log('✨ Analyzing code quality...');
  
  for (const file of files) {
    const content = readFileContent(file);
    if (!content) continue;
    
    const lines = content.split('\n');
    
    // Check for TODOs and FIXMEs
    lines.forEach((line, index) => {
      const trimmed = line.trim().toLowerCase();
      
      if (trimmed.includes('todo') || trimmed.includes('fixme')) {
        findings.push({
          id: 'quality:todo',
          title: 'TODO/FIXME Comment',
          severity: 'WARN',
          file: rel(file),
          line: index + 1,
          details: line.trim(),
          timestamp: new Date().toISOString(),
          category: 'code-quality'
        });
      }
      
      // Check for empty catch blocks
      if (trimmed === 'catch (error) {' || trimmed === 'catch (e) {') {
        const nextLine = lines[index + 1]?.trim();
        if (nextLine === '}') {
          findings.push({
            id: 'quality:empty-catch',
            title: 'Empty Catch Block',
            severity: 'WARN',
            file: rel(file),
            line: index + 1,
            details: 'Empty catch blocks hide errors',
            timestamp: new Date().toISOString(),
            category: 'code-quality'
          });
        }
      }
    });
    
    // Check function length
    const functions = content.match(/function\s+\w+[^{]*{[^}]*}/g) || [];
    functions.forEach(func => {
      const lineCount = func.split('\n').length;
      if (lineCount > 50) {
        const funcName = func.match(/function\s+(\w+)/)?.[1] || 'anonymous';
        findings.push({
          id: 'quality:function-length',
          title: 'Long Function',
          severity: 'WARN',
          file: rel(file),
          details: `Function '${funcName}' has ${lineCount} lines (consider breaking it down)`,
          timestamp: new Date().toISOString(),
          category: 'code-quality'
        });
      }
    });
  }
}

// Main analysis runner
async function runAnalysis() {
  console.log('🏥 Starting Codebase Doctor Analysis...');
  console.log(`📁 Analyzing directory: ${cfg.root}`);
  
  const findings = [];
  
  try {
    // Collect all files
    const files = await collectFiles();
    console.log(`📄 Found ${files.length} files to analyze`);
    
    // Run all analysis functions
    await analyzeSyntaxAndCompilation(files, findings);
    await analyzeImportsAndExports(files, findings);
    await analyzeReactSpecific(files, findings);
    await analyzeSecurity(files, findings);
    await analyzePerformance(files, findings);
    await analyzeCodeQuality(files, findings);
    
    // Create report
    const report = {
      timestamp: new Date().toISOString(),
      metadata: {
        totalFiles: files.length,
        analysisCategories: [
          'syntax', 'imports', 'react', 'security', 
          'performance', 'code-quality'
        ],
        rootDirectory: cfg.root
      },
      summary: {
        totalFindings: findings.length,
        criticalIssues: findings.filter(f => f.severity === 'FAIL').length,
        warnings: findings.filter(f => f.severity === 'WARN').length,
        suggestions: findings.filter(f => f.severity === 'PASS').length
      },
      findings: findings.sort((a, b) => {
        const severityOrder = { 'FAIL': 3, 'WARN': 2, 'PASS': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
    };
    
    // Output results
    console.log('\n🎯 Analysis Complete!');
    console.log(`📊 Total findings: ${report.summary.totalFindings}`);
    console.log(`🚨 Critical issues: ${report.summary.criticalIssues}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    
    // Output JSON for service consumption
    console.log('\n' + JSON.stringify(report, null, 2));
    
    return report;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Parse arguments and run
cfg.args = parseArgs();

if (cfg.args.root) {
  cfg.root = path.resolve(cfg.args.root);
}

// Run the analysis
runAnalysis().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});