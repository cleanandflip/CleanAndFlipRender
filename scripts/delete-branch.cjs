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

async function deleteBranch() {
  console.log('🚀 Finding and deleting old branch...');
  console.log(`Project ID: ${NEON_PROJECT_ID}`);
  console.log(`Target Branch: ${TARGET_BRANCH}\n`);

  try {
    // Get all branches
    console.log('🔍 Fetching branches...');
    const branchesData = await makeNeonRequest(`/projects/${NEON_PROJECT_ID}/branches`);
    
    // Find the target branch
    const targetBranch = branchesData.branches.find(branch => 
      branch.name === TARGET_BRANCH
    );

    if (!targetBranch) {
      console.log(`❌ Branch "${TARGET_BRANCH}" not found.`);
      return;
    }

    if (targetBranch.primary) {
      console.log(`❌ Cannot delete primary branch: ${targetBranch.name}`);
      return;
    }

    if (targetBranch.protected) {
      console.log(`❌ Cannot delete protected branch: ${targetBranch.name}`);
      return;
    }

    // Delete the branch
    console.log(`🗑️  Deleting branch: ${targetBranch.name} (${targetBranch.id})`);
    await makeNeonRequest(`/projects/${NEON_PROJECT_ID}/branches/${targetBranch.id}`, 'DELETE');
    
    console.log(`✅ Successfully deleted branch: ${targetBranch.name}`);
    console.log('🎉 Branch cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteBranch();