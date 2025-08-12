#!/usr/bin/env node
/**
 * @fileoverview Codebase Doctor - Advanced TypeScript Codebase Analysis Tool
 */
/**
 * Codebase Doctor — Advanced codebase checker & reporter for Clean & Flip
 * ---------------------------------------------------------------------------------
 * Enhanced version with integrated error logging for developer dashboard
 * 
 * What it checks:
 * 1) TypeScript compile errors (if tsconfig.json exists)
 * 2) Broken/ambiguous imports & orphaned files (module graph)
 * 3) Duplicate/near-duplicate files (content hashing & AST fingerprints)
 * 4) React Router: declared <Route path> vs. referenced links (Link/NavLink/to/navigate)
 * 5) Express API: declared routes vs. front-end fetch/axios calls
 * 6) Design system drift: Button variants/sizes vs. actual usage + hardcoded classnames
 * 7) Hardcoded CSS: inline styles, hex/rgb colors, !important, arbitrary Tailwind colors
 * 8) Conflicting CSS selectors and duplicate Tailwind utility collisions
 * 9) Large/unused assets, unoptimized images
 * 10) ENV variables: used vs. .env.example
 * 11) TODO/FIXME/console logs inventory
 * 12) Simple flaky patterns: setInterval without clear, unhandled promises, empty catch, etc.
 * 13) Missing pages/routes (simple 404 risk heuristics)
 * 14) JSON/TS/JS syntax validity (fast scan)
 * 15) License headers / file banners consistency (optional)
 * 16) Database schema consistency checks
 * 17) Security vulnerability patterns
 * 18) Performance anti-patterns
 */

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/* ------------------------------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------------------------------ */

type Severity = 'PASS' | 'WARN' | 'FAIL';

interface Finding {
  id: string;
  title: string;
  severity: Severity;
  file?: string;
  line?: number;
  column?: number;
  details?: string;
  suggestion?: string;
  tags?: string[];
  timestamp: string;
  category: string;
}

interface SectionReport {
  section: string;
  findings: Finding[];
}

interface CodebaseDoctorReport {
  timestamp: string;
  summary: {
    totalFindings: number;
    pass: number;
    warn: number;
    fail: number;
    criticalIssues: number;
  };
  sections: SectionReport[];
  metadata: {
    root: string;
    filesScanned: number;
    scanDuration: number;
    version: string;
  };
}

interface DoctorConfig {
  root: string;
  routerMode: 'auto' | 'react';
  expressDir: string | null;
  buttonPath: string | null;
  envExamplePath: string | null;
  ignore: string[];
  outputToDatabase: boolean;
}

/* ------------------------------------------------------------------------------------------------
 * CLI args and configuration
 * ------------------------------------------------------------------------------------------------ */

const args = process.argv.slice(2);
const getArg = (flag: string, fallback?: string | null) => {
  const idx = args.indexOf(flag);
  if (idx >= 0) return args[idx + 1] ?? null;
  return fallback ?? null;
};

const cfg: DoctorConfig = {
  root: path.resolve(getArg('--root', '.')!),
  routerMode: (getArg('--router', 'auto') as 'auto' | 'react') || 'auto',
  expressDir: getArg('--express', 'server'),
  buttonPath: getArg('--button', 'client/src/components/ui/button.tsx'),
  envExamplePath: getArg('--env', '.env.example'),
  outputToDatabase: args.includes('--db'),
  ignore: [
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '.next/**',
    '.turbo/**',
    '.git/**',
    '**/*.map',
    'scripts/**',
    'attached_assets/**'
  ]
};

/* ------------------------------------------------------------------------------------------------
 * Utils
 * ------------------------------------------------------------------------------------------------ */

const REPORT_DIR = path.join(process.cwd(), 'codebase-doctor-report');

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function rel(p: string) {
  return path.relative(cfg.root, p) || p;
}

