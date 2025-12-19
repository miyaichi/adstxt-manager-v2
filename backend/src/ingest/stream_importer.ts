import { PoolClient } from 'pg';
import { from as copyFrom } from 'pg-copy-streams';
import { pool } from '../db/client';
import httpClient from '../lib/http';

interface ImportOptions {
  domain: string;
  url: string;
}

export class StreamImporter {
  // Removed internal pool management to use singleton

  async importSellersJson(options: ImportOptions) {
    const client = await pool.connect();
    console.log(`Starting import for ${options.domain} from ${options.url}`);

    try {
      // 1. Fetch Full Content (In-Memory)
      let response;
      let usedUrl = options.url;
      const maxRetries = 1;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          response = await httpClient({
            method: 'get',
            url: usedUrl,
            responseType: 'arraybuffer',
            validateStatus: () => true,
            'axios-retry': { retries: 0 },
          } as any);

          if (response.status === 404 && !options.domain.startsWith('www.') && attempt === 0) {
            console.warn(`404 for ${usedUrl}, retrying with www.${options.domain}`);
            usedUrl = `https://www.${options.domain}/sellers.json`;
            continue;
          }

          if (response.status === 429 && attempt === 0) {
            console.warn(`429 for ${usedUrl}, waiting 2s and retrying...`);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }

          break;
        } catch (netErr: any) {
          if (attempt === maxRetries) {
            console.warn(`Network error fetching sellers.json for ${options.domain}:`, netErr.message);
            await this.createRawFileRecord(client, options.domain, 0, null);
            return;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (!response) return;

      const httpStatus = response.status;
      const etag = response.headers['etag'] || null;

      // 2. Raw File Record
      const rawFileId = await this.createRawFileRecord(
        client,
        options.domain,
        httpStatus,
        typeof etag === 'string' ? etag : null,
      );

      if (httpStatus >= 400) {
        console.warn(`Failed to fetch sellers.json for ${options.domain}. Status: ${httpStatus}`);
        return;
      }

      // 3. Parse JSON in Memory
      let sellersData: any[] = [];
      try {
        const rawBody = response.data.toString('utf-8');
        const json = JSON.parse(rawBody);

        if (json.sellers && Array.isArray(json.sellers)) {
          sellersData = json.sellers;
        } else {
          // Fallback: If root is array
          if (Array.isArray(json)) sellersData = json;
          else throw new Error('Invalid sellers.json structure: "sellers" array not found');
        }

        if (sellersData.length === 0) {
          console.warn(`No sellers found in ${options.domain}`);
        }
      } catch (parseErr: any) {
        console.error(`JSON Parse Error for ${options.domain}: ${parseErr.message}`);
        await client.query('UPDATE raw_sellers_files SET http_status = $1, etag = $2 WHERE id = $3', [
          998, // JSON Parse Error
          `Parse Error: ${parseErr.message}`.substring(0, 255),
          rawFileId,
        ]);
        return;
      }

      // 4. Bulk Insert (COPY)
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM sellers_catalog WHERE domain = $1', [options.domain]);

        const ingestStream = client.query(
          copyFrom(`
            COPY sellers_catalog (
              seller_id, 
              domain, 
              seller_type, 
              name, 
              seller_domain,
              identifiers,
              is_confidential, 
              raw_file_id
            ) FROM STDIN
          `),
        );

        const seenSellerIds = new Set<string>();

        for (const seller of sellersData) {
          try {
            if (!seller) continue;

            const sellerId = (seller.seller_id || '').toString().trim();
            if (!sellerId) continue;

            if (seenSellerIds.has(sellerId)) continue;
            seenSellerIds.add(sellerId);

            const sellerType = (seller.seller_type || 'PUBLISHER').toString().toUpperCase().trim();

            let name = (seller.name || '').toString();
            name = name.replace(/[\t\n\r\0]/g, ' ').trim();

            let isConfidential = false;
            if (seller.is_confidential === 1 || seller.is_confidential === true || seller.is_confidential === '1') {
              isConfidential = true;
            }

            let sellerDomain = (seller.domain || '').toString().trim();
            sellerDomain = sellerDomain.replace(/[\t\n\r\0]/g, '').trim();

            let identifiers = null;
            if (seller.identifiers && Array.isArray(seller.identifiers)) {
              try {
                identifiers = JSON.stringify(seller.identifiers);
                identifiers = identifiers.replace(/\\/g, '\\\\');
              } catch (e) {
                identifiers = null;
              }
            }
            const identifiersStr = identifiers ? identifiers : '\\N';

            const row = `${sellerId}\t${options.domain}\t${sellerType}\t${name}\t${sellerDomain}\t${identifiersStr}\t${isConfidential}\t${rawFileId}\n`;
            ingestStream.write(row);
          } catch (rErr) {
            // Ignore bad row
          }
        }

        ingestStream.end();

        // Wait for stream to finish
        await new Promise((resolve, reject) => {
          ingestStream.on('finish', resolve);
          ingestStream.on('error', reject);
        });

        await client.query('UPDATE raw_sellers_files SET processed_at = NOW() WHERE id = $1', [rawFileId]);
        await client.query('COMMIT');
        console.log(`Import completed for ${options.domain}. Processed ${sellersData.length} records.`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(`Error importing ${options.domain}:`, err);
        await client.query('UPDATE raw_sellers_files SET http_status = $1, etag = $2 WHERE id = $3', [
          999, // Processing Error
          `Error: ${err.message}`.substring(0, 255),
          rawFileId,
        ]);
        throw err;
      }
    } finally {
      client.release();
    }
  }

  private async createRawFileRecord(
    client: PoolClient,
    domain: string,
    httpStatus: number | null,
    etag: string | null,
  ): Promise<string> {
    const res = await client.query(
      `
      INSERT INTO raw_sellers_files (domain, fetched_at, http_status, etag)
      VALUES ($1, NOW(), $2, $3)
      RETURNING id
    `,
      [domain, httpStatus, etag],
    );

    if (res.rows.length > 0) {
      return res.rows[0].id;
    }
    throw new Error('Failed to create raw file record');
  }

  async close() {
    // No-op: Singleton pool is managed globally
  }
}
