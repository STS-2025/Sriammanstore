export interface SeedOperation {
  collectionName: string;
  docId: string;
  payload: Record<string, any>;
}

export interface LinkedCustomerFixture {
  userDocId: string;
  email: string;
  displayName?: string;
  phone?: string;
  emailVerified?: boolean;
  validated?: boolean;
  uid: string;
  profilePayload?: Record<string, any>;
  [key: string]: any;
}

export const ARRAY_RESOURCES: string[];
export const SINGLETON_RESOURCES: string[];
export function extractSeedOperationsFromData(data: Record<string, any>): SeedOperation[];
export function chunkOperations(ops: any[], chunkSize: number): any[][];
export function isDeepEqualRecord(a: any, b: any): boolean;
export function extractLinkedCustomerFixturesFromData(data: Record<string, any>): LinkedCustomerFixture[];
export function detectUnrelatedCustomerDataConflict(...args: any[]): boolean;
export function seedLinkedCustomerFixtures(...args: any[]): Promise<LinkedCustomerFixture[]>;
export function validateSeededCustomerLink(...args: any[]): Promise<any>;
export interface SeedStorageBackend {
  getDoc(col: string, id: string): Promise<any>;
  setDoc(col: string, id: string, data: any): Promise<any>;
  deleteDoc(col: string, id: string): Promise<any>;
}
export function seedProductionProductFixtures(backend: any, fixtures?: any): Promise<any>;