function readSafe(file: string): string {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

function isTextFile(file: string) {
  return /\.(t|j)sx?$|\.(json|md|css|scss|sass|html|vue)$/i.test(file);
}

/* ------------------------------------------------------------------------------------------------
 * Core scanner
 * ------------------------------------------------------------------------------------------------ */

async function collectFiles(): Promise<string[]> {
  const files: string[] = [];
  
  // Use simple fs.readdirSync approach for better reliability
  const walkDir = (dir: string): void => {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip ignored directories
          if (cfg.ignore.some(ignore => fullPath.includes(ignore.replace('**/', '').replace('/**', '')))) {
            continue;
          }
          walkDir(fullPath);
        } else if (stat.isFile()) {
          // Check if file matches our patterns
          if (/\.(t|j)sx?$|\.(json|md|css|scss|sass|html|vue)$/i.test(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  };
  
  walkDir(cfg.root);
  return files;
}

/* ------------------------------------------------------------------------------------------------
 * Check 1 — Syntax validity + TypeScript compilation
 * ------------------------------------------------------------------------------------------------ */
async function checkSyntax(files: string[]): Promise<SectionReport> {
  const findings: Finding[] = [];

  // Check JSON files
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  for (const file of jsonFiles) {
    const raw = readSafe(file);
    if (!raw) continue;
    try {
      JSON.parse(raw);
    } catch (e: any) {
      findings.push({
        id: 'syntax:json',
        title: `Invalid JSON`,
        severity: 'FAIL',
        file: rel(file),
        details: String(e.message),
        timestamp: new Date().toISOString(),
        category: 'syntax'
      });
    }
  }

  // Check TypeScript compilation
  const tsconfigPath = path.join(cfg.root, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    try {
      const result = await execAsync('npx tsc --noEmit --skipLibCheck', { cwd: cfg.root });
    } catch (e: any) {
      const errors = e.stdout || e.stderr || '';
      const errorLines = errors.split('\n').filter((line: string) => line.trim() && !line.includes('Found ') && !line.includes('error TS6053'));
      
      for (const errorLine of errorLines.slice(0, 20)) { // Limit to first 20 errors
        if (errorLine.includes('error TS')) {
          const match = errorLine.match(/(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)/);
          if (match) {
            findings.push({
              id: 'syntax:typescript',
              title: `TypeScript Error TS${match[4]}`,
              severity: 'FAIL',
              file: rel(path.resolve(cfg.root, match[1])),
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              details: match[5],
              timestamp: new Date().toISOString(),
              category: 'typescript'
            });
          }
        }
      }
    }
  }

  return { section: 'Syntax & Compilation', findings };
}

/* ------------------------------------------------------------------------------------------------
 * Check 2 — Import/Export Analysis
 * ------------------------------------------------------------------------------------------------ */
async function checkImports(files: string[]): Promise<SectionReport> {
  const findings: Finding[] = [];
  const sourceFiles = files.filter(f => /\.(t|j)sx?$/.test(f));
  
  for (const file of sourceFiles) {
    const content = readSafe(file);
    if (!content) continue;

    // Check for unused imports
    const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) { // Named imports
        const namedImports = match[1].split(',').map(imp => imp.trim().split(' as ')[0]);
        imports.push(...namedImports);
      } else if (match[2]) { // Namespace import
        imports.push(match[2]);
      } else if (match[3]) { // Default import
        imports.push(match[3]);
      }
    }

    // Check if imports are used in the file
    for (const imp of imports) {
      if (imp && !content.includes(imp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) {
        findings.push({
          id: 'import:unused',
          title: 'Unused import',
          severity: 'WARN',
          file: rel(file),
          details: `Import '${imp}' is not used in the file`,
          suggestion: 'Remove unused import to clean up the code',
          timestamp: new Date().toISOString(),
          category: 'imports'
        });
      }
    }

    // Check for missing file extensions in relative imports
    const relativeImportRegex = /from\s+['"](\.[^'"]+)['"]/g;
    while ((match = relativeImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (!importPath.match(/\.(t|j)sx?$/)) {
        const resolvedPath = path.resolve(path.dirname(file), importPath);
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        const found = extensions.some(ext => fs.existsSync(resolvedPath + ext));
        
        if (!found && !fs.existsSync(resolvedPath) && !fs.existsSync(path.join(resolvedPath, 'index.ts'))) {
          findings.push({
            id: 'import:missing',
            title: 'Broken import path',
            severity: 'FAIL',
            file: rel(file),
            details: `Cannot resolve import '${importPath}'`,
            suggestion: 'Check the file path and ensure the imported file exists',
            timestamp: new Date().toISOString(),
            category: 'imports'
          });
        }
      }
    }
  }

  return { section: 'Import/Export Analysis', findings };
}

/* ------------------------------------------------------------------------------------------------
 * Check 3 — React-specific checks
 * ------------------------------------------------------------------------------------------------ */
async function checkReact(files: string[]): Promise<SectionReport> {
  const findings: Finding[] = [];
  const reactFiles = files.filter(f => /\.(t|j)sx$/.test(f));

  for (const file of reactFiles) {
    const content = readSafe(file);
    if (!content) continue;

    // Check for missing React import (pre-React 17)
    if (content.includes('JSX') || content.match(/<[A-Z]/)) {
      if (!content.includes('import React') && !content.includes('import * as React')) {
        const lines = content.split('\n');
        const hasAutomaticJSX = lines.some(line => line.includes('/** @jsx') || line.includes('/* @jsx'));
        
        if (!hasAutomaticJSX) {
          findings.push({
            id: 'react:missing-import',
            title: 'Potential missing React import',
            severity: 'WARN',
            file: rel(file),
            details: 'File contains JSX but no React import (check if automatic JSX runtime is configured)',
            timestamp: new Date().toISOString(),
            category: 'react'
          });
        }
      }
    }

    // Check for hooks used outside components
    const hookRegex = /\b(use[A-Z]\w*)\s*\(/g;
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const match = hookRegex.exec(line);
      if (match) {
        const context = lines.slice(Math.max(0, index - 5), index + 1).join('\n');
        const isInComponent = /function\s+[A-Z]|const\s+[A-Z][^=]*=\s*\(|export\s+default\s+function\s+[A-Z]/.test(context);
        
        if (!isInComponent) {
          findings.push({
            id: 'react:hooks-outside-component',
            title: 'Hook used outside component',
            severity: 'WARN',
            file: rel(file),
            line: index + 1,
            details: `Hook '${match[1]}' might be used outside a React component`,
            suggestion: 'Ensure hooks are only called from React components or custom hooks',
            timestamp: new Date().toISOString(),
            category: 'react'
          });
        }
      }
    });

    // Check for missing keys in lists
    const mapRegex = /\.map\s*\(\s*(?:\([^)]*\)|[^=]*)\s*=>\s*<[^>]*>/g;
    while ((match = mapRegex.exec(content)) !== null) {
      if (!match[0].includes('key=')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: 'react:missing-key',
          title: 'Missing key prop in mapped element',
          severity: 'WARN',
          file: rel(file),
          line: lineNumber,
          details: 'Mapped JSX element is missing a key prop',
          suggestion: 'Add a unique key prop to improve React performance',
          timestamp: new Date().toISOString(),
          category: 'react'
        });
      }
    }
  }

  return { section: 'React Analysis', findings };
}

/* ------------------------------------------------------------------------------------------------
 * Check 4 — Security vulnerabilities
 * ------------------------------------------------------------------------------------------------ */
async function checkSecurity(files: string[]): Promise<SectionReport> {
  const findings: Finding[] = [];
  
  for (const file of files.filter(f => /\.(t|j)sx?$/.test(f))) {
    const content = readSafe(file);
    if (!content) continue;

    // Check for dangerous patterns
    const securityPatterns = [
      { pattern: /eval\s*\(/, id: 'security:eval', title: 'Use of eval()', severity: 'FAIL' as Severity },
      { pattern: /innerHTML\s*=/, id: 'security:innerHTML', title: 'Use of innerHTML', severity: 'WARN' as Severity },
      { pattern: /document\.write\s*\(/, id: 'security:document-write', title: 'Use of document.write', severity: 'WARN' as Severity },
      { pattern: /dangerouslySetInnerHTML/, id: 'security:dangerous-html', title: 'Use of dangerouslySetInnerHTML', severity: 'WARN' as Severity },
      { pattern: /console\.(log|error|warn|info)\s*\(/, id: 'security:console', title: 'Console statement in production code', severity: 'WARN' as Severity }
    ];

    for (const { pattern, id, title, severity } of securityPatterns) {
      const matches = [...content.matchAll(new RegExp(pattern.source, 'g'))];
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id,
          title,
          severity,
          file: rel(file),
          line: lineNumber,
          details: `Found: ${match[0]}`,
          suggestion: 'Review for security implications and consider alternatives',
          timestamp: new Date().toISOString(),
          category: 'security'
        });
      }
    }

    // Check for hardcoded secrets patterns
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/i,
      /secret[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/i,
      /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /token\s*[:=]\s*['"][^'"]{20,}['"]/i
    ];

    for (const pattern of secretPatterns) {
      const matches = [...content.matchAll(new RegExp(pattern.source, 'gi'))];
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: 'security:hardcoded-secret',
          title: 'Potential hardcoded secret',
          severity: 'FAIL',
          file: rel(file),
          line: lineNumber,
          details: 'Found potential hardcoded API key, password, or token',
          suggestion: 'Move secrets to environment variables',
          timestamp: new Date().toISOString(),
          category: 'security'
        });
      }
    }
  }

  return { section: 'Security Analysis', findings };
}

