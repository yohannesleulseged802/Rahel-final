import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  doc, 
  getDocFromServer, 
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
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
