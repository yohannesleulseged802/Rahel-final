import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  User, 
  UserRole,
  Product, 
  CartItem, 
  SaleTransaction, 
  CashDrawerShift, 
  ParkedTicket, 
  StoreSettings, 
  PaymentDetails,
  BulkImportResult,
  PurchaseTransaction,
  PurchaseItem,
  PaymentMethod,
  TabType
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_PRODUCTS, 
  INITIAL_SETTINGS, 
  INITIAL_OPEN_SHIFT 
} from '../data/initialData';
import { db, testConnection, handleFirestoreError, OperationType, sanitizeForFirestore } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc, 
  deleteDoc, 
  writeBatch, 
  getDocs,
  query,
  where,
  updateDoc,
  deleteField,
  orderBy 
} from 'firebase/firestore';
import { 
  generateSalt, 
  hashPassword, 
  verifyPassword, 
  hashPin, 
  verifyPin 
} from '../utils/security';
import { resolveAccurateTimestamp } from '../utils/dateTime';

interface POSContextType {
  currentUser: User | null;
  users: User[];
  isUsersLoaded: boolean;
  currentShift: CashDrawerShift | null;
  shiftHistory: CashDrawerShift[];
  products: Product[];
  cart: CartItem[];
  parkedTickets: ParkedTicket[];
  transactions: SaleTransaction[];
  purchases: PurchaseTransaction[];
  settings: StoreSettings;
  activeReceipt: SaleTransaction | null;
  activeTab: TabType;
  isAuthModalOpen: boolean;
  toastMessage: string | null;

  // Cloud Database Sync State
  isCloudConnected: boolean;

  // Barcode & QR Scanner State
  isScannerOpen: boolean;
  setIsScannerOpen: (isOpen: boolean) => void;
  scannerTarget: 'lookup' | 'sales' | 'purchase';
  openScanner: (target?: 'lookup' | 'sales' | 'purchase') => void;
  closeScanner: () => void;

  // Scanner Cross-Module Action Bridges
  scannedSaleEvent: { product: Product; timestamp: number } | null;
  triggerScannedSaleProduct: (product: Product) => void;
  scannedPurchaseEvent: { product: Product; timestamp: number } | null;
  triggerScannedPurchaseProduct: (product: Product) => void;
  scannedInventoryEvent: { code: string; product: Product | null; timestamp: number } | null;
  triggerScannedInventoryCode: (code: string, product: Product | null) => void;

  // Prefill for PO Reorder
  prefillPurchaseItems: {
    productId: string;
    name: string;
    sku: string;
    category: string;
    unitCost: number;
    quantity: number;
  }[] | null;
  setPrefillPurchaseItems: (items: {
    productId: string;
    name: string;
    sku: string;
    category: string;
    unitCost: number;
    quantity: number;
  }[] | null) => void;

  // Session & Inactivity Timeout State
  lastLockedUser: User | null;
  isSessionTimedOut: boolean;
  setIsSessionTimedOut: (val: boolean) => void;
  inactivityTimeoutMinutes: number;
  setInactivityTimeoutMinutes: (mins: number) => void;
  showInactivityWarning: boolean;
  inactivitySecondsLeft: number;
  staySignedIn: () => void;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setActiveTab: (tab: TabType) => void;
  setIsAuthModalOpen: (isOpen: boolean) => void;
  showToast: (msg: string) => void;
  
