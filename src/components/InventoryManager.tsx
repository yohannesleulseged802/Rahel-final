import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  X,
  FileSpreadsheet,
  Download,
  Sparkles,
  Barcode,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product, ProductCategory } from '../types';
import { BulkImportModal } from './BulkImportModal';
import { downloadExcelTemplate, exportInventoryToExcel } from '../utils/excelImportExport';

export const InventoryManager: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, showToast, openScanner, scannedInventoryEvent } = usePOS();
  const lastHandledScanRef = useRef<number>(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Notebooks & Paper' as ProductCategory,
    price: 9.99,
    costPrice: 4.50,
    stock: 25,
    minStockAlert: 8,
    unit: 'each',
    description: '',
  });

  const availableCategories = useMemo(() => {
    const defaults = [
      'Notebooks & Paper',
      'Writing Instruments',
      'Office & Desk',
      'Filing & Folders',
      'Art & Craft',
      'Print & Copy Services'
    ];
    const catSet = new Set<string>(defaults);
    products.forEach(p => {
      if (p.category && p.category.trim()) {
        catSet.add(p.category.trim());
      }
    });
    return Array.from(catSet);
  }, [products]);

  const filterCategories = useMemo(() => ['All', ...availableCategories], [availableCategories]);

  const [sortBy, setSortBy] = useState<'category' | 'name' | 'stock' | 'price'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleToggleSort = (field: 'category' | 'name' | 'stock' | 'price') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesLowStock = onlyLowStock ? p.stock <= p.minStockAlert : true;

      return matchesSearch && matchesCat && matchesLowStock;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'category') {
        const catA = (a.category || '').trim();
        const catB = (b.category || '').trim();
        const catCompare = catA.localeCompare(catB, undefined, { sensitivity: 'base' });
        if (catCompare !== 0) {
          return sortOrder === 'asc' ? catCompare : -catCompare;
        }
        // Sub-sort by item title A-Z
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }

      if (sortBy === 'name') {
        const nameCompare = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        return sortOrder === 'asc' ? nameCompare : -nameCompare;
      }

      if (sortBy === 'stock') {
        return sortOrder === 'asc' ? a.stock - b.stock : b.stock - a.stock;
      }

      if (sortBy === 'price') {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      }

      return 0;
    });
  }, [products, searchQuery, selectedCategory, onlyLowStock, sortBy, sortOrder]);

  const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const totalCostValuation = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStockAlert).length;

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      sku: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      category: 'Notebooks & Paper',
      price: 12.00,
      costPrice: 5.50,
      stock: 20,
      minStockAlert: 5,
      unit: 'each',
      description: '',
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode,
      category: prod.category,
      price: prod.price,
      costPrice: prod.costPrice,
      stock: prod.stock,
      minStockAlert: prod.minStockAlert,
      unit: prod.unit,
      description: prod.description,
    });
    setEditingProduct(prod);
    setIsAddModalOpen(true);
  };

  // Respond when user clicks "Edit Stock" or "Register in Inventory" from BarcodeScannerModal
  useEffect(() => {
    if (scannedInventoryEvent && scannedInventoryEvent.timestamp > lastHandledScanRef.current) {
      lastHandledScanRef.current = scannedInventoryEvent.timestamp;
      if (scannedInventoryEvent.product) {
        setSearchQuery(scannedInventoryEvent.product.barcode);
        handleOpenEdit(scannedInventoryEvent.product);
      } else {
        setFormData({
          name: '',
          sku: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: scannedInventoryEvent.code,
          category: 'Notebooks & Paper',
          price: 12.00,
          costPrice: 5.50,
          stock: 20,
          minStockAlert: 5,
          unit: 'each',
          description: '',
        });
        setEditingProduct(null);
        setIsAddModalOpen(true);
        showToast(`Pre-filled new item barcode: ${scannedInventoryEvent.code}`);
      }
    }
  }, [scannedInventoryEvent]);

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        ...formData,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        stock: Number(formData.stock),
        minStockAlert: Number(formData.minStockAlert),
      });
    } else {
      addProduct({
        ...formData,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        stock: Number(formData.stock),
        minStockAlert: Number(formData.minStockAlert),
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Title & Actions Bar in Black & Gold */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>Stationery Inventory &amp; Stock</span>
            <span className="text-amber-400 font-serif italic text-base font-normal">Catalog</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Monitor real-time inventory levels, wholesale cost margins, and low stock thresholds in the store.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Download Blank Template */}
          <button
            type="button"
            onClick={() => {
              downloadExcelTemplate();
              showToast('Downloaded official Excel import template (.xlsx)');
            }}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 hover:border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Download official pre-formatted Excel template with stationery samples"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Template (.xlsx)</span>
          </button>

          {/* Bulk Import Button */}
          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-950/80 to-amber-900/60 hover:from-amber-900 hover:to-amber-850 text-amber-300 border border-amber-500/40 hover:border-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Upload and audit Excel spreadsheet (.xlsx, .xls, .csv)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Bulk Item Import</span>
          </button>

          {/* Export Catalog Backup */}
          <button
            type="button"
            onClick={() => {
              exportInventoryToExcel(products);
              showToast(`Exported ${products.length} products to Excel (.xlsx)`);
            }}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Export full inventory list to Excel"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden md:inline">Export Catalog</span>
          </button>

          {/* Add Single Item */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Item</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strips in Obsidian & Gold */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm">
          <span className="text-xs text-neutral-400 font-medium block">Catalog SKUs</span>
          <span className="text-2xl font-bold font-mono-numbers text-neutral-100 mt-1 block">
            {products.length}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {totalStockItems} total units on shelves
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm">
          <span className="text-xs text-neutral-400 font-medium block">Retail Valuation</span>
          <span className="text-2xl font-bold font-mono-numbers text-amber-300 mt-1 block">
            ETB {totalRetailValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Expected gross shelf turnover
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm">
          <span className="text-xs text-neutral-400 font-medium block">Cost Valuation (COGS)</span>
          <span className="text-2xl font-bold font-mono-numbers text-neutral-200 mt-1 block">
            ETB {totalCostValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Wholesale stock investment
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm">
          <span className="text-xs text-neutral-400 font-medium block">Low Stock Alerts</span>
          <span className={`text-2xl font-bold font-mono-numbers mt-1 block ${
            lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {lowStockCount}
          </span>
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline mt-1 block cursor-pointer"
          >
            {onlyLowStock ? 'Show all items' : 'Filter low stock items'}
          </button>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500/50"
            />
          </div>
          <button
            type="button"
            onClick={() => openScanner('lookup')}
            title="Scan physical product barcode or shelf QR code"
            className="px-3 py-2.5 bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Barcode className="w-4 h-4" />
            <span className="hidden xs:inline">Scan Tag</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {filterCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 shadow-sm font-bold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-100 border border-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active Sort Bar & View Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400 font-medium">Sort by:</span>
          <div className="inline-flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => handleToggleSort('category')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                sortBy === 'category'
                  ? 'bg-amber-400 text-neutral-950 shadow-xs'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
              title="Click to toggle Category A-Z / Z-A"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Category {sortBy === 'category' ? (sortOrder === 'asc' ? 'A→Z' : 'Z→A') : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleSort('name')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                sortBy === 'name'
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <span>Name {sortBy === 'name' ? (sortOrder === 'asc' ? 'A→Z' : 'Z→A') : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleSort('stock')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                sortBy === 'stock'
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <span>Stock {sortBy === 'stock' ? (sortOrder === 'asc' ? 'Low' : 'High') : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleSort('price')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                sortBy === 'price'
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <span>Price {sortBy === 'price' ? (sortOrder === 'asc' ? 'Low' : 'High') : ''}</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] font-mono text-neutral-400">
          Showing <span className="text-amber-400 font-bold">{filteredProducts.length}</span> of {products.length} products
        </div>
      </div>

      {/* Inventory Table & Mobile Cards in Obsidian & Gold */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl shadow-black/40">
        {/* Desktop View: Full Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => handleToggleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-amber-300 transition-colors select-none"
                  title="Sort by item name"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Item &amp; Description</span>
                    {sortBy === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : <ArrowUpDown className="w-3 h-3 text-neutral-600" />}
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('category')}
                  className="py-3.5 px-3 cursor-pointer hover:text-amber-300 transition-colors select-none"
                  title="Sort by category"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortBy === 'category' ? 'text-amber-300 font-bold' : ''}>Category</span>
                    {sortBy === 'category' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : <ArrowUpDown className="w-3 h-3 text-neutral-600" />}
                  </div>
                </th>
                <th className="py-3.5 px-3">SKU / Barcode</th>
                <th
                  onClick={() => handleToggleSort('price')}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-amber-300 transition-colors select-none"
                  title="Sort by retail price"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Retail</span>
                    {sortBy === 'price' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : <ArrowUpDown className="w-3 h-3 text-neutral-600" />}
                  </div>
                </th>
                <th className="py-3.5 px-3 text-right">Cost</th>
                <th className="py-3.5 px-3 text-right">Margin %</th>
                <th
                  onClick={() => handleToggleSort('stock')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-amber-300 transition-colors select-none"
                  title="Sort by stock quantity"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Stock</span>
                    {sortBy === 'stock' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : <ArrowUpDown className="w-3 h-3 text-neutral-600" />}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Adjust</th>
                <th className="py-3.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredProducts.map((p) => {
                const marginPct = p.price > 0 ? ((p.price - p.costPrice) / p.price) * 100 : 0;
                const isLow = p.stock <= p.minStockAlert;

                return (
                  <tr key={p.id} className="hover:bg-neutral-850/60 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-neutral-100 truncate">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {p.description}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-neutral-400">
                      {p.category}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-neutral-400">
                      <div className="text-amber-500/80 font-medium">{p.sku}</div>
                      <div className="text-[10px] text-neutral-500">{p.barcode}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-amber-300">
                      ETB {p.price.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono-numbers text-neutral-400">
                      ETB {p.costPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono-numbers font-medium text-emerald-400">
                      {marginPct.toFixed(0)}%
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-mono-numbers font-bold text-xs ${
                        isLow ? 'text-amber-400' : 'text-neutral-200'
                      }`}>
                        {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{p.stock} {p.unit}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjustStock(p.id, 5)}
                          className="px-2 py-1 text-xs font-mono-numbers font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 cursor-pointer transition-colors"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustStock(p.id, 10)}
                          className="px-2 py-1 text-xs font-mono-numbers font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 cursor-pointer transition-colors"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          disabled={p.stock <= 0}
                          onClick={() => adjustStock(p.id, -1)}
                          className="px-2 py-1 text-xs font-mono-numbers rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 disabled:opacity-30 cursor-pointer transition-colors"
                        >
                          -1
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-neutral-400 hover:text-amber-300 rounded hover:bg-neutral-800 cursor-pointer transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete "${p.name}" from catalog?`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 rounded hover:bg-neutral-800 cursor-pointer transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Ergonomic Cards with >=44px touch targets */}
        <div className="md:hidden divide-y divide-neutral-800/80 p-2 space-y-2">
          {filteredProducts.map((p) => {
            const marginPct = p.price > 0 ? ((p.price - p.costPrice) / p.price) * 100 : 0;
            const isLow = p.stock <= p.minStockAlert;

            return (
              <div key={p.id} className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800/70 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-neutral-100 truncate">{p.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400 font-mono">
                      <span className="text-amber-400/90 font-medium">{p.sku}</span>
                      <span>•</span>
                      <span>{p.category}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 font-mono-numbers font-bold text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    isLow ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50' : 'bg-neutral-800 text-neutral-300'
                  }`}>
                    {isLow && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                    <span>{p.stock} {p.unit}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 py-1 px-2 rounded-lg bg-neutral-900/80 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Retail</span>
                    <span className="text-xs font-bold text-amber-300 font-mono-numbers">ETB {p.price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Cost</span>
                    <span className="text-xs text-neutral-400 font-mono-numbers">ETB {p.costPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Margin</span>
                    <span className="text-xs font-medium text-emerald-400 font-mono-numbers">{marginPct.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 gap-2">
                  {/* Stock quick adjust (>=44px touch targets) */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono mr-1">Stock:</span>
                    <button
                      type="button"
                      onClick={() => adjustStock(p.id, -1)}
                      disabled={p.stock <= 0}
                      className="min-h-[44px] min-w-[40px] px-2.5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustStock(p.id, 5)}
                      className="min-h-[44px] min-w-[44px] px-2.5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 cursor-pointer active:scale-95 transition-all"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustStock(p.id, 10)}
                      className="min-h-[44px] min-w-[44px] px-2.5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 cursor-pointer active:scale-95 transition-all"
                    >
                      +10
                    </button>
                  </div>

                  {/* Actions (>=44px touch targets) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-amber-300 rounded-lg hover:bg-neutral-800 border border-transparent hover:border-neutral-700 cursor-pointer transition-colors"
                      title="Edit Item"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete "${p.name}" from catalog?`)) {
                          deleteProduct(p.id);
                        }
                      }}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-neutral-800 border border-transparent hover:border-neutral-700 cursor-pointer transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-14 text-center text-neutral-500 text-xs">
            No products match the filter criteria.
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal in Black & Gold */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full border border-neutral-800 overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{editingProduct ? 'Edit Stationery Item' : 'Add New Stationery Product'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 focus:border-amber-500/50"
                  placeholder="e.g. Moleskine Dot Grid Large"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-neutral-400">
                      Category *
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">Manual Entry</span>
                  </div>
                  <input
                    type="text"
                    required
                    list="category-suggestions"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Type or pick category..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60 font-medium"
                  />
                  <datalist id="category-suggestions">
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1.5">
                    {availableCategories.slice(0, 5).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`text-[10px] px-2 py-0.5 rounded cursor-pointer whitespace-nowrap transition-colors border ${
                          formData.category === cat
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/60 font-semibold'
                            : 'bg-neutral-950 text-neutral-500 border-neutral-850 hover:text-neutral-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    Unit Type
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                    placeholder="each, pack, ream, box"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-neutral-800 bg-neutral-950 text-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    Barcode EAN / UPC
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    Retail Price (ETB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs font-mono-numbers rounded-lg border border-neutral-800 bg-neutral-950 text-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    Cost Price (ETB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs font-mono-numbers rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    Stock Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs font-mono-numbers rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs font-mono-numbers rounded-lg border border-neutral-800 bg-neutral-950 text-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Product Description / Specs
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Item Import & Template Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

    </div>
  );
};
