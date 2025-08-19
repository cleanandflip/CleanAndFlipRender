const https = require('https');
const dotenv = require('dotenv');

dotenv.config();

const NEON_API_KEY = process.env.NEON_API_KEY;
const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;

async function makeNeonRequest(path, method = 'GET', body = null) {
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

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function reorganizeAndDelete() {
  console.log('🚀 Reorganizing branch structure and deleting old branch...');
  console.log(`Project ID: ${NEON_PROJECT_ID}\n`);

  try {
    // Step 1: Get current branch structure
    console.log('📋 Step 1: Getting current branch structure...');
    const branchesData = await makeNeonRequest(`/projects/${NEON_PROJECT_ID}/branches`);
    const branches = branchesData.branches;
    
    const productionBranch = branches.find(b => b.name === 'production');
    const developmentBranch = branches.find(b => b.name === 'development');
    const oldBranch = branches.find(b => b.name === 'development_old_2025-08-18 17:41:21 -04:00');

    if (!productionBranch || !developmentBranch || !oldBranch) {
      console.log('❌ Could not find required branches');
      return;
    }

    console.log(`✅ Found all branches:`);
    console.log(`   - production: ${productionBranch.id}`);
    console.log(`   - development: ${developmentBranch.id}`);
    console.log(`   - old branch: ${oldBranch.id}`);

    // Step 2: Move development branch to be child of production
    console.log('\n🔄 Step 2: Moving development branch to be child of production...');
    
    // Note: Neon API might not support changing parent directly
    // We'll need to check if this is possible or if we need a different approach
    try {
      await makeNeonRequest(`/projects/${NEON_PROJECT_ID}/branches/${developmentBranch.id}`, 'PATCH', {
        parent_id: productionBranch.id
      });
      console.log('✅ Successfully moved development branch');
    } catch (error) {
      if (error.message.includes('422') || error.message.includes('400')) {
        console.log('ℹ️  Cannot change parent directly - this is expected with Neon');
        console.log('ℹ️  The old branch will need to remain as parent, but that\'s okay');
        console.log('ℹ️  Skipping deletion to maintain branch integrity');
        return;
      } else {
        throw error;
      }
    }

    // Step 3: Delete the old branch (only if parent change succeeded)
    console.log('\n🗑️  Step 3: Deleting old branch...');
    await makeNeonRequest(`/projects/${NEON_PROJECT_ID}/branches/${oldBranch.id}`, 'DELETE');
    console.log('✅ Successfully deleted old branch');

    // Step 4: Verify final structure
    console.log('\n🔍 Step 4: Verifying final branch structure...');
    const finalBranchesData = await makeNeonRequest(`/projects/${NEON_PROJECT_ID}/branches`);
    const finalBranches = finalBranchesData.branches;
    
    console.log('📋 Final branch structure:');
    finalBranches.forEach(branch => {
      const isPrimary = branch.primary ? ' (PRIMARY)' : '';
      const isProtected = branch.protected ? ' (PROTECTED)' : '';
      const parent = branch.parent_id ? 
        ` [parent: ${finalBranches.find(b => b.id === branch.parent_id)?.name || 'unknown'}]` : 
        ' [root]';
      console.log(`   • ${branch.name}${isPrimary}${isProtected}${parent}`);
    });

    const totalSize = finalBranches.reduce((sum, branch) => sum + (branch.logical_size || 0), 0);
    console.log(`\n💾 Total database size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('🎉 Branch cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('cannot delete branch that has children')) {
      console.log('\n💡 The old branch cannot be deleted because it has protected children.');
      console.log('💡 This is normal - Neon prevents deletion of branches with protected children.');
      console.log('💡 Your branch structure is still clean and functional.');
      console.log('💡 The old branch (31MB) will remain but is not actively used.');
    }
  }
}

reorganizeAndDelete();