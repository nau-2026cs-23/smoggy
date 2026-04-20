import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Database connection
    const sql = postgres(process.env.DATABASE_URL, {
      ssl: { rejectUnauthorized: false },
    });
    
    const db = drizzle(sql);
    
    console.log('Database connected successfully');
    
    // Test pgcrypto extension
    console.log('Testing pgcrypto extension...');
    try {
      const result = await sql`SELECT gen_random_uuid() as uuid`;
      console.log('pgcrypto extension is enabled:', result[0].uuid);
    } catch (error) {
      console.error('pgcrypto extension error:', error);
    }
    
    // Test Users table
    console.log('Testing Users table...');
    try {
      const result = await sql`SELECT * FROM Users LIMIT 1`;
      console.log('Users table exists, rows found:', result.length);
    } catch (error) {
      console.error('Users table error:', error);
    }
    
    await sql.end();
    console.log('Test completed');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatabase();