import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Truck, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  Building, 
  FileText, 
  Package, 
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  RefreshCw,
  Barcode
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product, PurchaseTransaction, PurchaseItem } from '../types';
import { 
  getLocalDateString, 
  getLocalTimeString, 
  resolveAccurateTimestamp, 
  formatLocalDateTime 
} from '../utils/dateTime';

interface PurchaseLineDraft {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  category: string;
  unitCost: number;
  quantity: number;
  sellingPrice?: number;
}

export const PurchaseManager: React.FC = () => {
  const { 
    products, 
    recordPurchase, 
    purchases, 
    showToast,
    prefillPurchaseItems,
    setPrefillPurchaseItems,
    openScanner,
    scannedPurchaseEvent
  } = usePOS();
  const lastHandledScanRef = useRef<number>(0);

  // Supplier & PO details
  const [supplierName, setSupplierName] = useState('Rhodia & Clairefontaine Distribution');
  const [poNumber, setPoNumber] = useState(() => `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [supplierInvoice, setSupplierInvoice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => getLocalDateString());
  const [purchaseTime, setPurchaseTime] = useState(() => getLocalTimeString());
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'on_account'>('paid');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSyncToNow = () => {
    setPurchaseDate(getLocalDateString());
    setPurchaseTime(getLocalTimeString());
    showToast('Inward date & time synced to current clock.');
  };

  // Line items draft
  const [purchaseItems, setPurchaseItems] = useState<PurchaseLineDraft[]>([]);

  // Product search picker for adding items
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Detail view modal
  const [viewingPO, setViewingPO] = useState<PurchaseTransaction | null>(null);

  // Supplier suggestion presets
  const commonSuppliers = [
    'Rhodia & Clairefontaine Distribution',
    'Pilot Pen Americas Wholesale',
    'Navigator Paper Mill Europe',
    'Swingline & ACCO Brands',
    'Strathmore & Artist Supplies Co.',
    'Olfa Precision Cutting Tools'
  ];

  // If redirected from PO Report with low stock items, pre-fill them
  useEffect(() => {
    if (prefillPurchaseItems && prefillPurchaseItems.length > 0) {
      const mapped = prefillPurchaseItems.map((p, idx) => ({
        id: `draft-reorder-${Date.now()}-${idx}`,
        productId: p.productId,
        name: p.name,
        sku: p.sku,
        category: p.category,
        unitCost: p.unitCost,
        quantity: p.quantity,
      }));
      setPurchaseItems(mapped);
      setSupplierName('Supplier Reorder Bureau');
      setNotes('Automated Reorder generated from Low Stock PO Report (< 5 units)');
      setPrefillPurchaseItems(null); // clear after loading
      showToast(`Loaded ${mapped.length} low-stock items into Purchase Order.`);
    }
  }, [prefillPurchaseItems]);

  const filteredCatalog = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.sku.toLowerCase().includes(q) || 
      p.barcode.includes(q)
    );
  }, [products, productSearch]);

  // Add Item to PO
  const handleAddProductToDraft = (product: Product) => {
    setPurchaseItems(prev => {
      const existing = prev.find(it => it.productId === product.id);
      if (existing) {
        return prev.map(it => 
          it.productId === product.id ? { ...it, quantity: it.quantity + 5 } : it
        );
      }
      return [
        ...prev,
        {
          id: `draft-${Date.now()}-${Math.random()}`,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          unitCost: product.costPrice || 1.00,
          quantity: 10,
          sellingPrice: product.price,
        }
      ];
    });

    setProductSearch('');
  };

  // Automatically add scanned item when dispatched from BarcodeScannerModal
  useEffect(() => {
    if (scannedPurchaseEvent && scannedPurchaseEvent.timestamp > lastHandledScanRef.current) {
      lastHandledScanRef.current = scannedPurchaseEvent.timestamp;
      handleAddProductToDraft(scannedPurchaseEvent.product);
    }
  }, [scannedPurchaseEvent]);

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
        handleAddProductToDraft(exact);
      } else if (filteredCatalog.length === 1) {
        handleAddProductToDraft(filteredCatalog[0]);
      }
    }
  };

  // Add Custom / New Product to PO
  const handleAddCustomProduct = () => {
    const newDraft: PurchaseLineDraft = {
      id: `draft-custom-${Date.now()}`,
      name: productSearch.trim() || 'New Stationery Item',
      sku: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Office & Desk',
      unitCost: 5.00,
      quantity: 10,
      sellingPrice: 8.50,
    };
    setPurchaseItems(prev => [...prev, newDraft]);
    setProductSearch('');
  };

  const handleUpdateItemQuantity = (lineId: string, qty: number) => {
    if (qty <= 0) {
      setPurchaseItems(prev => prev.filter(it => it.id !== lineId));
      return;
    }
    setPurchaseItems(prev => prev.map(it => 
      it.id === lineId ? { ...it, quantity: qty } : it
    ));
  };

  const handleUpdateItemCost = (lineId: string, cost: number) => {
    setPurchaseItems(prev => prev.map(it => 
      it.id === lineId ? { ...it, unitCost: Math.max(0, cost) } : it
    ));
  };

  const handleRemoveLine = (lineId: string) => {
    setPurchaseItems(prev => prev.filter(it => it.id !== lineId));
  };

  const handleRegeneratePo = () => {
    setPoNumber(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Calculations
  const totalCost = useMemo(() => {
    return purchaseItems.reduce((sum, it) => sum + (it.unitCost * it.quantity), 0);
  }, [purchaseItems]);

  const totalUnits = useMemo(() => {
    return purchaseItems.reduce((sum, it) => sum + it.quantity, 0);
  }, [purchaseItems]);

  // Submit Purchase
  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      showToast('Please specify a supplier or vendor name.');
      return;
    }
    if (purchaseItems.length === 0) {
      showToast('Please add at least one line item to this purchase order.');
      return;
    }

    setIsSubmitting(true);

    try {
      recordPurchase({
        poNumber,
        supplierName: supplierName.trim(),
        supplierInvoice: supplierInvoice.trim() || undefined,
        items: purchaseItems.map(it => ({
          productId: it.productId,
          name: it.name,
          sku: it.sku,
          category: it.category,
          unitCost: it.unitCost,
          quantity: it.quantity,
          updateCostPrice: true,
          sellingPrice: it.sellingPrice,
        })),
        paymentStatus,
        status: 'received',
        notes: notes.trim() || undefined,
        date: purchaseDate,
        time: purchaseTime,
        timestamp: resolveAccurateTimestamp(purchaseDate, purchaseTime),
      });

      // Reset form
      setPurchaseItems([]);
      setSupplierInvoice('');
      setNotes('');
      handleRegeneratePo();
      setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
      showToast(err.message || 'Error recording purchase.');
    }
  };

  // Stats
  const totalPurchaseSpend = useMemo(() => {
    return purchases.reduce((sum, p) => sum + p.totalCost, 0);
  }, [purchases]);

  const totalUnitsInward = useMemo(() => {
    return purchases.reduce((sum, p) => sum + p.itemCount, 0);
  }, [purchases]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Overview Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Truck className="w-5 h-5" />
            </span>
            <span>Purchase &amp; Inward Goods</span>
            <span className="text-amber-400 font-serif italic text-base font-normal">Bureau</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Record supplier orders and shipment deliveries. Every recorded purchase automatically increases inventory stock and updates unit cost valuations.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-right">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Total Purchases</span>
            <span className="text-base font-bold font-mono-numbers text-neutral-100">
              {purchases.length} POs
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-right">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Total Spend</span>
            <span className="text-base font-bold font-mono-numbers text-amber-300">
              ETB {totalPurchaseSpend.toFixed(2)}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-right">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Units Inward</span>
            <span className="text-base font-bold font-mono-numbers text-emerald-400">
              +{totalUnitsInward}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Purchase Order Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800/90 p-5 sm:p-6 shadow-xl shadow-black/40">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400" />
                <h2 className="text-sm font-bold text-neutral-100 tracking-wide uppercase">
                  Record Incoming Purchase Order
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 font-mono font-bold">{poNumber}</span>
                <button
                  type="button"
                  onClick={handleRegeneratePo}
                  title="Generate new PO reference"
                  className="p-1 text-neutral-400 hover:text-amber-400 rounded transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Supplier / Vendor Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rhodia & Clairefontaine Distribution"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              {/* Quick Supplier Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                {commonSuppliers.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSupplierName(s)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] whitespace-nowrap transition-colors cursor-pointer border ${
                      supplierName === s
                        ? 'border-amber-400 bg-amber-950/40 text-amber-300 font-medium'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {s.split(' ')[0]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Supplier Invoice # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9902"
                    value={supplierInvoice}
                    onChange={(e) => setSupplierInvoice(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-neutral-400">
                      Receipt / Inward Date
                    </label>
                    <button
                      type="button"
                      onClick={handleSyncToNow}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 cursor-pointer py-0.5 px-1.5 rounded bg-amber-950/40 border border-amber-800/40"
                      title="Sync date and time to current clock"
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>Now</span>
                    </button>
                  </div>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Inward Time
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={purchaseTime}
                    onChange={(e) => setPurchaseTime(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="paid">Paid in Full</option>
                    <option value="pending">Pending Payment</option>
                    <option value="on_account">On Vendor Account</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Lookup & Add */}
            <div className="space-y-2 mb-4 pt-3 border-t border-neutral-800">
              <label className="block text-xs font-semibold text-neutral-300">
                Add Products to Restock
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Type product name, barcode, or SKU to add..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openScanner('purchase')}
                  title="Open Camera / Barcode Scanner"
                  className="px-3 py-2.5 bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Barcode className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>

              {productSearch.trim().length > 0 && (
                <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 divide-y divide-neutral-900 shadow-xl">
                  {filteredCatalog.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleAddProductToDraft(prod)}
                      className="p-3 hover:bg-neutral-900 flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-neutral-100 group-hover:text-amber-300 transition-colors">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          SKU: {prod.sku} · Current Stock: {prod.stock} {prod.unit || 'units'} · Current Cost: ETB {prod.costPrice.toFixed(2)}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-400">Add +</span>
                    </div>
                  ))}

                  {/* Option to create brand new item on the fly */}
                  <div
                    onClick={handleAddCustomProduct}
                    className="p-3 bg-neutral-900/60 hover:bg-neutral-900 text-amber-300 flex items-center justify-between cursor-pointer transition-colors text-xs font-semibold"
                  >
                    <span>+ Add "{productSearch}" as new catalog product</span>
                    <span className="text-[10px] text-neutral-400">Click to create</span>
                  </div>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">
                  Inward Items to Restock ({purchaseItems.length})
                </span>
                <span className="text-[11px] text-neutral-500">
                  Adds to inventory stock immediately
                </span>
              </div>

              {purchaseItems.length === 0 ? (
                <div className="border border-dashed border-neutral-800 rounded-xl p-8 text-center bg-neutral-950/40">
                  <Truck className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">No items added to this purchase order.</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Search above to restock existing catalog items or add new shipments.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {purchaseItems.map((item) => {
                    const lineTotal = item.unitCost * item.quantity;

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-neutral-100 truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono mt-0.5 flex items-center gap-2">
                            <span>SKU: {item.sku}</span>
                            <span>·</span>
                            <span className="text-amber-400/80">{item.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Unit Cost */}
                          <div className="w-20">
                            <label className="block text-[9px] text-neutral-500 uppercase font-mono">Cost (ETB)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitCost}
                              onChange={(e) => handleUpdateItemCost(item.id, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono-numbers text-neutral-100"
                            />
                          </div>

                          {/* Inward Qty */}
                          <div className="w-18">
                            <label className="block text-[9px] text-neutral-500 uppercase font-mono">+ Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono-numbers text-emerald-400 font-bold"
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
                            onClick={() => handleRemoveLine(item.id)}
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

            {/* Notes */}
            <div className="mt-4 pt-3 border-t border-neutral-800">
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Shipment / Carrier / Verification Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Received undamaged in 3 cartons via DHL Freight"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Summary & Submit */}
            <div className="mt-5 pt-4 border-t border-neutral-800 bg-neutral-950 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-5 sm:p-6 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">Units Inward</span>
                  <span className="text-base font-bold font-mono-numbers text-emerald-400">
                    +{totalUnits} units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">Total PO Cost</span>
                  <span className="text-xl font-bold font-mono-numbers text-amber-300">
                    ETB {totalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={purchaseItems.length === 0 || isSubmitting}
                onClick={handleSavePurchase}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Record Purchase &amp; Restock</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Purchase History Ledger (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800/90 p-5 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
                  Inward Purchases Ledger
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-400 font-semibold">
                {purchases.length} total
              </span>
            </div>

            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {purchases.map((po) => {
                const dateStr = formatLocalDateTime(po.timestamp);

                return (
                  <div
                    key={po.id}
                    onClick={() => setViewingPO(po)}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-amber-500/40 hover:bg-neutral-850/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300 font-mono">
                          {po.poNumber}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {dateStr}
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono-numbers text-neutral-100 group-hover:text-amber-300 transition-colors">
                        ETB {po.totalCost.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="truncate max-w-[200px] font-medium text-neutral-300">
                        {po.supplierName}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        +{po.itemCount} units
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Purchase Details Modal */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-neutral-100 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div>
                <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Purchase Order Details</span>
                </h3>
                <span className="text-xs text-amber-400 font-mono">{viewingPO.poNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingPO(null)}
                className="text-neutral-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Supplier / Vendor</span>
                <span className="font-semibold text-neutral-100">{viewingPO.supplierName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Invoice Reference</span>
                <span className="font-mono text-neutral-200">{viewingPO.supplierInvoice || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Date Logged</span>
                <span className="font-mono text-neutral-200">{formatLocalDateTime(viewingPO.timestamp)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Payment Status</span>
                <span className="uppercase font-mono text-amber-400 font-bold">{viewingPO.paymentStatus}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Recorded By</span>
                <span className="text-neutral-200">{viewingPO.operatorName}</span>
              </div>

              {/* Items List */}
              <div className="pt-2">
                <span className="text-neutral-400 block mb-1 font-semibold uppercase text-[10px]">Restocked Line Items:</span>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {viewingPO.items.map((it, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-neutral-950 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-medium text-neutral-200">{it.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">Restocked: +{it.quantity} @ ETB {it.unitCost.toFixed(2)}</div>
                      </div>
                      <span className="font-bold font-mono-numbers text-amber-300">
                        ETB {it.totalCost.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-3 border-t border-neutral-800 flex justify-between items-center text-sm font-bold">
                <span className="text-neutral-200">Total Purchase Cost</span>
                <span className="font-mono-numbers text-amber-300 text-base">
                  ETB {viewingPO.totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewingPO(null)}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
