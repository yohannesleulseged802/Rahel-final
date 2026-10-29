export type UserRole = 'cashier' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatarColor: string;
  createdAt?: string;
  // Cryptographic salted hash credentials (never stored in plain text!)
  passwordHash?: string;
  passwordSalt?: string;
  pinHash?: string;
  pinSalt?: string;
  // Legacy fields (optional for migration)
  pin?: string;
  password?: string;
}

export type ProductCategory = 
  | 'Notebooks & Paper'
  | 'Writing Instruments'
  | 'Office & Desk'
  | 'Filing & Folders'
  | 'Art & Craft'
  | 'Print & Copy Services'
  | (string & {});

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: ProductCategory;
  price: number;
  costPrice: number;
  stock: number;
  minStockAlert: number;
  unit: string;
  description: string;
  isService?: boolean;
}

export interface ParsedImportItem {
  rowNumber: number;
  name: string;
  sku: string;
  barcode: string;
  category: ProductCategory;
  price: number;
  costPrice: number;
  stock: number;
  minStockAlert: number;
  unit: string;
  description: string;
  isValid: boolean;
  status: 'valid' | 'warning' | 'error';
  issues: string[];
  isExistingMatch?: boolean;
  matchedProductId?: string;
}

export interface BulkImportResult {
  added: number;
  updated: number;
  skipped: number;
}

export type ServiceType = 
  | 'print_copy'
  | 'binding'
  | 'lamination'
  | 'scanning'
  | 'custom_stamp'
  | 'passport_photo'
  | 'custom_job';

export interface ServiceJobConfig {
  serviceType: ServiceType;
  title: string;
  specifications: Record<string, any>;
  calculatedPrice: number;
  estimatedCost: number;
  customerName?: string;
  customerContact?: string;
  notes?: string;
}

export interface CartItem {
  id: string;
  type: 'product' | 'service';
  productId?: string;
  serviceType?: ServiceType;
  name: string;
  category: string;
  details?: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discountPercent: number; // 0 to 100
  taxable: boolean;
}

export type PaymentMethod = 
  | 'cbe' 
  | 'abyssinia' 
  | 'telebirr_maria' 
  | 'telebirr_rahel' 
  | 'awash' 
  | 'dashen' 
  | 'cash' 
  | 'card' 
  | 'split' 
  | 'store_credit' 
  | (string & {});

export const PAYMENT_METHOD_NAMES: Record<string, string> = {
  cbe: 'CBE (Commercial Bank of Ethiopia)',
  abyssinia: 'Abyssinia Bank',
  telebirr_maria: 'Telebirr (Maria)',
  telebirr_rahel: 'Telebirr (Rahel)',
  awash: 'Awash Bank',
  dashen: 'Dashen Bank',
  cash: 'Cash Settlement',
  card: 'Card / POS Terminal',
  split: 'Split Payment',
  store_credit: 'Internal Account / Store Credit'
};

export interface PaymentDetails {
  method: PaymentMethod;
  cashTendered?: number;
  changeGiven?: number;
  cardBrand?: string;
  cardLast4?: string;
  splitCash?: number;
  splitCard?: number;
}

export interface SaleTransaction {
  id: string;
  receiptNumber: string;
  timestamp: string; // ISO string
  cashierId: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  taxRate: number;
  total: number;
  costTotal: number;
  grossProfit: number;
  payment: PaymentDetails;
  status: 'completed' | 'refunded';
  shiftId: string;
  notes?: string;
  noReceipt?: boolean;
  receiptPreference?: 'printed' | 'no_receipt' | 'email';
}

export interface ParkedTicket {
  id: string;
  name: string;
  timestamp: string;
  cashierName: string;
  items: CartItem[];
  customerName?: string;
  notes?: string;
}

export interface CashDrawerShift {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  totalSales: number;
  cashDrops: number;
  expectedCash: number;
  actualCashCounted?: number;
  discrepancy?: number;
  transactionsCount: number;
  status: 'open' | 'closed';
  notes?: string;
}

