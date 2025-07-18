require('dotenv').config({ path: '.env.local' });

async function testLogin() {
  try {
    // Test API endpoint
    const response = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'oscar05224@yahoo.com',
        password: 'User123@'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
