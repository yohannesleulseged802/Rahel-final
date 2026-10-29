import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  User, 
  ShoppingBag,
  CreditCard,
  Banknote,
  Building,
  FileText,
  Clock,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  Barcode,
  Printer,
  Leaf,
  FileDown,
  X,
  BookOpen,
  ExternalLink,
  UserCheck,
  Phone,
  ChevronDown
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product, PaymentMethod, SaleTransaction, PAYMENT_METHOD_NAMES, CustomerCreditAccount } from '../types';
import { generateSaleReceiptPDF } from '../utils/pdfExport';
import { 
  getLocalDateString, 
  getLocalTimeString, 
  formatLocalDateTime, 
  formatLocalDate, 
  formatLocalTime, 
  isSameLocalDate 
} from '../utils/dateTime';

interface SaleLineItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export const SalesManager: React.FC = () => {
  const { 
    products, 
    recordSale, 
    updateSaleReceiptStatus, 
    transactions, 
    settings, 
    showToast, 
    openScanner, 
    scannedSaleEvent,
    creditAccounts,
    setActiveTab
  } = usePOS();
  const lastHandledScanRef = useRef<number>(0);

  // Search & Selector State
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [saleItems, setSaleItems] = useState<SaleLineItem[]>([]);

  // Metadata with accurate local date and live clock time
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [saleDate, setSaleDate] = useState(() => getLocalDateString());
  const [saleTime, setSaleTime] = useState(() => getLocalTimeString());
  const [useCustomDateTime, setUseCustomDateTime] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Close customer picker dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Match existing Credit Ledger account by name or phone
  const matchedCreditAccount = useMemo(() => {
    if (!customerName.trim() || !Array.isArray(creditAccounts)) return null;
    const clean = customerName.trim().toLowerCase();
    return creditAccounts.find(a => 
      a.customerName.toLowerCase() === clean || 
      (a.phone && a.phone.toLowerCase() === clean)
    ) || null;
  }, [customerName, creditAccounts]);

  // Matching credit customers for search/autocomplete dropdown
  const matchingCreditCustomers = useMemo(() => {
    if (!Array.isArray(creditAccounts)) return [];
    const q = customerName.trim().toLowerCase();
    if (!q) return creditAccounts.slice(0, 8);
    return creditAccounts.filter(a => 
      a.customerName.toLowerCase().includes(q) ||
      (a.phone && a.phone.toLowerCase().includes(q)) ||
      (a.companyOrOrg && a.companyOrOrg.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [customerName, creditAccounts]);

  // Select a customer directly from the Credit Ledger list
  const handleSelectCreditCustomer = (acc: CustomerCreditAccount) => {
    setCustomerName(acc.customerName);
    if (acc.phone && acc.phone !== 'Not specified') {
      setCustomerPhone(acc.phone);
    }
    if (acc.email) {
      setCustomerEmail(acc.email);
    }
    setIsCustomerPickerOpen(false);
    showToast(`Linked customer "${acc.customerName}" from Credit Ledger.`);
  };

  // Quick reset to live current date and time
  const handleSetCurrentDateTime = () => {
    setSaleDate(getLocalDateString());
    setSaleTime(getLocalTimeString());
    setUseCustomDateTime(false);
    showToast('Sale timestamp synced to current date & time.');
  };

  // Receipt Options State (Customer can decline receipt / Paperless mode)
  const [noReceipt, setNoReceipt] = useState<boolean>(
    () => settings.allowNoReceiptOption !== false && settings.defaultReceiptOption === 'no_receipt'
  );
  const [completedSaleModal, setCompletedSaleModal] = useState<SaleTransaction | null>(null);

  // Sync noReceipt state if store default setting updates
  useEffect(() => {
    if (settings.allowNoReceiptOption === false) {
      setNoReceipt(false);
    } else {
      setNoReceipt(settings.defaultReceiptOption === 'no_receipt');
    }
  }, [settings.defaultReceiptOption, settings.allowNoReceiptOption]);

  // Selected Sale for Details Modal
  const [viewingSale, setViewingSale] = useState<SaleTransaction | null>(null);

  // Filtered Products for Picker
  const categories = ['All', 'Notebooks & Paper', 'Writing Instruments', 'Office & Desk', 'Filing & Folders', 'Art & Craft'];

  const filteredCatalog = useMemo(() => {
    return products.filter((p) => {
      const q = productSearch.toLowerCase().trim();
      const matchText = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchText && matchCat;
    });
  }, [products, productSearch, selectedCategory]);

  // Add Item to Current Sale
  const handleAddItem = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`Warning: "${product.name}" is currently out of stock (0 units).`);
    }

    setSaleItems((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock && product.stock > 0) {
          showToast(`Note: Added quantity exceeds available stock (${product.stock} units).`);
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [
        ...prev,
        {
          id: `line-${Date.now()}-${Math.random()}`,
          product,
          quantity: 1,
          unitPrice: product.price,
          discountPercent: 0,
        }
      ];
    });

    setProductSearch('');
  };

