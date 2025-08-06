import { SimplePasswordReset } from '../server/services/simple-password-reset';

async function test() {
  console.log('🔥 Testing Simple Password Reset System...\n');
  
  const pr = new SimplePasswordReset();
  
  try {
    // Test 1: Find user
    console.log('📝 Test 1: Looking up user...');
    const user = await pr.findUser('cleanandflipyt@gmail.com');
    if (user) {
      console.log('✅ User found:', user.email);
      console.log('   ID:', user.id);
      console.log('   Name:', user.first_name, user.last_name);
    } else {
      console.log('❌ User not found');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Request reset (if user found)
    if (user) {
      console.log('📝 Test 2: Requesting password reset...');
      const result = await pr.requestReset('cleanandflipyt@gmail.com');
      console.log('Reset result:', result);
      
      if (result.success) {
        console.log('✅ Password reset request completed');
      } else {
        console.log('❌ Password reset failed');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🎯 Test complete!');
  process.exit(0);
}

test();