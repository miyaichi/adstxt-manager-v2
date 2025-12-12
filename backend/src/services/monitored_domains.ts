import { query } from '../db/client';

export class MonitoredDomainsService {
  async addDomain(domain: string) {
    const res = await query(
      `INSERT INTO monitored_domains (domain) 
       VALUES ($1) 
       ON CONFLICT (domain) DO UPDATE SET is_active = true 
       RETURNING *`,
      [domain],
    );
    return res.rows[0];
  }

  async listDomains(limit = 100, offset = 0) {
    const res = await query(`SELECT * FROM monitored_domains ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [
      limit,
      offset,
    ]);
    return res.rows;
  }

  async removeDomain(domain: string) {
    // Soft delete or hard delete? Let's do hard update to inactive for now, or delete.
    // User might want to stop monitoring.
    // "Remove" usually implies delete. But disabling is also useful.
    // Let's implement delete for now as per "remove".
    await query(`DELETE FROM monitored_domains WHERE domain = $1`, [domain]);
  }

  async getDueDomains() {
    // Find domains where last_scanned_at is null OR older than interval
    // Interval is in minutes.
    const res = await query(
      `SELECT domain, scan_interval_minutes 
       FROM monitored_domains 
       WHERE is_active = true 
       AND (
         last_scanned_at IS NULL 
         OR 
         last_scanned_at < NOW() - (scan_interval_minutes || ' minutes')::interval
       )
       LIMIT 50`, // Process in batches
    );
    return res.rows as { domain: string; scan_interval_minutes: number }[];
  }

  async updateLastScanned(domain: string) {
    await query(`UPDATE monitored_domains SET last_scanned_at = NOW(), updated_at = NOW() WHERE domain = $1`, [domain]);
  }
}