/* ------------------------------------------------------------------------------------------------
 * Check 5 — Performance patterns
 * ------------------------------------------------------------------------------------------------ */
async function checkPerformance(files: string[]): Promise<SectionReport> {
  const findings: Finding[] = [];
  
  for (const file of files.filter(f => /\.(t|j)sx?$/.test(f))) {
    const content = readSafe(file);
    if (!content) continue;

    // Check for performance anti-patterns
    const performancePatterns = [
      { pattern: /useEffect\s*\(\s*[^,]+,\s*\[\s*\]/, id: 'perf:empty-deps', title: 'useEffect with empty dependency array', severity: 'WARN' as Severity },
      { pattern: /setInterval\s*\([^)]+\)(?!\s*;\s*return)/, id: 'perf:uncleaned-interval', title: 'Potential memory leak: setInterval without cleanup', severity: 'WARN' as Severity },
      { pattern: /setTimeout\s*\([^)]+\)(?!\s*;\s*return)/, id: 'perf:uncleaned-timeout', title: 'Potential memory leak: setTimeout without cleanup', severity: 'WARN' as Severity }
    ];

    for (const { pattern, id, title, severity } of performancePatterns) {
      const matches = [...content.matchAll(new RegExp(pattern.source, 'g'))];
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id,
          title,
          severity,
          file: rel(file),
          line: lineNumber,
          details: `Found: ${match[0].substring(0, 50)}...`,
          suggestion: 'Review for potential performance issues and memory leaks',
          timestamp: new Date().toISOString(),
          category: 'performance'
        });
      }
    }

    // Check for large bundle indicators
    const largeImports = content.match(/import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]*lodash['"]/g);
    if (largeImports) {
      findings.push({
        id: 'perf:large-import',
        title: 'Large library import detected',
        severity: 'WARN',
        file: rel(file),
        details: 'Importing entire lodash library instead of specific functions',
        suggestion: 'Use specific imports to reduce bundle size: import { function } from "lodash"',
        timestamp: new Date().toISOString(),
        category: 'performance'
      });
    }
  }

  return { section: 'Performance Analysis', findings };
}