  // Auth & User Management
  login: (pin: string, userToLogin?: User, rememberDevice?: boolean) => Promise<boolean>;
  loginWithCredentials: (emailOrName: string, passwordAttempt: string, rememberDevice?: boolean) => Promise<boolean>;
  signup: (userData: {
    name: string;
    email: string;
    password: string;
    pin: string;
    role?: UserRole;
    masterPasscode: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  lockTerminal: () => void;
  switchUser: (user: User) => void;
  updateUserPassword: (newPassword: string, targetUserId?: string) => Promise<boolean>;
  updateUserPin: (newPin: string, targetUserId?: string) => Promise<boolean>;
  updateMasterPasscode: (newPasscode: string) => Promise<{ success: boolean; error?: string }>;
  deleteUserAccount: (userId: string) => Promise<{ success: boolean; error?: string }>;
  removeAllUsers: () => Promise<void>;
  generateRandomPassword: () => string;

  // Sales & Purchase Records (Automatic Inventory Edits)
  recordSale: (saleData: {
    items: {
      productId?: string;
      name: string;
      sku?: string;
      category?: string;
      quantity: number;
      unitPrice: number;
      costPrice?: number;
      discountPercent?: number;
      details?: string;
    }[];
    customerName?: string;
    customerEmail?: string;
    notes?: string;
    paymentMethod?: PaymentMethod;
    date?: string;
    time?: string;
    timestamp?: string;
    noReceipt?: boolean;
    receiptPreference?: 'printed' | 'no_receipt' | 'email';
  }) => SaleTransaction;

  recordPurchase: (purchaseData: {
    poNumber?: string;
    supplierName?: string;
    supplierInvoice?: string;
    items: {
      productId?: string;
      name: string;
      sku?: string;
      category?: string;
      unitCost: number;
      quantity: number;
      updateCostPrice?: boolean;
      sellingPrice?: number;
    }[];
    paymentStatus?: 'paid' | 'pending' | 'on_account';
    status?: 'received' | 'ordered' | 'pending';
    notes?: string;
    date?: string;
    time?: string;
    timestamp?: string;
  }) => PurchaseTransaction;

  // Cart operations
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  updateCartDiscount: (itemId: string, discountPercent: number) => void;
  updateCartPrice: (itemId: string, newUnitPrice: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscountTotal: number;
  cartTaxTotal: number;
  cartTotal: number;

  // Checkout & Transactions (Internal records)
  completeSale: (
    payment: PaymentDetails, 
    customerName?: string, 
    customerEmail?: string, 
    notes?: string,
    noReceipt?: boolean
  ) => SaleTransaction;
  updateSaleReceiptStatus: (saleId: string, noReceipt: boolean) => void;
  recordServiceJob: (job: {
    name: string;
    category?: string;
    details: string;
    price: number;
    cost: number;
    customerName?: string;
    notes?: string;
  }) => SaleTransaction;
  setActiveReceipt: (tx: SaleTransaction | null) => void;

  // Parked orders
  parkCurrentTicket: (label?: string, customerName?: string) => void;
  restoreParkedTicket: (ticketId: string) => void;
  deleteParkedTicket: (ticketId: string) => void;

  // Drawer & Shifts
  openShiftDrawer: (openingFloat: number, notes?: string) => void;
  performCashDrop: (amount: number, reason: string) => void;
  closeShiftDrawer: (actualCashCounted: number, notes?: string) => CashDrawerShift;

  // Inventory
  addProduct: (newProd: Omit<Product, 'id'>) => Product;
  bulkImportProducts: (items: Omit<Product, 'id'>[], mode: 'append' | 'upsert' | 'replace') => BulkImportResult;
  updateProduct: (updatedProd: Product) => void;
  deleteProduct: (productId: string) => void;
  adjustStock: (productId: string, delta: number) => void;

  // Settings & Data Management
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetAllData: () => Promise<void> | void;
  resetYearlyData: () => Promise<void>;
  fullResetWithUserRemoval: () => Promise<void>;
  importDatabaseBackup: (backupData: any) => boolean;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local storage keys
  const STORAGE_PREFIX = 'rahel_stationary_pos_';

  // Inactivity timeout configuration (in minutes, default 60)
  const [inactivityTimeoutMinutes, setInactivityTimeoutMinutes] = useState<number>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}inactivity_timeout_mins`);
    return saved ? Math.max(1, parseInt(saved, 10)) : 60;
  });

  const [isSessionTimedOut, setIsSessionTimedOut] = useState<boolean>(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState<boolean>(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState<number>(45);
  const [lastLockedUser, setLastLockedUser] = useState<User | null>(null);

  // Insist on independent login by default on every device / browser window
  // Only restore if a valid, unexpired session (within 60 minutes of last activity) exists
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const timeoutMs = 60 * 60 * 1000; // Strictly 60-minute inactivity timeout

      // 1. Check tab session in sessionStorage
      const sessionRaw = sessionStorage.getItem(`${STORAGE_PREFIX}active_session`);
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session && session.user && typeof session.lastActive === 'number' && Date.now() - session.lastActive < timeoutMs) {
          return session.user;
        } else {
          sessionStorage.removeItem(`${STORAGE_PREFIX}active_session`);
        }
      }

      // 2. Check localStorage if "Remember me on this device" was used
      const persistentRaw = localStorage.getItem(`${STORAGE_PREFIX}persistent_session`);
      if (persistentRaw) {
        const session = JSON.parse(persistentRaw);
        if (session && session.user && typeof session.lastActive === 'number' && Date.now() - session.lastActive < timeoutMs) {
          return session.user;
        } else {
          localStorage.removeItem(`${STORAGE_PREFIX}persistent_session`);
        }
      }
    } catch (e) {
      /* fallback */
    }
    // Must default to null to insist on independent authentication
    return null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}users`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((u: any) => u.id !== 'user-rahel' && u.email?.toLowerCase() !== 'rahel@rfstationary.site');
        }
      } catch (e) {}
    }
    return [];
  });
  const [isUsersLoaded, setIsUsersLoaded] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<SaleTransaction | null>(null);

  // Live Cloud Database (Firestore) synchronization state
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Barcode & QR Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'lookup' | 'sales' | 'purchase'>('lookup');

  const [scannedSaleEvent, setScannedSaleEvent] = useState<{ product: Product; timestamp: number } | null>(null);
  const [scannedPurchaseEvent, setScannedPurchaseEvent] = useState<{ product: Product; timestamp: number } | null>(null);
  const [scannedInventoryEvent, setScannedInventoryEvent] = useState<{ code: string; product: Product | null; timestamp: number } | null>(null);

  const openScanner = (target: 'lookup' | 'sales' | 'purchase' = 'lookup') => {
    setScannerTarget(target);
    setIsScannerOpen(true);
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
  };

  const triggerScannedSaleProduct = (product: Product) => {
    setScannedSaleEvent({ product, timestamp: Date.now() });
  };

  const triggerScannedPurchaseProduct = (product: Product) => {
    setScannedPurchaseEvent({ product, timestamp: Date.now() });
  };

  const triggerScannedInventoryCode = (code: string, product: Product | null) => {
    setScannedInventoryEvent({ code, product, timestamp: Date.now() });
  };

  // Pre-fill state for generating PO from low-stock items
  const [prefillPurchaseItems, setPrefillPurchaseItems] = useState<{
    productId: string;
    name: string;
    sku: string;
    category: string;
    unitCost: number;
    quantity: number;
  }[] | null>(null);

  // Settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved); 
        return { ...parsed, storeName: 'Rahel Stationary & Print Services', currencySymbol: 'ETB' };
      } catch (e) { /* fallback */ }
    }
    return INITIAL_SETTINGS;
  });

  // Products: defaults strictly to [] with filter against demo product IDs
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}products`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: any) => p && p.id && p.name);
        }
      } catch (e) { /* fallback */ }
    }
    return [];
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}cart`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  // Parked tickets
  const [parkedTickets, setParkedTickets] = useState<ParkedTicket[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}parked`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  // Shifts: strictly null when register is unassigned/closed (no dummy open shifts)
  const [currentShift, setCurrentShift] = useState<CashDrawerShift | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}currentShift`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id !== 'shift-current') return parsed;
      } catch (e) { /* fallback */ }
    }
    return null;
  });

  const [shiftHistory, setShiftHistory] = useState<CashDrawerShift[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}shiftHistory`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  // Transactions
  // Transactions: defaults strictly to [] so reset never revives deleted transactions
  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}transactions`);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* fallback */ }
    }
    return [];
  });

  // Purchases (Inward Goods & Supplier Orders): defaults strictly to []
  const [purchases, setPurchases] = useState<PurchaseTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}purchases`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* fallback */ }
    }
    return [];
  });

  // Inactivity tracking ref - strictly initialized from existing session timestamp to prevent extending timer on page reload
  const lastActivityRef = useRef<number>((() => {
    try {
      const activeRaw = sessionStorage.getItem(`${STORAGE_PREFIX}active_session`) ||
                        localStorage.getItem(`${STORAGE_PREFIX}persistent_session`);
      if (activeRaw) {
        const parsed = JSON.parse(activeRaw);
        if (parsed?.lastActive && typeof parsed.lastActive === 'number') {
          return parsed.lastActive;
        }
      }
    } catch (e) {}
    return Date.now();
  })());

  // Record user interaction and update session timestamp
  const recordUserActivity = () => {
    lastActivityRef.current = Date.now();
    try {
      const activeRaw = sessionStorage.getItem(`${STORAGE_PREFIX}active_session`);
      if (activeRaw) {
        const parsed = JSON.parse(activeRaw);
        parsed.lastActive = Date.now();
        sessionStorage.setItem(`${STORAGE_PREFIX}active_session`, JSON.stringify(parsed));
      }
      const persistentRaw = localStorage.getItem(`${STORAGE_PREFIX}persistent_session`);
      if (persistentRaw) {
        const parsed = JSON.parse(persistentRaw);
        parsed.lastActive = Date.now();
        localStorage.setItem(`${STORAGE_PREFIX}persistent_session`, JSON.stringify(parsed));
      }
    } catch (e) {
      /* ignore storage error */
    }
  };

  // Window-wide user interaction listeners
  useEffect(() => {
    if (!currentUser) return;

    let throttleTimer = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - throttleTimer > 3000) {
        throttleTimer = now;
        recordUserActivity();
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, [currentUser]);

  // Periodic inactivity timeout checker (every 1 second)
  useEffect(() => {
    if (!currentUser) {
      setShowInactivityWarning(false);
      return;
    }

    const interval = setInterval(() => {
      const timeoutMs = inactivityTimeoutMinutes * 60 * 1000;
      const warningMs = 45 * 1000; // 45-second pre-timeout warning
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = timeoutMs - elapsed;

      if (remaining <= 0) {
        // Inactivity timeout: lock session and insist on re-login
        setLastLockedUser(currentUser);
        setCurrentUser(null);
        setIsSessionTimedOut(true);
        setShowInactivityWarning(false);
        sessionStorage.removeItem(`${STORAGE_PREFIX}active_session`);
        localStorage.removeItem(`${STORAGE_PREFIX}persistent_session`);
        showToast('Session timed out due to inactivity.');
      } else if (remaining <= warningMs) {
        setShowInactivityWarning(true);
        setInactivitySecondsLeft(Math.max(1, Math.ceil(remaining / 1000)));
      } else {
        setShowInactivityWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser, inactivityTimeoutMinutes]);

  const staySignedIn = () => {
    lastActivityRef.current = Date.now();
    setShowInactivityWarning(false);
    recordUserActivity();
    showToast('Session refreshed.');
  };

  // Live Cloud Database (Firestore) real-time synchronization across all devices
  useEffect(() => {
    testConnection().then(connected => {
      if (connected) setIsCloudConnected(true);
    });

    // 1. Live Products & Inventory Catalog
    const productsCol = collection(db, 'products');
    const unsubProducts = onSnapshot(productsCol, (snapshot) => {
      setIsCloudConnected(true);
      if (snapshot.empty) {
        setProducts([]);
        localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify([]));
      } else {
        const liveProducts = snapshot.docs
          .map(d => d.data() as Product)
          .filter(p => p && p.id && p.name);
        setProducts(liveProducts);
        localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(liveProducts));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    // 2. Live Sales Transactions
    const salesCol = query(collection(db, 'sales'), orderBy('timestamp', 'desc'));
    const unsubSales = onSnapshot(salesCol, (snapshot) => {
      setIsCloudConnected(true);
      if (snapshot.empty) {
        setTransactions([]);
        localStorage.setItem(`${STORAGE_PREFIX}transactions`, JSON.stringify([]));
      } else {
        const liveSales = snapshot.docs.map(d => d.data() as SaleTransaction);
        setTransactions(liveSales);
        localStorage.setItem(`${STORAGE_PREFIX}transactions`, JSON.stringify(liveSales));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sales');
    });

    // 3. Live Purchase Orders
    const purchasesCol = query(collection(db, 'purchases'), orderBy('timestamp', 'desc'));
    const unsubPurchases = onSnapshot(purchasesCol, (snapshot) => {
      setIsCloudConnected(true);
      if (snapshot.empty) {
        setPurchases([]);
        localStorage.setItem(`${STORAGE_PREFIX}purchases`, JSON.stringify([]));
      } else {
        const livePurchases = snapshot.docs.map(d => d.data() as PurchaseTransaction);
        setPurchases(livePurchases);
        localStorage.setItem(`${STORAGE_PREFIX}purchases`, JSON.stringify(livePurchases));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'purchases');
    });

    // 4. Live Store Settings (Enforcing permanent ETB currency & master passcode)
    const settingsDocRef = doc(db, 'settings', 'store_config');
    const unsubSettings = onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        const remote = snap.data() as StoreSettings;
        const enforced: StoreSettings = { 
          ...remote, 
          currencySymbol: 'ETB',
          masterPasscode: remote.masterPasscode || INITIAL_SETTINGS.masterPasscode || 'RahelF1234'
        };
        setSettings(enforced);
        if (remote.currencySymbol !== 'ETB' || !remote.masterPasscode) {
          setDoc(settingsDocRef, sanitizeForFirestore(enforced), { merge: true }).catch(() => {});
        }
      } else {
        setDoc(settingsDocRef, sanitizeForFirestore(INITIAL_SETTINGS)).catch(e => 
          handleFirestoreError(e, OperationType.WRITE, 'settings')
        );
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings');
    });

    // 5. Live Staff & Operators Synchronization (all registered users synced across devices)
    const usersCol = collection(db, 'users');
    const unsubUsers = onSnapshot(usersCol, (snap) => {
      const liveUsers = snap.docs
        .map(d => d.data() as User)
        .filter(u => u.id !== 'user-rahel' && u.email?.toLowerCase() !== 'rahel@rfstationary.site');
      setUsers(liveUsers);
      setIsUsersLoaded(true);
      localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(liveUsers));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      setIsUsersLoaded(true);
    });

    return () => {
      unsubProducts();
      unsubSales();
      unsubPurchases();
      unsubSettings();
      unsubUsers();
    };
  }, []);

  // Persist state updates to localStorage (offline cache fallback)
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}cart`, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}parked`, JSON.stringify(parkedTickets));
  }, [parkedTickets]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}currentShift`, JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}shiftHistory`, JSON.stringify(shiftHistory));
  }, [shiftHistory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}purchases`, JSON.stringify(purchases));
  }, [purchases]);

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Auth operations: Authenticates using salted PBKDF2 hash (never plaintext!)
  const login = async (pinAttempt: string, userToLogin?: User, rememberDevice: boolean = false): Promise<boolean> => {
    const cleanPin = String(pinAttempt ?? '').trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      showToast('PIN must be exactly 4 numeric digits.');
      return false;
    }

    // Helper to test a user candidate's PIN credentials
    const testCandidatePin = async (candidate: User): Promise<boolean> => {
      try {
        if (candidate.pinSalt && candidate.pinHash) {
          return await verifyPin(cleanPin, candidate.pinSalt, candidate.pinHash);
        }
        if (candidate.pin && String(candidate.pin).trim() === cleanPin) {
          return true;
        }
      } catch (err) {
        console.warn('Error testing candidate PIN:', err);
      }
      return false;
    };

    // 1. Gather all known user records (combining in-memory state and localStorage)
    let candidateUsers = [...users];
    if (candidateUsers.length === 0) {
      try {
        const saved = localStorage.getItem(`${STORAGE_PREFIX}users`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            candidateUsers = parsed;
          }
        }
      } catch (e) {}
    }

    // If candidateUsers is still empty, fetch directly from Firestore users collection
    if (candidateUsers.length === 0) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          const remoteUsers = snap.docs.map(d => d.data() as User);
          candidateUsers = remoteUsers;
          setUsers(remoteUsers);
          localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(remoteUsers));
        }
      } catch (err) {
        console.warn('Error fetching users from Firestore in login():', err);
      }
    }

    let authenticatedUser: User | null = null;

    // 2. If a specific user was targeted (e.g., from quick unlock, selected user pill, or login modal):
    if (userToLogin) {
      // Find full user record that contains pinSalt/pinHash from candidate pool
      let fullTargetUser: User | undefined = candidateUsers.find(
        u => u.id === userToLogin.id || (u.email && userToLogin.email && u.email.toLowerCase() === userToLogin.email.toLowerCase())
      );

      // If targeted user lacks credentials in local memory, fetch fresh doc from Firestore
      if (!fullTargetUser?.pinHash && !fullTargetUser?.pin) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userToLogin.id));
          if (userDoc.exists()) {
            fullTargetUser = userDoc.data() as User;
          }
        } catch (err) {
          console.warn('Error fetching targeted user doc from Firestore:', err);
        }
      }

      // If userToLogin itself already carried credentials:
      if (!fullTargetUser && (userToLogin.pinHash || userToLogin.pin)) {
        fullTargetUser = userToLogin;
      }

      if (fullTargetUser) {
        const matches = await testCandidatePin(fullTargetUser);
        if (matches) {
          authenticatedUser = fullTargetUser;
        }
      }
    }

    // 3. If no targeted match yet (or cashier entered their PIN while another user was selected or register was locked):
    if (!authenticatedUser) {
      for (const candidate of candidateUsers) {
        const matches = await testCandidatePin(candidate);
        if (matches) {
          authenticatedUser = candidate;
          break;
        }
      }
    }

    // 4. Fallback search against Firestore if candidateUsers didn't produce a match
    if (!authenticatedUser && candidateUsers.length <= 1) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        for (const docSnap of snap.docs) {
          const remoteUser = docSnap.data() as User;
          const matches = await testCandidatePin(remoteUser);
          if (matches) {
            authenticatedUser = remoteUser;
            break;
          }
        }
      } catch (err) {
        console.warn('Error in Firestore fallback search:', err);
      }
    }

    // If still no match found, notify failure
    if (!authenticatedUser) {
      if (userToLogin?.name) {
        showToast('Incorrect PIN for ' + userToLogin.name);
      } else {
        showToast('Incorrect 4-digit PIN. Please try again.');
      }
      return false;
    }

    // 5. Auto-migrate legacy plain PIN to salted PBKDF2 hash in Firestore
    if (!authenticatedUser.pinHash && authenticatedUser.pin) {
      try {
        const salt = generateSalt();
        const hash = await hashPin(cleanPin, salt);
        await updateDoc(doc(db, 'users', authenticatedUser.id), {
          pinHash: hash,
          pinSalt: salt,
          pin: deleteField()
        });
        authenticatedUser.pinHash = hash;
        authenticatedUser.pinSalt = salt;
        delete authenticatedUser.pin;
      } catch (err) {
        console.warn('Could not migrate legacy PIN in Firestore:', err);
      }
    }

    // 6. Never store passwords or credentials in the session object
    const safeUser: User = {
      id: authenticatedUser.id,
      name: authenticatedUser.name,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
      avatarColor: authenticatedUser.avatarColor,
      createdAt: authenticatedUser.createdAt
    };

    setCurrentUser(safeUser);
    setLastLockedUser(safeUser);
    setIsSessionTimedOut(false);
    setShowInactivityWarning(false);
    setIsAuthModalOpen(false);
    lastActivityRef.current = Date.now();

    const sessionPayload = {
      user: safeUser,
      rememberDevice,
      lastActive: Date.now()
    };

    sessionStorage.setItem(`${STORAGE_PREFIX}active_session`, JSON.stringify(sessionPayload));
    if (rememberDevice) {
      localStorage.setItem(`${STORAGE_PREFIX}persistent_session`, JSON.stringify(sessionPayload));
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}persistent_session`);
    }

    showToast(`Signed in as ${safeUser.name} (${safeUser.role.toUpperCase()})`);
    return true;
  };

  const loginWithCredentials = async (
    emailOrName: string, 
    passwordAttempt: string, 
    rememberDevice: boolean = false
  ): Promise<boolean> => {
    const cleanQuery = emailOrName.trim().toLowerCase();
    
    // 1. Search in-memory users state first
    let targetUser = users.find(u => 
      u.email.toLowerCase() === cleanQuery || 
      u.name.toLowerCase() === cleanQuery || 
      u.id.toLowerCase() === cleanQuery
    );

    // 2. If not found in local memory, query Firestore users collection directly
    if (!targetUser) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', cleanQuery));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetUser = snap.docs[0].data() as User;
        }
      } catch (err) {
        console.error('Error fetching user from Firestore:', err);
      }
    }

    if (!targetUser) {
      showToast('Invalid email or password.');
      return false;
    }

    // 3. Verify password via salted cryptographic hash
    let isPasswordValid = false;
    if (targetUser.passwordSalt && targetUser.passwordHash) {
      isPasswordValid = await verifyPassword(passwordAttempt, targetUser.passwordSalt, targetUser.passwordHash);
    } else if (targetUser.password && targetUser.password === passwordAttempt) {
      // Auto-migrate legacy plain password to salted PBKDF2 hash
      isPasswordValid = true;
      try {
        const salt = generateSalt();
        const hash = await hashPassword(passwordAttempt, salt);
        await updateDoc(doc(db, 'users', targetUser.id), {
          passwordHash: hash,
          passwordSalt: salt,
          password: deleteField()
        });
        targetUser.passwordHash = hash;
        targetUser.passwordSalt = salt;
        delete targetUser.password;
      } catch (err) {
        console.warn('Could not migrate legacy password in Firestore:', err);
      }
    }

    if (!isPasswordValid) {
      showToast('Invalid email or password.');
      return false;
    }

    // 4. Create safe session profile (free of password / hash fields)
    const safeUser: User = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      avatarColor: targetUser.avatarColor,
      createdAt: targetUser.createdAt
    };

    setCurrentUser(safeUser);
    setLastLockedUser(safeUser);
    setIsSessionTimedOut(false);
    setShowInactivityWarning(false);
    setIsAuthModalOpen(false);
    lastActivityRef.current = Date.now();

    const sessionPayload = {
      user: safeUser,
      rememberDevice,
      lastActive: Date.now()
    };

    sessionStorage.setItem(`${STORAGE_PREFIX}active_session`, JSON.stringify(sessionPayload));
    if (rememberDevice) {
      localStorage.setItem(`${STORAGE_PREFIX}persistent_session`, JSON.stringify(sessionPayload));
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}persistent_session`);
    }

    showToast(`Welcome back, ${safeUser.name}`);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setLastLockedUser(null);
    setIsSessionTimedOut(false);
    setShowInactivityWarning(false);
    sessionStorage.removeItem(`${STORAGE_PREFIX}active_session`);
    localStorage.removeItem(`${STORAGE_PREFIX}persistent_session`);
    showToast('Signed out of POS register.');
  };

  const lockTerminal = () => {
    if (currentUser) {
      setLastLockedUser(currentUser);
    }
    setCurrentUser(null);
    setIsSessionTimedOut(false);
    setShowInactivityWarning(false);
    sessionStorage.removeItem(`${STORAGE_PREFIX}active_session`);
    showToast('Terminal locked.');
  };

  const switchUser = (user: User) => {
    const safeUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    };
    setCurrentUser(safeUser);
    setLastLockedUser(safeUser);
    lastActivityRef.current = Date.now();
    setIsAuthModalOpen(false);
    showToast(`Active workstation operator: ${safeUser.name}`);
  };

  const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pwd = 'Rf!';
    for (let i = 0; i < 9; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    return pwd;
  };

  const signup = async (userData: {
    name: string;
    email: string;
    password: string;
    pin: string;
    role?: UserRole;
    masterPasscode: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    // 1. Verify master passcode (required for authorized store operators)
    const activeMasterPasscode = (settings.masterPasscode || INITIAL_SETTINGS.masterPasscode || 'RahelF1234').trim();
    if (userData.masterPasscode.trim() !== activeMasterPasscode) {
      return { 
        success: false, 
        error: 'Invalid master passcode. Registration requires approval from the store administrator.' 
      };
    }

    // 2. Validate input fields
    const trimmedName = userData.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: 'Please enter a valid full name (minimum 2 characters).' };
    }

    const trimmedEmail = userData.email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!userData.password || userData.password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    const trimmedPin = userData.pin.trim();
    if (!/^\d{4}$/.test(trimmedPin)) {
      return { success: false, error: 'Quick PIN must be exactly 4 numeric digits.' };
    }

    // 3. Uniqueness checks across in-memory state and Cloud Firestore
    if (users.some(u => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: 'An account with this email address already exists. Please sign in instead.' };
    }

    try {
      const q = query(collection(db, 'users'), where('email', '==', trimmedEmail));
      const existingSnap = await getDocs(q);
      if (!existingSnap.empty) {
        return { success: false, error: 'An account with this email address already exists. Please sign in instead.' };
      }
    } catch (err) {
      console.warn('Could not verify email uniqueness in Firestore:', err);
    }

    // 4. Generate cryptographically salted hashes for password and PIN (NEVER plain text!)
    const passwordSalt = generateSalt();
    const passwordHash = await hashPassword(userData.password, passwordSalt);
    const pinSalt = generateSalt();
    const pinHash = await hashPin(trimmedPin, pinSalt);

    // 5. Generate avatar color & unique user ID conforming to regex ^[a-zA-Z0-9_\-\.]+$
    const avatarColors = [
      'bg-amber-600',
      'bg-blue-600',
      'bg-emerald-600',
      'bg-purple-600',
      'bg-rose-600',
      'bg-indigo-600',
      'bg-cyan-600',
      'bg-teal-600'
    ];
    const chosenColor = avatarColors[users.length % avatarColors.length];
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser: User = {
      id: newUserId,
      name: trimmedName,
      email: trimmedEmail,
      role: userData.role || 'cashier',
      passwordHash,
      passwordSalt,
      pinHash,
      pinSalt,
      avatarColor: chosenColor,
      createdAt: new Date().toISOString(),
    };

    // 6. Persist to Firestore and local state
    try {
      await setDoc(doc(db, 'users', newUser.id), sanitizeForFirestore(newUser));
      setUsers(prev => {
        const nextUsers = [...prev.filter(u => u.id !== newUser.id), newUser];
        localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(nextUsers));
        return nextUsers;
      });
      showToast(`Account registered for ${newUser.name} (${newUser.role.toUpperCase()})`);
      return { success: true, user: newUser };
    } catch (err) {
      console.error('Error creating user in Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, 'users');
      return { success: false, error: 'Failed to synchronize account to cloud database. Please verify internet connection.' };
    }
  };

  const updateMasterPasscode = async (newPasscode: string): Promise<{ success: boolean; error?: string }> => {
    const clean = newPasscode.trim();
    if (!clean || clean.length < 4) {
      return { success: false, error: 'Master passcode must be at least 4 characters long.' };
    }
    const updatedSettings: StoreSettings = {
      ...settings,
      masterPasscode: clean,
    };
    setSettings(updatedSettings);
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(updatedSettings));
    try {
      await setDoc(doc(db, 'settings', 'store_config'), sanitizeForFirestore(updatedSettings), { merge: true });
      showToast('Master registration passcode updated successfully.');
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings');
      return { success: false, error: 'Failed to sync master passcode to cloud database.' };
    }
  };

  const deleteUserAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => {
        const next = prev.filter(u => u.id !== userId);
        localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(next));
        return next;
      });
      if (currentUser?.id === userId) {
        logout();
      }
      showToast('User account deleted.');
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'users');
      return { success: false, error: 'Failed to delete user account.' };
    }
  };

  const removeAllUsers = async (): Promise<void> => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      setUsers([]);
      setCurrentUser(null);
      setLastLockedUser(null);
      localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify([]));
      localStorage.removeItem(`${STORAGE_PREFIX}persistent_session`);
      localStorage.removeItem(`${STORAGE_PREFIX}active_session`);
      sessionStorage.clear();
      showToast('All user accounts removed. You can now create your own account.');
    } catch (e) {
      console.error('Error removing all users:', e);
      showToast('Failed to remove all users from database.');
    }
  };

  const updateUserPassword = async (newPassword: string, targetUserId?: string): Promise<boolean> => {
    if (!newPassword || newPassword.length < 4) {
      showToast('Password must be at least 4 characters long.');
      return false;
    }
    const idToUpdate = targetUserId || currentUser?.id || users[0]?.id;
    if (!idToUpdate) return false;

    try {
      const salt = generateSalt();
      const hash = await hashPassword(newPassword, salt);
      await updateDoc(doc(db, 'users', idToUpdate), {
        passwordHash: hash,
        passwordSalt: salt,
        password: deleteField()
      });

      setUsers(prev => {
        const updated = prev.map(u => {
          if (u.id === idToUpdate) {
            const up = { ...u, passwordHash: hash, passwordSalt: salt };
            delete up.password;
            return up;
          }
          return u;
        });
        localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(updated));
        return updated;
      });

      showToast('Workstation password updated across all devices.');
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'users');
      showToast('Failed to update password.');
      return false;
    }
  };

  const updateUserPin = async (newPin: string, targetUserId?: string): Promise<boolean> => {
    const cleanPin = String(newPin ?? '').trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      showToast('PIN must be exactly 4 numeric digits.');
      return false;
    }
    const idToUpdate = targetUserId || currentUser?.id || users[0]?.id;
    if (!idToUpdate) return false;

    try {
      const salt = generateSalt();
      const hash = await hashPin(cleanPin, salt);
      await updateDoc(doc(db, 'users', idToUpdate), {
        pinHash: hash,
        pinSalt: salt,
        pin: deleteField()
      });

      setUsers(prev => {
        const updated = prev.map(u => {
          if (u.id === idToUpdate) {
            const up = { ...u, pinHash: hash, pinSalt: salt };
            delete up.pin;
            return up;
          }
          return u;
        });
        localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(updated));
        return updated;
      });

      showToast('Counter PIN updated across all devices.');
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'users');
      showToast('Failed to update PIN.');
      return false;
    }
  };

  // Cart operations
  const addToCart = (itemData: Omit<CartItem, 'id'>) => {
    setCart((prev) => {
      // If it's a product with identical productId and price, increment quantity
      if (itemData.type === 'product' && itemData.productId) {
        const existingIndex = prev.findIndex(
          it => it.type === 'product' && it.productId === itemData.productId && it.unitPrice === itemData.unitPrice
        );
        if (existingIndex > -1) {
          const updated = [...prev];
          const curr = updated[existingIndex];
          const targetProduct = products.find(p => p.id === itemData.productId);
          const newQty = curr.quantity + itemData.quantity;
          
          if (targetProduct && newQty > targetProduct.stock) {
            showToast(`Warning: Only ${targetProduct.stock} ${targetProduct.name} available in stock!`);
          }

          updated[existingIndex] = {
            ...curr,
            quantity: newQty,
          };
          return updated;
        }
      }

      // Otherwise generate unique item id
      const newItem: CartItem = {
        ...itemData,
        id: `cart-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };
      return [...prev, newItem];
    });

    showToast(`Added ${itemData.name} to ticket`);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(it => it.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(it => {
        if (it.id === itemId) {
          return { ...it, quantity };
        }
        return it;
      })
    );
  };

  const updateCartDiscount = (itemId: string, discountPercent: number) => {
    const clamped = Math.max(0, Math.min(100, discountPercent));
    setCart(prev =>
      prev.map(it => (it.id === itemId ? { ...it, discountPercent: clamped } : it))
    );
  };

  const updateCartPrice = (itemId: string, newUnitPrice: number) => {
    if (newUnitPrice < 0) return;
    setCart(prev =>
      prev.map(it => (it.id === itemId ? { ...it, unitPrice: Number(newUnitPrice.toFixed(2)) } : it))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cart computations
  const cartSubtotal = Number(
    cart.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0).toFixed(2)
  );

  const cartDiscountTotal = Number(
    cart.reduce((sum, it) => {
      const line = it.unitPrice * it.quantity;
      return sum + line * (it.discountPercent / 100);
    }, 0).toFixed(2)
  );

  const netTaxableAmount = Math.max(0, cartSubtotal - cartDiscountTotal);
  const effectiveTaxRate = settings.taxEnabled !== false ? (settings.taxRate ?? 0.15) : 0;
  const cartTaxTotal = Number((netTaxableAmount * effectiveTaxRate).toFixed(2));
  const cartTotal = Number((netTaxableAmount + cartTaxTotal).toFixed(2));

  // Complete Sale
  const completeSale = (
    payment: PaymentDetails, 
    customerName?: string, 
    customerEmail?: string, 
    notes?: string,
    noReceipt?: boolean
  ): SaleTransaction => {
    if (!currentUser) {
      throw new Error('Must be logged in to complete sale');
    }
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    const costTotal = Number(
      cart.reduce((sum, it) => sum + (it.costPrice || 0) * it.quantity, 0).toFixed(2)
    );
    const grossProfit = Number((netTaxableAmount - costTotal).toFixed(2));

    const receiptNum = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const isNoReceipt = noReceipt ?? (settings.defaultReceiptOption === 'no_receipt');

    const newTx: SaleTransaction = {
      id: `tx-${Date.now()}`,
      receiptNumber: receiptNum,
      timestamp: new Date().toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerName: customerName?.trim() || undefined,
      customerEmail: customerEmail?.trim() || undefined,
      items: [...cart],
      subtotal: cartSubtotal,
      discountTotal: cartDiscountTotal,
      taxTotal: cartTaxTotal,
      taxRate: effectiveTaxRate,
      total: cartTotal,
      costTotal,
      grossProfit,
      payment,
      status: 'completed',
      shiftId: currentShift?.id || 'unassigned',
      notes,
      noReceipt: isNoReceipt,
      receiptPreference: isNoReceipt ? 'no_receipt' : 'printed',
    };

    // Deduct stock for retail products sold
    setProducts((prev) =>
      prev.map((prod) => {
        const soldInCart = cart.filter(
          (c) => c.type === 'product' && c.productId === prod.id
        );
        if (soldInCart.length > 0) {
          const totalQtySold = soldInCart.reduce((sum, c) => sum + c.quantity, 0);
          const remainingStock = Math.max(0, prod.stock - totalQtySold);
          const updatedProd = { ...prod, stock: remainingStock };
          setDoc(doc(db, 'products', prod.id), sanitizeForFirestore(updatedProd), { merge: true })
            .catch(e => handleFirestoreError(e, OperationType.WRITE, 'products'));
          return updatedProd;
        }
        return prod;
      })
    );

    // Update active shift drawer stats
    if (currentShift && currentShift.status === 'open') {
      let cashContrib = 0;
      let cardContrib = 0;

      if (payment.method === 'cash') {
        cashContrib = cartTotal;
      } else if (payment.method === 'card') {
        cardContrib = cartTotal;
      } else if (payment.method === 'split') {
        cashContrib = payment.splitCash || 0;
        cardContrib = payment.splitCard || 0;
      }

      setCurrentShift({
        ...currentShift,
        cashSales: Number((currentShift.cashSales + cashContrib).toFixed(2)),
        cardSales: Number((currentShift.cardSales + cardContrib).toFixed(2)),
        totalSales: Number((currentShift.totalSales + cartTotal).toFixed(2)),
        expectedCash: Number((currentShift.expectedCash + cashContrib).toFixed(2)),
        transactionsCount: currentShift.transactionsCount + 1,
      });
    }

    // Save transaction to internal records & Firestore
    setTransactions((prev) => [newTx, ...prev]);
    setDoc(doc(db, 'sales', newTx.id), sanitizeForFirestore(newTx))
      .catch(e => handleFirestoreError(e, OperationType.WRITE, 'sales'));

    // Clear cart (no receipt modal / print generated)
    setCart([]);
    setActiveReceipt(null);
    showToast(`Record #${receiptNum} saved to live records across all devices.`);

    return newTx;
  };

  // Direct internal service job recording
  const recordServiceJob = (job: {
    name: string;
    category?: string;
    details: string;
    price: number;
    cost: number;
    customerName?: string;
    notes?: string;
  }): SaleTransaction => {
    if (!currentUser) {
      throw new Error('Must be logged in to record service jobs');
    }

    const receiptNum = `JOB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const taxRate = settings.taxEnabled !== false ? (settings.taxRate ?? 0.15) : 0;
    const taxTotal = Number((job.price * taxRate).toFixed(2));
    const total = Number((job.price + taxTotal).toFixed(2));
    const grossProfit = Number((job.price - job.cost).toFixed(2));

    const item: CartItem = {
      id: `srv-${Date.now()}`,
      type: 'service',
      name: job.name,
      category: job.category || 'Print & Copy Services',
      details: job.details,
      unitPrice: job.price,
      costPrice: job.cost,
      quantity: 1,
      discountPercent: 0,
      taxable: true,
    };

    const newTx: SaleTransaction = {
      id: `tx-${Date.now()}`,
      receiptNumber: receiptNum,
      timestamp: new Date().toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerName: job.customerName?.trim() || undefined,
      items: [item],
      subtotal: job.price,
      discountTotal: 0,
      taxTotal,
      taxRate,
      total,
      costTotal: job.cost,
      grossProfit,
      payment: {
        method: 'store_credit',
      },
      status: 'completed',
      shiftId: 'internal-records',
      notes: job.notes,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setDoc(doc(db, 'sales', newTx.id), sanitizeForFirestore(newTx))
      .catch(e => handleFirestoreError(e, OperationType.WRITE, 'sales'));
    setActiveReceipt(null);
    showToast(`Service Record #${receiptNum} saved to live database across all devices.`);
    return newTx;
  };

  // 1. Record Sale: Creates internal sales record & EDITS INVENTORY AUTOMATICALLY (deducts stock)
  const recordSale = (saleData: {
    items: {
      productId?: string;
      name: string;
      sku?: string;
      category?: string;
      quantity: number;
      unitPrice: number;
      costPrice?: number;
      discountPercent?: number;
      details?: string;
    }[];
    customerName?: string;
    customerEmail?: string;
    notes?: string;
    paymentMethod?: PaymentMethod;
    date?: string;
    time?: string;
    timestamp?: string;
    noReceipt?: boolean;
    receiptPreference?: 'printed' | 'no_receipt' | 'email';
  }): SaleTransaction => {
    if (!currentUser) {
      throw new Error('Must be logged in to record sales');
    }
    if (!saleData.items || saleData.items.length === 0) {
      throw new Error('Sale must contain at least one item');
    }

    const refNum = `SL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const cartItems: CartItem[] = saleData.items.map((it, idx) => ({
      id: `sale-item-${Date.now()}-${idx}`,
      type: 'product',
      productId: it.productId,
      name: it.name,
      category: it.category || 'General Merchandise',
      details: it.details,
      unitPrice: it.unitPrice,
      costPrice: it.costPrice || 0,
      quantity: it.quantity,
      discountPercent: it.discountPercent || 0,
      taxable: true,
    }));

    const subtotal = Number(cartItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0).toFixed(2));
    const discountTotal = Number(
      cartItems.reduce((sum, it) => sum + (it.unitPrice * it.quantity * (it.discountPercent / 100)), 0).toFixed(2)
    );
    const netTaxable = Math.max(0, subtotal - discountTotal);
    const taxRate = settings.taxEnabled !== false ? (settings.taxRate ?? 0.15) : 0;
    const taxTotal = Number((netTaxable * taxRate).toFixed(2));
    const total = Number((netTaxable + taxTotal).toFixed(2));
    const costTotal = Number(cartItems.reduce((sum, it) => sum + (it.costPrice || 0) * it.quantity, 0).toFixed(2));
    const grossProfit = Number((netTaxable - costTotal).toFixed(2));

    const isNoReceipt = saleData.noReceipt ?? (saleData.receiptPreference === 'no_receipt');

    const newTx: SaleTransaction = {
      id: `tx-${Date.now()}`,
      receiptNumber: refNum,
      timestamp: saleData.timestamp || resolveAccurateTimestamp(saleData.date, saleData.time),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerName: saleData.customerName?.trim() || undefined,
      customerEmail: saleData.customerEmail?.trim() || undefined,
      items: cartItems,
      subtotal,
      discountTotal,
      taxTotal,
      taxRate,
      total,
      costTotal,
      grossProfit,
      payment: {
        method: saleData.paymentMethod || 'cash',
      },
      status: 'completed',
      shiftId: 'internal-records',
      notes: saleData.notes,
      noReceipt: isNoReceipt,
      receiptPreference: saleData.receiptPreference || (isNoReceipt ? 'no_receipt' : 'printed'),
    };

    // AUTOMATICALLY EDIT INVENTORY: Deduct stock for all items sold
    setProducts((prev) =>
      prev.map((prod) => {
        const soldMatch = cartItems.filter(
          (c) => (c.productId && c.productId === prod.id) || c.name.toLowerCase() === prod.name.toLowerCase()
        );
        if (soldMatch.length > 0) {
          const totalQtySold = soldMatch.reduce((sum, c) => sum + c.quantity, 0);
          const remainingStock = Math.max(0, prod.stock - totalQtySold);
          // Persist product stock to Firestore
          setDoc(doc(db, 'products', prod.id), sanitizeForFirestore({ ...prod, stock: remainingStock }), { merge: true })
            .catch(e => handleFirestoreError(e, OperationType.WRITE, 'products'));
          return {
            ...prod,
            stock: remainingStock,
          };
        }
        return prod;
      })
    );

    // Save transaction to internal state & Firestore live database
    setTransactions((prev) => [newTx, ...prev]);
    setDoc(doc(db, 'sales', newTx.id), sanitizeForFirestore(newTx))
      .catch(e => handleFirestoreError(e, OperationType.WRITE, 'sales'));

    showToast(`Sale #${refNum} recorded (${isNoReceipt ? 'No receipt requested' : 'Receipt issued'}). Inventory deducted automatically.`);
    return newTx;
  };

  // Update Receipt Status for an existing Sale Transaction (e.g. customer declines receipt or requests late copy)
  const updateSaleReceiptStatus = (saleId: string, noReceipt: boolean) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === saleId) {
          const updated: SaleTransaction = {
            ...tx,
            noReceipt,
            receiptPreference: noReceipt ? 'no_receipt' : 'printed',
          };
          setDoc(doc(db, 'sales', tx.id), sanitizeForFirestore(updated), { merge: true })
            .catch(e => handleFirestoreError(e, OperationType.WRITE, 'sales'));
          return updated;
        }
        return tx;
      })
    );
  };

  // 2. Record Purchase: Creates supplier PO record & EDITS INVENTORY AUTOMATICALLY (adds stock & updates cost)
  const recordPurchase = (purchaseData: {
    poNumber?: string;
    supplierName?: string;
    supplierInvoice?: string;
    items: {
      productId?: string;
      name: string;
      sku?: string;
      category?: string;
      unitCost: number;
      quantity: number;
      updateCostPrice?: boolean;
      sellingPrice?: number;
    }[];
    paymentStatus?: 'paid' | 'pending' | 'on_account';
    status?: 'received' | 'ordered' | 'pending';
    notes?: string;
    date?: string;
    time?: string;
    timestamp?: string;
  }): PurchaseTransaction => {
    if (!currentUser) {
      throw new Error('Must be logged in to record purchases');
    }
    if (!purchaseData.items || purchaseData.items.length === 0) {
      throw new Error('Purchase order must contain at least one line item');
    }

    const poNumber = purchaseData.poNumber?.trim() || `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const purchaseItems: PurchaseItem[] = purchaseData.items.map((it, idx) => {
      const totalCost = Number((it.unitCost * it.quantity).toFixed(2));
      return {
        id: `po-item-${Date.now()}-${idx}`,
        productId: it.productId || `prod-gen-${Date.now()}-${idx}`,
        name: it.name,
        sku: it.sku || `SKU-${Date.now().toString().slice(-4)}`,
        category: it.category || 'General Supplies',
        unitCost: it.unitCost,
        quantity: it.quantity,
        totalCost,
      };
    });

    const totalCost = Number(purchaseItems.reduce((sum, it) => sum + it.totalCost, 0).toFixed(2));
    const totalUnits = purchaseItems.reduce((sum, it) => sum + it.quantity, 0);

    const newPO: PurchaseTransaction = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierName: purchaseData.supplierName?.trim() || 'General Vendor',
      supplierInvoice: purchaseData.supplierInvoice?.trim() || undefined,
      timestamp: purchaseData.timestamp || resolveAccurateTimestamp(purchaseData.date, purchaseData.time),
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      items: purchaseItems,
      totalCost,
      itemCount: totalUnits,
      status: purchaseData.status || 'received',
      paymentStatus: purchaseData.paymentStatus || 'paid',
      notes: purchaseData.notes,
    };

    // AUTOMATICALLY EDIT INVENTORY: Increase stock and update cost/selling prices
    setProducts((prev) => {
      const updated = [...prev];
      purchaseData.items.forEach((pItem) => {
        const matchIndex = updated.findIndex((p) => 
          (pItem.productId && p.id === pItem.productId) || 
          (pItem.sku && p.sku.toLowerCase() === pItem.sku.toLowerCase()) ||
          p.name.toLowerCase() === pItem.name.toLowerCase()
        );

        if (matchIndex > -1) {
          const existing = updated[matchIndex];
          const newStock = existing.stock + pItem.quantity;
          const newCost = pItem.updateCostPrice !== false ? pItem.unitCost : existing.costPrice;
          const newPrice = pItem.sellingPrice !== undefined && pItem.sellingPrice > 0 ? pItem.sellingPrice : existing.price;
          const updatedProd: Product = {
            ...existing,
            stock: newStock,
            costPrice: newCost,
            price: newPrice,
          };
          updated[matchIndex] = updatedProd;

          // Persist product to Firestore
          setDoc(doc(db, 'products', updatedProd.id), sanitizeForFirestore(updatedProd), { merge: true })
            .catch(e => handleFirestoreError(e, OperationType.WRITE, 'products'));
        } else {
          // Add new product automatically to inventory catalog
          const newProduct: Product = {
            id: pItem.productId || `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: pItem.name,
            sku: pItem.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            category: (pItem.category as any) || 'Office & Desk',
            costPrice: pItem.unitCost,
            price: pItem.sellingPrice || Number((pItem.unitCost * 1.6).toFixed(2)),
            stock: pItem.quantity,
            minStockAlert: 5,
            unit: 'each',
            description: `Auto-cataloged from Purchase ${poNumber} (${purchaseData.supplierName})`,
          };
          updated.unshift(newProduct);

          // Persist new product to Firestore
          setDoc(doc(db, 'products', newProduct.id), sanitizeForFirestore(newProduct))
            .catch(e => handleFirestoreError(e, OperationType.WRITE, 'products'));
        }
      });
      return updated;
    });

    // Save PO to internal state & Firestore live database
    setPurchases((prev) => [newPO, ...prev]);
    setDoc(doc(db, 'purchases', newPO.id), sanitizeForFirestore(newPO))
      .catch(e => handleFirestoreError(e, OperationType.WRITE, 'purchases'));

    showToast(`Purchase ${poNumber} recorded. Inventory restocked (+${totalUnits} units) across all devices.`);
    return newPO;
  };

  // Park tickets
  const parkCurrentTicket = (label?: string, customerName?: string) => {
    if (cart.length === 0) {
      showToast('Ticket is empty; nothing to hold.');
      return;
    }
    const newParked: ParkedTicket = {
      id: `parked-${Date.now()}`,
      name: label || `Held Ticket #${parkedTickets.length + 1}`,
      timestamp: new Date().toISOString(),
      cashierName: currentUser?.name || 'Staff',
      items: [...cart],
      customerName,
    };
    setParkedTickets(prev => [newParked, ...prev]);
    setCart([]);
    showToast(`Ticket saved on hold (${newParked.name})`);
  };

  const restoreParkedTicket = (ticketId: string) => {
    const target = parkedTickets.find(t => t.id === ticketId);
    if (!target) return;
    if (cart.length > 0) {
      // Park current first or warn
      parkCurrentTicket(`Auto-saved before restoring ${target.name}`);
    }
    setCart(target.items);
    setParkedTickets(prev => prev.filter(t => t.id !== ticketId));
    showToast(`Restored held order: ${target.name}`);
  };

  const deleteParkedTicket = (ticketId: string) => {
    setParkedTickets(prev => prev.filter(t => t.id !== ticketId));
    showToast('Deleted held ticket.');
  };

  // Drawer / Shift management
  const openShiftDrawer = (openingFloat: number, notes?: string) => {
    if (!currentUser) return;
    const newShift: CashDrawerShift = {
      id: `shift-${Date.now()}`,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      openedAt: new Date().toISOString(),
      openingFloat: Number(openingFloat.toFixed(2)),
      cashSales: 0,
      cardSales: 0,
      totalSales: 0,
      cashDrops: 0,
      expectedCash: Number(openingFloat.toFixed(2)),
      transactionsCount: 0,
      status: 'open',
      notes,
    };
    setCurrentShift(newShift);
    showToast(`New drawer shift opened with float ETB ${openingFloat.toFixed(2)}`);
  };

  const performCashDrop = (amount: number, reason: string) => {
    if (!currentShift) return;
    if (amount <= 0 || amount > currentShift.expectedCash) {
      showToast('Invalid cash drop amount.');
      return;
    }
    const updated: CashDrawerShift = {
      ...currentShift,
      cashDrops: Number((currentShift.cashDrops + amount).toFixed(2)),
      expectedCash: Number((currentShift.expectedCash - amount).toFixed(2)),
      notes: currentShift.notes 
        ? `${currentShift.notes}\n[Drop ETB ${amount.toFixed(2)}: ${reason}]`
        : `[Drop ETB ${amount.toFixed(2)}: ${reason}]`,
    };
    setCurrentShift(updated);
    showToast(`Safe cash drop of ETB ${amount.toFixed(2)} recorded.`);
  };

  const closeShiftDrawer = (actualCashCounted: number, notes?: string): CashDrawerShift => {
    if (!currentShift) throw new Error('No active shift to close.');
    const discrepancy = Number((actualCashCounted - currentShift.expectedCash).toFixed(2));
    const closed: CashDrawerShift = {
      ...currentShift,
      closedAt: new Date().toISOString(),
      actualCashCounted: Number(actualCashCounted.toFixed(2)),
      discrepancy,
      status: 'closed',
      notes: notes || currentShift.notes,
    };
    setShiftHistory(prev => [closed, ...prev]);
    setCurrentShift(null);
    showToast(`Shift closed. Drawer discrepancy: ${discrepancy >= 0 ? '+' : ''}ETB ${discrepancy.toFixed(2)}`);
    return closed;
  };

  // Inventory actions
  // Inventory actions with live Firestore synchronization
  const addProduct = (newProd: Omit<Product, 'id'>): Product => {
    const prod: Product = {
      ...newProd,
      id: `prod-item-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setProducts(prev => {
      const filtered = prev.filter(p => p.id !== prod.id);
      const updated = [prod, ...filtered];
      try {
        localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setDoc(doc(db, 'products', prod.id), sanitizeForFirestore(prod))
      .catch(e => handleFirestoreError(e, OperationType.WRITE, 'products'));
    showToast(`Added "${prod.name}" to inventory.`);
    return prod;
  };

  const bulkImportProducts = (
    items: Omit<Product, 'id'>[],
    mode: 'append' | 'upsert' | 'replace'
  ): BulkImportResult => {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    if (mode === 'replace') {
      const newCatalog: Product[] = items.map((it, idx) => ({
        ...it,
        id: `prod-imp-${Date.now()}-${idx}`,
      }));
      setProducts(newCatalog);
      // Batch write to Firestore
      try {
        const batch = writeBatch(db);
        newCatalog.forEach(p => batch.set(doc(db, 'products', p.id), sanitizeForFirestore(p)));
        batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, 'products'));
      } catch (e) {}
      added = newCatalog.length;
      showToast(`Catalog replaced with ${added} items from Excel.`);
      return { added, updated, skipped };
    }

    setProducts((prev) => {
      const currentList = [...prev];
      const batch = writeBatch(db);

      items.forEach((item, idx) => {
        // Find matching item by SKU or Barcode
        const existingIndex = currentList.findIndex(
          p => (item.sku && p.sku.trim().toLowerCase() === item.sku.trim().toLowerCase()) || 
               (item.barcode && p.barcode && p.barcode.trim() === item.barcode.trim())
        );

        if (existingIndex > -1) {
          if (mode === 'upsert') {
            const up: Product = {
              ...currentList[existingIndex],
              name: item.name || currentList[existingIndex].name,
              category: item.category || currentList[existingIndex].category,
              price: item.price !== undefined ? item.price : currentList[existingIndex].price,
              costPrice: item.costPrice !== undefined ? item.costPrice : currentList[existingIndex].costPrice,
              stock: item.stock !== undefined ? item.stock : currentList[existingIndex].stock,
              minStockAlert: item.minStockAlert !== undefined ? item.minStockAlert : currentList[existingIndex].minStockAlert,
              unit: item.unit || currentList[existingIndex].unit,
              description: item.description || currentList[existingIndex].description,
            };
            currentList[existingIndex] = up;
            batch.set(doc(db, 'products', up.id), sanitizeForFirestore(up), { merge: true });
            updated++;
          } else {
            // Append mode: generate differentiated SKU if existing
            const disambiguated: Product = {
              ...item,
              id: `prod-imp-${Date.now()}-${idx}`,
              sku: item.sku ? `${item.sku}-DUP` : `ST-${Date.now().toString().slice(-4)}`,
            };
            currentList.unshift(disambiguated);
            batch.set(doc(db, 'products', disambiguated.id), sanitizeForFirestore(disambiguated));
            added++;
          }
        } else {
          const newProduct: Product = {
            ...item,
            id: `prod-imp-${Date.now()}-${idx}`,
          };
          currentList.unshift(newProduct);
          batch.set(doc(db, 'products', newProduct.id), sanitizeForFirestore(newProduct));
          added++;
        }
      });

      batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, 'products'));
      return currentList;
    });

    showToast(`Bulk Import complete: ${added} added, ${updated} updated.`);
    return { added, updated, skipped };
  };

  const updateProduct = (updatedProd: Product) => {
    setProducts(prev => prev.map(p => (p.id === updatedProd.id ? updatedProd : p)));
    setDoc(doc(db, 'products', updatedProd.id), sanitizeForFirestore(updatedProd), { merge: true })
      .catch(e => handleFirestoreError(e, OperationType.WRITE, 'products'));
    showToast(`Updated product ${updatedProd.name}.`);
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    deleteDoc(doc(db, 'products', productId))
      .catch(e => handleFirestoreError(e, OperationType.DELETE, 'products'));
    showToast('Product removed from catalog.');
  };

  const adjustStock = (productId: string, delta: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock + delta);
          const updated = { ...p, stock: newStock };
          setDoc(doc(db, 'products', productId), sanitizeForFirestore(updated), { merge: true })
            .catch(e => handleFirestoreError(e, OperationType.WRITE, 'products'));
          return updated;
        }
        return p;
      })
    );
    showToast(`Stock updated (${delta > 0 ? `+${delta}` : delta}) across devices.`);
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings(prev => {
      const merged = { ...prev, ...newSettings, currencySymbol: 'ETB' };
      if (newSettings.inactivityTimeoutMinutes !== undefined) {
        setInactivityTimeoutMinutes(newSettings.inactivityTimeoutMinutes);
        localStorage.setItem(`${STORAGE_PREFIX}inactivity_timeout_mins`, String(newSettings.inactivityTimeoutMinutes));
      }
      localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(merged));
      setDoc(doc(db, 'settings', 'store_config'), sanitizeForFirestore(merged), { merge: true })
        .catch(e => handleFirestoreError(e, OperationType.WRITE, 'settings'));
      return merged;
    });
    showToast('Store settings updated.');
  };

  const importDatabaseBackup = (backupData: any): boolean => {
    try {
      if (!backupData || typeof backupData !== 'object') {
        showToast('Invalid backup file format.');
        return false;
      }
      if (Array.isArray(backupData.products)) {
        setProducts(backupData.products);
        localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(backupData.products));
        const batch = writeBatch(db);
        backupData.products.forEach((p: Product) => {
          if (p && p.id) {
            batch.set(doc(db, 'products', p.id), sanitizeForFirestore(p), { merge: true });
          }
        });
        batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, 'products'));
      }
      if (Array.isArray(backupData.transactions)) {
        setTransactions(backupData.transactions);
        localStorage.setItem(`${STORAGE_PREFIX}transactions`, JSON.stringify(backupData.transactions));
      }
      if (Array.isArray(backupData.purchases)) {
        setPurchases(backupData.purchases);
        localStorage.setItem(`${STORAGE_PREFIX}purchases`, JSON.stringify(backupData.purchases));
      }
      if (backupData.settings && typeof backupData.settings === 'object') {
        const mergedSettings = { ...backupData.settings, currencySymbol: 'ETB' };
        setSettings(mergedSettings);
        localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(mergedSettings));
        setDoc(doc(db, 'settings', 'store_config'), sanitizeForFirestore(mergedSettings), { merge: true })
          .catch(e => handleFirestoreError(e, OperationType.WRITE, 'settings'));
      }
      showToast('Store database backup restored successfully.');
      return true;
    } catch (err) {
      console.error('Backup import error:', err);
      showToast('Error restoring backup file.');
      return false;
    }
  };

  const resetAllData = async () => {
    setTransactions([]);
    setPurchases([]);
    setCart([]);
    setParkedTickets([]);
    setShiftHistory([]);
    setProducts([]);
    setSettings(INITIAL_SETTINGS);
    setCurrentUser(null);
    setLastLockedUser(null);
    setIsSessionTimedOut(false);
    setShowInactivityWarning(false);
    setActiveTab('home');
    setCurrentShift(null);

    try {
      localStorage.setItem(`${STORAGE_PREFIX}transactions`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_PREFIX}purchases`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_PREFIX}cart`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_PREFIX}parked`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_PREFIX}shiftHistory`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(INITIAL_SETTINGS));
      localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify([]));
      localStorage.removeItem(`${STORAGE_PREFIX}persistent_session`);
      localStorage.removeItem(`${STORAGE_PREFIX}active_session`);
      localStorage.removeItem(`${STORAGE_PREFIX}currentShift`);
      sessionStorage.clear();

      // Clear all Firestore products
      const prodsSnap = await getDocs(collection(db, 'products'));
      if (!prodsSnap.empty) {
        const batchProds = writeBatch(db);
        prodsSnap.docs.forEach(d => batchProds.delete(d.ref));
        await batchProds.commit();
      }

      await setDoc(doc(db, 'settings', 'store_config'), sanitizeForFirestore(INITIAL_SETTINGS));

      const salesSnap = await getDocs(collection(db, 'sales'));
      if (!salesSnap.empty) {
        const batchSales = writeBatch(db);
        salesSnap.docs.forEach(d => batchSales.delete(d.ref));
        await batchSales.commit();
      }

      const purchasesSnap = await getDocs(collection(db, 'purchases'));
      if (!purchasesSnap.empty) {
        const batchPurchases = writeBatch(db);
        purchasesSnap.docs.forEach(d => batchPurchases.delete(d.ref));
        await batchPurchases.commit();
      }
    } catch (e) {
      console.error('resetAllData error:', e);
    }

    showToast('Database reset to clean empty state. Please sign in.');
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  // 1. "Yearly" Reset: Clears operational transactions (sales, purchases, shifts) for the closed financial year while keeping products, inventory stock, user accounts, and store settings
  const resetYearlyData = async () => {
    // 1. Instantly clear local state for responsive UI
    setTransactions([]);
    setPurchases([]);
    setCart([]);
    setParkedTickets([]);
    setShiftHistory([]);
    setCurrentShift(null);

    // 2. Clear localStorage keys explicitly
    localStorage.setItem(`${STORAGE_PREFIX}transactions`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}purchases`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}parked`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}shiftHistory`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}cart`, JSON.stringify([]));
    localStorage.removeItem(`${STORAGE_PREFIX}currentShift`);

    // 3. Delete existing sales and purchases records from Firestore
    try {
      const salesSnap = await getDocs(collection(db, 'sales'));
      if (!salesSnap.empty) {
        const batchSales = writeBatch(db);
        salesSnap.docs.forEach(docSnap => batchSales.delete(docSnap.ref));
        await batchSales.commit();
      }

      const purchasesSnap = await getDocs(collection(db, 'purchases'));
      if (!purchasesSnap.empty) {
        const batchPurchases = writeBatch(db);
        purchasesSnap.docs.forEach(docSnap => batchPurchases.delete(docSnap.ref));
        await batchPurchases.commit();
      }
    } catch (e) {
      console.error('Firestore yearly cleanup error:', e);
    }

    showToast('Yearly reset completed: Financial year records cleared. Inventory & users preserved.');
  };

  // 2. "Full reset with user removal": Complete factory wipe. Clears all data, removes all accounts and catalog items, wipes Firestore collections
  const fullResetWithUserRemoval = async () => {
    // 1. Set local state to clean initial defaults
    setTransactions([]);
    setPurchases([]);
    setCart([]);
    setParkedTickets([]);
    setShiftHistory([]);
    setProducts([]);
    setSettings(INITIAL_SETTINGS);
    setUsers([]);
    setCurrentUser(null);
    setLastLockedUser(null);
    setIsSessionTimedOut(false);
    setShowInactivityWarning(false);
    setActiveTab('home');
    setCurrentShift(null);

    // 2. Explicitly write clean initial storage
    try {
      localStorage.setItem(`${STORAGE_PREFIX}transactions`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_PREFIX}purchases`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_PREFIX}cart`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_PREFIX}parked`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_PREFIX}shiftHistory`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(INITIAL_SETTINGS));
      localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify([]));
      localStorage.removeItem(`${STORAGE_PREFIX}persistent_session`);
      localStorage.removeItem(`${STORAGE_PREFIX}active_session`);
      localStorage.removeItem(`${STORAGE_PREFIX}currentShift`);
      sessionStorage.clear();
    } catch (e) {}

    // 3. Reset Firestore collections: products wiped, sales/purchases deleted, all users deleted
    try {
      // Clear all sales
      const salesSnap = await getDocs(collection(db, 'sales'));
      if (!salesSnap.empty) {
        const batchSales = writeBatch(db);
        salesSnap.docs.forEach(d => batchSales.delete(d.ref));
        await batchSales.commit();
      }

      // Clear all purchases
      const purchasesSnap = await getDocs(collection(db, 'purchases'));
      if (!purchasesSnap.empty) {
        const batchPurchases = writeBatch(db);
        purchasesSnap.docs.forEach(d => batchPurchases.delete(d.ref));
        await batchPurchases.commit();
      }

      // Clear all products
      const existingProductsSnap = await getDocs(collection(db, 'products'));
      if (!existingProductsSnap.empty) {
        const batchProds = writeBatch(db);
        existingProductsSnap.docs.forEach(d => batchProds.delete(d.ref));
        await batchProds.commit();
      }

      // Reset store settings
      await setDoc(doc(db, 'settings', 'store_config'), sanitizeForFirestore(INITIAL_SETTINGS));

      // Clear all users completely
      const usersSnap = await getDocs(collection(db, 'users'));
      if (!usersSnap.empty) {
        const batchUsers = writeBatch(db);
        usersSnap.docs.forEach(d => batchUsers.delete(d.ref));
        await batchUsers.commit();
      }
    } catch (e) {
      console.error('Firestore full reset error:', e);
    }

    showToast('Full reset complete: All users, sessions, and data removed. Please sign in.');
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <POSContext.Provider
      value={{
        currentUser,
        users,
        isUsersLoaded,
        currentShift,
        shiftHistory,
        products,
        cart,
        parkedTickets,
        transactions,
        purchases,
        settings,
        activeReceipt,
        activeTab,
        isAuthModalOpen,
        toastMessage,

        // Live Cloud Database (Firestore)
        isCloudConnected,

        // Barcode & QR Scanner
        isScannerOpen,
        setIsScannerOpen,
        scannerTarget,
        openScanner,
        closeScanner,
        scannedSaleEvent,
        triggerScannedSaleProduct,
        scannedPurchaseEvent,
        triggerScannedPurchaseProduct,
        scannedInventoryEvent,
        triggerScannedInventoryCode,

        // Prefill for PO Reorder
        prefillPurchaseItems,
        setPrefillPurchaseItems,

        // Session & Inactivity Timeout State
        lastLockedUser,
        isSessionTimedOut,
        setIsSessionTimedOut,
        inactivityTimeoutMinutes,
        setInactivityTimeoutMinutes,
        showInactivityWarning,
        inactivitySecondsLeft,
        staySignedIn,

        setCurrentUser,
        setActiveTab,
        setIsAuthModalOpen,
        showToast,

        login,
        loginWithCredentials,
        signup,
        logout,
        lockTerminal,
        switchUser,
        updateUserPassword,
        updateUserPin,
        updateMasterPasscode,
        deleteUserAccount,
        removeAllUsers,
        generateRandomPassword,

        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartDiscount,
        updateCartPrice,
        clearCart,
        cartSubtotal,
        cartDiscountTotal,
        cartTaxTotal,
        cartTotal,

        completeSale,
        recordSale,
        updateSaleReceiptStatus,
        recordPurchase,
        recordServiceJob,
        setActiveReceipt,

        parkCurrentTicket,
        restoreParkedTicket,
        deleteParkedTicket,

        openShiftDrawer,
        performCashDrop,
        closeShiftDrawer,

        addProduct,
        bulkImportProducts,
        updateProduct,
        deleteProduct,
        adjustStock,

        updateSettings,
        resetAllData,
        resetYearlyData,
        fullResetWithUserRemoval,
        importDatabaseBackup,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
