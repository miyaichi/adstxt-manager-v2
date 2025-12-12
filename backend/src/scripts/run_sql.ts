import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

// Load env from root of backend (v2/backend/.env)
// Since this script is in v2/backend/src/scripts, we go up 2 levels
config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error('Please provide a sql file path');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const sql = fs.readFileSync(file, 'utf-8');
    await client.query(sql);
    console.log(`Executed ${file} successfully`);
  } catch (e) {
    console.error('Error executing SQL:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
