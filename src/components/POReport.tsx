import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShoppingCart, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  ArrowRight, 
  TrendingDown,
  Package,
  Layers,
  Sparkles,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product } from '../types';
import { generateBrandedPDFReport } from '../utils/pdfExport';

export const POReport: React.FC = () => {
  const { products, setPrefillPurchaseItems, setActiveTab, showToast, settings } = usePOS();

  // Editable stock threshold (user requirement: default < 5, editable)
  const [stockThreshold, setStockThreshold] = useState<number>(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [reorderQuantities, setReorderQuantities] = useState<Record<string, number>>({});

  // Categories present in catalog
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => set.add(p.category));
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  // Filter products by stock < stockThreshold (strictly less than editable threshold)
  const lowStockProducts = useMemo(() => {
    return products.filter((prod) => {
      const isUnderThreshold = prod.stock < stockThreshold;
      const matchesSearch = !searchQuery.trim() || 
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.barcode.includes(searchQuery);
      const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
      return isUnderThreshold && matchesSearch && matchesCategory;
    }).sort((a, b) => a.stock - b.stock); // lowest stock first
  }, [products, stockThreshold, searchQuery, selectedCategory]);

  // Default suggested reorder quantities for low-stock items
  const getSuggestedQty = (prod: Product): number => {
    if (reorderQuantities[prod.id] !== undefined) {
      return reorderQuantities[prod.id];
    }
    // Bring stock up to healthy level: (minStockAlert * 2) - current stock, minimum 10
    const target = Math.max(10, (prod.minStockAlert || 8) * 2);
    return Math.max(5, target - prod.stock);
  };

  const handleUpdateReorderQty = (prodId: string, qty: number) => {
    setReorderQuantities(prev => ({
      ...prev,
      [prodId]: Math.max(1, qty),
    }));
  };

  // Select all or toggle
  const allFilteredSelected = lowStockProducts.length > 0 && 
    lowStockProducts.every(p => selectedProductIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(lowStockProducts.map(p => p.id));
    }
  };

  const handleToggleProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Metrics
  const totalOutOfStock = lowStockProducts.filter(p => p.stock === 0).length;
  const totalLowStock = lowStockProducts.filter(p => p.stock > 0 && p.stock < stockThreshold).length;
  
  const estimatedTotalReorderCost = useMemo(() => {
    return lowStockProducts.reduce((sum, p) => {
      const qty = getSuggestedQty(p);
      const cost = p.costPrice || (p.price * 0.5);
      return sum + (cost * qty);
    }, 0);
  }, [lowStockProducts, reorderQuantities]);

  // Create Purchase Order from selected or all low stock items
  const handleCreatePurchaseOrder = (specificProducts?: Product[]) => {
    const targetList = specificProducts || (
      selectedProductIds.length > 0 
        ? lowStockProducts.filter(p => selectedProductIds.includes(p.id))
        : lowStockProducts
    );

    if (targetList.length === 0) {
      showToast('No low stock items selected to generate Purchase Order.');
      return;
    }

    const itemsToOrder = targetList.map(p => ({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitCost: p.costPrice || Number((p.price * 0.55).toFixed(2)),
      quantity: getSuggestedQty(p),
    }));

    setPrefillPurchaseItems(itemsToOrder);
    setActiveTab('purchase');
    showToast(`Transferring ${itemsToOrder.length} low-stock items to Purchase Order...`);
  };

  // Export PDF
  const handleExportPDF = () => {
    if (lowStockProducts.length === 0) {
      showToast('No items to export.');
      return;
    }

    const headers = ['Product Name', 'SKU', 'Barcode', 'Category', 'Current Stock', 'Cost Price', 'Retail Price', 'Reorder Qty', 'Est. Cost'];
    const rows = lowStockProducts.map(p => {
      const qty = getSuggestedQty(p);
      const cost = p.costPrice || 0;
      return [
        p.name,
        p.sku,
        p.barcode,
        p.category,
        `${p.stock} ${p.unit || 'units'}`,
        `ETB ${cost.toFixed(2)}`,
        `ETB ${p.price.toFixed(2)}`,
        qty,
        `ETB ${(cost * qty).toFixed(2)}`
      ];
    });

    generateBrandedPDFReport({
      filename: `PO_Low_Stock_Report_Under_${stockThreshold}_Units_${new Date().toISOString().slice(0, 10)}.pdf`,
      title: `Purchase Order (PO) Reorder Report`,
      subtitle: `Items with Stock < ${stockThreshold} Units · Automated Restock Advisory`,
      metaRight: `Threshold: < ${stockThreshold} Units`,
      metrics: [
        { label: `Items < ${stockThreshold} Units`, value: String(lowStockProducts.length) },
        { label: 'Out of Stock (0)', value: String(totalOutOfStock) },
        { label: 'Suggested Units', value: String(lowStockProducts.reduce((s, p) => s + getSuggestedQty(p), 0)) },
        { label: 'Est. Reorder Cost', value: `ETB ${estimatedTotalReorderCost.toFixed(2)}` },
      ],
      headers,
      rows,
      orientation: 'landscape',
    });

    showToast(`Exported PO Low Stock Report PDF (< ${stockThreshold} units).`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Report Header Card */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 sm:p-6 shadow-xl shadow-black/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-neutral-100 flex items-center gap-2">
                  Purchase Order (PO) Reorder Report
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium border border-amber-500/30">
                    Stock &lt; {stockThreshold} Units
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Automated reorder advisory listing products falling below inventory threshold. Editable safety limit.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-400" />
              <span>Print PO Sheet</span>
            </button>

            <button
              onClick={handleExportPDF}
              type="button"
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={() => handleCreatePurchaseOrder()}
              type="button"
              disabled={lowStockProducts.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4 text-neutral-950" />
              <span>
                {selectedProductIds.length > 0 
                  ? `Create PO for ${selectedProductIds.length} Selected` 
                  : `Create PO for All (${lowStockProducts.length})`}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-950" />
            </button>
          </div>
        </div>

        {/* Threshold Adjustment Bar & Filter Controls */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Editable Threshold Control */}
          <div className="md:col-span-5 p-3.5 rounded-xl bg-neutral-950 border border-amber-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <span>Stock Alert Threshold:</span>
                <span className="text-amber-400 font-mono font-bold">&lt; {stockThreshold} Units</span>
              </label>
              <span className="text-[10px] text-neutral-400">Click preset or edit:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={stockThreshold}
                  onChange={(e) => setStockThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-neutral-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-amber-300 focus:outline-hidden focus:border-amber-400 text-center"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 pointer-events-none">
                  units
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1">
                {[3, 5, 10, 15].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStockThreshold(val)}
                    className={`px-2 py-1 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                      stockThreshold === val
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-neutral-750'
                    }`}
                  >
                    &lt;{val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="md:col-span-4 relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name, SKU, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-amber-500/50"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-neutral-900 text-neutral-100">
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-800/80">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
            <span className="text-[11px] text-neutral-400 font-medium block">Total Items Needing Reorder</span>
            <span className="text-xl font-bold font-mono-numbers text-amber-400 mt-1 block">
              {lowStockProducts.length} <span className="text-xs font-normal text-neutral-400">products</span>
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
            <span className="text-[11px] text-red-400 font-medium block">Completely Out of Stock</span>
            <span className="text-xl font-bold font-mono-numbers text-red-400 mt-1 block">
              {totalOutOfStock} <span className="text-xs font-normal text-neutral-400">items (0 units)</span>
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
            <span className="text-[11px] text-amber-400 font-medium block">Critically Low (1 to {stockThreshold - 1})</span>
            <span className="text-xl font-bold font-mono-numbers text-amber-300 mt-1 block">
              {totalLowStock} <span className="text-xs font-normal text-neutral-400">items</span>
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
            <span className="text-[11px] text-emerald-400 font-medium block">Estimated Restock Spend</span>
            <span className="text-xl font-bold font-mono-numbers text-emerald-300 mt-1 block">
              ETB {estimatedTotalReorderCost.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Low Stock Items Table */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl shadow-black/40">
        <div className="p-4 bg-neutral-950/70 border-b border-neutral-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-white cursor-pointer select-none"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4 text-neutral-500" />
              )}
              <span>Select All ({lowStockProducts.length})</span>
            </button>

            {selectedProductIds.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                {selectedProductIds.length} item{selectedProductIds.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          <div className="text-xs text-neutral-400">
            Showing <strong className="text-neutral-200">{lowStockProducts.length}</strong> items below threshold of{' '}
            <strong className="text-amber-400">{stockThreshold} units</strong>
          </div>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-neutral-200">Optimal Inventory Levels</h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
              No products found with stock under {stockThreshold} units matching your current filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/90 border-b border-neutral-800 text-neutral-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">Product &amp; SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Current Stock</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Retail Price</th>
                  <th className="py-3 px-3 text-center">Reorder Qty</th>
                  <th className="py-3 px-3 text-right">Estimated PO Total</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70 font-mono-numbers">
                {lowStockProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const isZero = p.stock === 0;
                  const reorderQty = getSuggestedQty(p);
                  const unitCost = p.costPrice || (p.price * 0.55);
                  const lineTotalCost = unitCost * reorderQty;

                  return (
                    <tr 
                      key={p.id}
                      className={`hover:bg-neutral-850/60 transition-colors ${
                        isSelected ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(p.id)}
                          className="cursor-pointer text-neutral-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-600" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-neutral-100">{p.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>SKU: {p.sku}</span>
                          <span>•</span>
                          <span>Barcode: {p.barcode}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-sans text-neutral-300">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-[11px]">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                          isZero 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : p.stock <= 2
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}>
                          {isZero ? '0 (Out)' : `${p.stock} units`}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-neutral-300">
                        ETB {unitCost.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right text-neutral-400">
                        ETB {p.price.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={reorderQty}
                          onChange={(e) => handleUpdateReorderQty(p.id, parseInt(e.target.value) || 1)}
                          className="w-16 bg-neutral-950 border border-neutral-700 focus:border-amber-400 rounded px-1.5 py-1 text-center text-xs font-mono font-bold text-amber-300"
                        />
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-emerald-300">
                        ETB {lineTotalCost.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCreatePurchaseOrder([p])}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-neutral-700 hover:border-amber-400"
                        >
                          Reorder Item
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
