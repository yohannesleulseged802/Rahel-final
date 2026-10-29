import React, { useMemo, useState } from 'react';
import {
  ShoppingBag,
  Truck,
  Package,
  Printer,
  BarChart3,
  QrCode,
  Barcode,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileDown,
  TrendingUp,
  Layers,
  ShieldCheck,
  Sparkles,
  Plus,
  Search,
  Settings as SettingsIcon,
  Wallet,
  BookOpen
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { generateBrandedPDFReport } from '../utils/pdfExport';
import { RahelLogo } from './RahelLogo';

export const HomeDashboard: React.FC = () => {
  const {
    products,
    transactions,
    purchases,
    expenses,
    creditAccounts,
    currentUser,
    setActiveTab,
    openScanner,
    isCloudConnected,
    settings,
    showToast
  } = usePOS();

  const [activityFilter, setActivityFilter] = useState<'all' | 'sales' | 'purchases'>('all');

  // Compute Executive Store Metrics in ETB
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const safePurchases = Array.isArray(purchases) ? purchases : [];
    const safeProducts = Array.isArray(products) ? products : [];

    const activeTransactions = safeTransactions.filter(t => t && t.status !== 'refunded');
    const todayTransactions = activeTransactions.filter(
      t => t.timestamp && new Date(t.timestamp).toDateString() === todayStr
    );

    const todayRevenue = todayTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const totalRevenue = activeTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);

    // Compute COGS & Gross Profit
    let totalCostOfGoods = 0;
    activeTransactions.forEach(t => {
      const items = Array.isArray(t.items) ? t.items : [];
      items.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        if (item.costPrice !== undefined && item.costPrice !== null) {
          totalCostOfGoods += (Number(item.costPrice) || 0) * qty;
        } else if (item.productId) {
          const prod = safeProducts.find(p => p.id === item.productId);
          totalCostOfGoods += (Number(prod?.costPrice) || unitPrice * 0.55) * qty;
        } else {
          totalCostOfGoods += unitPrice * 0.35 * qty;
        }
      });
    });

    const totalGrossProfit = totalRevenue - totalCostOfGoods;
    const profitMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    // Catalog Valuation
    const retailValuation = safeProducts.reduce(
      (sum, p) => sum + (Number(p.price) || 0) * Math.max(0, Number(p.stock) || 0),
      0
    );
    const costValuation = safeProducts.reduce(
      (sum, p) =>
        sum +
        (Number(p.costPrice) || (Number(p.price) || 0) * 0.55) *
          Math.max(0, Number(p.stock) || 0),
      0
    );
    const totalUnitsInStock = safeProducts.reduce(
      (sum, p) => sum + Math.max(0, Number(p.stock) || 0),
      0
    );

    // Stock Health
    const lowStockItems = safeProducts.filter(
      p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= (Number(p.minStockAlert) || 10)
    );
    const outOfStockItems = safeProducts.filter(p => (Number(p.stock) || 0) <= 0);
    const criticalItems = [...outOfStockItems, ...lowStockItems].slice(0, 6);

    // Purchase Spend
    const totalPurchaseSpend = safePurchases.reduce(
      (sum, po) => sum + (Number(po?.totalCost) || 0),
      0
    );

    // Top Selling Products by Revenue & Service Jobs Count
    let serviceJobsCount = 0;
    const productSalesMap = new Map<string, { id: string; name: string; category: string; qty: number; revenue: number }>();
    activeTransactions.forEach(tx => {
      const items = Array.isArray(tx.items) ? tx.items : [];
      items.forEach(item => {
        if (item.type === 'service' || item.category === 'Print & Copy Services') {
          serviceJobsCount += 1;
        }
        const key = item.productId || item.name || 'item';
        const existing = productSalesMap.get(key) || {
          id: key,
          name: item.name || 'Store Item',
          category: item.category || 'General',
          qty: 0,
          revenue: 0
        };
        const qty = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        existing.qty += qty;
        existing.revenue += unitPrice * qty;
        productSalesMap.set(key, existing);
      });
    });
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    const totalOtherExpenses = safeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const safeCredits = Array.isArray(creditAccounts) ? creditAccounts : [];
    const totalOutstandingDebt = safeCredits.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
    const activeDebtorsCount = safeCredits.filter(a => (Number(a.currentBalance) || 0) > 0).length;

    return {
      todayRevenue,
      todayCount: todayTransactions.length,
      totalRevenue,
      totalTransactions: activeTransactions.length,
      totalGrossProfit,
      profitMargin,
      retailValuation,
      costValuation,
      totalUnitsInStock,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      criticalItems,
      totalPurchaseSpend,
      serviceJobsCount,
      topProducts,
      totalOtherExpenses,
      totalOutstandingDebt,
      activeDebtorsCount
    };
  }, [products, transactions, purchases, expenses, creditAccounts]);

  // Unified Recent Store Ledger (Sales & Purchases)
  const recentActivity = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const safePurchases = Array.isArray(purchases) ? purchases : [];

    const saleEntries = safeTransactions.slice(0, 12).map(tx => {
      const items = Array.isArray(tx?.items) ? tx.items : [];
      const unitCount = items.reduce((s, i) => s + (Number(i?.quantity) || 0), 0);
      const paymentLabel = String(tx?.payment?.method || (tx as any)?.paymentMethod || 'cash').toUpperCase();
      return {
        id: tx?.id || Math.random().toString(),
        ref: tx?.receiptNumber || 'SALE',
        type: 'sale' as const,
        title: tx?.customerName || 'Walk-In Counter Sale',
        subtitle: `${unitCount} unit(s) · ${paymentLabel}`,
        amount: Number(tx?.total) || 0,
        timestamp: tx?.timestamp || new Date().toISOString(),
        status: tx?.status || 'completed',
        noReceipt: !!tx?.noReceipt
      };
    });

    const purchaseEntries = safePurchases.slice(0, 12).map(po => {
      const poItems = Array.isArray(po?.items) ? po.items : [];
      const totalUnits = poItems.reduce((s, i) => s + (Number(i?.quantity) || 0), 0);
      return {
        id: po?.id || Math.random().toString(),
        ref: po?.poNumber || 'PO',
        type: 'purchase' as const,
        title: po?.supplierName || 'Supplier Delivery',
        subtitle: `${totalUnits} unit(s) restocked · Inv ${po?.supplierInvoice || 'N/A'}`,
        amount: Number(po?.totalCost) || 0,
        timestamp: po?.timestamp || new Date().toISOString(),
        status: po?.status || 'received'
      };
    });

    const combined =
      activityFilter === 'sales'
        ? saleEntries
        : activityFilter === 'purchases'
        ? purchaseEntries
        : [...saleEntries, ...purchaseEntries];

    return combined
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [transactions, purchases, activityFilter]);

  const handleExportOverviewPDF = () => {
    generateBrandedPDFReport({
      title: 'Executive Store Overview & Valuation Report',
      subtitle: `${settings.storeName} · Permanent Currency: ETB · Generated by ${currentUser?.name || 'Administrator'}`,
      filename: `Rahel_Executive_Overview_${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'landscape',
      metrics: [
        { label: "Today's Counter Revenue", value: `ETB ${metrics.todayRevenue.toFixed(2)}` },
        { label: 'Cumulative Revenue', value: `ETB ${metrics.totalRevenue.toFixed(2)}` },
        { label: 'Gross Profit', value: `ETB ${metrics.totalGrossProfit.toFixed(2)} (${metrics.profitMargin.toFixed(1)}%)` },
        { label: 'Catalog Retail Value', value: `ETB ${metrics.retailValuation.toFixed(2)}` },
        { label: 'Active SKUs / Units', value: `${products.length} SKUs (${metrics.totalUnitsInStock} units)` },
        { label: 'Restock Alerts', value: `${metrics.lowStockCount + metrics.outOfStockCount} items` }
      ],
      headers: ['SKU', 'Item Name', 'Category', 'Stock on Hand', 'Min Level', 'Unit Cost (ETB)', 'Retail Price (ETB)', 'Retail Valuation (ETB)'],
      rows: products.map(p => {
        const price = Number(p.price) || 0;
        const cost = Number(p.costPrice) || price * 0.55;
        const stock = Math.max(0, Number(p.stock) || 0);
        return [
          p.sku || '',
          p.name || '',
          p.category || '',
          `${p.stock ?? 0} ${p.unit || 'pcs'}`,
          p.minStockAlert ?? 10,
          `ETB ${cost.toFixed(2)}`,
          `ETB ${price.toFixed(2)}`,
          `ETB ${(price * stock).toFixed(2)}`
        ];
      })
    });
    showToast('Executive Store Overview exported to PDF (ETB).');
  };

  const workstationModules = [
    {
      id: 'sales' as const,
      title: 'Sales Register & POS',
      subtitle: 'Record counter sales, scan barcodes, print receipts & deduct stock automatically.',
      metricLabel: 'Recorded Sales',
      metricValue: `ETB ${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      badge: `${metrics.totalTransactions} receipts`,
      icon: ShoppingBag,
      accent: 'from-amber-400/20 to-amber-500/5 border-amber-500/40'
    },
    {
      id: 'purchase' as const,
      title: 'Purchase & Receiving',
      subtitle: 'Log supplier deliveries, track wholesale unit costs in ETB & restock inventory.',
      metricLabel: 'Procurement Spend',
      metricValue: `ETB ${metrics.totalPurchaseSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      badge: `${purchases?.length || 0} POs logged`,
      icon: Truck,
      accent: 'from-neutral-800/80 to-neutral-900 border-neutral-800 hover:border-amber-500/40'
    },
    {
      id: 'inventory' as const,
      title: 'Inventory Catalog',
      subtitle: 'Manage stationery SKUs, wholesale/retail ETB pricing, Excel bulk import & stock levels.',
      metricLabel: 'Catalog Valuation',
      metricValue: `ETB ${metrics.retailValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      badge: `${products?.length || 0} active SKUs`,
      icon: Package,
      accent: 'from-neutral-800/80 to-neutral-900 border-neutral-800 hover:border-amber-500/40'
    },
    {
      id: 'services' as const,
      title: 'Services & Copy Atelier',
      subtitle: 'Instant job costing for printing, binding, lamination, rubber stamps & passport photos.',
      metricLabel: 'Atelier Configurations',
      metricValue: '7 Service Stations',
      badge: `${metrics.serviceJobsCount} jobs recorded`,
      icon: Printer,
      accent: 'from-neutral-800/80 to-neutral-900 border-neutral-800 hover:border-amber-500/40'
    },
    {
      id: 'expenses' as const,
      title: 'Other Expenses',
      subtitle: 'Track Fuel, Rent & Salary payments with account tracking across Telebirr (Maria/Rahel) & Banks.',
      metricLabel: 'Recorded Expenses',
      metricValue: `ETB ${metrics.totalOtherExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      badge: `${expenses?.length || 0} expenses`,
      icon: Wallet,
      accent: 'from-neutral-800/80 to-neutral-900 border-neutral-800 hover:border-amber-500/40'
    },
    {
      id: 'credit_ledger' as const,
      title: 'Credit Ledger (ዕዳ ደብተር)',
      subtitle: 'Track customer debt receivables, issue store credit, generate customer statements & record repayments.',
      metricLabel: 'Receivables Outstanding',
      metricValue: `ETB ${metrics.totalOutstandingDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      badge: `${metrics.activeDebtorsCount} active debtors`,
      icon: BookOpen,
      accent: 'from-amber-400/20 to-amber-500/5 border-amber-500/40'
    },
    {
      id: 'reports' as const,
      title: 'Business Reports & PDF Hub',
      subtitle: 'Annual & monthly P&L analytics, sales/purchase ledgers, and automated Reorder PO PDFs.',
      metricLabel: 'Gross Margin',
      metricValue: `${metrics.profitMargin.toFixed(1)}% Yield`,
      badge: 'PDF Export Ready',
      icon: BarChart3,
      accent: 'from-neutral-800/80 to-neutral-900 border-neutral-800 hover:border-amber-500/40'
    },
    {
      id: 'labels' as const,
      title: 'Barcode & QR Label Studio',
      subtitle: 'Generate & print thermal roll or A4 sheet Code-128 barcodes and QR price tags in ETB.',
      metricLabel: 'Symbologies',
      metricValue: 'Code-128 & QR',
      badge: 'Print Ready',
      icon: QrCode,
      accent: 'from-neutral-800/80 to-neutral-900 border-neutral-800 hover:border-amber-500/40'
    },
    {
      id: 'settings' as const,
      title: 'Store & Terminal Settings',
      subtitle: 'Store profile, Ethiopian VAT rates, thermal receipts, inventory thresholds & database backups.',
      metricLabel: 'System Config',
      metricValue: isCloudConnected ? 'Cloud Synced' : 'Online',
      badge: 'Configure',
      icon: SettingsIcon,
      accent: 'from-neutral-800/80 to-neutral-900 border-neutral-800 hover:border-amber-500/40'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-6 sm:p-8 shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-amber-400/5 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Executive Command Center
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
                <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isCloudConnected ? 'Live Cloud Database Synced' : 'Local + Cloud Sync'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-amber-500/30 text-amber-300 font-mono font-bold">
                Currency: ETB
              </span>
            </div>

            <div className="flex items-center gap-3.5 pt-1">
              <div className="hidden sm:block shrink-0">
                <RahelLogo size={52} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">
                  Welcome back, <span className="text-amber-400">{currentUser?.name || 'Rahel Fira'}</span>
                </h1>
                <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
                  {settings.storeName} — Unified Point-of-Sale, Procurement, Stationery Catalog, and Copy Atelier synchronized across all devices in Ethiopian Birr (ETB).
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/15 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Counter Sale</span>
            </button>

            <button
              type="button"
              onClick={() => openScanner('sales')}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Barcode className="w-4 h-4 text-amber-400" />
              <span>Scan to Sale</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('purchase')}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-neutral-700 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Receive Stock</span>
            </button>

            <button
              type="button"
              onClick={handleExportOverviewPDF}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-amber-500/40 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
              title="Download Executive Store Overview in PDF format"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>Overview PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4-Card Executive KPI Strip (Max 3 data points per card, tabular-nums, ETB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Today&apos;s Sales
            </span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 text-2xl font-bold font-mono-numbers text-amber-300">
            ETB {metrics.todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-neutral-400 flex items-center justify-between">
            <span>{metrics.todayCount} receipt(s) today</span>
            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className="text-amber-400 hover:underline font-medium cursor-pointer"
            >
              Open Register →
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Cumulative Revenue
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2 text-2xl font-bold font-mono-numbers text-neutral-100">
            ETB {metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-400 font-mono-numbers">
            Net Profit: ETB {metrics.totalGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({metrics.profitMargin.toFixed(1)}%)
          </div>
        </div>

        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Inventory Valuation
            </span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 text-2xl font-bold font-mono-numbers text-neutral-100">
            ETB {metrics.retailValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-neutral-400 font-mono-numbers">
            Cost Basis: ETB {metrics.costValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Catalog &amp; Stock Health
            </span>
            <AlertTriangle className={`w-4 h-4 ${metrics.lowStockCount + metrics.outOfStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div className="my-2 text-2xl font-bold font-mono-numbers text-neutral-100">
            {products.length} SKUs <span className="text-sm font-normal text-neutral-400">({metrics.totalUnitsInStock} units)</span>
          </div>
          <div className="text-xs flex items-center justify-between">
            <span className={metrics.lowStockCount + metrics.outOfStockCount > 0 ? 'text-amber-400 font-medium' : 'text-emerald-400'}>
              {metrics.outOfStockCount} out · {metrics.lowStockCount} low stock
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className="text-amber-400 hover:underline font-medium cursor-pointer"
            >
              Inspect →
            </button>
          </div>
        </div>
      </div>

      {/* Workstation Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-neutral-100 tracking-tight">
              Workstation Modules &amp; Departments
            </h2>
            <p className="text-xs text-neutral-400">
              Select a department to manage transactions, inventory records, services, or barcode labels.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openScanner('lookup')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Quick Price / SKU Lookup</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workstationModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveTab(mod.id)}
                className={`group text-left p-5 rounded-2xl bg-gradient-to-br ${mod.accent} border transition-all duration-150 hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between cursor-pointer`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-amber-500/30 text-amber-400 group-hover:bg-amber-400 group-hover:text-neutral-950 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md bg-neutral-950/90 border border-neutral-800 text-[11px] font-mono text-neutral-300">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-100 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                    <span>{mod.title}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-amber-400" />
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {mod.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">{mod.metricLabel}</span>
                  <span className="font-mono-numbers font-bold text-amber-300">
                    {mod.metricValue}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Operational Split Panel: Activity Feed (Left) & Restock Watchlist / Top Products (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Live Store Ledger */}
        <div className="lg:col-span-7 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Recent Store Ledger (ETB)</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Real-time synchronized sales receipts and supplier purchase orders
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
                {(['all', 'sales', 'purchases'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActivityFilter(tab)}
                    className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-colors cursor-pointer ${
                      activityFilter === tab
                        ? 'bg-amber-400 text-neutral-950'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-neutral-800/70 mt-2">
              {recentActivity.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  No recent transactions recorded yet.
                </div>
              ) : (
                recentActivity.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-950/40 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg border shrink-0 ${
                          item.type === 'sale'
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-950/30 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {item.type === 'sale' ? (
                          <ShoppingBag className="w-4 h-4" />
                        ) : (
                          <Truck className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-300">
                            {item.ref}
                          </span>
                          {(item as any).noReceipt && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              No Receipt
                            </span>
                          )}
                          <span className="text-xs font-semibold text-neutral-100 truncate">
                            {item.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {item.subtitle} · {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-mono-numbers font-bold ${
                          item.type === 'sale' ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        {item.type === 'sale' ? '+' : '-'}ETB {item.amount.toFixed(2)}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">
                        {item.type === 'sale' ? 'Sale Receipt' : 'Supplier PO'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              View Full Sales Ledger →
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="text-neutral-300 hover:text-amber-300 font-semibold cursor-pointer"
            >
              Financial Reports &amp; PDFs →
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Restock Watchlist & Top Selling SKUs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Critical Restock Watchlist */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Priority Restock Watchlist</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  SKUs at or below minimum stock threshold
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('purchase')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors cursor-pointer"
              >
                Restock Now
              </button>
            </div>

            <div className="divide-y divide-neutral-800/70 mt-2">
              {metrics.criticalItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All catalog SKUs are stocked above minimum thresholds.</span>
                </div>
              ) : (
                metrics.criticalItems.map((prod) => (
                  <div key={prod.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-neutral-100 truncate">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {prod.sku} · Cost: ETB {(prod.costPrice || prod.price * 0.55).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          prod.stock <= 0
                            ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                            : 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {prod.stock} / {prod.minStockAlert ?? 10} {prod.unit || 'pcs'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Selling Stationery & Services */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Top Revenue Contributors (ETB)</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Highest-grossing catalog items &amp; services
                </p>
              </div>
            </div>

            <div className="divide-y divide-neutral-800/70 mt-2">
              {metrics.topProducts.map((item, idx) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-neutral-950 border border-neutral-800 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-neutral-100 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {item.category} · {item.qty} sold
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono-numbers font-bold text-amber-300 shrink-0">
                    ETB {item.revenue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
