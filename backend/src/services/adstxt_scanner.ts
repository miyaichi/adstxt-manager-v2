import axios from 'axios';
import { query } from '../db/client';
import { parseAdsTxtContent } from '../lib/adstxt/validator';

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
        const res = await axios.get(finalUrl, { timeout: 10000, maxRedirects: 5 });
        content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        statusCode = res.status;
      } catch (e: any) {
        // Fallback to HTTP
        try {
          finalUrl = `http://${domain}/ads.txt`;
          const res = await axios.get(finalUrl, { timeout: 10000, maxRedirects: 5 });
          content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          statusCode = res.status;
        } catch (inner: any) {
          statusCode = inner.response?.status || 0;
          errorMessage = inner.message;
          // Throw if both failed, but we might want to save the failure record
          throw inner;
        }
      }
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

    // 2. Simple Parse for Stats (No cross-check here, just basic syntax validity stats)
    // Cross-check depends on the VIEWING context (which sellers.json to check against).
    // For storing stats in DB, we just count parsable records.
    const parsed = parseAdsTxtContent(content, domain);
    const recordsCount = parsed.length;
    // Note: without cross-check, 'is_valid' is syntax check only (missing fields, invalid chars)
    // 'has_warning' usually comes from cross-check, so it will be count of syntax warnings here
    const validCount = parsed.filter((r) => r.is_valid).length;

    // 3. Save
    const res = await query(
      `INSERT INTO ads_txt_scans 
         (domain, url, content, status_code, records_count, valid_count, warning_count, scanned_at)
         VALUES ($1, $2, $3, $4, $5, $6, 0, NOW()) -- warning_count 0 for now as it requires cross-check
         RETURNING *`,
      [domain, finalUrl, content, statusCode, recordsCount, validCount],
    );

    return res.rows[0];
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
