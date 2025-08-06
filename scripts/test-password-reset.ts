import { UserService } from '../server/services/user.service';

async function test() {
  const userService = new UserService();
  
  console.log('Testing user lookup...');
  
  const emails = [
    'cleanandflipyt@gmail.com',
    'test3@gmail.com',
    'CLEANANDFLIPYT@GMAIL.COM',  // Test case sensitivity
  ];
  
  for (const email of emails) {
    console.log(`\nTesting: "${email}"`);
    const user = await userService.findUserByEmail(email);
    
    if (user) {
      console.log(`✅ FOUND: ${user.email} (ID: ${user.id})`);
    } else {
      console.log(`❌ NOT FOUND`);
    }
  }
  
  process.exit(0);
}

test();