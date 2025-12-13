import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5433/adstxt_v2',
});

async function run() {
  await client.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'raw_sellers_files';
    `);
    console.log('Columns in raw_sellers_files:', res.rows);

    const rows = await client.query(
      'SELECT id, domain, http_status, etag, fetched_at FROM raw_sellers_files ORDER BY fetched_at DESC LIMIT 5',
    );
    console.log('Recent 5 rows:', rows.rows);

    // Check if any row has http_status
    const hasStatus = rows.rows.some((r) => r.http_status !== null);
    console.log('Has http_status data:', hasStatus);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
