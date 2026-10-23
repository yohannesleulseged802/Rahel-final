import { Product, StoreSettings, User, CashDrawerShift, PurchaseTransaction } from '../types';

export const INITIAL_USERS: User[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_OPEN_SHIFT: CashDrawerShift | null = null;

export const INITIAL_PURCHASES: PurchaseTransaction[] = [];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'Rahel Stationary & Print Services',
  tagline: 'Fine Papers, Office Supplies & Document Finishing Bureau',
  address: '142 Merchant Street, Suite 4B, City Center, Addis Ababa, Ethiopia',
  phone: '+251 911 382 749',
  email: 'contact@rahelstationary.site',
  tinNumber: '0048291048-TIN',
  currencySymbol: 'ETB',
  taxRate: 0.15, // 15% Ethiopian VAT
  taxEnabled: true,
  taxIncludedInPrice: false,
  receiptHeader: 'Official Sales Receipt & Invoice',
  receiptFooterMessage: 'Thank you for choosing Rahel Stationary! Quality guaranteed on all print & merchandise.',
  receiptPaperSize: '80mm',
  autoPrintReceipt: true,
  showCashierOnReceipt: true,
  showTinOnReceipt: true,
  allowNoReceiptOption: true,
  defaultReceiptOption: 'print',
  lowStockThreshold: 10,
  negativeStockAllowed: false,
  defaultMarkupPercent: 40,
  barcodeFormat: 'CODE128',
  inactivityTimeoutMinutes: 10,
  requirePinForRefund: true,
  soundEffects: true,
  masterPasscode: 'RahelF1234',
};