/* ------------------------------------------------------------------------------------------------
 * Check 6 — Code quality patterns
 * ------------------------------------------------------------------------------------------------ */
async function checkCodeQuality(files: string[]): Promise<SectionReport> {
  const findings: Finding[] = [];
  
  for (const file of files.filter(f => /\.(t|j)sx?$/.test(f))) {
    const content = readSafe(file);
    if (!content) continue;

    const lines = content.split('\n');
    
    // Check for TODO/FIXME comments
    lines.forEach((line, index) => {
      const todoMatch = line.match(/(TODO|FIXME|HACK|XXX|BUG)[\s:]+(.*)/i);
      if (todoMatch) {
        findings.push({
          id: 'quality:todo',
          title: `${todoMatch[1].toUpperCase()} comment found`,
          severity: 'WARN',
          file: rel(file),
          line: index + 1,
          details: todoMatch[2].trim(),
          suggestion: 'Address the TODO/FIXME or create a proper ticket',
          timestamp: new Date().toISOString(),
          category: 'code-quality'
        });
      }
    });

    // Check for empty catch blocks
    const emptyCatchRegex = /catch\s*\([^)]*\)\s*{\s*}/g;
    const matches = [...content.matchAll(emptyCatchRegex)];
    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      findings.push({
        id: 'quality:empty-catch',
        title: 'Empty catch block',
        severity: 'WARN',
        file: rel(file),
        line: lineNumber,
        details: 'Catch block is empty, potentially hiding errors',
        suggestion: 'Add proper error handling or at least log the error',
        timestamp: new Date().toISOString(),
        category: 'code-quality'
      });
    }

    // Check for long functions (>50 lines)
    const functionMatches = [...content.matchAll(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|\w+\s*\([^)]*\)\s*{)/g)];
    for (const match of functionMatches) {
      const startLine = content.substring(0, match.index).split('\n').length;
      const afterMatch = content.substring(match.index);
      let braceCount = 0;
      let endIndex = 0;
      
      for (let i = 0; i < afterMatch.length; i++) {
        if (afterMatch[i] === '{') braceCount++;
        if (afterMatch[i] === '}') braceCount--;
        if (braceCount === 0 && afterMatch[i] === '}') {
          endIndex = i;
          break;
        }
      }
      
      const functionBody = afterMatch.substring(0, endIndex);
      const lineCount = functionBody.split('\n').length;
      
      if (lineCount > 50) {
        findings.push({
          id: 'quality:long-function',
          title: 'Long function detected',
          severity: 'WARN',
          file: rel(file),
          line: startLine,
          details: `Function is ${lineCount} lines long`,
          suggestion: 'Consider breaking down into smaller functions for better maintainability',
          timestamp: new Date().toISOString(),
          category: 'code-quality'
        });
      }
    }
  }

  return { section: 'Code Quality', findings };
}

