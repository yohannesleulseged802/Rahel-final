import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  doc, 
  getDocFromServer, 
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Safely intercept internal Firebase SDK error logs for quota-exhausted notices and backoff warnings
if (typeof window !== 'undefined' && (window as any).__pos_console_interceptor_installed !== true) {
  (window as any).__pos_console_interceptor_installed = true;
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    try {
      const message = args
        .map(a => (a instanceof Error ? `${a.name}: ${a.message}` : typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ');
      if (
        message.includes('resource-exhausted') ||
        message.includes('Quota limit exceeded') ||
        message.includes('maximum backoff delay') ||
        message.includes('Free daily write units') ||
        message.includes('quota metric')
      ) {
        console.warn('[Firestore Free Quota Limit]', ...args);
        return;
      }
    } catch {
      // Fallback to original console.error if stringify fails
    }
    originalConsoleError.apply(console, args);
  };
}

// Silence verbose internal Firebase debug/info messages
try {
  setLogLevel('error');
} catch {}

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore with multi-tab persistent IndexedDB local cache and ignoreUndefinedProperties
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app, 
    { 
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    }, 
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  try {
    firestoreInstance = initializeFirestore(
      app, 
      { ignoreUndefinedProperties: true }, 
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = firestoreInstance;

// Recursively strip undefined values to guarantee clean Firestore writes
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function isQuotaExhaustedError(error: unknown): boolean {
  if (!error) return false;
  const errMsg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  return (
    code === 'resource-exhausted' ||
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('Quota limit exceeded') ||
    errMsg.includes('quota')
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isQuota = isQuotaExhaustedError(error);

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    operationType,
    path
  };

  if (isQuota) {
    console.warn('[Firestore] Daily free-tier quota reached. Switched to high-speed offline local persistence mode.');
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  return errInfo;
}

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Connected to live database:', firebaseConfig.firestoreDatabaseId);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client is offline or initializing.');
    }
    return false;
  }
}
