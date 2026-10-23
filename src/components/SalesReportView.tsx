import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Printer, 
  Download, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  ArrowRight, 
  FileText, 
  Layers, 
  X, 
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Leaf
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { SaleTransaction, PaymentMethod } from '../types';
import { generateBrandedPDFReport, generateSaleReceiptPDF } from '../utils/pdfExport';

export const SalesReportView: React.FC = () => {
  const { transactions, settings, showToast } = usePOS();

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('All');
  const [receiptFilter, setReceiptFilter] = useState<'All' | 'receipt' | 'no_receipt'>('All');

  // Selected Sale for Detailed Modal View
  const [inspectSale, setInspectSale] = useState<SaleTransaction | null>(null);

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

  // Filter Transactions by Date or Date Range
  const filteredSales = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = tx.timestamp.slice(0, 10);

      // Date matching
      let dateMatch = true;
      if (filterMode === 'single') {
        dateMatch = txDate === specificDate;
      } else {
        if (startDate && txDate < startDate) dateMatch = false;
        if (endDate && txDate > endDate) dateMatch = false;
      }

      if (!dateMatch) return false;

      // Payment Method
      if (selectedPaymentMethod !== 'All' && tx.payment.method !== selectedPaymentMethod) {
        return false;
      }

      // Receipt Status Filter
      if (receiptFilter === 'receipt' && tx.noReceipt) {
        return false;
      }
      if (receiptFilter === 'no_receipt' && !tx.noReceipt) {
        return false;
      }

      // Search matching (receipt #, customer name, items)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchReceipt = tx.receiptNumber.toLowerCase().includes(q);
        const matchCustomer = !!tx.customerName?.toLowerCase().includes(q);
        const matchItems = tx.items.some(it => it.name.toLowerCase().includes(q));
        if (!matchReceipt && !matchCustomer && !matchItems) return false;
      }

      return true;
    });
  }, [transactions, filterMode, specificDate, startDate, endDate, selectedPaymentMethod, receiptFilter, searchQuery]);

  // Aggregate KPI Calculations
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalCost = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalUnits = 0;
    let cashSales = 0;
    let cardSales = 0;
    let otherSales = 0;
    let paperlessCount = 0;

    filteredSales.forEach((tx) => {
      totalSales += tx.total;
      totalCost += tx.costTotal || 0;
      totalDiscount += tx.discountTotal || 0;
      totalTax += tx.taxTotal || 0;

      if (tx.noReceipt) paperlessCount++;

      tx.items.forEach(it => {
        totalUnits += it.quantity;
      });

      if (tx.payment.method === 'cash') cashSales += tx.total;
      else if (tx.payment.method === 'card') cardSales += tx.total;
      else otherSales += tx.total;
    });

    const netSales = Math.max(0, totalSales - totalTax);
    const grossProfit = Math.max(0, netSales - totalCost);
    const marginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
    const aov = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

    return {
      totalSales,
      netSales,
      totalCost,
      totalDiscount,
      totalTax,
      grossProfit,
      marginPct,
      aov,
      orderCount: filteredSales.length,
      totalUnits,
      paperlessCount,
      cashSales,
      cardSales,
      otherSales
    };
  }, [filteredSales]);

  // Top products sold in this period
  const topProductsInPeriod = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number; category: string }>();

    filteredSales.forEach((tx) => {
      tx.items.forEach((it) => {
        const key = it.productId || it.name;
        const existing = map.get(key);
        const lineRev = it.unitPrice * it.quantity;
        if (existing) {
          existing.quantity += it.quantity;
          existing.revenue += lineRev;
        } else {
          map.set(key, {
            name: it.name,
            quantity: it.quantity,
            revenue: lineRev,
            category: it.category || 'General'
          });
        }
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [filteredSales]);

  // PDF Export
  const handleExportPDF = () => {
    if (filteredSales.length === 0) {
      showToast('No sales records to export.');
      return;
    }

    const headers = ['Receipt #', 'Date & Time', 'Customer', 'Items', 'Payment', 'Subtotal', 'Discount', 'Tax', 'Total (ETB)', 'Cost', 'Profit'];
    const rows = filteredSales.map((tx) => [
      tx.receiptNumber,
      new Date(tx.timestamp).toLocaleString(),
      tx.customerName || 'Walk-in Customer',
      tx.items.reduce((s, it) => s + it.quantity, 0),
      tx.payment.method.toUpperCase(),
      `ETB ${tx.subtotal.toFixed(2)}`,
      `ETB ${tx.discountTotal.toFixed(2)}`,
      `ETB ${tx.taxTotal.toFixed(2)}`,
      `ETB ${tx.total.toFixed(2)}`,
      `ETB ${(tx.costTotal || 0).toFixed(2)}`,
      `ETB ${(tx.grossProfit || 0).toFixed(2)}`,
    ]);

    const dateLabel = filterMode === 'single' ? specificDate : `${startDate || 'start'}_to_${endDate || 'now'}`;
    const periodText = filterMode === 'single' ? `Date: ${specificDate}` : `${startDate || 'Earliest'} to ${endDate || 'Today'}`;

    generateBrandedPDFReport({
      filename: `Sales_Report_${dateLabel}.pdf`,
      title: 'Sales & Outgoing Revenue Report',
      subtitle: `Period: ${periodText} · Internal Audit of Retail Sales & Stationery Services`,
      metaRight: periodText,
      metrics: [
        { label: 'Total Sales Revenue', value: `ETB ${metrics.totalSales.toFixed(2)}` },
        { label: 'Gross Profit', value: `ETB ${metrics.grossProfit.toFixed(2)} (${metrics.marginPct.toFixed(1)}%)` },
        { label: 'Completed Orders', value: `${metrics.orderCount} (${metrics.totalUnits} units)` },
        { label: 'Avg Order Value', value: `ETB ${metrics.aov.toFixed(2)}` },
      ],
      headers,
      rows,
      orientation: 'landscape',
    });

    showToast(`Exported Sales Report PDF (${filteredSales.length} records).`);
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
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-neutral-100 flex items-center gap-2">
                  Sales Report
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium border border-amber-500/30">
                    {filterMode === 'single' ? `Date: ${specificDate}` : `${startDate || 'Earliest'} → ${endDate || 'Today'}`}
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Internal audit of all completed retail sales and on-demand stationery service tickets.
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

            {/* Payment Method Filter */}
            <div className="md:col-span-2">
              <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                Payment Method
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
              >
                <option value="All">All Payments</option>
                <option value="cash">Cash Only</option>
                <option value="card">Card / Electronic</option>
                <option value="store_credit">Store Credit</option>
              </select>
            </div>

            {/* Receipt Choice Filter */}
            <div className="md:col-span-2">
              <label className="text-[11px] text-neutral-400 font-medium block mb-1 flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-400" />
                Receipt Mode
              </label>
              <select
                value={receiptFilter}
                onChange={(e) => setReceiptFilter(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
              >
                <option value="All">All Receipts</option>
                <option value="receipt">Standard Receipt</option>
                <option value="no_receipt">No Receipt (Eco)</option>
              </select>
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Receipt #, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Aggregate KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-neutral-800">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-medium block">Total Sales</span>
            <span className="text-xl font-bold font-mono-numbers text-amber-300 mt-1 block">
              ETB {metrics.totalSales.toFixed(2)}
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-medium block">Gross Profit</span>
            <span className="text-xl font-bold font-mono-numbers text-emerald-400 mt-1 block">
              ETB {metrics.grossProfit.toFixed(2)}
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              {metrics.marginPct.toFixed(1)}% margin
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-medium block">Orders Logged</span>
            <span className="text-xl font-bold font-mono-numbers text-neutral-100 mt-1 block">
              {metrics.orderCount}
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              {metrics.totalUnits} items · {metrics.paperlessCount} paperless
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-medium block">Average Order</span>
            <span className="text-xl font-bold font-mono-numbers text-neutral-200 mt-1 block">
              ETB {metrics.aov.toFixed(2)}
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-medium block">Cash Logged</span>
            <span className="text-xl font-bold font-mono-numbers text-neutral-200 mt-1 block">
              ETB {metrics.cashSales.toFixed(2)}
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-medium block">Sales Tax</span>
            <span className="text-xl font-bold font-mono-numbers text-amber-400/90 mt-1 block">
              ETB {metrics.totalTax.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Selling Products in Period */}
      {topProductsInPeriod.length > 0 && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 shadow-xl shadow-black/40">
          <h3 className="text-sm font-bold text-neutral-200 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Top Selling Merchandise &amp; Services in Selected Period
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topProductsInPeriod.map((item, idx) => (
              <div key={idx} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-xs text-neutral-100 truncate">{item.name}</div>
                  <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    {item.quantity} units • {item.category}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold font-mono-numbers text-amber-400">
                    ETB {item.revenue.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl shadow-black/40">
        <div className="p-4 bg-neutral-950/70 border-b border-neutral-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-neutral-200">
            Sales Transactions Breakdown ({filteredSales.length} records)
          </div>
          <div className="text-xs text-neutral-400">
            Period Total: <strong className="text-amber-400 font-mono">ETB {metrics.totalSales.toFixed(2)}</strong>
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <ShoppingBag className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-neutral-300">No Sales in Selected Period</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              No sales records match the selected date or date range. Try widening the date filter or using "All Records".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/90 border-b border-neutral-800 text-neutral-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-3">Date &amp; Time</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items Summary</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">Tax</th>
                  <th className="py-3 px-4 text-right">Total (ETB)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70 font-mono-numbers">
                {filteredSales.map((tx) => {
                  const itemCount = tx.items.reduce((s, it) => s + it.quantity, 0);
                  const firstItem = tx.items[0]?.name || 'Item';
                  const itemsSummary = tx.items.length === 1 
                    ? firstItem 
                    : `${firstItem} + ${tx.items.length - 1} more`;

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-850/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-neutral-100 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span>{tx.receiptNumber}</span>
                          {tx.noReceipt && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                              <Leaf className="w-2.5 h-2.5" />
                              No Rcpt
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-neutral-300">
                        {new Date(tx.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3 px-3 font-sans text-neutral-300">
                        {tx.customerName || <span className="text-neutral-500 italic">Walk-in</span>}
                      </td>

                      <td className="py-3 px-3 font-sans text-neutral-300 truncate max-w-xs" title={itemsSummary}>
                        <span className="font-mono text-amber-400/90 font-bold mr-1.5">[{itemCount}x]</span>
                        {itemsSummary}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-mono capitalize">
                          {tx.payment.method}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-neutral-400">
                        ETB {tx.subtotal.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right text-neutral-400">
                        ETB {tx.taxTotal.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-amber-300">
                        ETB {tx.total.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setInspectSale(tx)}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-sans font-semibold rounded-md transition-colors cursor-pointer"
                        >
                          Details
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

      {/* Sale Details Inspection Modal */}
      {inspectSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <span>Sale Record #{inspectSale.receiptNumber}</span>
                </h4>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {new Date(inspectSale.timestamp).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectSale(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Customer info & Receipt status */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-neutral-200">
                  <span>Customer: <strong>{inspectSale.customerName || 'Walk-in'}</strong></span>
                  <span>Operator: <strong>{inspectSale.cashierName}</strong></span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-850 text-neutral-400">
                  <span>Receipt Option:</span>
                  <span>
                    {inspectSale.noReceipt ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 font-mono text-[11px]">
                        <Leaf className="w-3 h-3" /> No Receipt (Paperless)
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1 font-mono text-[11px]">
                        <Printer className="w-3 h-3" /> Standard Receipt Issued
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-neutral-300 block">Line Items:</span>
                <div className="divide-y divide-neutral-800/80 border border-neutral-800 rounded-xl bg-neutral-950 overflow-hidden">
                  {inspectSale.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-neutral-100">{it.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {it.quantity} x ETB {it.unitPrice.toFixed(2)}
                          {it.discountPercent ? ` (${it.discountPercent}% off)` : ''}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-neutral-200 text-right">
                        ETB {(it.unitPrice * it.quantity * (1 - (it.discountPercent || 0) / 100)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal:</span>
                  <span>ETB {inspectSale.subtotal.toFixed(2)}</span>
                </div>
                {inspectSale.discountTotal > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Discount:</span>
                    <span>-ETB {inspectSale.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-400">
                  <span>Tax ({((inspectSale.taxRate || settings.taxRate) * 100).toFixed(2)}%):</span>
                  <span>ETB {inspectSale.taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-amber-300 pt-1.5 border-t border-neutral-800">
                  <span>Total Recorded:</span>
                  <span>ETB {inspectSale.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => generateSaleReceiptPDF(inspectSale, settings)}
                className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 border border-amber-500/30 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Download Receipt (PDF)</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectSale(null)}
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