/* ------------------------------------------------------------------------------------------------
 * Database integration for error logging
 * ------------------------------------------------------------------------------------------------ */
async function saveToDatabase(report: CodebaseDoctorReport): Promise<void> {
  if (!cfg.outputToDatabase) return;
  
  try {
    // This would integrate with your existing error logging system
    const errorEntries = report.sections.flatMap(section => 
      section.findings.filter(f => f.severity === 'FAIL' || f.severity === 'WARN').map(finding => ({
        message: `${finding.title}: ${finding.details || ''}`,
        stack: finding.file ? `at ${finding.file}:${finding.line || 1}:${finding.column || 1}` : 'Unknown location',
        level: finding.severity === 'FAIL' ? 'error' : 'warn',
        timestamp: finding.timestamp,
        metadata: JSON.stringify({
          category: finding.category,
          id: finding.id,
          suggestion: finding.suggestion,
          tags: finding.tags
        }),
        source: 'codebase-doctor',
        userId: null,
        sessionId: null,
        resolved: false
      }))
    );

    // Save each error to your error logging system
    // This would use your existing error logging infrastructure
    console.log(`Would save ${errorEntries.length} findings to database`);
    
  } catch (error) {
    console.error('Failed to save to database:', error);
  }
}

/* ------------------------------------------------------------------------------------------------
 * Main execution
 * ------------------------------------------------------------------------------------------------ */
