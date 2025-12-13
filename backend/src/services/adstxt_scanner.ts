import { query } from '../db/client';
import { parseAdsTxtContent } from '../lib/adstxt/validator';
import client from '../lib/http';

export interface ScanResult {
  id: string;
  domain: string;
  url: string;
  content: string;
  scanned_at: Date;
  status_code: number;
  error_message?: string;
  records_count: number;
  valid_count: number;
  warning_count: number; // Note: Current DB schema might not have this, checking previous step
}

export class AdsTxtScanner {
  /**
   * Fetch, parse (for stats), and save ads.txt
   */
  async scanAndSave(domain: string): Promise<ScanResult> {
    let content = '';
    let finalUrl = '';
    let statusCode = 0;
    let errorMessage = '';

    try {
      // 1. Fetch
      try {
        finalUrl = `https://${domain}/ads.txt`;
        const res = await client.get(finalUrl, { maxRedirects: 5 });
        content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        statusCode = res.status;
      } catch (e: any) {
        // Fallback to HTTP
        try {
          finalUrl = `http://${domain}/ads.txt`;
          const res = await client.get(finalUrl, { maxRedirects: 5 });
          content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          statusCode = res.status;
        } catch (inner: any) {
          statusCode = inner.response?.status || 0;
          errorMessage = inner.message;
          throw inner;
        }
      }

      // 2. Simple Parse for Stats
      const parsed = parseAdsTxtContent(content, domain);
      const recordsCount = parsed.length;
      const validCount = parsed.filter((r) => r.is_valid).length;

      // 3. Save Success
      const res = await query(
        `INSERT INTO ads_txt_scans 
         (domain, url, content, status_code, records_count, valid_count, warning_count, scanned_at)
         VALUES ($1, $2, $3, $4, $5, $6, 0, NOW())
         RETURNING *`,
        [domain, finalUrl, content, statusCode, recordsCount, validCount],
      );
      return res.rows[0];
    } catch (err: any) {
      // Save failed scan record
      const failRes = await query(
        `INSERT INTO ads_txt_scans 
          (domain, url, content, status_code, error_message, records_count, valid_count, warning_count, scanned_at)
          VALUES ($1, $2, $3, $4, $5, 0, 0, 0, NOW())
          RETURNING *`,
        [domain, finalUrl || `http://${domain}/ads.txt`, '', statusCode, errorMessage || err.message],
      );
      return failRes.rows[0];
    }
  }

  async getLatestScan(domain: string): Promise<ScanResult | null> {
    const res = await query(`SELECT * FROM ads_txt_scans WHERE domain = $1 ORDER BY scanned_at DESC LIMIT 1`, [domain]);
    return res.rows[0] || null;
  }

  async getHistory(domain: string, limit = 10): Promise<ScanResult[]> {
    const res = await query(
      `SELECT id, domain, url, scanned_at, status_code, error_message, records_count, valid_count, warning_count
         FROM ads_txt_scans 
         WHERE domain = $1 
         ORDER BY scanned_at DESC 
         LIMIT $2`,
      [domain, limit],
    );
    return res.rows;
  }
}
