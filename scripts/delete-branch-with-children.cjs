const https = require('https');
const dotenv = require('dotenv');

dotenv.config();

const NEON_API_KEY = process.env.NEON_API_KEY;
const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;
const TARGET_BRANCH = 'development_old_2025-08-18 17:41:21 -04:00';

async function makeNeonRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'console.neon.tech',
      port: 443,
      path: `/api/v2${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch (e) {
            resolve({});
          }
        } else {
          reject(new Error(`API error: ${res.statusCode} ${res.statusMessage} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function analyzeAndDeleteBranch() {
  console.log('🚀 Analyzing branch dependencies...');
  console.log(`Project ID: ${NEON_PROJECT_ID}`);
  console.log(`Target Branch: ${TARGET_BRANCH}\n`);

  try {
    // Get all branches
    console.log('🔍 Fetching branches...');
    const branchesData = await makeNeonRequest(`/projects/${NEON_PROJECT_ID}/branches`);
    const branches = branchesData.branches;
    
    console.log('📋 Current branch structure:');
    branches.forEach(branch => {
      const isPrimary = branch.primary ? ' (PRIMARY)' : '';
      const isProtected = branch.protected ? ' (PROTECTED)' : '';
      const parent = branch.parent_id ? ` [parent: ${branches.find(b => b.id === branch.parent_id)?.name || 'unknown'}]` : ' [root]';
      console.log(`  • ${branch.name}${isPrimary}${isProtected}${parent}`);
    });

    // Find the target branch
    const targetBranch = branches.find(branch => branch.name === TARGET_BRANCH);

    if (!targetBranch) {
      console.log(`\n❌ Branch "${TARGET_BRANCH}" not found.`);
      return;
    }

    // Find children branches
    const children = branches.filter(branch => branch.parent_id === targetBranch.id);
    
    console.log(`\n🔍 Branch "${TARGET_BRANCH}" analysis:`);
    console.log(`  ID: ${targetBranch.id}`);
    console.log(`  Children: ${children.length}`);
    
    if (children.length > 0) {
      console.log(`  Child branches:`);
      children.forEach(child => {
        console.log(`    - ${child.name} (${child.id})`);
      });

      console.log(`\n⚠️  Cannot delete branch with children. Options:`);
      console.log(`  1. Delete child branches first (if they're safe to delete)`);
      console.log(`  2. Move children to a different parent branch`);
      console.log(`  3. Keep the old branch (it's using ${(targetBranch.logical_size / 1024 / 1024).toFixed(2)} MB)`);
      
      // Check if children are safe to delete (non-primary, non-protected)
      const safeBranches = children.filter(child => !child.primary && !child.protected);
      const unsafeBranches = children.filter(child => child.primary || child.protected);
      
      if (safeBranches.length > 0 && unsafeBranches.length === 0) {
        console.log(`\n✅ All child branches appear safe to delete. Would you like to proceed?`);
        console.log(`   This will delete:`);
        children.forEach(child => {
          console.log(`   - ${child.name} (${(child.logical_size / 1024 / 1024).toFixed(2)} MB)`);
        });
        console.log(`   - ${TARGET_BRANCH} (${(targetBranch.logical_size / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`\n   Total space recovered: ${((children.reduce((sum, child) => sum + child.logical_size, 0) + targetBranch.logical_size) / 1024 / 1024).toFixed(2)} MB`);
        
        // For now, just show what would be deleted. User can confirm if they want to proceed.
        console.log(`\n📝 To proceed with deletion, the script would:`);
        children.forEach((child, index) => {
          console.log(`   ${index + 1}. Delete child branch: ${child.name}`);
        });
        console.log(`   ${children.length + 1}. Delete parent branch: ${TARGET_BRANCH}`);
        
      } else {
        console.log(`\n❌ Cannot safely delete - has protected or primary children:`);
        unsafeBranches.forEach(child => {
          const flags = [child.primary && 'PRIMARY', child.protected && 'PROTECTED'].filter(Boolean).join(', ');
          console.log(`   - ${child.name} (${flags})`);
        });
      }
      
    } else {
      console.log(`\n🗑️  Branch has no children, attempting deletion...`);
      
      if (targetBranch.primary) {
        console.log(`❌ Cannot delete primary branch: ${targetBranch.name}`);
        return;
      }

      if (targetBranch.protected) {
        console.log(`❌ Cannot delete protected branch: ${targetBranch.name}`);
        return;
      }

      await makeNeonRequest(`/projects/${NEON_PROJECT_ID}/branches/${targetBranch.id}`, 'DELETE');
      console.log(`✅ Successfully deleted branch: ${targetBranch.name}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeAndDeleteBranch();