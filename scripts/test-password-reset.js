import { UserService } from './server/utils/user-lookup.js';

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset System');
  
  try {
    // Test 1: Find user by email
    console.log('\n1. Testing user lookup...');
    const user = await UserService.findUserByEmail('cleanandflipyt@gmail.com');
    
    if (user) {
      console.log('✅ User found:', user.id, user.email);
      
      // Test 2: Create password reset token
      console.log('\n2. Testing token creation...');
      const token = await UserService.createPasswordResetToken(
        user.id, 
        '127.0.0.1', 
        'Test User Agent'
      );
      
      if (token) {
        console.log('✅ Token created:', token.substring(0, 16) + '...');
        
        // Test 3: Validate token
        console.log('\n3. Testing token validation...');
        const validation = await UserService.validateResetToken(token);
        
        if (validation) {
          console.log('✅ Token validation passed:', validation);
          
          console.log('\n🎉 All tests passed! Password reset system is working.');
        } else {
          console.log('❌ Token validation failed');
        }
      } else {
        console.log('❌ Token creation failed');
      }
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('🔥 Test failed:', error.message);
    if (error.code) {
      console.error('Database error code:', error.code);
    }
  }
}

testPasswordReset();