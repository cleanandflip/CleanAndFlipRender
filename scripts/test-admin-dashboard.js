#!/usr/bin/env node

// Comprehensive Admin Dashboard Testing Script
const BASE_URL = 'http://localhost:5000';

async function makeAuthenticatedRequest(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`${endpoint}: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function testAllDashboardTabs() {
  console.log('\n📊 COMPREHENSIVE ADMIN DASHBOARD TEST\n');
  console.log('='.repeat(50));
  
  const tests = [
    {
      name: 'Products Tab',
      endpoint: '/api/admin/products',
      tests: [
        { name: 'Get Products', endpoint: '/api/admin/products' },
        { name: 'Search Products', endpoint: '/api/admin/products?search=barbell' },
        { name: 'Filter by Category', endpoint: '/api/admin/products?categoryId=test' },
        { name: 'Sort Products', endpoint: '/api/admin/products?sortBy=name&sortOrder=asc' },
        { name: 'Pagination', endpoint: '/api/admin/products?page=1&limit=10' }
      ]
    },
    {
      name: 'Categories Tab', 
      endpoint: '/api/admin/categories',
      tests: [
        { name: 'Get Categories', endpoint: '/api/admin/categories' },
        { name: 'Sort Categories', endpoint: '/api/admin/categories?sortBy=order&sortOrder=asc' }
      ]
    },
    {
      name: 'Users Tab',
      endpoint: '/api/admin/users', 
      tests: [
        { name: 'Get Users', endpoint: '/api/admin/users' },
        { name: 'Search Users', endpoint: '/api/admin/users?search=dean' },
        { name: 'Filter by Role', endpoint: '/api/admin/users?role=developer' },
        { name: 'Sort Users', endpoint: '/api/admin/users?sortBy=name&sortOrder=asc' }
      ]
    },
    {
      name: 'Analytics Tab',
      endpoint: '/api/admin/analytics',
      tests: [
        { name: 'Get Analytics', endpoint: '/api/admin/analytics' },
        { name: 'Revenue Chart', endpoint: '/api/admin/analytics/revenue-chart' },
        { name: 'Activity Chart', endpoint: '/api/admin/analytics/activity-chart' }
      ]
    },
    {
      name: 'Submissions Tab',
      endpoint: '/api/admin/submissions',
      tests: [
        { name: 'Get Submissions', endpoint: '/api/admin/submissions' },
        { name: 'Filter by Status', endpoint: '/api/admin/submissions?status=pending' },
        { name: 'Search Submissions', endpoint: '/api/admin/submissions?search=test' },
        { name: 'Sort Submissions', endpoint: '/api/admin/submissions?sortBy=date&sortOrder=desc' }
      ]
    },
    {
      name: 'Wishlist Tab',
      endpoint: '/api/admin/wishlist-analytics/detailed',
      tests: [
        { name: 'Get Wishlist Analytics', endpoint: '/api/admin/wishlist-analytics/detailed' },
        { name: 'Wishlist Users', endpoint: '/api/admin/wishlist-analytics/users' },
        { name: 'Top Products', endpoint: '/api/admin/wishlist-analytics/products' }
      ]
    },
    {
      name: 'System Tab',
      endpoint: '/api/admin/system/health',
      tests: [
        { name: 'System Health', endpoint: '/api/admin/system/health' },
        { name: 'Database Status', endpoint: '/api/admin/system/database' },
        { name: 'Performance Metrics', endpoint: '/api/admin/system/performance' }
      ]
    }
  ];

  const results = {
    passed: 0,
    failed: 0,
    details: []
  };

  for (const tab of tests) {
    console.log(`\n🔍 Testing ${tab.name}:`);
    console.log('-'.repeat(30));
    
    for (const test of tab.tests) {
      try {
        const data = await makeAuthenticatedRequest(test.endpoint);
        console.log(`✅ ${test.name}: PASS`);
        
        // Show data preview
        if (data.data && Array.isArray(data.data)) {
          console.log(`   → Found ${data.data.length} items`);
        } else if (data.users && Array.isArray(data.users)) {
          console.log(`   → Found ${data.users.length} users`);
        } else if (data.categories && Array.isArray(data.categories)) {
          console.log(`   → Found ${data.categories.length} categories`);
        } else if (data.totalRevenue !== undefined) {
          console.log(`   → Revenue: $${data.totalRevenue}, Orders: ${data.totalOrders}, Users: ${data.totalUsers}`);
        } else if (data.database) {
          console.log(`   → Database: ${data.database.status}, Cache: ${data.cache?.status || 'N/A'}`);
        }
        
        results.passed++;
        results.details.push({ test: `${tab.name} - ${test.name}`, status: 'PASS' });
        
      } catch (error) {
        console.log(`❌ ${test.name}: FAIL`);
        console.log(`   → Error: ${error.message}`);
        results.failed++;
        results.details.push({ test: `${tab.name} - ${test.name}`, status: 'FAIL', error: error.message });
      }
    }
  }

  // Test Export Functions
  console.log(`\n📤 Testing Export Functions:`);
  console.log('-'.repeat(30));
  
  const exportTests = [
    { name: 'Products CSV Export', endpoint: '/api/admin/products/export?format=csv' },
    { name: 'Users CSV Export', endpoint: '/api/admin/users/export?format=csv' },
    { name: 'Analytics Export', endpoint: '/api/admin/analytics/export?format=csv' }
  ];

  for (const test of exportTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.endpoint}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log(`✅ ${test.name}: AVAILABLE`);
        results.passed++;
      } else {
        console.log(`⚠️  ${test.name}: NOT IMPLEMENTED (${response.status})`);
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`);
      results.failed++;
    }
  }

  // Final Results
  console.log('\n' + '='.repeat(50));
  console.log(`📊 FINAL TEST RESULTS:`);
  console.log('='.repeat(50));
  console.log(`✅ PASSED: ${results.passed}`);
  console.log(`❌ FAILED: ${results.failed}`);
  console.log(`📈 SUCCESS RATE: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed > 0) {
    console.log(`\n⚠️  FAILED TESTS:`);
    results.details.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   • ${r.test}: ${r.error || 'Unknown error'}`);
    });
  }
  
  console.log('\n🎯 All critical admin dashboard endpoints tested!');
  return results;
}

