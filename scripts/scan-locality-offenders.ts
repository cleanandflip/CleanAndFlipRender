import * as fs from 'fs';
import * as path from 'path';

interface Offender {
  file: string;
  line: number;
  codeContext: string;
  offenderType: string;
  fixSuggestion: string;
}

const bannedModules = [
  'server/lib/locality',
  'server/lib/localityChecker', 
  'server/locality/getLocalityForRequest',
  'server/lib/geo',
  'client/src/hooks/use-cart',
  'server/routes/cart.ts'
];

const bannedPatterns = [
  { pattern: /\bisLocal\(/g, type: 'banned-function', fix: 'Use computeEffectiveAvailability(productMode, userMode)' },
  { pattern: /\bisLocalMiles\(/g, type: 'banned-function', fix: 'Use computeEffectiveAvailability(productMode, userMode)' },
  { pattern: /\/api\/cart(?!\.v2)/g, type: 'legacy-cart-api', fix: 'Use /api/cart.v2 endpoints only' },
  { pattern: /from\s+['"]server\/lib\/locality/g, type: 'banned-import', fix: 'Import from server/services/localityService' },
  { pattern: /from\s+['"]server\/lib\/localityChecker/g, type: 'banned-import', fix: 'Import from server/services/localityService' },
  { pattern: /from\s+['"]client\/src\/hooks\/use-cart/g, type: 'banned-import', fix: 'Import from client/src/hooks/useCart (V2)' }
];

const offenders: Offender[] = [];

function scanFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check banned patterns
    bannedPatterns.forEach(({ pattern, type, fix }) => {
      const matches = line.match(pattern);
      if (matches) {
        offenders.push({
          file: filePath,
          line: lineNumber,
          codeContext: line.trim(),
          offenderType: type,
          fixSuggestion: fix
        });
      }
    });
    
    // Check for LOCAL_ONLY/LOCAL_AND_SHIPPING usage outside allowed files
    const isAllowedFile = [
      'shared/locality.ts',
      'shared/fulfillment.ts', 
      'shared/availability.ts',
      'server/services/localityService.ts'
    ].some(allowed => filePath.includes(allowed));
    
    if (!isAllowedFile) {
      const localOnlyMatch = line.match(/\bLOCAL_ONLY\b/);
      const localAndShippingMatch = line.match(/\bLOCAL_AND_SHIPPING\b/);
      
      if (localOnlyMatch || localAndShippingMatch) {
        // Allow if it's in a comment or part of computeEffectiveAvailability usage
        const isComment = line.trim().startsWith('//') || line.includes('/*');
        const isAllowedUsage = line.includes('computeEffectiveAvailability') || 
                              line.includes('modeFromProduct') ||
                              line.includes('FulfillmentMode');
        
        if (!isComment && !isAllowedUsage) {
          offenders.push({
            file: filePath,
            line: lineNumber,
            codeContext: line.trim(),
            offenderType: 'direct-fulfillment-check',
            fixSuggestion: 'Use computeEffectiveAvailability(productMode, userMode) instead'
          });
        }
      }
    }
  });
}

function scanDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) return;
  
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.git' && item !== 'attached_assets') {
      scanDirectory(fullPath);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      scanFile(fullPath);
    }
  });
}

// Scan key directories
scanDirectory('client/src');
scanDirectory('server');
scanDirectory('shared');

// Generate report
const report = {
  scanDate: new Date().toISOString(),
  totalOffenders: offenders.length,
  offendersByType: {},
  offenders: offenders
};

// Group by type for summary
offenders.forEach(offender => {
  if (!report.offendersByType[offender.offenderType]) {
    report.offendersByType[offender.offenderType] = 0;
  }
  report.offendersByType[offender.offenderType]++;
});

fs.writeFileSync('../audit/locality-ssot-report.json', JSON.stringify(report, null, 2));

console.log(`\n🔍 SSOT Locality Audit Complete`);
console.log(`Found ${offenders.length} violations:`);
Object.entries(report.offendersByType).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count}`);
});
console.log(`\nDetailed report: audit/locality-ssot-report.json\n`);

// Exit with error if violations found
process.exit(offenders.length > 0 ? 1 : 0);