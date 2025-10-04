import { PGlite } from '@electric-sql/pglite';

const db = new PGlite('./db');

(async () => {
  try {
    // Check if users table exists
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables:', result.rows);
    
    // Try to describe users table
    const usersCols = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Users table columns:', usersCols.rows);
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
})();