  // Automatically add scanned item when dispatched from BarcodeScannerModal
  useEffect(() => {
    if (scannedSaleEvent && scannedSaleEvent.timestamp > lastHandledScanRef.current) {
      lastHandledScanRef.current = scannedSaleEvent.timestamp;
      handleAddItem(scannedSaleEvent.product);
    }
  }, [scannedSaleEvent]);

  // Allow direct barcode scan / Enter key inside search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && productSearch.trim()) {
      e.preventDefault();
      const q = productSearch.trim();
      const lower = q.toLowerCase();
      const exact = products.find(
        p => p.barcode === q || p.sku.toLowerCase() === lower || p.id.toLowerCase() === lower
      );
      if (exact) {
        handleAddItem(exact);
      } else if (filteredCatalog.length === 1) {
        handleAddItem(filteredCatalog[0]);
      }
    }
  };

  const handleUpdateQuantity = (lineId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(lineId);
      return;
    }
    setSaleItems(prev => prev.map(item => {
      if (item.id === lineId) {
        if (qty > item.product.stock && item.product.stock > 0) {
          showToast(`Warning: Only ${item.product.stock} units in inventory for ${item.product.name}`);
        }
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const handleUpdatePrice = (lineId: string, price: number) => {
    setSaleItems(prev => prev.map(item => 
      item.id === lineId ? { ...item, unitPrice: Math.max(0, price) } : item
    ));
  };

  const handleUpdateDiscount = (lineId: string, disc: number) => {
    setSaleItems(prev => prev.map(item => 
      item.id === lineId ? { ...item, discountPercent: Math.min(100, Math.max(0, disc)) } : item
    ));
  };

  const handleRemoveItem = (lineId: string) => {
    setSaleItems(prev => prev.filter(item => item.id !== lineId));
  };

  const handleClearSale = () => {
    setSaleItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setNotes('');
    setIsCustomerPickerOpen(false);
    setNoReceipt(settings.allowNoReceiptOption !== false && settings.defaultReceiptOption === 'no_receipt');
  };

  // Calculations
  const subtotal = useMemo(() => {
    return saleItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [saleItems]);

  const discountTotal = useMemo(() => {
    return saleItems.reduce((sum, item) => {
      const line = item.unitPrice * item.quantity;
      return sum + (line * (item.discountPercent / 100));
    }, 0);
  }, [saleItems]);

  const netTaxable = Math.max(0, subtotal - discountTotal);
  const effectiveTaxRate = settings.taxEnabled !== false ? (settings.taxRate ?? 0.15) : 0;
  const taxTotal = netTaxable * effectiveTaxRate;
  const grandTotal = netTaxable + taxTotal;
  const costTotal = useMemo(() => {
    return saleItems.reduce((sum, item) => sum + item.product.costPrice * item.quantity, 0);
  }, [saleItems]);
  const estimatedProfit = Math.max(0, netTaxable - costTotal);
  const profitMargin = netTaxable > 0 ? (estimatedProfit / netTaxable) * 100 : 0;

  // Submit Sale & Deduct Stock
  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) {
      showToast('Please add at least one product to the sale order.');
      return;
    }

    // When payment method is Store Credit, Customer Name is strictly required
    if (paymentMethod === 'store_credit' && !customerName.trim()) {
      showToast('Customer name is required when using Store Credit to record in the Credit Ledger.');
      setIsCustomerPickerOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsPayload = saleItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        category: item.product.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: item.product.costPrice,
        discountPercent: item.discountPercent,
        details: `${item.product.unit || 'units'} · SKU: ${item.product.sku}`,
      }));

      const timestampPayload = useCustomDateTime 
        ? `${saleDate}T${saleTime}` 
        : new Date().toISOString();

      const createdTx = recordSale({
        items: itemsPayload,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        paymentMethod,
        date: timestampPayload,
        noReceipt,
      });

      handleClearSale();
      setUseCustomDateTime(false);
      setSaleDate(getLocalDateString());
      setSaleTime(getLocalTimeString());
      setIsSubmitting(false);

      // If customer requested a receipt, show modal with instant Print Slip or Skip options
      if (!noReceipt) {
        setCompletedSaleModal(createdTx);
      } else {
        showToast(`Sale #${createdTx.receiptNumber} recorded (ETB ${createdTx.total.toFixed(2)}) · No receipt issued (Paperless).`);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      showToast(err.message || 'Failed to record sale.');
    }
  };

  // Top Statistics - Accurately filtered by local calendar day
  const todaysSales = useMemo(() => {
    return transactions.filter(t => isSameLocalDate(t.timestamp));
  }, [transactions]);

  const todayRevenue = useMemo(() => {
    return todaysSales.reduce((sum, t) => sum + t.total, 0);
  }, [todaysSales]);

  const todayProfit = useMemo(() => {
    return todaysSales.reduce((sum, t) => sum + t.grossProfit, 0);
  }, [todaysSales]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Overview Cards in Black & Gold */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <span>Sales &amp; Outgoing Inventory</span>
            <span className="text-amber-400 font-serif italic text-base font-normal">Desk</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Record customer and internal product dispatches. Every sale recorded automatically deducts live stock from inventory.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-right">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Today's Sales</span>
            <span className="text-base font-bold font-mono-numbers text-amber-300">
              ETB {todayRevenue.toFixed(2)}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-right">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Gross Profit</span>
            <span className="text-base font-bold font-mono-numbers text-emerald-400">
              +ETB {todayProfit.toFixed(2)}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-right">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Orders Today</span>
            <span className="text-base font-bold font-mono-numbers text-neutral-100">
              {todaysSales.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Record Sale Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800/90 p-5 sm:p-6 shadow-xl shadow-black/40">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400" />
                <h2 className="text-sm font-bold text-neutral-100 tracking-wide uppercase">
                  Record New Sale Order
                </h2>
              </div>
              {saleItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSale}
                  className="text-xs text-neutral-400 hover:text-rose-400 font-medium transition-colors cursor-pointer"
                >
                  Clear Items
                </button>
              )}
            </div>

            {/* Product Quick-Search Bar & Barcode Scanner */}
            <div className="space-y-2 mb-5">
              <label className="block text-xs font-semibold text-neutral-300">
                Select Product from Inventory Catalog
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by product name, SKU, or scan barcode..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openScanner('sales')}
                  title="Open Camera / Barcode Scanner"
                  className="px-3 py-2.5 bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Barcode className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>

              {/* Category pills for faster lookup */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                        : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Dropdown / Suggestions grid when searching or category filtered */}
              {(productSearch.trim().length > 0 || selectedCategory !== 'All') && (
                <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 divide-y divide-neutral-900 shadow-xl">
                  {filteredCatalog.length === 0 ? (
                    <div className="p-4 text-xs text-neutral-500 text-center">
                      No matching products found in catalog.
                    </div>
                  ) : (
                    filteredCatalog.slice(0, 10).map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleAddItem(prod)}
                        className="p-3 hover:bg-neutral-900 flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs sm:text-sm font-semibold text-neutral-100 group-hover:text-amber-300 transition-colors truncate">
                            {prod.name}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono mt-0.5 flex items-center gap-2">
                            <span>SKU: {prod.sku}</span>
                            <span>·</span>
                            <span className={prod.stock <= 5 ? 'text-rose-400 font-bold' : 'text-neutral-400'}>
                              Stock: {prod.stock} {prod.unit || 'units'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-bold font-mono-numbers text-amber-300 block">
                            ETB {prod.price.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-neutral-400">Click to add</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Items Line Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">
                  Sale Line Items ({saleItems.length})
                </span>
                <span className="text-[11px] text-neutral-500">
                  Stock deducted immediately upon saving
                </span>
              </div>

              {saleItems.length === 0 ? (
                <div className="border border-dashed border-neutral-800 rounded-xl p-8 text-center bg-neutral-950/40">
                  <Package className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">No items selected yet.</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Use the product search above or select a category to add products to this sale order.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {saleItems.map((item) => {
                    const lineTotal = (item.unitPrice * item.quantity) * (1 - item.discountPercent / 100);
                    const isLowStock = item.product.stock <= 5;
                    const exceedsStock = item.quantity > item.product.stock;

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-neutral-100 truncate">
                            {item.product.name}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                            <span>SKU: {item.product.sku}</span>
                            <span>·</span>
                            <span className={exceedsStock ? 'text-rose-400 font-bold' : isLowStock ? 'text-amber-400 font-medium' : 'text-neutral-400'}>
                              In Stock: {item.product.stock}
                            </span>
                            {exceedsStock && (
                              <span className="text-[10px] text-rose-400 bg-rose-950/50 px-1.5 py-0.2 rounded font-bold">
                                Exceeds Stock!
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity and Pricing inputs */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Unit Price */}
                          <div className="w-20">
                            <label className="block text-[9px] text-neutral-500 uppercase font-mono">Price (ETB)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono-numbers text-neutral-100"
                            />
                          </div>

                          {/* Qty Stepper */}
                          <div className="w-16">
                            <label className="block text-[9px] text-neutral-500 uppercase font-mono">Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono-numbers text-neutral-100 font-bold"
                            />
                          </div>

                          {/* Line total */}
                          <div className="w-20 text-right">
                            <label className="block text-[9px] text-neutral-500 uppercase font-mono">Total</label>
                            <span className="text-xs font-bold font-mono-numbers text-amber-300 block pt-1">
                              ETB {lineTotal.toFixed(2)}
                            </span>
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Customer & Settlement Metadata */}
            <div className="mt-5 pt-4 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Customer / Account Name - Required and linked to Credit Ledger when paymentMethod === 'store_credit' */}
              <div ref={customerDropdownRef} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className={paymentMethod === 'store_credit' ? 'text-amber-300 font-bold' : 'text-neutral-400'}>
                      Customer / Account Name
                    </span>
                    {paymentMethod === 'store_credit' ? (
                      <span className="text-rose-400 font-bold text-[11px]">* (Required for Store Credit)</span>
                    ) : (
                      <span className="text-neutral-500 text-[11px]">(Optional)</span>
                    )}
                  </label>

                  {/* Quick button to pick existing customer from Credit Ledger */}
                  {Array.isArray(creditAccounts) && creditAccounts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCustomerPickerOpen(prev => !prev)}
                      className={`text-[10px] font-mono flex items-center gap-1 hover:underline cursor-pointer transition-colors ${
                        paymentMethod === 'store_credit' 
                          ? 'text-amber-400 font-bold hover:text-amber-300' 
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Select existing debtor from Credit Ledger"
                    >
                      <BookOpen className="w-3 h-3 text-amber-400" />
                      <span>Credit Ledger ({creditAccounts.length})</span>
                      <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isCustomerPickerOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                    paymentMethod === 'store_credit' ? 'text-amber-400' : 'text-neutral-500'
                  }`} />
                  <input
                    type="text"
                    required={paymentMethod === 'store_credit'}
                    placeholder={
                      paymentMethod === 'store_credit'
                        ? "Enter or choose customer for Credit Ledger..."
                        : "e.g. Acme Design Bureau / Walk-in"
                    }
                    value={customerName}
                    onFocus={() => {
                      if (creditAccounts && creditAccounts.length > 0) {
                        setIsCustomerPickerOpen(true);
                      }
                    }}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setIsCustomerPickerOpen(true);
                    }}
                    className={`w-full pl-9 pr-8 py-2 bg-neutral-950 border rounded-xl text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none transition-colors ${
                      paymentMethod === 'store_credit' && !customerName.trim()
                        ? 'border-rose-500/80 focus:border-rose-400 shadow-xs shadow-rose-500/10'
                        : paymentMethod === 'store_credit'
                        ? 'border-amber-500/60 focus:border-amber-400'
                        : 'border-neutral-800 focus:border-amber-500/50'
                    }`}
                  />
                  {customerName && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerName('');
                        setCustomerPhone('');
                        setIsCustomerPickerOpen(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Dropdown list of matching customers from Credit Ledger Tab */}
                {isCustomerPickerOpen && Array.isArray(creditAccounts) && creditAccounts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto bg-neutral-900 border border-amber-500/40 rounded-xl shadow-2xl p-1.5 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between border-b border-neutral-800 pb-1">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-400" />
                        Select Debtor from Credit Ledger
                      </span>
                      <span className="font-mono text-neutral-400">{creditAccounts.length} accounts</span>
                    </div>
                    {matchingCreditCustomers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-neutral-400">
                        No debtor matching "{customerName}". A new credit profile will be created.
                      </div>
                    ) : (
                      matchingCreditCustomers.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleSelectCreditCustomer(acc)}
                          className="w-full p-2 text-left rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-between gap-2 group cursor-pointer text-xs"
                        >
                          <div>
                            <div className="font-semibold text-neutral-100 group-hover:text-amber-300 flex items-center gap-1.5">
                              <span>{acc.customerName}</span>
                              {acc.companyOrOrg && (
                                <span className="text-[10px] text-neutral-400 font-normal">
                                  ({acc.companyOrOrg})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{acc.phone || 'No phone'}</span>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className={`block text-[11px] font-bold ${
                              acc.currentBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              Bal: ETB {acc.currentBalance.toLocaleString()}
                            </span>
                            {acc.creditLimit ? (
                              <span className="text-[9px] text-neutral-500">
                                Limit: ETB {acc.creditLimit.toLocaleString()}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Validation and Linked Credit Account Info */}
                {paymentMethod === 'store_credit' && (
                  <>
                    {!customerName.trim() ? (
                      <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5 animate-in fade-in duration-150">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span>Customer name is <strong>required</strong> to charge on Store Credit.</span>
                      </div>
                    ) : matchedCreditAccount ? (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-amber-300">
                            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Linked to Credit Ledger: {matchedCreditAccount.customerName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('credit_ledger')}
                            className="text-[10px] text-amber-400 hover:text-amber-200 flex items-center gap-1 font-mono underline cursor-pointer"
                            title="Open Credit Ledger tab to view full debt history"
                          >
                            <span>Ledger Tab</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-300 pt-1 border-t border-amber-500/20 font-mono">
                          <div>
                            <span className="text-neutral-500 block text-[9px] uppercase">Current Debt</span>
                            <span className="font-bold text-amber-400">ETB {matchedCreditAccount.currentBalance.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block text-[9px] uppercase">Credit Limit</span>
                            <span>{matchedCreditAccount.creditLimit ? `ETB ${matchedCreditAccount.creditLimit.toLocaleString()}` : 'No Limit'}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block text-[9px] uppercase">New Debt Bal</span>
                            <span className="font-bold text-neutral-100">ETB {(matchedCreditAccount.currentBalance + grandTotal).toLocaleString()}</span>
                          </div>
                        </div>
                        {matchedCreditAccount.creditLimit && (matchedCreditAccount.currentBalance + grandTotal) > matchedCreditAccount.creditLimit && (
                          <div className="text-[10px] text-rose-400 flex items-center gap-1 font-semibold pt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Will exceed credit limit by ETB {((matchedCreditAccount.currentBalance + grandTotal) - matchedCreditAccount.creditLimit).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs space-y-1.5 animate-in fade-in duration-150">
                        <div className="flex items-center gap-1.5 text-neutral-200">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>New Customer: <strong>{customerName.trim()}</strong> will be added to the Credit Ledger.</span>
                        </div>
                        <div className="pt-1 border-t border-neutral-800/80">
                          <label className="block text-[10px] text-neutral-400 mb-0.5 font-mono">
                            Phone Number for Credit Ledger (Recommended):
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500" />
                            <input
                              type="text"
                              placeholder="0911223344"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              className="w-full pl-7 pr-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-400">
                    Sale Date &amp; Time
                  </label>
                  <button
                    type="button"
                    onClick={handleSetCurrentDateTime}
                    className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer font-mono"
                    title="Reset to current local date & time"
                  >
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Now</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
                    <input
                      type="date"
                      value={saleDate}
                      onChange={(e) => {
                        setSaleDate(e.target.value);
                        setUseCustomDateTime(true);
                      }}
                      className="w-full pl-8 pr-2 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
                    <input
                      type="time"
                      value={saleTime}
                      onChange={(e) => {
                        setSaleTime(e.target.value);
                        setUseCustomDateTime(true);
                      }}
                      className="w-full pl-8 pr-2 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Payment / Settlement Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
                >
                  <optgroup label="Mobile Money">
                    <option value="telebirr_maria">Telebirr (Maria)</option>
                    <option value="telebirr_rahel">Telebirr (Rahel)</option>
                  </optgroup>
                  <optgroup label="Commercial Banks">
                    <option value="cbe">CBE (Commercial Bank of Ethiopia)</option>
                    <option value="abyssinia">Abyssinia Bank</option>
                    <option value="awash">Awash Bank</option>
                    <option value="dashen">Dashen Bank</option>
                  </optgroup>
                  <optgroup label="Counter & Other">
                    <option value="cash">Cash Settlement</option>
                    <option value="card">Card / Electronic Terminal</option>
                    <option value="store_credit">Internal Account / Store Credit</option>
                    <option value="split">Split Payment</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Internal Dispatch Notes / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project deliverable #401"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Customer Receipt Option: Issue Receipt vs No Receipt */}
              {settings.allowNoReceiptOption !== false && (
                <div className="sm:col-span-2 pt-3 border-t border-neutral-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        Customer Receipt Option
                      </label>
                      <p className="text-[11px] text-neutral-400">
                        Print an official thermal slip or skip receipt printing if declined by customer.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNoReceipt(false)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          !noReceipt
                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-xs'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Issue Receipt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoReceipt(true)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          noReceipt
                            ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-xs ring-1 ring-emerald-500/30'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                        <span>No Receipt (Eco)</span>
                      </button>
                    </div>
                  </div>

                  {noReceipt && (
                    <div className="mt-2.5 px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span><strong>No Receipt Mode:</strong> Fast paperless sale. Inventory will be deducted immediately without opening a print dialog.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Financial Summary & Action Strip */}
            <div id="checkout-action-strip" className="mt-5 pt-4 border-t border-neutral-800 bg-neutral-950 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-5 sm:p-6 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="grid grid-cols-3 gap-4 w-full sm:w-auto">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">Subtotal</span>
                  <span className="text-xs sm:text-sm font-semibold font-mono-numbers text-neutral-200">
                    ETB {subtotal.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">
                    Tax {effectiveTaxRate > 0 ? `(${((effectiveTaxRate) * 100).toFixed(1)}%)` : '(Exempt)'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold font-mono-numbers text-neutral-200">
                    ETB {taxTotal.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">Grand Total</span>
                  <span className="text-xl font-bold font-mono-numbers text-amber-300">
                    ETB {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={saleItems.length === 0 || isSubmitting || (paymentMethod === 'store_credit' && !customerName.trim())}
                onClick={handleRecordSale}
                className={`w-full sm:w-auto px-6 py-3 text-neutral-950 text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  paymentMethod === 'store_credit' && !customerName.trim()
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : noReceipt
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 shadow-emerald-500/10'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-amber-500/10'
                }`}
              >
                {paymentMethod === 'store_credit' && !customerName.trim() ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Customer Name Required (Store Credit)</span>
                  </>
                ) : noReceipt ? (
                  <>
                    <Leaf className="w-4 h-4 text-neutral-950" />
                    <span>Complete Sale (No Receipt)</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-neutral-950" />
                    <span>Record Sale &amp; Print Receipt</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Recent Sales Ledger (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800/90 p-5 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
                  Recent Sales Records
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-400 font-semibold">
                {transactions.length} total
              </span>
            </div>

            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {transactions.slice(0, 15).map((tx) => {
                return (
                  <div
                    key={tx.id}
                    onClick={() => setViewingSale(tx)}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-amber-500/40 hover:bg-neutral-850/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300 font-mono">
                          {tx.receiptNumber}
                        </span>
                        {tx.noReceipt && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-medium">
                            <Leaf className="w-2.5 h-2.5" />
                            No Receipt
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {formatLocalDateTime(tx.timestamp)}
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono-numbers text-neutral-100 group-hover:text-amber-300 transition-colors">
                        ETB {tx.total.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="truncate max-w-[170px]">
                        {tx.customerName || 'General Customer'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-neutral-400">
                          {tx.items.length} item(s) · {PAYMENT_METHOD_NAMES[tx.payment.method] || tx.payment.method.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateSaleReceiptPDF(tx, settings);
                          }}
                          className="p-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 border border-neutral-800 transition-colors cursor-pointer"
                          title="Generate & print thermal receipt slip"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Sale Details Modal */}
      {viewingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-neutral-100 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div>
                <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Sale Record Details</span>
                </h3>
                <span className="text-xs text-amber-400 font-mono">{viewingSale.receiptNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingSale(null)}
                className="text-neutral-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Date &amp; Time</span>
                <span className="font-mono text-neutral-200">{formatLocalDateTime(viewingSale.timestamp)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Client / Customer</span>
                <span className="font-semibold text-neutral-100">{viewingSale.customerName || 'None listed'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Operator</span>
                <span className="text-neutral-200">{viewingSale.cashierName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Payment Method</span>
                <span className="font-mono text-amber-400 font-semibold">{PAYMENT_METHOD_NAMES[viewingSale.payment.method] || viewingSale.payment.method.toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Receipt Status</span>
                <span className="font-semibold flex items-center gap-1">
                  {viewingSale.noReceipt ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                      <Leaf className="w-3 h-3" /> No Receipt (Paperless)
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1 font-mono text-[11px]">
                      <Printer className="w-3 h-3" /> Issued Receipt
                    </span>
                  )}
                </span>
              </div>

              {/* Items List */}
              <div className="pt-2">
                <span className="text-neutral-400 block mb-1 font-semibold uppercase text-[10px]">Items Deducted:</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {viewingSale.items.map((it, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-neutral-950 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-medium text-neutral-200">{it.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">Qty: {it.quantity} × ETB {it.unitPrice.toFixed(2)}</div>
                      </div>
                      <span className="font-bold font-mono-numbers text-amber-300">
                        ETB {(it.unitPrice * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-3 border-t border-neutral-800 flex justify-between items-center text-sm font-bold">
                <span className="text-neutral-200">Total Recorded</span>
                <span className="font-mono-numbers text-amber-300 text-base">
                  ETB {viewingSale.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => generateSaleReceiptPDF(viewingSale, settings)}
                className="flex-1 py-2.5 bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 border border-amber-500/30 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Download Receipt (PDF)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingSale(null)}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Completed & Receipt Choice Modal */}
      {completedSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 text-neutral-100 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-100">Sale Recorded Successfully</h3>
                  <span className="text-xs font-mono text-amber-300">{completedSaleModal.receiptNumber}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletedSaleModal(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial summary snapshot */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Items Sold:</span>
                <span className="font-mono text-neutral-200">
                  {completedSaleModal.items.reduce((s, it) => s + it.quantity, 0)} units ({completedSaleModal.items.length} lines)
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Payment Settlement:</span>
                <span className="font-mono text-amber-400 font-semibold">{PAYMENT_METHOD_NAMES[completedSaleModal.payment.method] || completedSaleModal.payment.method.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Recorded Date &amp; Time:</span>
                <span className="font-mono text-neutral-200">{formatLocalDateTime(completedSaleModal.timestamp)}</span>
              </div>
              {completedSaleModal.customerName && (
                <div className="flex justify-between text-neutral-400">
                  <span>Customer:</span>
                  <span className="font-semibold text-neutral-200">{completedSaleModal.customerName}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-neutral-800 font-bold text-sm">
                <span className="text-neutral-300">Total Collected:</span>
                <span className="text-lg font-mono-numbers text-amber-300">
                  ETB {completedSaleModal.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Receipt Options Actions */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] text-neutral-400 text-center mb-1">
                Customer receipt options for this transaction:
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    generateSaleReceiptPDF(completedSaleModal, settings);
                    setCompletedSaleModal(null);
                  }}
                  className="py-3 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateSaleReceiptStatus(completedSaleModal.id, true);
                    showToast(`Sale #${completedSaleModal.receiptNumber} finalized with No Receipt (Paperless).`);
                    setCompletedSaleModal(null);
                  }}
                  className="py-3 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-emerald-300 border border-neutral-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <span>No Receipt (Done)</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCompletedSaleModal(null)}
              className="w-full py-2 text-center text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Start Next Transaction
            </button>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MOBILE STICKY ACTION BAR (Thumb Zone & Pattern C: Sticky Bottom CTA)
        Floats above the bottom navigation bar when items are in cart.
        ========================================================================
      */}
      {saleItems.length > 0 && (
        <div className="fixed bottom-18 left-3 right-3 z-30 md:hidden bg-neutral-900/95 border border-amber-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200">
          <div className="min-w-0">
            <span className="text-[10px] text-neutral-400 block font-mono">
              {saleItems.reduce((s, it) => s + it.quantity, 0)} item(s) in sale
            </span>
            <span className="text-sm font-bold font-mono-numbers text-amber-300">
              ETB {grandTotal.toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('checkout-action-strip');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shrink-0 min-h-[44px]"
          >
            <span>Review &amp; Pay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
