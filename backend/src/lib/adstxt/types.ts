/**
 * Common types and interfaces for ads.txt validation
 */

// Severity enum to represent the importance level of validation results
export enum Severity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// Validation keys without namespace prefixes for cleaner structure
export const VALIDATION_KEYS = {
  MISSING_FIELDS: 'missingFields',
  INVALID_FORMAT: 'invalidFormat',
  INVALID_RELATIONSHIP: 'invalidRelationship',
  INVALID_DOMAIN: 'invalidDomain',
  EMPTY_ACCOUNT_ID: 'emptyAccountId',
  IMPLIMENTED: 'implimentedEntry',
  NO_SELLERS_JSON: 'noSellersJson',
  DIRECT_ACCOUNT_ID_NOT_IN_SELLERS_JSON: 'directAccountIdNotInSellersJson',
  RESELLER_ACCOUNT_ID_NOT_IN_SELLERS_JSON: 'resellerAccountIdNotInSellersJson',
  DOMAIN_MISMATCH: 'domainMismatch',
  DIRECT_NOT_PUBLISHER: 'directNotPublisher',
  SELLER_ID_NOT_UNIQUE: 'sellerIdNotUnique',
  RESELLER_NOT_INTERMEDIARY: 'resellerNotIntermediary',
  SELLERS_JSON_VALIDATION_ERROR: 'sellersJsonValidationError',
  // Content validation
  EMPTY_FILE: 'emptyFile',
  INVALID_CHARACTERS: 'invalidCharacters',
};

// For backward compatibility
export const ERROR_KEYS = VALIDATION_KEYS;

// Interfaces aliged with backend API definitions
export interface BatchSellersResult {
  domain: string;
  requested_count: number;
  found_count: number;
  results: SellerResult[];
  metadata: SellersJsonMetadata;
  cache: CacheInfo;
}

export interface SellerResult {
  sellerId: string;
  seller: Seller | null;
  found: boolean;
  source: 'cache' | 'fresh';
  error?: string;
}

export interface Seller {
  seller_id: string;
  name?: string;
  domain?: string;
  seller_type?: 'PUBLISHER' | 'INTERMEDIARY' | 'BOTH';
  is_confidential?: boolean | 0 | 1; // Backend uses boolean/null, v1 used 0/1, unifying to handle both
  [key: string]: any;
}

export interface SellersJsonMetadata {
  version?: string;
  contact_email?: string;
  contact_address?: string;
  seller_count?: number;
  identifiers?: any[];
}

export interface CacheInfo {
  is_cached: boolean;
  last_updated?: string;
  status: 'success' | 'error' | 'stale';
  expires_at?: string;
}

// Common base interface for both record and variable entries
export interface ParsedAdsTxtEntryBase {
  line_number: number;
  raw_line: string;
  is_valid: boolean;
  error?: string;
  has_warning?: boolean;
  warning?: string;
  validation_key?: string;
  severity?: Severity;
  warning_params?: Record<string, any>;
  all_warnings?: Array<{ key: string; params?: Record<string, any>; severity?: Severity }>;
  validation_error?: string;
}

export interface ParsedAdsTxtVariable extends ParsedAdsTxtEntryBase {
  variable_type: 'CONTACT' | 'SUBDOMAIN' | 'INVENTORYPARTNERDOMAIN' | 'OWNERDOMAIN' | 'MANAGERDOMAIN';
  value: string;
  is_variable: true;
}

export type ParsedAdsTxtEntry = ParsedAdsTxtRecord | ParsedAdsTxtVariable;

export interface ParsedAdsTxtRecord extends ParsedAdsTxtEntryBase {
  domain: string;
  account_id: string;
  account_type: string;
  certification_authority_id?: string;
  relationship: 'DIRECT' | 'RESELLER';
  is_variable?: false; // Mark this as not a variable record
  duplicate_domain?: string; // Store duplicate domain without overwriting original domain
  validation_results?: CrossCheckValidationResult; // Store detailed validation results
}

export interface CrossCheckValidationResult {
  hasSellerJson: boolean;
  directAccountIdInSellersJson: boolean;
  directDomainMatchesSellerJsonEntry: boolean | null;
  directEntryHasPublisherType: boolean | null;
  directSellerIdIsUnique: boolean | null;
  resellerAccountIdInSellersJson: boolean | null;
  resellerDomainMatchesSellerJsonEntry: boolean | null;
  resellerEntryHasIntermediaryType: boolean | null;
  resellerSellerIdIsUnique: boolean | null;

  sellerData?: SellersJsonSellerRecord | null;
  error?: string;
}

export interface SellersJsonSellerRecord {
  seller_id: string;
  name?: string;
  domain?: string;
  seller_type?: 'PUBLISHER' | 'INTERMEDIARY' | 'BOTH';
  is_confidential?: boolean | 0 | 1;
  [key: string]: any;
}

export interface SellersJsonProvider {
  batchGetSellers(domain: string, sellerIds: string[]): Promise<BatchSellersResult>;
  getMetadata(domain: string): Promise<SellersJsonMetadata>;
  hasSellerJson(domain: string): Promise<boolean>;
  getCacheInfo(domain: string): Promise<CacheInfo>;
}
