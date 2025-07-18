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

async function testLogin() {
  const client = await pool.connect();
  try {
    // Check auth table
    console.log('=== AUTH TABLE SAMPLE ===');
    const authResult = await client.query('SELECT id, email FROM auth LIMIT 5');
    console.log(authResult.rows);
    
    // Check if we have users with all required joins
    console.log('\n=== FULL JOIN TEST ===');
    const fullQuery = `
      SELECT 
        a.id as auth_id,
        a.email,
        u.id as user_id,
        u.username,
        u.full_name,
        ur.role,
        ud.division_name
      FROM auth a
      INNER JOIN users u ON a.id = u.auth_id
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN user_divisions ud ON u.id = ud.user_id
      LIMIT 3
    `;
    
    const fullResult = await client.query(fullQuery);
    console.log(fullResult.rows);
    
    // Test specific email
    if (authResult.rows.length > 0) {
      const testEmail = authResult.rows[0].email;
      console.log(`\n=== TESTING EMAIL: ${testEmail} ===`);
      
      const testResult = await client.query(fullQuery + ' WHERE a.email = $1', [testEmail]);
      console.log('Result for test email:');
      console.log(testResult.rows);
    }
    
  } catch (error) {
    console.error('Query error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

testLogin();
