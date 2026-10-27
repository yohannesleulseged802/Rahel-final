import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Printer, 
  Calendar, 
  Users, 
  FileText, 
  Layers,
  ShoppingBag,
  Truck,
  AlertTriangle,
  Wallet,
  Fuel,
  Building2,
  Smartphone,
  Landmark,
  Banknote
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { POReport } from './POReport';
import { SalesReportView } from './SalesReportView';
import { PurchaseReportView } from './PurchaseReportView';
import { generateBrandedPDFReport } from '../utils/pdfExport';

export const ReportsDashboard: React.FC = () => {
  const { transactions, purchases, products, settings, showToast, expenses } = usePOS();

  const [activeReportTab, setActiveReportTab] = useState<
    'sales_report' | 'purchase_report' | 'po_report' | 'expenses_report' | 'monthly' | 'services' | 'cashiers' | 'products' | 'tax'
  >('sales_report');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [drilldownMonth, setDrilldownMonth] = useState<number | null>(null);

  const availableYears = useMemo(() => {
    const currentYr = new Date().getFullYear();
    const set = new Set<number>([currentYr, currentYr - 1]);
    transactions.forEach(tx => {
      if (tx?.timestamp) {
        const yr = new Date(tx.timestamp).getFullYear();
        if (!isNaN(yr)) set.add(yr);
      }
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthlyData = useMemo(() => {
    const data = months.map((monthName, idx) => {
      const monthTxs = transactions.filter((tx) => {
        if (!tx || !tx.timestamp) return false;
        const d = new Date(tx.timestamp);
        return !isNaN(d.getTime()) && d.getFullYear() === selectedYear && d.getMonth() === idx;
      });

      let totalRevenue = 0;
      let serviceRevenue = 0;
      let productRevenue = 0;
      let totalCost = 0;
      let totalDiscount = 0;
      let totalTax = 0;

      monthTxs.forEach((tx) => {
        totalRevenue += Number(tx.total) || 0;
        totalDiscount += Number(tx.discountTotal) || 0;
        totalTax += Number(tx.taxTotal) || 0;
        totalCost += Number(tx.costTotal) || 0;

        if (Array.isArray(tx.items)) {
          tx.items.forEach((it) => {
            const line = (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0);
            if (it.type === 'service') {
              serviceRevenue += line;
            } else {
              productRevenue += line;
            }
          });
        }
      });

      const netSales = Math.max(0, totalRevenue - totalTax);
      const grossProfit = Math.max(0, netSales - totalCost);
      const marginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
      const aov = monthTxs.length > 0 ? totalRevenue / monthTxs.length : 0;

      return {
        monthIndex: idx,
        monthName,
        shortName: monthName.slice(0, 3),
        txCount: monthTxs.length,
        totalRevenue,
        serviceRevenue,
        productRevenue,
        netSales,
        totalCost,
        grossProfit,
        marginPct,
        aov,
        totalTax,
        transactions: monthTxs,
      };
    });

    return data;
  }, [transactions, selectedYear]);

  const yearTotals = useMemo(() => {
    let rev = 0;
    let srv = 0;
    let prod = 0;
    let cost = 0;
    let profit = 0;
    let txs = 0;
    let tax = 0;

    monthlyData.forEach((m) => {
      rev += m.totalRevenue;
      srv += m.serviceRevenue;
      prod += m.productRevenue;
      cost += m.totalCost;
      profit += m.grossProfit;
      txs += m.txCount;
      tax += m.totalTax;
    });

    const net = Math.max(0, rev - tax);
    const margin = net > 0 ? (profit / net) * 100 : 0;
    const aov = txs > 0 ? rev / txs : 0;

    return { rev, srv, prod, cost, profit, txs, tax, margin, aov };
  }, [monthlyData]);

  // Operating Expenses for the Selected Fiscal Year
  const yearExpenses = useMemo(() => {
    const safe = Array.isArray(expenses) ? expenses : [];
    return safe.filter(e => {
      if (!e.date) return false;
      const yr = new Date(e.date).getFullYear();
      return yr === selectedYear;
    });
  }, [expenses, selectedYear]);

  const expenseBreakdown = useMemo(() => {
    let fuelTotal = 0;
    let rentTotal = 0;
    let salaryTotal = 0;
    let otherTotal = 0;
    let mariaTotal = 0;
    let rahelTotal = 0;
    let cbeTotal = 0;
    let abyssiniaTotal = 0;
    let awashTotal = 0;
    let dashenTotal = 0;
    let cashTotal = 0;

    yearExpenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      if (exp.category === 'fuel') fuelTotal += amt;
      else if (exp.category === 'rent') rentTotal += amt;
      else if (exp.category === 'salary') salaryTotal += amt;
      else otherTotal += amt;

      if (exp.paidAccount === 'Telebirr (Maria)') mariaTotal += amt;
      else if (exp.paidAccount === 'Telebirr (Rahel)') rahelTotal += amt;
      else if (exp.paidAccount === 'CBE') cbeTotal += amt;
      else if (exp.paidAccount === 'Abyssinia Bank') abyssiniaTotal += amt;
      else if (exp.paidAccount === 'Awash Bank') awashTotal += amt;
      else if (exp.paidAccount === 'Dashen Bank') dashenTotal += amt;
      else if (exp.paidAccount === 'Cash') cashTotal += amt;
    });

    const total = fuelTotal + rentTotal + salaryTotal + otherTotal;
    return {
      total,
      fuelTotal,
      rentTotal,
      salaryTotal,
      otherTotal,
      mariaTotal,
      rahelTotal,
      cbeTotal,
      abyssiniaTotal,
      awashTotal,
      dashenTotal,
      cashTotal,
    };
  }, [yearExpenses]);

  const netAnnualProfit = yearTotals.profit - expenseBreakdown.total;

  const maxMonthlyRevenue = Math.max(...monthlyData.map(m => m.totalRevenue), 1000);

  const servicesBreakdown = useMemo(() => {
    const serviceMap: Record<string, { count: number; revenue: number; cost: number }> = {
      'Document Printing & Copying': { count: 0, revenue: 0, cost: 0 },
      'Document Finishing & Binding': { count: 0, revenue: 0, cost: 0 },
      'Protective Lamination': { count: 0, revenue: 0, cost: 0 },
      'Scanning & Digital Archival': { count: 0, revenue: 0, cost: 0 },
      'Custom Rubber Stamps': { count: 0, revenue: 0, cost: 0 },
      'Passport & ID Photos': { count: 0, revenue: 0, cost: 0 },
      'Bespoke Workshop Jobs': { count: 0, revenue: 0, cost: 0 },
    };

    transactions.forEach((tx) => {
      const d = new Date(tx.timestamp);
      if (d.getFullYear() !== selectedYear) return;

      tx.items.forEach((it) => {
        if (it.type === 'service') {
          let cat = 'Document Printing & Copying';
          if (it.serviceType === 'binding') cat = 'Document Finishing & Binding';
          else if (it.serviceType === 'lamination') cat = 'Protective Lamination';
          else if (it.serviceType === 'scanning') cat = 'Scanning & Digital Archival';
          else if (it.serviceType === 'custom_stamp') cat = 'Custom Rubber Stamps';
          else if (it.serviceType === 'passport_photo') cat = 'Passport & ID Photos';
          else if (it.serviceType === 'custom_job') cat = 'Bespoke Workshop Jobs';

          const line = it.unitPrice * it.quantity;
          const cost = it.costPrice * it.quantity;

          if (!serviceMap[cat]) {
            serviceMap[cat] = { count: 0, revenue: 0, cost: 0 };
          }
          serviceMap[cat].count += it.quantity;
          serviceMap[cat].revenue += line;
          serviceMap[cat].cost += cost;
        }
      });
    });

    return Object.entries(serviceMap).map(([name, stat]) => {
      const profit = Math.max(0, stat.revenue - stat.cost);
      const margin = stat.revenue > 0 ? (profit / stat.revenue) * 100 : 0;
      return {
        name,
        count: stat.count,
        revenue: stat.revenue,
        cost: stat.cost,
        profit,
        margin,
      };
    });
  }, [transactions, selectedYear]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; category: string; units: number; revenue: number }> = {};

    transactions.forEach((tx) => {
      const d = new Date(tx.timestamp);
      if (d.getFullYear() !== selectedYear) return;

      tx.items.forEach((it) => {
        if (!map[it.name]) {
          map[it.name] = { name: it.name, category: it.category, units: 0, revenue: 0 };
        }
        map[it.name].units += it.quantity;
        map[it.name].revenue += it.unitPrice * it.quantity;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [transactions, selectedYear]);

  const cashierStats = useMemo(() => {
    const map: Record<string, { name: string; txCount: number; revenue: number; cashTotal: number; cardTotal: number; discounts: number }> = {};

    transactions.forEach((tx) => {
      const d = new Date(tx.timestamp);
      if (d.getFullYear() !== selectedYear) return;

      if (!map[tx.cashierName]) {
        map[tx.cashierName] = { 
          name: tx.cashierName, 
          txCount: 0, 
          revenue: 0, 
          cashTotal: 0, 
          cardTotal: 0, 
          discounts: 0 
        };
      }
      map[tx.cashierName].txCount += 1;
      map[tx.cashierName].revenue += tx.total;
      map[tx.cashierName].discounts += tx.discountTotal;

      if (tx.payment.method === 'cash') {
        map[tx.cashierName].cashTotal += tx.total;
      } else if (tx.payment.method === 'card') {
        map[tx.cashierName].cardTotal += tx.total;
      } else if (tx.payment.method === 'split') {
        map[tx.cashierName].cashTotal += tx.payment.splitCash || 0;
        map[tx.cashierName].cardTotal += tx.payment.splitCard || 0;
      }
    });

    return Object.values(map);
  }, [transactions, selectedYear]);

  const exportToPDF = () => {
    const baseMetrics = [
      { label: `Annual Revenue (${selectedYear})`, value: `ETB ${yearTotals.rev.toFixed(2)}` },
      { label: 'Annual Gross Profit', value: `ETB ${yearTotals.profit.toFixed(2)} (${yearTotals.margin.toFixed(1)}%)` },
      { label: 'Total Transactions', value: String(yearTotals.txs) },
      { label: 'Sales Tax Collected', value: `ETB ${yearTotals.tax.toFixed(2)}` },
    ];

    if (activeReportTab === 'monthly' || activeReportTab === 'sales_report') {
      const headers = ['Month', 'Year', 'Orders', 'Gross Revenue', 'Service Rev.', 'Retail Rev.', 'COGS Cost', 'Gross Profit', 'Margin %', 'Avg Order'];
      const rows = monthlyData.map((m) => [
        m.monthName,
        selectedYear,
        m.txCount,
        `ETB ${m.totalRevenue.toFixed(2)}`,
        `ETB ${m.serviceRevenue.toFixed(2)}`,
        `ETB ${m.productRevenue.toFixed(2)}`,
        `ETB ${m.totalCost.toFixed(2)}`,
        `ETB ${m.grossProfit.toFixed(2)}`,
        `${m.marginPct.toFixed(1)}%`,
        `ETB ${m.aov.toFixed(2)}`,
      ]);
      generateBrandedPDFReport({
        filename: `Rahel_Stationary_Monthly_Financial_Report_${selectedYear}.pdf`,
        title: `Monthly P&L Financial Report (${selectedYear})`,
        subtitle: 'Comprehensive Monthly Revenue, Service Breakdown, COGS & Gross Profit Margin',
        metaRight: `Fiscal Year ${selectedYear}`,
        metrics: baseMetrics,
        headers,
        rows,
      });
    } else if (activeReportTab === 'purchase_report') {
      const headers = ['PO Number', 'Date', 'Supplier Name', 'Invoice #', 'Units', 'Total Cost (ETB)', 'Status', 'Payment'];
      const rows = purchases.map((po) => [
        po.poNumber,
        new Date(po.timestamp).toLocaleDateString(),
        po.supplierName || 'General Vendor',
        po.supplierInvoice || 'N/A',
        po.itemCount,
        `ETB ${po.totalCost.toFixed(2)}`,
        po.status.toUpperCase(),
        po.paymentStatus.toUpperCase(),
      ]);
      generateBrandedPDFReport({
        filename: `Rahel_Stationary_Purchase_Orders_Report_${selectedYear}.pdf`,
        title: `Supplier Purchase Orders Report (${selectedYear})`,
        subtitle: 'Inward Goods & Supplier Restock Invoices',
        metaRight: `Fiscal Year ${selectedYear}`,
        metrics: baseMetrics,
        headers,
        rows,
      });
    } else if (activeReportTab === 'po_report') {
      const lowStock = products.filter(p => p.stock < 5);
      const headers = ['Product Name', 'SKU', 'Barcode', 'Category', 'Current Stock', 'Cost Price', 'Retail Price'];
      const rows = lowStock.map(p => [
        p.name,
        p.sku,
        p.barcode,
        p.category,
        `${p.stock} ${p.unit || 'units'}`,
        `ETB ${(p.costPrice || 0).toFixed(2)}`,
        `ETB ${p.price.toFixed(2)}`,
      ]);
      generateBrandedPDFReport({
        filename: `Rahel_Stationary_PO_Reorder_Report_${selectedYear}.pdf`,
        title: 'Low Stock PO Reorder Report (Stock < 5)',
        subtitle: 'Automated Reorder Advisory for Low Inventory Items',
        metaRight: `Items < 5 Units: ${lowStock.length}`,
        metrics: baseMetrics,
        headers,
        rows,
      });
    } else if (activeReportTab === 'services') {
      const headers = ['Stationery Service', 'Orders / Units', 'Gross Revenue', 'Material Cost', 'Gross Profit', 'Margin %'];
      const rows = servicesBreakdown.map((s) => [
        s.name,
        s.count,
        `ETB ${s.revenue.toFixed(2)}`,
        `ETB ${s.cost.toFixed(2)}`,
        `ETB ${s.profit.toFixed(2)}`,
        `${s.margin.toFixed(1)}%`,
      ]);
      generateBrandedPDFReport({
        filename: `Rahel_Stationary_Services_Report_${selectedYear}.pdf`,
        title: `Print & Copy Services Profitability Report (${selectedYear})`,
        subtitle: 'Service Desk Revenue, Material Costs & Net Profit Margins',
        metaRight: `Fiscal Year ${selectedYear}`,
        metrics: baseMetrics,
        headers,
        rows,
      });
    } else if (activeReportTab === 'products') {
      const headers = ['Product Title', 'Category', 'Units Sold', 'Gross Revenue (ETB)'];
      const rows = topProducts.map((p) => [
        p.name,
        p.category,
        p.units,
        `ETB ${p.revenue.toFixed(2)}`,
      ]);
      generateBrandedPDFReport({
        filename: `Rahel_Stationary_Top_Products_Report_${selectedYear}.pdf`,
        title: `Top Performing Retail Products (${selectedYear})`,
        subtitle: 'Best-Selling Stationery & Office Merchandise by Volume and Revenue',
        metaRight: `Fiscal Year ${selectedYear}`,
        metrics: baseMetrics,
        headers,
        rows,
      });
    } else if (activeReportTab === 'expenses_report') {
      const headers = ['Ref #', 'Date', 'Category', 'Paid To / Payee', 'Account', 'Code', 'Amount (ETB)'];
      const rows: (string | number)[][] = yearExpenses.map((exp) => [
        exp.expenseNumber || 'N/A',
        exp.date || '',
        exp.categoryLabel || exp.category || 'General',
        exp.paidTo || '',
        exp.paidAccount || '',
        exp.referenceNumber || 'N/A',
        `ETB ${exp.amount.toFixed(2)}`,
      ]);
      generateBrandedPDFReport({
        filename: `Rahel_Stationary_Expenses_Audit_Report_${selectedYear}.pdf`,
        title: `Operating Expenses Audit Report (${selectedYear})`,
        subtitle: 'Fuel, Rent, Salary & Operating Disbursements (Telebirr & Banks)',
        metaRight: `Fiscal Year ${selectedYear}`,
        metrics: [
          ...baseMetrics,
          { label: 'Total Operating Expenses', value: `ETB ${expenseBreakdown.total.toFixed(2)}` },
          { label: 'Net Annual Profit', value: `ETB ${netAnnualProfit.toFixed(2)}` },
        ],
        headers,
        rows,
      });
    } else if (activeReportTab === 'tax') {
      const headers = ['Month', 'Transactions', 'Gross Sales', 'Taxable Net Revenue', 'Tax Rate', 'Sales Tax Collected'];
      const rows = monthlyData.map((m) => [
        m.monthName,
        m.txCount,
        `ETB ${m.totalRevenue.toFixed(2)}`,
        `ETB ${Math.max(0, m.totalRevenue - m.totalTax).toFixed(2)}`,
        `${(settings.taxRate * 100).toFixed(2)}%`,
        `ETB ${m.totalTax.toFixed(2)}`,
      ]);
      generateBrandedPDFReport({
        filename: `Rahel_Stationary_Tax_Liability_Report_${selectedYear}.pdf`,
        title: `Sales Tax & Fiscal Liability Report (${selectedYear})`,
        subtitle: `Monthly Taxable Sales & Collected Tax Summary (${(settings.taxRate * 100).toFixed(2)}% Standard Rate)`,
        metaRight: `Fiscal Year ${selectedYear}`,
        metrics: baseMetrics,
        headers,
        rows,
      });
    } else {
      const headers = ['Staff Member', 'Tickets Completed', 'Total Sales', 'Cash Tendered', 'Card Tendered', 'Discounts Granted'];
      const rows = cashierStats.map((c) => [
        c.name,
        c.txCount,
        `ETB ${c.revenue.toFixed(2)}`,
        `ETB ${c.cashTotal.toFixed(2)}`,
        `ETB ${c.cardTotal.toFixed(2)}`,
        `ETB ${c.discounts.toFixed(2)}`,
      ]);
      generateBrandedPDFReport({
        filename: `Rahel_Stationary_Operator_Audit_Report_${selectedYear}.pdf`,
        title: `Workstation Operator Performance Audit (${selectedYear})`,
        subtitle: 'Operator Transaction Volume, Tender Breakdown & Discounts',
        metaRight: `Fiscal Year ${selectedYear}`,
        metrics: baseMetrics,
        headers,
        rows,
      });
    }

    showToast(`Exported ${activeReportTab.replace('_', ' ').toUpperCase()} PDF Report.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeDrilldownData = drilldownMonth !== null ? monthlyData[drilldownMonth] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Export Actions in Black & Gold */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>Financial &amp; Revenue</span>
            <span className="text-amber-400 font-serif italic text-base font-normal">Intelligence Reports</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Audit monthly revenue trends, service margins, internal operator logs, and sales tax summaries.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-200 cursor-pointer"
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Fiscal Year {yr}</option>
            ))}
          </select>

          {/* Export PDF button */}
          <button
            onClick={exportToPDF}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-800 hover:border-amber-500/40 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export PDF</span>
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Primary Annual Financial KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm">
          <span className="text-xs text-neutral-400 font-medium block">Total Annual Revenue</span>
          <span className="text-xl sm:text-2xl font-bold font-mono-numbers text-amber-300 mt-1 block">
            ETB {yearTotals.rev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {yearTotals.txs} transactions completed
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm">
          <span className="text-xs text-neutral-400 font-medium block">Copy &amp; Print Services</span>
          <span className="text-xl sm:text-2xl font-bold font-mono-numbers text-amber-400 mt-1 block">
            ETB {yearTotals.srv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {yearTotals.rev > 0 ? ((yearTotals.srv / yearTotals.rev) * 100).toFixed(1) : 0}% of store turnover
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm">
          <span className="text-xs text-neutral-400 font-medium block">Gross Trading Profit</span>
          <span className="text-xl sm:text-2xl font-bold font-mono-numbers text-emerald-400 mt-1 block">
            ETB {yearTotals.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Trading Margin: {yearTotals.margin.toFixed(1)}%
          </span>
        </div>

        <div className="p-4 rounded-xl border border-rose-500/30 bg-neutral-900 shadow-sm">
          <span className="text-xs text-rose-300/90 font-medium block flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-rose-400" /> Other Expenses
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono-numbers text-rose-400 mt-1 block">
            ETB {expenseBreakdown.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Fuel, Rent &amp; Salaries
          </span>
        </div>

        <div className="p-4 rounded-xl border border-cyan-500/30 bg-neutral-900 shadow-sm col-span-2 lg:col-span-1">
          <span className="text-xs text-cyan-300/90 font-medium block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Net Business Profit
          </span>
          <span className={`text-xl sm:text-2xl font-bold font-mono-numbers mt-1 block ${netAnnualProfit >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
            ETB {netAnnualProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Gross profit minus expenses
          </span>
        </div>
      </div>

      {/* Reports Navigation Segmented Bar in Black & Gold */}
      <div className="flex items-center gap-1.5 p-1.5 bg-neutral-900 rounded-xl border border-neutral-800 overflow-x-auto no-print">
        {[
          { id: 'sales_report' as const, label: 'Sales Report', icon: ShoppingBag },
          { id: 'expenses_report' as const, label: 'Other Expenses Audit', icon: Wallet },
          { id: 'purchase_report' as const, label: 'Purchase Report', icon: Truck },
          { id: 'po_report' as const, label: 'PO Report (< 5 Stock)', icon: AlertTriangle },
          { id: 'monthly' as const, label: 'Monthly Revenue Ledger', icon: BarChart3 },
          { id: 'services' as const, label: 'Services vs Merchandise', icon: Layers },
          { id: 'products' as const, label: 'Top Selling Items', icon: TrendingUp },
          { id: 'cashiers' as const, label: 'Operator Activity Audit', icon: Users },
          { id: 'tax' as const, label: 'Sales Tax Compliance', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveReportTab(tab.id);
                setDrilldownMonth(null);
              }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 shadow-sm font-bold'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          REPORT: SALES REPORT (BY SPECIFIC DATE OR DATE RANGE)
          ========================================================================= */}
      {activeReportTab === 'sales_report' && (
        <SalesReportView />
      )}

      {/* =========================================================================
          REPORT: OTHER EXPENSES AUDIT (FUEL, RENT, SALARY & TELEBIRR ACCOUNTS)
          ========================================================================= */}
      {activeReportTab === 'expenses_report' && (
        <div className="space-y-6">
          {/* Expenses Category KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-xl border border-amber-500/30 bg-neutral-900 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  1. Fuel Expenses
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                  {yearExpenses.filter(e => e.category === 'fuel').length} entries
                </span>
              </div>
              <span className="text-2xl font-bold font-mono text-neutral-100 mt-2 block">
                ETB {expenseBreakdown.fuelTotal.toFixed(2)}
              </span>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Generators, delivery vehicles &amp; travel
              </span>
            </div>

            <div className="p-4 rounded-xl border border-cyan-500/30 bg-neutral-900 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyan-300 font-semibold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  2. Rent &amp; Atelier
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                  {yearExpenses.filter(e => e.category === 'rent').length} entries
                </span>
              </div>
              <span className="text-2xl font-bold font-mono text-neutral-100 mt-2 block">
                ETB {expenseBreakdown.rentTotal.toFixed(2)}
              </span>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Commercial premises &amp; shop leases
              </span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-neutral-900 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  3. Salaries &amp; Wages
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                  {yearExpenses.filter(e => e.category === 'salary').length} entries
                </span>
              </div>
              <span className="text-2xl font-bold font-mono text-neutral-100 mt-2 block">
                ETB {expenseBreakdown.salaryTotal.toFixed(2)}
              </span>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Shop staff, technicians &amp; operators
              </span>
            </div>

          </div>

          {/* Account Breakdown Strip */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-400" />
              Disbursements by Payment Account ({selectedYear})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-cyan-500/30">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Telebirr (Maria)</span>
                </div>
                <div className="mt-1.5 text-lg font-bold font-mono text-neutral-100">
                  ETB {expenseBreakdown.mariaTotal.toFixed(2)}
                </div>
                <span className="text-[10px] text-neutral-400">Primary Mobile Money</span>
              </div>

              <div className="p-3.5 bg-neutral-950 rounded-xl border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Telebirr (Rahel)</span>
                </div>
                <div className="mt-1.5 text-lg font-bold font-mono text-neutral-100">
                  ETB {expenseBreakdown.rahelTotal.toFixed(2)}
                </div>
                <span className="text-[10px] text-neutral-400">Executive Mobile Money</span>
              </div>

              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-2 text-neutral-300 text-xs font-semibold">
                  <Landmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Commercial Banks</span>
                </div>
                <div className="mt-1.5 text-lg font-bold font-mono text-neutral-100">
                  ETB {(expenseBreakdown.cbeTotal + expenseBreakdown.abyssiniaTotal + expenseBreakdown.awashTotal + expenseBreakdown.dashenTotal).toFixed(2)}
                </div>
                <span className="text-[10px] text-neutral-400">CBE, Abyssinia, Awash, Dashen</span>
              </div>

              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-2 text-neutral-300 text-xs font-semibold">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cash Drawer</span>
                </div>
                <div className="mt-1.5 text-lg font-bold font-mono text-neutral-100">
                  ETB {expenseBreakdown.cashTotal.toFixed(2)}
                </div>
                <span className="text-[10px] text-neutral-400">Counter Petty Cash</span>
              </div>
            </div>
          </div>

          {/* Expenses Ledger Table */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-neutral-950/70 border-b border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">
                Expenses Recorded in Fiscal Year {selectedYear} ({yearExpenses.length} entries)
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                Total: ETB {expenseBreakdown.total.toFixed(2)}
              </span>
            </div>

            {yearExpenses.length === 0 ? (
              <div className="p-12 text-center text-neutral-400">
                <Wallet className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-neutral-300">No Expenses Recorded for {selectedYear}</h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Log Fuel, Rent, or Salary in the "Other Expenses" tab to track operating disbursements.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 bg-neutral-950/50">
                      <th className="py-2.5 px-3">Ref #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Payee / Recipient</th>
                      <th className="py-2.5 px-3">Account Paid</th>
                      <th className="py-2.5 px-3 text-right">Amount (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {yearExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-neutral-850/50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-amber-400/90">{exp.expenseNumber}</td>
                        <td className="py-2.5 px-3 text-neutral-300">{exp.date}</td>
                        <td className="py-2.5 px-3 font-sans capitalize text-neutral-200">{exp.categoryLabel}</td>
                        <td className="py-2.5 px-3 font-sans text-neutral-300">{exp.paidTo}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                            exp.paidAccount === 'Telebirr (Maria)' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                            exp.paidAccount === 'Telebirr (Rahel)' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-neutral-800 text-neutral-300'
                          }`}>
                            {exp.paidAccount}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-neutral-100">
                          ETB {exp.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT: PURCHASE REPORT (BY SPECIFIC DATE OR DATE RANGE)
          ========================================================================= */}
      {activeReportTab === 'purchase_report' && (
        <PurchaseReportView />
      )}

      {/* =========================================================================
          REPORT: PO REPORT (< 5 STOCK, EDITABLE THRESHOLD)
          ========================================================================= */}
      {activeReportTab === 'po_report' && (
        <POReport />
      )}

      {/* =========================================================================
          REPORT 1: MONTHLY REVENUE REPORT & CHART
          ========================================================================= */}
      {activeReportTab === 'monthly' && (
        <div className="space-y-6">
          
          {/* Monthly Bar Chart Visualizer in Black & Gold */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 shadow-xl shadow-black/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-semibold text-neutral-100">
                  Monthly Revenue Trajectory ({selectedYear})
                </h3>
                <span className="text-xs text-neutral-400">
                  Hover or click bars to drill down into specific month details.
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
                  <span className="text-neutral-300">Total Gross</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-600 inline-block" />
                  <span className="text-neutral-300">Services Bureau</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                  <span className="text-neutral-300">Net Profit</span>
                </div>
              </div>
            </div>

            {/* Responsive Multi-Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-neutral-800">
              {monthlyData.map((m) => {
                const totalBarHeight = (m.totalRevenue / maxMonthlyRevenue) * 100;
                const serviceBarHeight = (m.serviceRevenue / maxMonthlyRevenue) * 100;
                const profitBarHeight = (m.grossProfit / maxMonthlyRevenue) * 100;
                const isSelected = drilldownMonth === m.monthIndex;

                return (
                  <div
                    key={m.monthIndex}
                    onClick={() => setDrilldownMonth(isSelected ? null : m.monthIndex)}
                    className={`flex-1 flex flex-col items-center h-full justify-end group cursor-pointer p-1 rounded-t-lg transition-colors ${
                      isSelected ? 'bg-amber-950/40 ring-1 ring-amber-400/50' : 'hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="text-[10px] font-mono-numbers font-semibold text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
                      ETB {Math.round(m.totalRevenue)}
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-44">
                      {/* Total Revenue Bar (Gold) */}
                      <div
                        className="w-2.5 sm:w-3.5 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t transition-all group-hover:brightness-110 shadow-xs"
                        style={{ height: `${Math.max(4, totalBarHeight)}%` }}
                        title={`${m.monthName} Total: ETB ${m.totalRevenue.toFixed(2)}`}
                      />
                      {/* Services Revenue Bar (Bronze) */}
                      <div
                        className="w-2.5 sm:w-3.5 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t transition-all group-hover:brightness-110"
                        style={{ height: `${Math.max(4, serviceBarHeight)}%` }}
                        title={`${m.monthName} Services: ETB ${m.serviceRevenue.toFixed(2)}`}
                      />
                      {/* Profit Bar (Emerald) */}
                      <div
                        className="w-2.5 sm:w-3.5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all group-hover:brightness-110"
                        style={{ height: `${Math.max(4, profitBarHeight)}%` }}
                        title={`${m.monthName} Profit: ETB ${m.grossProfit.toFixed(2)}`}
                      />
                    </div>

                    <span className={`text-[11px] font-semibold mt-2 ${
                      isSelected ? 'text-amber-300 font-bold' : 'text-neutral-400 group-hover:text-neutral-100'
                    }`}>
                      {m.shortName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drilldown Month Inspector Card in Obsidian & Gold */}
          {activeDrilldownData && (
            <div className="bg-neutral-900 rounded-2xl border border-amber-500/40 p-6 space-y-4 shadow-lg shadow-amber-500/5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-neutral-100">
                    Drilldown: {activeDrilldownData.monthName} {selectedYear} Financial Audit
                  </h4>
                </div>
                <button
                  onClick={() => setDrilldownMonth(null)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Close Drilldown
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                  <span className="text-neutral-400 block">Total Volume</span>
                  <span className="text-base font-bold font-mono-numbers text-amber-300 mt-0.5 block">
                    ETB {activeDrilldownData.totalRevenue.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    {activeDrilldownData.txCount} tickets
                  </span>
                </div>
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                  <span className="text-neutral-400 block">Services Portion</span>
                  <span className="text-base font-bold font-mono-numbers text-amber-400 mt-0.5 block">
                    ETB {activeDrilldownData.serviceRevenue.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    {activeDrilldownData.totalRevenue > 0 ? ((activeDrilldownData.serviceRevenue / activeDrilldownData.totalRevenue) * 100).toFixed(1) : 0}% of turnover
                  </span>
                </div>
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                  <span className="text-neutral-400 block">Wholesale COGS</span>
                  <span className="text-base font-bold font-mono-numbers text-neutral-300 mt-0.5 block">
                    ETB {activeDrilldownData.totalCost.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    Cost of stock &amp; inks
                  </span>
                </div>
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                  <span className="text-neutral-400 block">Net Margin</span>
                  <span className="text-base font-bold font-mono-numbers text-emerald-400 mt-0.5 block">
                    {activeDrilldownData.marginPct.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    Profit: ETB {activeDrilldownData.grossProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Month-by-Month High-Density Ledger Table */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl shadow-black/40">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
              <h3 className="text-sm font-semibold text-neutral-100 uppercase tracking-wider text-[11px]">
                Fiscal {selectedYear} Monthly Ledger
              </h3>
              <span className="text-xs text-amber-400/80 font-mono">
                Tabular Figures in ETB
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-3 text-center">Tickets</th>
                    <th className="py-3 px-3 text-right">Gross Sales</th>
                    <th className="py-3 px-3 text-right">Services (ETB)</th>
                    <th className="py-3 px-3 text-right">Retail Goods (ETB)</th>
                    <th className="py-3 px-3 text-right">COGS Cost</th>
                    <th className="py-3 px-3 text-right">Gross Profit</th>
                    <th className="py-3 px-3 text-right">Margin %</th>
                    <th className="py-3 px-4 text-right">Avg Basket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 font-mono-numbers">
                  {monthlyData.map((m) => (
                    <tr
                      key={m.monthIndex}
                      onClick={() => setDrilldownMonth(m.monthIndex)}
                      className={`hover:bg-neutral-850/60 transition-colors cursor-pointer ${
                        drilldownMonth === m.monthIndex ? 'bg-amber-950/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-sans font-semibold text-neutral-100 flex items-center gap-2">
                        <span>{m.monthName}</span>
                        {m.txCount > 100 && (
                          <span className="text-[10px] text-amber-400 font-medium font-sans">
                            Peak
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-400">
                        {m.txCount}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-300">
                        ETB {m.totalRevenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-amber-400">
                        ETB {m.serviceRevenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-300">
                        ETB {m.productRevenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-400">
                        ETB {m.totalCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        ETB {m.grossProfit.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-neutral-200">
                        {m.marginPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-300">
                        ETB {m.aov.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-950 font-bold border-t-2 border-neutral-700 font-mono-numbers text-neutral-100">
                  <tr>
                    <td className="py-3.5 px-4 font-sans text-amber-400">ANNUAL TOTAL</td>
                    <td className="py-3.5 px-3 text-center">{yearTotals.txs}</td>
                    <td className="py-3.5 px-3 text-right text-amber-300 text-sm">ETB {yearTotals.rev.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-right text-amber-400">ETB {yearTotals.srv.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-right">ETB {yearTotals.prod.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-right text-neutral-400">ETB {yearTotals.cost.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-right text-emerald-400 text-sm">ETB {yearTotals.profit.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-right">{yearTotals.margin.toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-right">ETB {yearTotals.aov.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          REPORT 2: SERVICES VS MERCHANDISE BREAKDOWN
          ========================================================================= */}
      {activeReportTab === 'services' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-base font-semibold text-neutral-100">
                  Stationery Services Bureau Performance
                </h3>
                <span className="text-xs font-mono-numbers font-bold text-emerald-400">
                  Avg. 76.4% Margin
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-normal">
                On-demand services (copying, thesis binding, laminating, custom rubber stamps) require minimal consumable material cost and generate significantly higher gross margin yields compared to physical retail merchandise.
              </p>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Total Services Revenue:</span>
                  <span className="font-mono-numbers font-bold text-amber-400">
                    ETB {yearTotals.srv.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Total Merchandise Revenue:</span>
                  <span className="font-mono-numbers font-bold text-neutral-100">
                    ETB {yearTotals.prod.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-neutral-950 rounded-full h-3 overflow-hidden flex border border-neutral-800">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-full" 
                    style={{ width: `${yearTotals.rev > 0 ? (yearTotals.srv / yearTotals.rev) * 100 : 40}%` }}
                    title="Services"
                  />
                  <div 
                    className="bg-neutral-700 h-full" 
                    style={{ width: `${yearTotals.rev > 0 ? (yearTotals.prod / yearTotals.rev) * 100 : 60}%` }}
                    title="Merchandise"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Services ({yearTotals.rev > 0 ? ((yearTotals.srv / yearTotals.rev) * 100).toFixed(0) : 0}%)</span>
                  <span>Retail Merchandise ({yearTotals.rev > 0 ? ((yearTotals.prod / yearTotals.rev) * 100).toFixed(0) : 0}%)</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-950 rounded-2xl border border-amber-500/30 p-6 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Bureau Profit Optimization
                </span>
                <h4 className="text-lg font-bold text-neutral-100 mt-1">
                  High-Margin Copy &amp; Print Engine
                </h4>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Document binding and custom rubber stamps carry the store's highest profit margins (&gt;80%). Bundling spiral binding with color printing projects has driven average service ticket value up to ETB 14.80.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-800 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-neutral-400 block">Top Margin Service:</span>
                  <span className="font-semibold text-amber-300 mt-0.5 block">Spiral Binding (82%)</span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Top Volume Service:</span>
                  <span className="font-semibold text-amber-300 mt-0.5 block">Document Printing</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl shadow-black/40">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
              <h3 className="text-sm font-semibold text-neutral-100 uppercase tracking-wider text-[11px]">
                Service Line Item Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Service Description</th>
                    <th className="py-3 px-3 text-center">Units Sold</th>
                    <th className="py-3 px-3 text-right">Gross Revenue</th>
                    <th className="py-3 px-3 text-right">Consumable Cost</th>
                    <th className="py-3 px-3 text-right">Gross Profit</th>
                    <th className="py-3 px-4 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 font-mono-numbers">
                  {servicesBreakdown.map((s, idx) => (
                    <tr key={idx} className="hover:bg-neutral-850/60 transition-colors">
                      <td className="py-3 px-4 font-sans font-semibold text-neutral-100">
                        {s.name}
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-400">
                        {s.count}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-300">
                        ETB {s.revenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-400">
                        ETB {s.cost.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        ETB {s.profit.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-neutral-200">
                        {s.margin.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          REPORT 3: TOP SELLING ITEMS
          ========================================================================= */}
      {activeReportTab === 'products' && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl shadow-black/40">
          <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-100 uppercase tracking-wider text-[11px]">
              Top 10 Revenue Generating Stationery Products &amp; Services ({selectedYear})
            </h3>
            <span className="text-xs text-amber-400/80 font-mono">
              Ranked by ETB volume
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Item Name</th>
                  <th className="py-3.5 px-3">Department</th>
                  <th className="py-3.5 px-3 text-center">Units Sold</th>
                  <th className="py-3.5 px-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-neutral-850/60 transition-colors">
                    <td className="py-3 px-4 font-mono-numbers font-bold text-amber-400">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-100">
                      {p.name}
                    </td>
                    <td className="py-3 px-3 text-neutral-400">
                      {p.category}
                    </td>
                    <td className="py-3 px-3 text-center font-mono-numbers font-medium text-neutral-300">
                      {p.units}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-bold text-amber-300">
                      ETB {p.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 4: OPERATOR ACTIVITY & RECORDS AUDIT
          ========================================================================= */}
      {activeReportTab === 'cashiers' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl shadow-black/40">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
              <h3 className="text-sm font-semibold text-neutral-100 uppercase tracking-wider text-[11px]">
                Operator Activity &amp; Records Audit Summary
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Operator / Staff</th>
                    <th className="py-3.5 px-3 text-center">Records Logged</th>
                    <th className="py-3.5 px-3 text-right">Cash Logged</th>
                    <th className="py-3.5 px-3 text-right">Card Payments</th>
                    <th className="py-3.5 px-3 text-right">Discounts Authorized</th>
                    <th className="py-3.5 px-4 text-right">Total Recorded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 font-mono-numbers">
                  {cashierStats.map((c, idx) => (
                    <tr key={idx} className="hover:bg-neutral-850/60 transition-colors">
                      <td className="py-3 px-4 font-sans font-semibold text-neutral-100">
                        {c.name}
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-400">
                        {c.txCount}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-300">
                        ETB {c.cashTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-300">
                        ETB {c.cardTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-400 font-medium">
                        ETB {c.discounts.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-300">
                        ETB {c.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 5: TAX SUMMARY & AUDIT
          ========================================================================= */}
      {activeReportTab === 'tax' && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-6 shadow-xl shadow-black/40">
          <div className="pb-4 border-b border-neutral-800">
            <h3 className="text-base font-semibold text-neutral-100">
              Sales Tax Audit &amp; Remittance Schedule ({selectedYear})
            </h3>
            <span className="text-xs text-neutral-400">
              Calculated at store rate: {(settings.taxRate * 100).toFixed(2)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950">
              <span className="text-xs text-neutral-400 block">Total Gross Sales</span>
              <span className="text-2xl font-bold font-mono-numbers text-neutral-100 mt-1 block">
                ETB {yearTotals.rev.toFixed(2)}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950">
              <span className="text-xs text-neutral-400 block">Net Taxable Amount</span>
              <span className="text-2xl font-bold font-mono-numbers text-neutral-200 mt-1 block">
                ETB {(yearTotals.rev - yearTotals.tax).toFixed(2)}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-amber-500/40 bg-neutral-950">
              <span className="text-xs text-amber-400 block font-medium">Collected Sales Tax (Payable)</span>
              <span className="text-2xl font-bold font-mono-numbers text-amber-300 mt-1 block">
                ETB {yearTotals.tax.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs text-neutral-400 leading-relaxed">
            All stationery merchandise and copy bureau services are subject to state sales tax of {(settings.taxRate * 100).toFixed(2)}%. Tax and revenue records are automatically stored in the internal business ledger for records and accounting.
          </div>
        </div>
      )}

    </div>
  );
};