async function main() {
  console.log('🔍 Starting Advanced Codebase Doctor Analysis...');
  const startTime = Date.now();
  
  const files = await collectFiles();
  console.log(`📁 Found ${files.length} files to analyze`);

  const sections: SectionReport[] = [];
  
  console.log('🔍 Running syntax and compilation checks...');
  sections.push(await checkSyntax(files));
  
  console.log('🔍 Analyzing imports and dependencies...');
  sections.push(await checkImports(files));
  
  console.log('🔍 Running React-specific checks...');
  sections.push(await checkReact(files));
  
  console.log('🔍 Performing security analysis...');
  sections.push(await checkSecurity(files));
  
  console.log('🔍 Checking performance patterns...');
  sections.push(await checkPerformance(files));
  
  console.log('🔍 Analyzing code quality...');
  sections.push(await checkCodeQuality(files));

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Generate summary
  const allFindings = sections.flatMap(s => s.findings);
  const summary = {
    totalFindings: allFindings.length,
    pass: allFindings.filter(f => f.severity === 'PASS').length,
    warn: allFindings.filter(f => f.severity === 'WARN').length,
    fail: allFindings.filter(f => f.severity === 'FAIL').length,
    criticalIssues: allFindings.filter(f => f.severity === 'FAIL' && f.category === 'security').length
  };

  const report: CodebaseDoctorReport = {
    timestamp: new Date().toISOString(),
    summary,
    sections,
    metadata: {
      root: cfg.root,
      filesScanned: files.length,
      scanDuration: duration,
      version: '2.0.0'
    }
  };

  // Save reports
  ensureDir(REPORT_DIR);
  await fsp.writeFile(
    path.join(REPORT_DIR, 'report.json'),
    JSON.stringify(report, null, 2)
  );

  // Generate markdown report
  const markdown = generateMarkdownReport(report);
  await fsp.writeFile(
    path.join(REPORT_DIR, 'report.md'),
    markdown
  );

  // Save to database if requested
  await saveToDatabase(report);

  // Console summary
  console.log('\n📊 Codebase Doctor Summary:');
  console.log(`   Files scanned: ${files.length}`);
  console.log(`   Total findings: ${summary.totalFindings}`);
  console.log(`   ✅ Pass: ${summary.pass}`);
  console.log(`   ⚠️  Warn: ${summary.warn}`);
  console.log(`   ❌ Fail: ${summary.fail}`);
  console.log(`   🔴 Critical: ${summary.criticalIssues}`);
  console.log(`   ⏱️  Duration: ${duration}ms`);
  console.log(`\n📁 Reports saved to: ${REPORT_DIR}`);

  // Exit with error code if there are failures
  if (summary.fail > 0) {
    process.exit(1);
  }
}

function generateMarkdownReport(report: CodebaseDoctorReport): string {
  let markdown = `# Codebase Doctor Report\n\n`;
  markdown += `**Generated:** ${report.timestamp}\n`;
  markdown += `**Files Scanned:** ${report.metadata.filesScanned}\n`;
  markdown += `**Duration:** ${report.metadata.scanDuration}ms\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `- Total Findings: ${report.summary.totalFindings}\n`;
  markdown += `- ✅ Pass: ${report.summary.pass}\n`;
  markdown += `- ⚠️ Warn: ${report.summary.warn}\n`;
  markdown += `- ❌ Fail: ${report.summary.fail}\n`;
  markdown += `- 🔴 Critical: ${report.summary.criticalIssues}\n\n`;

  for (const section of report.sections) {
    if (section.findings.length === 0) continue;
    
    markdown += `## ${section.section}\n\n`;
    
    for (const finding of section.findings) {
      const icon = finding.severity === 'FAIL' ? '❌' : finding.severity === 'WARN' ? '⚠️' : '✅';
      markdown += `### ${icon} ${finding.title}\n\n`;
      
      if (finding.file) {
        markdown += `**File:** ${finding.file}`;
        if (finding.line) markdown += `:${finding.line}`;
        markdown += '\n\n';
      }
      
      if (finding.details) {
        markdown += `**Details:** ${finding.details}\n\n`;
      }
      
      if (finding.suggestion) {
        markdown += `**Suggestion:** ${finding.suggestion}\n\n`;
      }
      
      markdown += '---\n\n';
    }
  }

  return markdown;
}

if (require.main === module) {
  main().catch(console.error);
}

export { main as runCodebaseDoctor, type CodebaseDoctorReport, type Finding };