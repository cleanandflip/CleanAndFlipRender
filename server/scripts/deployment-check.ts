#!/usr/bin/env tsx

/**
 * Deployment Readiness Check
 * Validates that all required configurations and files are properly set up for Cloud Run deployment
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { Logger } from '../config/logger';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

class DeploymentChecker {
  private results: CheckResult[] = [];

  async runAllChecks(): Promise<void> {
    Logger.info('[DEPLOYMENT-CHECK] Starting deployment readiness validation...');
    
    await this.checkRequiredFiles();
    await this.checkEnvironmentVariables();
    await this.checkBuildConfiguration();
    await this.checkServerConfiguration();
    await this.checkHealthEndpoints();
    
    this.displayResults();
  }

  private async checkRequiredFiles(): Promise<void> {
    // Find the actual workspace root by looking for package.json
    let workspaceRoot = process.cwd();
    while (workspaceRoot !== '/' && !existsSync(resolve(workspaceRoot, 'package.json'))) {
      workspaceRoot = resolve(workspaceRoot, '..');
    }
    
    const requiredFiles = [
      'package.json',
      'server/index.ts',
      'server/routes.ts',
      'esbuild.config.js',
      'Dockerfile',
      '.dockerignore'
    ];

    for (const file of requiredFiles) {
      const fullPath = resolve(workspaceRoot, file);
      const exists = existsSync(fullPath);
      this.results.push({
        name: `Required file: ${file}`,
        status: exists ? 'pass' : 'fail',
        message: exists ? 'File exists' : 'File missing',
        details: exists ? undefined : `Missing required file: ${file} (workspace: ${workspaceRoot})`
      });
    }
  }

  private async checkEnvironmentVariables(): Promise<void> {
    const requiredEnvVars = [
      'DATABASE_URL',
      'STRIPE_SECRET_KEY'
    ];

    const optionalEnvVars = [
      'REDIS_URL',
      'CLOUDINARY_CLOUD_NAME',
      'RESEND_API_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      const hasValue = !!process.env[envVar];
      this.results.push({
        name: `Environment Variable: ${envVar}`,
        status: hasValue ? 'pass' : 'fail',
        message: hasValue ? 'Configured' : 'Missing (required)',
        details: hasValue ? undefined : `Set ${envVar} environment variable`
      });
    }

    for (const envVar of optionalEnvVars) {
      const hasValue = !!process.env[envVar];
      this.results.push({
        name: `Environment Variable: ${envVar}`,
        status: hasValue ? 'pass' : 'warning',
        message: hasValue ? 'Configured' : 'Not set (optional)',
        details: hasValue ? undefined : `Consider setting ${envVar} for full functionality`
      });
    }
  }

  private async checkBuildConfiguration(): Promise<void> {
    try {
      const packageJson = await import('../../package.json', { assert: { type: 'json' } });
      
      // Check start script
      const hasStartScript = packageJson.default.scripts?.start;
      this.results.push({
        name: 'NPM start script',
        status: hasStartScript ? 'pass' : 'fail',
        message: hasStartScript ? 'Configured' : 'Missing start script',
        details: hasStartScript ? `Script: ${hasStartScript}` : 'Add "start" script to package.json'
      });

      // Check build script
      const hasBuildScript = packageJson.default.scripts?.build;
      this.results.push({
        name: 'NPM build script',
        status: hasBuildScript ? 'pass' : 'fail',
        message: hasBuildScript ? 'Configured' : 'Missing build script',
        details: hasBuildScript ? `Script: ${hasBuildScript}` : 'Add "build" script to package.json'
      });

    } catch (error) {
      this.results.push({
        name: 'Package.json validation',
        status: 'fail',
        message: 'Cannot read package.json',
        details: 'Ensure package.json exists and is valid JSON'
      });
    }
  }

  private async checkServerConfiguration(): Promise<void> {
    // Check for proper host binding (0.0.0.0)
    try {
      const { readFileSync } = await import('fs');
      const rootDir = resolve(process.cwd(), '../..');
      const routesPath = resolve(rootDir, 'server/routes.ts');
      const routesContent = readFileSync(routesPath, 'utf-8');
      
      const hasCorrectBinding = routesContent.includes("'0.0.0.0'") || routesContent.includes('"0.0.0.0"');
      this.results.push({
        name: 'Server host binding',
        status: hasCorrectBinding ? 'pass' : 'fail',
        message: hasCorrectBinding ? 'Bound to 0.0.0.0 (correct)' : 'Not bound to 0.0.0.0',
        details: hasCorrectBinding ? undefined : 'Server must bind to 0.0.0.0 for Cloud Run'
      });

      // Check for port configuration
      const hasPortConfig = routesContent.includes('process.env.PORT');
      this.results.push({
        name: 'Port configuration',
        status: hasPortConfig ? 'pass' : 'warning',
        message: hasPortConfig ? 'Uses PORT environment variable' : 'Static port configuration',
        details: hasPortConfig ? undefined : 'Consider using process.env.PORT for flexibility'
      });

    } catch (error) {
      this.results.push({
        name: 'Server configuration check',
        status: 'fail',
        message: 'Cannot read server files',
        details: `Unable to validate server configuration: ${error}`
      });
    }
  }

  private async checkHealthEndpoints(): Promise<void> {
    try {
      const healthConfig = await import('../config/health');
      
      const hasLiveCheck = typeof healthConfig.healthLive === 'function';
      const hasReadyCheck = typeof healthConfig.healthReady === 'function';

      this.results.push({
        name: 'Health check endpoints',
        status: (hasLiveCheck && hasReadyCheck) ? 'pass' : 'warning',
        message: hasLiveCheck && hasReadyCheck ? 'Both /health and /health/ready available' : 'Some health checks missing',
        details: `Live: ${hasLiveCheck ? '✓' : '✗'}, Ready: ${hasReadyCheck ? '✓' : '✗'}`
      });

    } catch (error) {
      this.results.push({
        name: 'Health check endpoints',
        status: 'warning',
        message: 'Cannot validate health endpoints',
        details: 'Health endpoints may not be properly configured'
      });
    }
  }

  private displayResults(): void {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    Logger.info('\n' + '='.repeat(60));
    Logger.info('[DEPLOYMENT-CHECK] DEPLOYMENT READINESS REPORT');
    Logger.info('='.repeat(60));

    // Group results by status
    const failedChecks = this.results.filter(r => r.status === 'fail');
    const warningChecks = this.results.filter(r => r.status === 'warning');
    const passedChecks = this.results.filter(r => r.status === 'pass');

    if (failedChecks.length > 0) {
      Logger.error('\n❌ FAILED CHECKS:');
      failedChecks.forEach(check => {
        Logger.error(`  • ${check.name}: ${check.message}`);
        if (check.details) Logger.error(`    ${check.details}`);
      });
    }

    if (warningChecks.length > 0) {
      Logger.warn('\n⚠️  WARNINGS:');
      warningChecks.forEach(check => {
        Logger.warn(`  • ${check.name}: ${check.message}`);
        if (check.details) Logger.warn(`    ${check.details}`);
      });
    }

    if (passedChecks.length > 0) {
      Logger.info('\n✅ PASSED CHECKS:');
      passedChecks.forEach(check => {
        Logger.info(`  • ${check.name}: ${check.message}`);
      });
    }

    Logger.info('\n' + '='.repeat(60));
    Logger.info(`[DEPLOYMENT-CHECK] SUMMARY: ${passed} passed, ${warnings} warnings, ${failed} failed`);
    
    if (failed === 0) {
      Logger.info('🚀 Deployment readiness: READY FOR DEPLOYMENT');
    } else {
      Logger.error('❌ Deployment readiness: FIX REQUIRED BEFORE DEPLOYMENT');
    }
    Logger.info('='.repeat(60) + '\n');
  }
}

// Run the deployment check if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new DeploymentChecker();
  checker.runAllChecks();
}

export { DeploymentChecker };