export type TabType = 'home' | 'sales' | 'credit_ledger' | 'purchase' | 'inventory' | 'services' | 'expenses' | 'reports' | 'labels' | 'settings';

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  tinNumber?: string;
  currencySymbol: string;
  taxRate: number; // e.g. 0.15 for 15% VAT
  taxEnabled?: boolean;
  taxIncludedInPrice?: boolean;
  receiptHeader?: string;
  receiptFooterMessage: string;
  receiptPaperSize?: '80mm' | '58mm' | 'A4';
  autoPrintReceipt?: boolean;
  showCashierOnReceipt?: boolean;
  showTinOnReceipt?: boolean;
  allowNoReceiptOption?: boolean;
  defaultReceiptOption?: 'print' | 'no_receipt' | 'prompt';
  lowStockThreshold: number;
  negativeStockAllowed?: boolean;
  defaultMarkupPercent?: number;
  barcodeFormat?: 'CODE128' | 'EAN13';
  inactivityTimeoutMinutes?: number;
  requirePinForRefund?: boolean;
  soundEffects?: boolean;
  masterPasscode?: string;
}

export type LengthUnit = 'mm' | 'cm' | 'pt' | 'in';

export interface LabelTemplate {
  id: string;
  name: string;
  category: 'A4' | 'Custom' | 'Roll';
  sheetType: 'A4' | 'Custom' | 'Roll';
  width: number; // in target unit
  height: number;
  unit: LengthUnit;
  columns?: number;
  rows?: number;
  labelsPerSheet?: number;
  description: string;
}

export interface LabelItemTarget {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  category: string;
  quantityCopies: number;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  category: string;
  unitCost: number;
  quantity: number;
  totalCost: number;
  notes?: string;
}

export interface PurchaseTransaction {
  id: string;
  poNumber: string;
  supplierName?: string;
  supplierInvoice?: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  items: PurchaseItem[];
  totalCost: number;
  itemCount: number;
  status: 'received' | 'ordered' | 'pending';
  paymentStatus: 'paid' | 'pending' | 'on_account';
  notes?: string;
}

export type ExpenseCategory = 'fuel' | 'rent' | 'salary' | 'other';
export type TelebirrAccount = 'Telebirr (Maria)' | 'Telebirr (Rahel)';
export type ExpensePaymentAccount = 
  | 'CBE'
  | 'Abyssinia Bank'
  | 'Telebirr (Maria)'
  | 'Telebirr (Rahel)'
  | 'Awash Bank'
  | 'Dashen Bank'
  | 'Cash'
  | (string & {});

export interface ExpenseTransaction {
  id: string;
  expenseNumber: string; // e.g. EXP-1001
  category: ExpenseCategory; // 'fuel' | 'rent' | 'salary' | 'other'
  categoryLabel: string; // 'Fuel Expenses' | 'Rent' | 'Salary' | 'Other'
  amount: number;
  paidAccount: ExpensePaymentAccount; // 'Telebirr (Maria)' | 'Telebirr (Rahel)' | 'Cash'
  referenceNumber?: string; // Telebirr confirmation code / SMS receipt
  paidTo?: string; // Driver, Petrol Station, Landlord, Employee Name
  periodMonth?: string; // e.g. "October 2026"
  notes?: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  operatorId: string;
  operatorName: string;
}

export type CreditEntryType = 'issue_credit' | 'repayment';

export type CreditAccountStatus = 'active' | 'cleared' | 'overdue';

export interface CustomerCreditAccount {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  companyOrOrg?: string;
  creditLimit?: number;
  totalCreditIssued: number;
  totalRepaid: number;
  currentBalance: number;
  status: CreditAccountStatus;
  lastActivityDate: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditLedgerEntry {
  id: string;
  creditNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  type: CreditEntryType;
  amount: number;
  balanceAfter: number;
  paymentAccount?: ExpensePaymentAccount;
  referenceNumber?: string;
  itemsSummary?: string;
  saleReceiptNumber?: string;
  dueDate?: string;
  date: string;
  time: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  notes?: string;
}
