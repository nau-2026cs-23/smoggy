import postgres from 'postgres';
import 'dotenv/config';

async function detailedDbTest() {
  console.log('=== Detailed Database Test ===\n');

  const connectionString = process.env.DATABASE_URL;
  console.log('1. Connection string:', connectionString);

  // Parse the connection string to extract components
  try {
    const url = new URL(connectionString);
    console.log('\n2. Parsed components:');
    console.log('   Protocol:', url.protocol);
    console.log('   Username:', url.username);
    console.log('   Hostname:', url.hostname);
    console.log('   Port:', url.port);
    console.log('   Database:', url.pathname);
  } catch (err) {
    console.error('   Failed to parse connection string:', err.message);
  }

  // Test connection with direct query
  console.log('\n3. Testing database connection...');
  const sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    connect_timeout: 10,
    max: 1,
  });

  try {
    // Test basic connection
    console.log('   Attempting to connect...');
    const result = await sql`SELECT version()`;
    console.log('   ✓ Connected! PostgreSQL version:', result[0].version.split(',')[0]);

    // Test pgcrypto
    console.log('\n4. Testing pgcrypto extension...');
    try {
      const uuid = await sql`SELECT gen_random_uuid() as uuid`;
      console.log('   ✓ pgcrypto works! Generated UUID:', uuid[0].uuid);
    } catch (pgErr) {
      console.error('   ✗ pgcrypto error:', pgErr.message);
    }

    // Test Users table
    console.log('\n5. Testing Users table...');
    try {
      const users = await sql`SELECT * FROM users LIMIT 1`;
      console.log('   ✓ Users table exists! Found', users.length, 'rows');
    } catch (tblErr) {
      console.error('   ✗ Users table error:', tblErr.message);
    }

    // Test if we can insert
    console.log('\n6. Testing INSERT permission...');
    try {
      const testInsert = await sql`INSERT INTO users (id, name, email, password, role) VALUES (gen_random_uuid(), 'Test', 'test@test.com', 'test', 'user') RETURNING id`;
      console.log('   ✓ Insert works! Inserted ID:', testInsert[0].id);

      // Clean up test insert
      await sql`DELETE FROM users WHERE email = 'test@test.com'`;
      console.log('   ✓ Cleanup successful');
    } catch (insErr) {
      console.error('   ✗ Insert error:', insErr.message);
    }

  } catch (connErr) {
    console.error('   ✗ Connection failed:', connErr.message);
    console.error('   Error code:', connErr.code);
    console.error('   Error syscall:', connErr.syscall);
  }

  await sql.end();
  console.log('\n=== Test Complete ===');
}

detailedDbTest();