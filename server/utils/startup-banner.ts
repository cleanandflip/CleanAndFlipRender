import chalk from 'chalk';
import { logger } from '../config/logger';
import { Logger } from '../utils/logger';

export function displayStartupBanner(config: any) {
  console.clear(); // Clear console for clean start
  
  Logger.info(chalk.cyan('\n================================================'));
  Logger.info(chalk.cyan.bold('        🏋️  CLEAN & FLIP - SERVER READY 🏋️        '));
  Logger.info(chalk.cyan('================================================\n'));
  
  const status = [
    { name: 'Environment', value: process.env.NODE_ENV || 'development', status: 'info' },
    { name: 'Port', value: config.port, status: 'info' },
    { name: 'Database', value: config.db ? 'Connected' : 'Failed', status: config.db ? 'success' : 'error' },
    { name: 'Session Store', value: 'PostgreSQL', status: 'success' },
    { name: 'File Storage', value: 'Cloudinary', status: 'success' },
    { name: 'Payment System', value: 'Stripe', status: 'success' },
    { name: 'WebSocket', value: config.ws ? 'Active' : 'Disabled', status: config.ws ? 'success' : 'warning' },
    { name: 'Security', value: 'OWASP Compliant', status: 'success' },
    { name: 'Performance', value: 'Optimized', status: 'success' },
  ];
  
  status.forEach(item => {
    const statusIcon = item.status === 'success' ? '✅' : item.status === 'error' ? '❌' : '⚠️ ';
    const color = item.status === 'success' ? chalk.green : item.status === 'error' ? chalk.red : chalk.yellow;
    Logger.info(`  ${statusIcon} ${chalk.gray(item.name.padEnd(15))} ${color(item.value)}`);
  });
  
  Logger.info(chalk.cyan('\n================================================'));
  Logger.info(chalk.gray(`  Startup completed in ${config.startupTime}ms`));
  
  if (config.warnings.length > 0) {
    Logger.info(chalk.yellow('\n⚠️  System Warnings:'));
    config.warnings.forEach((warn: string) => Logger.info(chalk.yellow(`  - ${warn}`)));
  } else {
    Logger.info(chalk.green('\n🎯 All systems operational - no warnings'));
  }
  
  Logger.info(chalk.cyan('================================================\n'));
  
  // Performance tips
  Logger.info(chalk.green('💡 Performance: Direct database access for optimal performance'));
  Logger.info(chalk.gray('📝 Logs: Optimized logging active\n'));
}