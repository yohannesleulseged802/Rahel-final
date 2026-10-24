import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Printer, 
  Download, 
  DollarSign, 
  Truck, 
  Layers, 
  FileText, 
  X, 
  Clock, 
  CheckCircle2, 
  Building2, 
  PackageCheck,
  TrendingDown,
  ShoppingBag
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { PurchaseTransaction } from '../types';
import { generateBrandedPDFReport } from '../utils/pdfExport';

export const PurchaseReportView: React.FC = () => {
  const { purchases, showToast } = usePOS();

  // Mode: 'range' or 'single'
  const [filterMode, setFilterMode] = useState<'range' | 'single'>('range');

  // Date State
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [specificDate, setSpecificDate] = useState<string>(todayStr);

  // Default range: First day of current month to today
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Additional Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Selected PO for Detailed Modal View
  const [inspectPO, setInspectPO] = useState<PurchaseTransaction | null>(null);

  // Quick Date Presets
  const handleSetPreset = (preset: 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'all') => {
    const now = new Date();
    const toDateStr = (date: Date) => date.toISOString().slice(0, 10);

    if (preset === 'today') {
      setFilterMode('single');
      setSpecificDate(toDateStr(now));
      setStartDate(toDateStr(now));
      setEndDate(toDateStr(now));
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      setFilterMode('single');
      setSpecificDate(toDateStr(y));
      setStartDate(toDateStr(y));
      setEndDate(toDateStr(y));
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setFilterMode('range');
      setStartDate(toDateStr(past));
      setEndDate(toDateStr(now));
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setFilterMode('range');
      setStartDate(toDateStr(past));
      setEndDate(toDateStr(now));
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setFilterMode('range');
      setStartDate(toDateStr(start));
      setEndDate(toDateStr(now));
    } else if (preset === 'all') {
      setFilterMode('range');
      setStartDate('');
      setEndDate('');
    }
  };

  // Distinct Suppliers
  const suppliers = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach(p => {
      if (p.supplierName) set.add(p.supplierName);
    });
    return ['All', ...Array.from(set).sort()];
  }, [purchases]);

  // Filter Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((po) => {
      const poDate = po.timestamp.slice(0, 10);

      // Date matching
      let dateMatch = true;
      if (filterMode === 'single') {
        dateMatch = poDate === specificDate;
      } else {
        if (startDate && poDate < startDate) dateMatch = false;
        if (endDate && poDate > endDate) dateMatch = false;
      }

      if (!dateMatch) return false;

      // Supplier
      if (selectedSupplier !== 'All' && (po.supplierName || 'General Vendor') !== selectedSupplier) {
        return false;
      }

      // Status
      if (selectedStatus !== 'All' && po.status !== selectedStatus) {
        return false;
      }

      // Search matching (PO #, invoice #, supplier name, item names)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPO = po.poNumber.toLowerCase().includes(q);
        const matchSupplier = (po.supplierName || 'General Vendor').toLowerCase().includes(q);
        const matchInvoice = !!po.supplierInvoice?.toLowerCase().includes(q);
        const matchItems = po.items.some(it => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q));
        if (!matchPO && !matchSupplier && !matchInvoice && !matchItems) return false;
      }

      return true;
    });
  }, [purchases, filterMode, specificDate, startDate, endDate, selectedSupplier, selectedStatus, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    let totalSpend = 0;
    let totalUnits = 0;
    let paidSpend = 0;
    let pendingSpend = 0;

    filteredPurchases.forEach(po => {
      totalSpend += po.totalCost;
      totalUnits += po.itemCount;
      if (po.paymentStatus === 'paid') {
        paidSpend += po.totalCost;
      } else {
        pendingSpend += po.totalCost;
      }
    });

    const averagePO = filteredPurchases.length > 0 ? totalSpend / filteredPurchases.length : 0;

    return {
      totalSpend,
      totalUnits,
      poCount: filteredPurchases.length,
      averagePO,
      paidSpend,
      pendingSpend
    };
  }, [filteredPurchases]);

  // Supplier Breakdown
  const supplierSpendList = useMemo(() => {
    const map = new Map<string, { count: number; spend: number; units: number }>();

    filteredPurchases.forEach(po => {
      const name = po.supplierName || 'General Supplier';
      const existing = map.get(name);
      if (existing) {
        existing.count += 1;
        existing.spend += po.totalCost;
        existing.units += po.itemCount;
      } else {
        map.set(name, { count: 1, spend: po.totalCost, units: po.itemCount });
      }
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 6);
  }, [filteredPurchases]);

  // Export PDF
  const handleExportPDF = () => {
    if (filteredPurchases.length === 0) {
      showToast('No purchase records to export.');
      return;
    }

    const headers = ['PO Number', 'Date', 'Supplier Name', 'Invoice #', 'Total Units', 'Total Cost (ETB)', 'Delivery Status', 'Payment Status', 'Operator'];
    const rows = filteredPurchases.map(po => [
      po.poNumber,
      new Date(po.timestamp).toLocaleDateString(),
      po.supplierName || 'General Vendor',
      po.supplierInvoice || 'N/A',
      po.itemCount,
      `ETB ${po.totalCost.toFixed(2)}`,
      po.status.toUpperCase(),
      po.paymentStatus.replace('_', ' ').toUpperCase(),
      po.operatorName,
    ]);

    const dateLabel = filterMode === 'single' ? specificDate : `${startDate || 'start'}_to_${endDate || 'now'}`;
    const periodText = filterMode === 'single' ? `Date: ${specificDate}` : `${startDate || 'Earliest'} to ${endDate || 'Today'}`;

    generateBrandedPDFReport({
      filename: `Purchase_Report_${dateLabel}.pdf`,
      title: 'Purchase & Supplier Restock Report',
      subtitle: `Period: ${periodText} · Internal Audit of Vendor Purchase Orders & Inward Shipments`,
      metaRight: periodText,
      metrics: [
        { label: 'Total Purchase Spend', value: `ETB ${metrics.totalSpend.toFixed(2)}` },
        { label: 'Purchase Orders', value: String(metrics.poCount) },
        { label: 'Total Units Restocked', value: `${metrics.totalUnits} units` },
        { label: 'Average PO Value', value: `ETB ${metrics.averagePO.toFixed(2)}` },
      ],
      headers,
      rows,
      orientation: 'landscape',
    });

    showToast(`Exported Purchase Report PDF (${filteredPurchases.length} records).`);
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
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-neutral-100 flex items-center gap-2">
                  Purchase Report
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium border border-amber-500/30">
                    {filterMode === 'single' ? `Date: ${specificDate}` : `${startDate || 'Earliest'} → ${endDate || 'Today'}`}
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Internal audit of all vendor purchase orders, inventory restocking shipments, and supplier invoices.
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
              <span>Print Report</span>
            </button>

            <button
              onClick={handleExportPDF}
              type="button"
              className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-neutral-950" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="mt-5 space-y-3">
          {/* Filter Mode Toggle & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setFilterMode('range')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filterMode === 'range' 
                    ? 'bg-amber-500 text-neutral-950 font-bold' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Date Range
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('single')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filterMode === 'single' 
                    ? 'bg-amber-500 text-neutral-950 font-bold' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Specific Date
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'today' as const, label: 'Today' },
                { id: 'yesterday' as const, label: 'Yesterday' },
                { id: '7days' as const, label: 'Last 7 Days' },
                { id: 'this_month' as const, label: 'This Month' },
                { id: 'all' as const, label: 'All Records' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSetPreset(p.id)}
                  className="px-2.5 py-1 text-xs bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg border border-neutral-750 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Input Pickers & Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
            {filterMode === 'range' ? (
              <>
                <div className="md:col-span-3">
                  <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-hidden focus:border-amber-500/50"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-hidden focus:border-amber-500/50"
                  />
                </div>
              </>
            ) : (
              <div className="md:col-span-6">
                <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                  Specific Date
                </label>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-hidden focus:border-amber-500/50"
                />
              </div>
            )}

            {/* Supplier Filter */}
            <div className="md:col-span-3">
              <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                Supplier
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
              >
                {suppliers.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All Suppliers' : s}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="md:col-span-3">
              <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="PO #, invoice, supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Aggregate KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-neutral-800">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-medium block">Total Purchase Spend</span>
            <span className="text-xl font-bold font-mono-numbers text-amber-300 mt-1 block">
              ETB {metrics.totalSpend.toFixed(2)}
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-medium block">Purchase Orders (POs)</span>
            <span className="text-xl font-bold font-mono-numbers text-neutral-100 mt-1 block">
              {metrics.poCount}
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              Across {supplierSpendList.length} suppliers
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-medium block">Stock Units Added</span>
            <span className="text-xl font-bold font-mono-numbers text-emerald-400 mt-1 block">
              +{metrics.totalUnits} <span className="text-xs font-normal text-neutral-400">units</span>
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-medium block">Average PO Spend</span>
            <span className="text-xl font-bold font-mono-numbers text-neutral-200 mt-1 block">
              ETB {metrics.averagePO.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Suppliers Spend in Period */}
      {supplierSpendList.length > 0 && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 shadow-xl shadow-black/40">
          <h3 className="text-sm font-bold text-neutral-200 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            Supplier Volume Breakdown in Selected Period
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {supplierSpendList.map((sup, idx) => (
              <div key={idx} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-xs text-neutral-100 truncate">{sup.name}</div>
                  <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    {sup.count} PO{sup.count > 1 ? 's' : ''} • {sup.units} units received
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold font-mono-numbers text-amber-400">
                    ETB {sup.spend.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PO Transactions Table */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl shadow-black/40">
        <div className="p-4 bg-neutral-950/70 border-b border-neutral-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-neutral-200">
            Purchase Orders Breakdown ({filteredPurchases.length} records)
          </div>
          <div className="text-xs text-neutral-400">
            Period Restock Total: <strong className="text-amber-400 font-mono">ETB {metrics.totalSpend.toFixed(2)}</strong>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <Truck className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-neutral-300">No Purchase Orders in Selected Period</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              No supplier purchase orders match the selected date or date range. Try widening the date filter or using "All Records".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/90 border-b border-neutral-800 text-neutral-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Supplier Name</th>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3 text-center">Items / Units</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-4 text-right">Total Cost (ETB)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70 font-mono-numbers">
                {filteredPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-neutral-850/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-neutral-100 font-mono">
                      {po.poNumber}
                    </td>

                    <td className="py-3 px-3 text-neutral-300">
                      {new Date(po.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="py-3 px-3 font-sans text-neutral-200 font-medium">
                      {po.supplierName}
                    </td>

                    <td className="py-3 px-3 font-mono text-neutral-400 text-[11px]">
                      {po.supplierInvoice || '—'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[11px] font-mono">
                        {po.items.length} lines ({po.itemCount} units)
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        po.status === 'received'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : po.status === 'ordered'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {po.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono capitalize ${
                        po.paymentStatus === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {po.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-amber-300">
                      ETB {po.totalCost.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setInspectPO(po)}
                        className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-sans font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PO Details Inspection Modal */}
      {inspectPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <span>Purchase Order #{inspectPO.poNumber}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono uppercase font-bold">
                    {inspectPO.status}
                  </span>
                </h4>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {new Date(inspectPO.timestamp).toLocaleString()} • Logged by {inspectPO.operatorName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectPO(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Supplier & Invoice */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 text-xs">
                <div className="flex items-center justify-between text-neutral-200">
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Supplier / Vendor:</span>
                    <strong className="text-sm text-neutral-100">{inspectPO.supplierName}</strong>
                  </div>
                  {inspectPO.supplierInvoice && (
                    <div className="text-right">
                      <span className="text-neutral-400 block text-[11px]">Vendor Invoice #:</span>
                      <strong className="font-mono text-neutral-100">{inspectPO.supplierInvoice}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-neutral-300 block">Restocked Items:</span>
                <div className="divide-y divide-neutral-800/80 border border-neutral-800 rounded-xl bg-neutral-950 overflow-hidden">
                  {inspectPO.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-neutral-100">{it.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          SKU: {it.sku} • {it.quantity} units @ ETB {it.unitCost.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-neutral-200 text-right">
                        ETB {it.totalCost.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {inspectPO.notes && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 text-xs text-neutral-300">
                  <span className="text-[11px] text-neutral-400 block mb-0.5">PO Notes:</span>
                  {inspectPO.notes}
                </div>
              )}

              {/* Total Summary */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Total Units Restocked:</span>
                  <span>{inspectPO.itemCount} units</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Payment Status:</span>
                  <span className="capitalize">{inspectPO.paymentStatus}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-amber-300 pt-1.5 border-t border-neutral-800">
                  <span>Total Expenditure:</span>
                  <span>ETB {inspectPO.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectPO(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
