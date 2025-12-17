# Improvement Plan

## Feature Roadmap

- [x] **Implement Internationalization (i18n) Support** `Completed`
  - [x] Prepare frontend for i18n (LanguageProvider, translations).
  - [x] Add Japanese translations for all UI elements and messages.
  - [x] Ensure all pages and components use translated strings (including Optimizer).
   - Reference: adstxt-manager (v1) `frontend/src/i18n`.

2. **Publish the Validation Codes / Warning Page**
   - Publish a page to display detailed messages (errors/warnings) from `adstxt-validator`.
   - Content should be derived from the validation keys and messages (see `translations.ts` in v1).
   - **Note**: Need to confirm the exact URL used in v1 (e.g., `/warnings` or `/codes`). If not found, will use `/warnings`.

3. **Insite Analytics**
   - Using OpenSincera's API, retrieve data for the publisher's domain.
   - Collect data such as number of records in ads.txt/app-ads.txt and the ratio of DIRECT/RESELLER.
   - Display insights into how that publisher is perceived externally.
   - Reference: adstxt-manager (v1) `SiteAnalysisPage`.

4. **ads.txt/app-ads.txt Optimizer** `Completed`
   - Optimizer for publishers who have published Ads.txt/app-ads.txt to improve step by step.
   - Steps include:
     1. Removing errors and duplicate records
     2. Setting ownerdomain and removing managerdomain that should not be used
     3. Correcting DIRECT/RESELLER relationship based on sellers.json
     4. Removing entries that do not exist in the corresponding sellers.json

5. **Integrate adstxt-validator package** `Completed`
   - Integrate the `adstxt-validator` package into the project.
   - Replaced internal validator logic in `v2/backend` with the package.

## Technical Improvements & Fixes

Based on Architecture, Code, and DB evaluations.

### High Priority (Critical Fixes & Data Integrity)

- **Fix Scheduler Logic**: ✅ Completed
  - **Issue**: `isJobRunning` flag in `backend/src/jobs/scheduler.ts` is not reset in the `finally` block, causing the cron job to run only once and then skip forever.
  - **Action**: Move `isJobRunning = false` to the `finally` block.

- **Resolve Schema Drift**: ✅ Completed
  - **Issue**: Code expects `file_type` column in `monitored_domains` but it is missing in the DB schema.
  - **Action**: Add `file_type` column (default 'ads.txt') and update Unique constraints to `(domain, file_type)`.

- **Reliable Bulk Import**: ✅ Completed
  - **Issue**: `backend/src/ingest/stream_importer.ts` uses `COPY` for `sellers_catalog` which fails on Primary Key conflicts (`domain`, `seller_id`) if re-imported.
  - **Action**: Implement a staging table strategy or DELETE-then-INSERT / UPSERT logic to handle updates safely.

- **Frontend UI/UX Fixes**: ✅ Completed
  - **Issue**: Default Next.js metadata ("Create Next App"), misaligned headers in Analytics/Status pages, and missing icons.
  - **Action**: Updated `layout.tsx`, centered headers, and added icons to Scan Status tabs.

- **Validator Reliability Fixes**: ✅ Completed
  - **Issue**:
    1. `docomo.ne.jp` fetch failed due to legacy TLS renegotiation.
    2. `facebook.com` app-ads.txt returned HTML (200 OK) causing parser errors.
  - **Action**:
    1. Configured `httpsAgent` in backend to allow legacy server connections.
    2. Added content format validation (HTML check) in `adstxt.ts`.

- **Feature: Direct/Reseller Ratio**: ✅ Completed
  - **Request**: Display the ratio of DIRECT vs RESELLER records in Validator results.
  - **Action**: Added stats calculation in backend and UI display in `ValidatorResult` component.
  
- **Sellers.json Display Improvements**: ✅ Completed
  - **Issue**:
    1. `sellers.json` explorer displayed source domain instead of seller's domain in Domain column.
    2. Optional `identifiers` field was not displayed.
  - **Action**:
    - **DB**: Added `seller_domain` and `identifiers` columns to `sellers_catalog`.
    - **Backend**: Updated ingestion to store these fields and API to return `seller_domain` as primary domain and include `identifiers`.
    - **Frontend**: Updated `SellersResult` to show `seller_domain` (plain text) and a new `Identifiers` column.

### Medium Priority (Performance & Reliability)

- **Database Indexing**: ✅ Completed
  - **Issue**: `sellers_catalog` lacks efficient indexes for search queries using `ILIKE`. `raw_sellers_files` lacks indexes for frequent access patterns.
  - **Action**:
    - Add Trigram indexes (GIN) for `domain` and `seller_id` in `sellers_catalog`.
    - Add index `(domain, fetched_at DESC)` for `raw_sellers_files` to speed up "latest file" checks.
    - Optimize `COUNT(*)` queries in `sellers.ts` (potentially use estimates or cached counts).

- **API Proxy Reliability**: ✅ Completed
  - **Issue**: `backend/src/api/analytics.ts` calls OpenSincera API without timeouts or retries.
  - **Action**: Add abortable timeouts (e.g., 5s), limited retries, and short-term caching to prevent worker exhaustion.

- **OpenX Sellers.json Error**: ✅ Completed
  - **Issue**: Scanning `openx.com` sellers.json returns 500 Error (`Failed to load report`). Likely due to timeout or massive file size.
  - **Action**: Optimized stream processing in `StreamImporter` to handle large files efficiently and increased timeouts where necessary. Implemented robust sanitization and deduplication.

### Low Priority (Architecture & Operations)

- **Secret Management**:
  - **Recommendation**: Move sensitive DB credentials from environment variables to **GCP Secret Manager** (accessed via Volume Mount or SDK) for better security and rotation support.

- **Job Separation**:
  - **Recommendation**: Consider migrating the internal Cron Scheduler to **Cloud Scheduler + Cloud Run Jobs** to avoid reliability issues with long-running processes in the API service.