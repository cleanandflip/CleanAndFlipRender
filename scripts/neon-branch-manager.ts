#!/usr/bin/env tsx
/**
 * Neon Database Branch Management Script
 * Manages Neon database branches via API
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const NEON_API_KEY = process.env.NEON_API_KEY;
const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;

if (!NEON_API_KEY || !NEON_PROJECT_ID) {
  console.error('❌ Missing required environment variables: NEON_API_KEY, NEON_PROJECT_ID');
  process.exit(1);
}

const NEON_API_BASE = 'https://console.neon.tech/api/v2';

interface NeonBranch {
  id: string;
  name: string;
  parent_id?: string;
  parent_lsn?: string;
  parent_timestamp?: string;
  created_at: string;
  updated_at: string;
  current_state: string;
  pending_state?: string;
  logical_size?: number;
  physical_size?: number;
  cpu_used_sec?: number;
  primary: boolean;
  protected?: boolean;
}

interface NeonBranchesResponse {
  branches: NeonBranch[];
}

async function makeNeonApiCall<T>(endpoint: string, method = 'GET', body?: any): Promise<T> {
  const url = `${NEON_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${NEON_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Neon API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

async function listBranches(): Promise<NeonBranch[]> {
  console.log('🔍 Fetching branches from Neon...');
  
  const data = await makeNeonApiCall<NeonBranchesResponse>(`/projects/${NEON_PROJECT_ID}/branches`);
  return data.branches;
}

async function deleteBranch(branchId: string, branchName: string): Promise<void> {
  console.log(`🗑️  Deleting branch: ${branchName} (${branchId})`);
  
  await makeNeonApiCall(`/projects/${NEON_PROJECT_ID}/branches/${branchId}`, 'DELETE');
  console.log(`✅ Successfully deleted branch: ${branchName}`);
}

async function findAndDeleteOldBranch(targetBranchName: string): Promise<void> {
  try {
    const branches = await listBranches();
    
    console.log(`\n📋 Found ${branches.length} branches:`);
    branches.forEach((branch, index) => {
      const isPrimary = branch.primary ? ' (PRIMARY)' : '';
      const isProtected = branch.protected ? ' (PROTECTED)' : '';
      const size = branch.logical_size ? ` - ${(branch.logical_size / 1024 / 1024).toFixed(2)} MB` : '';
      
      console.log(`${index + 1}. ${branch.name}${isPrimary}${isProtected}${size}`);
      console.log(`   ID: ${branch.id}`);
      console.log(`   Created: ${new Date(branch.created_at).toLocaleString()}`);
      console.log('');
    });

    // Find the target branch
    const targetBranch = branches.find(branch => 
      branch.name === targetBranchName || 
      branch.name.includes(targetBranchName.replace(/\s+/g, ''))
    );

    if (!targetBranch) {
      console.log(`❌ Branch "${targetBranchName}" not found.`);
      console.log('Available branches:');
      branches.forEach(branch => console.log(`  - ${branch.name}`));
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
    await deleteBranch(targetBranch.id, targetBranch.name);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const targetBranch = 'hdevelopment_old_2025-08-18 17:41:21 -04:00';
  
  console.log('🚀 Neon Database Branch Manager');
  console.log('================================');
  console.log(`Project ID: ${NEON_PROJECT_ID}`);
  console.log(`Target Branch: ${targetBranch}\n`);

  await findAndDeleteOldBranch(targetBranch);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { listBranches, deleteBranch, findAndDeleteOldBranch };