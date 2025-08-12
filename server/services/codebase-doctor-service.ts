/**
 * Codebase Doctor Service - Integration with Error Management System
 * Provides enhanced error logging capabilities for the developer dashboard
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
// Using console.log for now since Logger path needs to be verified
// import { Logger } from '../lib/logger.js';
import type { CodebaseDoctorReport, Finding } from '../../scripts/codebase-doctor.js';

const execAsync = promisify(exec);

export interface CodebaseAnalysisResult {
  timestamp: string;
  summary: {
    totalFindings: number;
    criticalIssues: number;
    warnings: number;
    suggestions: number;
  };
  categories: {
    [key: string]: {
      count: number;
      critical: number;
      items: EnhancedFinding[];
    };
  };
  trends: {
    improvementFromLastScan: number;
    newIssues: number;
    resolvedIssues: number;
  };
}

export interface EnhancedFinding extends Finding {
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'trivial' | 'easy' | 'medium' | 'hard';
  priority: number; // 1-10 scale
  affectedFiles?: string[];
  relatedFindings?: string[];
}

export class CodebaseDoctorService {
  private static instance: CodebaseDoctorService;
  private lastScanResults: CodebaseAnalysisResult | null = null;
  private scanHistory: Array<{ timestamp: string; summary: any }> = [];

  private constructor() {}

  static getInstance(): CodebaseDoctorService {
    if (!CodebaseDoctorService.instance) {
      CodebaseDoctorService.instance = new CodebaseDoctorService();
    }
    return CodebaseDoctorService.instance;
  }

  async runFullCodebaseAnalysis(options: {
    includePerformance?: boolean;
    includeSecurity?: boolean;
    includeCodeQuality?: boolean;
    outputToDatabase?: boolean;
  } = {}): Promise<CodebaseAnalysisResult> {
    try {
      console.log('Starting comprehensive codebase analysis...');
      
      const rootDir = process.cwd();
      
      // Use the CommonJS version of the script to avoid ES module issues
      const scriptPath = path.join(process.cwd(), 'scripts', 'codebase-doctor.cjs');
      let command = `node "${scriptPath}" --root "${rootDir}"`;
      
      if (options.outputToDatabase) {
        command += ' --db';
      }

      // Execute the codebase doctor script
      console.log(`Executing: ${command}`);
      const { stdout, stderr } = await execAsync(command, {
        cwd: rootDir,
        timeout: 300000, // 5 minute timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (stderr) {
        console.warn('Script stderr:', stderr);
      }

      // Parse the JSON output from stdout
      let reportData: CodebaseDoctorReport;
      try {
        // Extract JSON from the script output (it's at the end after console logs)
        const lines = stdout.split('\n');
        const jsonStart = lines.findIndex(line => line.trim().startsWith('{'));
        if (jsonStart === -1) {
          throw new Error('No JSON output found in script response');
        }
        const jsonOutput = lines.slice(jsonStart).join('\n').trim();
        reportData = JSON.parse(jsonOutput);
      } catch (parseError) {
        console.error('Failed to parse script output:', stdout);
        throw new Error('Failed to parse codebase analysis results');
      }
      
      // Enhanced analysis and categorization
      const result = await this.enhanceAndCategorizeFindings(reportData);
      
      // Store results for trend analysis
      this.lastScanResults = result;
      this.scanHistory.push({
        timestamp: result.timestamp,
        summary: result.summary
      });
      
      // Keep only last 10 scans for trend analysis
      if (this.scanHistory.length > 10) {
        this.scanHistory = this.scanHistory.slice(-10);
      }

      console.log(`Codebase analysis completed: ${result.summary.totalFindings} findings`);
      return result;

    } catch (error: any) {
      console.error('Codebase analysis failed:', error);
      throw new Error(`Codebase analysis failed: ${error?.message || 'Unknown error'}`);
    }
  }

  private async enhanceAndCategorizeFindings(report: CodebaseDoctorReport): Promise<CodebaseAnalysisResult> {
    const categories: { [key: string]: { count: number; critical: number; items: EnhancedFinding[] } } = {};
    let totalCritical = 0;
    let totalWarnings = 0;
    let totalSuggestions = 0;

    // Process each section's findings
    for (const section of report.sections) {
      for (const finding of section.findings) {
        const enhanced = this.enhanceFinding(finding);
        
        // Categorize by type
        const category = enhanced.category || 'general';
        if (!categories[category]) {
          categories[category] = { count: 0, critical: 0, items: [] };
        }
        
        categories[category].count++;
        categories[category].items.push(enhanced);
        
        if (enhanced.severity === 'FAIL' || enhanced.impact === 'critical') {
          categories[category].critical++;
          totalCritical++;
        } else if (enhanced.severity === 'WARN') {
          totalWarnings++;
        } else {
          totalSuggestions++;
        }
      }
    }

    // Calculate trends if we have previous data
    const trends = this.calculateTrends(report.summary);

    return {
      timestamp: report.timestamp,
      summary: {
        totalFindings: report.summary.totalFindings,
        criticalIssues: totalCritical,
        warnings: totalWarnings,
        suggestions: totalSuggestions
      },
      categories,
      trends
    };
  }

  private enhanceFinding(finding: Finding): EnhancedFinding {
    // Enhance finding with impact, effort, and priority
    const enhanced: EnhancedFinding = {
      ...finding,
      impact: this.calculateImpact(finding),
      effort: this.calculateEffort(finding),
      priority: 0
    };

    // Calculate priority based on impact, effort, and severity
    enhanced.priority = this.calculatePriority(enhanced);

    return enhanced;
  }

  private calculateImpact(finding: Finding): 'low' | 'medium' | 'high' | 'critical' {
    // High impact patterns
    if (finding.id.includes('security') || finding.id.includes('syntax')) {
      return 'critical';
    }
    
    if (finding.severity === 'FAIL') {
      return 'high';
    }
    
    if (finding.id.includes('performance') || finding.id.includes('import')) {
      return 'medium';
    }
    
    return 'low';
  }

  private calculateEffort(finding: Finding): 'trivial' | 'easy' | 'medium' | 'hard' {
    // Easy fixes
    if (finding.id.includes('unused') || finding.id.includes('console') || finding.id.includes('todo')) {
      return 'trivial';
    }
    
    if (finding.id.includes('import') || finding.id.includes('missing')) {
      return 'easy';
    }
    
    if (finding.id.includes('security') || finding.id.includes('performance')) {
      return 'medium';
    }
    
    return 'hard';
  }

  private calculatePriority(finding: EnhancedFinding): number {
    // Priority calculation based on impact and effort
    const impactScore = {
      'critical': 10,
      'high': 7,
      'medium': 4,
      'low': 2
    }[finding.impact];

    const effortMultiplier = {
      'trivial': 1,
      'easy': 0.8,
      'medium': 0.6,
      'hard': 0.4
    }[finding.effort];

    return Math.round(impactScore * effortMultiplier);
  }

  private calculateTrends(currentSummary: any): {
    improvementFromLastScan: number;
    newIssues: number;
    resolvedIssues: number;
  } {
    if (this.scanHistory.length === 0) {
      return {
        improvementFromLastScan: 0,
        newIssues: 0,
        resolvedIssues: 0
      };
    }

    const lastScan = this.scanHistory[this.scanHistory.length - 1];
    const improvement = lastScan.summary.totalFindings - currentSummary.totalFindings;
    
    return {
      improvementFromLastScan: improvement,
      newIssues: Math.max(0, -improvement),
      resolvedIssues: Math.max(0, improvement)
    };
  }

  async getQuickHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    keyIssues: string[];
    lastScan?: string;
  }> {
    try {
      // Run a minimal check focusing on critical issues only
      const criticalChecks = [
        'syntax:typescript',
        'security:hardcoded-secret',
        'import:missing',
        'security:eval'
      ];

      const result = await this.runFullCodebaseAnalysis({
        includeSecurity: true,
        includeCodeQuality: false,
        includePerformance: false
      });

      const criticalIssues = Object.values(result.categories)
        .flatMap(cat => cat.items)
        .filter(item => item.severity === 'FAIL' && criticalChecks.includes(item.id));

      const score = Math.max(0, 100 - (result.summary.criticalIssues * 10) - (result.summary.warnings * 2));
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (result.summary.criticalIssues > 0) {
        status = 'critical';
      } else if (result.summary.warnings > 10) {
        status = 'warning';
      }

      return {
        status,
        score,
        keyIssues: criticalIssues.slice(0, 5).map(issue => issue.title),
        lastScan: result.timestamp
      };

    } catch (error) {
      console.error('Quick health check failed:', error);
      return {
        status: 'critical',
        score: 0,
        keyIssues: ['Unable to perform health check'],
        lastScan: undefined
      };
    }
  }

  getLastScanResults(): CodebaseAnalysisResult | null {
    return this.lastScanResults;
  }

  getScanHistory(): Array<{ timestamp: string; summary: any }> {
    return this.scanHistory;
  }

  async generateDetailedReport(format: 'json' | 'markdown' = 'json'): Promise<string> {
    if (!this.lastScanResults) {
      throw new Error('No scan results available. Run analysis first.');
    }

    if (format === 'json') {
      return JSON.stringify(this.lastScanResults, null, 2);
    }

    // Generate markdown report
    let markdown = `# Codebase Health Report\n\n`;
    markdown += `**Generated:** ${this.lastScanResults.timestamp}\n`;
    markdown += `**Total Findings:** ${this.lastScanResults.summary.totalFindings}\n`;
    markdown += `**Critical Issues:** ${this.lastScanResults.summary.criticalIssues}\n\n`;

    markdown += `## Categories\n\n`;
    for (const [category, data] of Object.entries(this.lastScanResults.categories)) {
      markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
      markdown += `- Total: ${data.count}\n`;
      markdown += `- Critical: ${data.critical}\n\n`;
      
      // Top 3 highest priority items
      const topIssues = data.items
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);
      
      if (topIssues.length > 0) {
        markdown += `**Top Issues:**\n`;
        for (const issue of topIssues) {
          markdown += `- ${issue.title} (Priority: ${issue.priority})\n`;
        }
        markdown += `\n`;
      }
    }

    return markdown;
  }
}