// Test CRUD Operations
async function testCRUDOperations() {
  console.log('\n🔧 Testing CRUD Operations:');
  console.log('-'.repeat(30));
  
  try {
    // Test creating a category
    const newCategory = {
      name: 'Test Category ' + Date.now(),
      slug: 'test-category-' + Date.now(),
      description: 'Test category for automated testing',
      isActive: true
    };
    
    const categoryResult = await makeAuthenticatedRequest('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(newCategory)
    });
    
    console.log('✅ Category Creation: PASS');
    console.log(`   → Created category: ${categoryResult.name}`);
    
    // Test updating the category
    const updateResult = await makeAuthenticatedRequest(`/api/admin/categories/${categoryResult.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: newCategory.name + ' (Updated)' })
    });
    
    console.log('✅ Category Update: PASS');
    
    // Test deleting the category
    await makeAuthenticatedRequest(`/api/admin/categories/${categoryResult.id}`, {
      method: 'DELETE'
    });
    
    console.log('✅ Category Deletion: PASS');
    
  } catch (error) {
    console.log('❌ CRUD Operations: FAIL');
    console.log(`   → Error: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  try {
    console.log('🚀 Starting comprehensive admin dashboard tests...');
    
    const dashboardResults = await testAllDashboardTabs();
    await testCRUDOperations();
    
    console.log('\n✨ Testing completed successfully!');
    return dashboardResults;
    
  } catch (error) {
    console.error('💥 Testing failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runAllTests();
}

module.exports = { testAllDashboardTabs, testCRUDOperations, runAllTests };