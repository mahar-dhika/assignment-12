require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'workshop_db',
  password: process.env.DB_PASSWORD || 'admin123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('render.com') ? { rejectUnauthorized: false } : false,
});

async function getSampleEmails() {
  const client = await pool.connect();
  try {
    // Get first 5 emails
    const result = await client.query('SELECT email FROM auth LIMIT 5');
    console.log('Sample emails in database:');
    result.rows.forEach(row => console.log(row.email));
    
    // Check if user.1@example.com exists
    const specificUser = await client.query('SELECT email FROM auth WHERE email = $1', ['user.1@example.com']);
    console.log('\nuser.1@example.com exists:', specificUser.rows.length > 0);
    
    // Get total count
    const count = await client.query('SELECT COUNT(*) FROM auth');
    console.log('Total auth records:', count.rows[0].count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

getSampleEmails();
