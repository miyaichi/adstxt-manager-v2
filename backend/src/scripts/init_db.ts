
import fs from 'fs';
import path from 'path';
import { pool } from '../db/client';

async function runInitSql() {
  const sqlPath = path.join(__dirname, '../db/init.sql');
  console.log(`Reading SQL from ${sqlPath}...`);

  try {
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    console.log('Executing init.sql...');

    // Split by statement if needed, or execute as one block
    // pg driver supports multiple statements in one query call usually.
    await pool.query(sqlContent);

    console.log('Successfully executed init.sql');
  } catch (err: any) {
    console.error('Failed to execute init.sql:', err.message);
  } finally {
    await pool.end();
  }
}

runInitSql();
