require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'workshop_db', 
  password: process.env.DB_PASSWORD || 'admin123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('render.com') ? { rejectUnauthorized: false } : false,
});

// Same hash function as in seed script
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function checkPassword() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT email, password FROM auth WHERE email = $1', ['oscar05224@yahoo.com']);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('User found:', user.email);
      console.log('Stored password hash:', user.password);
      
      const testPassword = 'Password123';
      const hashedTestPassword = hashPassword(testPassword);
      console.log('Test password hash:', hashedTestPassword);
      console.log('Password match:', user.password === hashedTestPassword);
      
      // Test other common passwords
      const commonPasswords = ['password', 'admin123', 'Password123', 'test123', 'user123'];
      for (const pwd of commonPasswords) {
        const hash = hashPassword(pwd);
        if (user.password === hash) {
          console.log(`✅ Correct password is: ${pwd}`);
        }
      }
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPassword();
