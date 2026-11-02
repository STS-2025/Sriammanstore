export const EXPECTED_PRODUCTION_PROJECT_ID: string;
export const EXPECTED_PRODUCTION_PROJECT_NUMBER: string;
export const EXPECTED_PRODUCTION_AUTH_DOMAIN: string;
export const EXPECTED_STORAGE_BUCKET: string;
export const EXPECTED_APP_ID: string;

export const APPROVED_PRODUCT_DOC_IDS: string[];
export const DEFAULT_PRODUCT_DOC_ID: string;

export function maskSecret(secret?: string | null): string;

export function isApprovedReadOnlyProductPath(
  collection: string,
  docId: string
): boolean;

export interface ProductionFirebaseConfig {
  projectId: string;
  authDomain: string;
  messagingSenderId: string;
  storageBucket: string;
  appId: string;
  apiKey: string;
}

export function resolveProductionFirebaseConfig(): ProductionFirebaseConfig;

export function validateProductionConfig(config: Partial<ProductionFirebaseConfig>): {
  valid: boolean;
  errors: string[];
};

import type { Product } from "../src/types";

export interface ProductDocReadResult {
  docPath: string;
  exists: boolean;
  name?: string;
  productName?: string;
  mrp?: number | string | null;
  price?: number | string | null;
  stock?: number | string | null;
  fieldCount?: number;
  createTime?: string;
  updateTime?: string;
  raw?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export function unmarshalFirestoreRestValue(val: unknown): unknown;
export function unmarshalFirestoreRestFields(
  fields: Record<string, unknown>
): Record<string, unknown>;

export interface NormalizedProductPreviewResult {
  docId: string;
  docPath: string;
  rawFieldCount: number;
  raw: Record<string, unknown> | null;
  normalized: Product | null;
}

export function fetchAndNormalizeProductionProduct(
  docId?: string,
  options?: DiagnosticOptions
): Promise<NormalizedProductPreviewResult>;

export function readProductDocViaRest(
  config: ProductionFirebaseConfig,
  docId?: string
): Promise<ProductDocReadResult>;

export function readProductDocViaSdk(
  config: ProductionFirebaseConfig,
  docId?: string
): Promise<ProductDocReadResult>;

export interface DiagnosticOptions {
  confirmProductionReadOnly?: boolean;
  config?: ProductionFirebaseConfig;
  docId?: string;
}

export interface DiagnosticResult {
  timestamp: string;
  safetyScope: {
    readOnly: boolean;
    writesPerformed: number;
    customerRecordsAccessed: number;
    authenticationAttempted: boolean;
    rulesDeployed: boolean;
  };
  targetProject: {
    projectId: string;
    projectNumber: string;
    authDomain: string;
    apiKeyMasked: string;
  };
  checks: {
    projectIdValidated: boolean;
    restApiConnectivity: {
      status: string;
      docPath: string;
      exists: boolean;
      fieldCount?: number;
    } | null;
    sdkConnectivity: {
      status: string;
      docPath: string;
      exists: boolean;
      fieldCount?: number;
    } | null;
  };
  documentRead: {
    docPath: string;
    exists: boolean;
    productName: string;
    mrp: number | string | null;
    price: number | string | null;
    fieldCount?: number;
  } | null;
  securityNotice: string;
}

export function runProductionConnectivityDiagnostic(
  options?: DiagnosticOptions
): Promise<DiagnosticResult>;

