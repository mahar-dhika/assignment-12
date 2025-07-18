require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

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

async function testPasswordMethods() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT email, password FROM auth WHERE email = $1', ['oscar05224@yahoo.com']);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('User found:', user.email);
      console.log('Stored password hash:', user.password);
      
      const testPassword = 'User123@';
      
      // Test SHA256 method (used in seed)
      const sha256Hash = hashPassword(testPassword);
      console.log('SHA256 hash of User123@:', sha256Hash);
      console.log('SHA256 match:', user.password === sha256Hash);
      
      // Test bcrypt method (used in API)
      try {
        const bcryptMatch = await bcrypt.compare(testPassword, user.password);
        console.log('Bcrypt match:', bcryptMatch);
      } catch (e) {
        console.log('Bcrypt error (expected):', e.message);
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

testPasswordMethods();
