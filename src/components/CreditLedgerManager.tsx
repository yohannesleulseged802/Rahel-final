import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Check, 
  Receipt, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft,
  Smartphone, 
  DollarSign, 
  FileText, 
  Printer, 
  Download, 
  X, 
  Clock, 
  ChevronDown, 
  AlertCircle, 
  Landmark, 
  Banknote,
  UserCheck,
  UserX,
  Phone,
  Building2,
  CreditCard,
  Edit2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  Percent,
  ExternalLink
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { 
  CustomerCreditAccount, 
  CreditLedgerEntry, 
  ExpensePaymentAccount, 
  CreditAccountStatus 
} from '../types';

export const CreditLedgerManager: React.FC = () => {
  const { 
    creditAccounts, 
    creditEntries, 
    recordCreditIssuance, 
    recordCreditRepayment, 
    updateCustomerCreditAccount, 
    deleteCreditEntry, 
    deleteCustomerCreditAccount,
    settings, 
    currentUser, 
    showToast 
  } = usePOS();

  // Active view tab: 'accounts' (Customer Debtors Directory) or 'entries' (Transactions Ledger)
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'entries'>('accounts');

  // Modals state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<CustomerCreditAccount | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerCreditAccount | null>(null);

  // Form states for "+ Issue Credit"
  const [issueCustomerId, setIssueCustomerId] = useState<string>('new');
  const [issueCustomerName, setIssueCustomerName] = useState('');
  const [issueCustomerPhone, setIssueCustomerPhone] = useState('');
  const [issueCustomerEmail, setIssueCustomerEmail] = useState('');
  const [issueCompany, setIssueCompany] = useState('');
  const [issueCreditLimit, setIssueCreditLimit] = useState('');
  const [issueAmount, setIssueAmount] = useState('');
  const [issueItemsSummary, setIssueItemsSummary] = useState('');
  const [issueReceiptNumber, setIssueReceiptNumber] = useState('');
  const [issueDueDate, setIssueDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // Default 14 days credit term
    return d.toISOString().split('T')[0];
  });
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [issueTime, setIssueTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [issueNotes, setIssueNotes] = useState('');
  const [issueError, setIssueError] = useState<string | null>(null);

  // Form states for "+ Record Repayment"
  const [repayCustomerId, setRepayCustomerId] = useState<string>('');
  const [repayAmount, setRepayAmount] = useState('');
  const [repayPaymentAccount, setRepayPaymentAccount] = useState<ExpensePaymentAccount>('Telebirr (Maria)');
  const [repayRefNumber, setRepayRefNumber] = useState('');
  const [repayDate, setRepayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [repayTime, setRepayTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [repayNotes, setRepayNotes] = useState('');
  const [repayError, setRepayError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cleared' | 'overdue'>('all');
  const [entryTypeFilter, setEntryTypeFilter] = useState<'all' | 'issue_credit' | 'repayment'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'balance_asc' | 'name' | 'activity'>('balance_desc');

  // Format currency with symbol
  const formatCurrency = (val: number) => {
    return `${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${settings.currencySymbol || 'ETB'}`;
  };

  // Payment accounts list matching system requirements
  const paymentAccounts: ExpensePaymentAccount[] = [
    'Telebirr (Maria)',
    'Telebirr (Rahel)',
    'CBE',
    'Abyssinia Bank',
    'Awash Bank',
    'Dashen Bank',
    'Cash',
  ];

  // Helper to get styling & icon for payment accounts
  const getAccountBadge = (accountName?: string) => {
    if (!accountName) return null;
    if (accountName.includes('Maria')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <Smartphone className="w-3 h-3 text-emerald-400" />
          Telebirr (Maria)
        </span>
      );
    }
    if (accountName.includes('Rahel')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
          <Smartphone className="w-3 h-3 text-cyan-400" />
          Telebirr (Rahel)
        </span>
      );
    }
    if (accountName.includes('CBE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <Landmark className="w-3 h-3 text-purple-400" />
          CBE
        </span>
      );
    }
    if (accountName.includes('Abyssinia')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Landmark className="w-3 h-3 text-amber-400" />
          Abyssinia Bank
        </span>
      );
    }
    if (accountName.includes('Awash')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
          <Landmark className="w-3 h-3 text-blue-400" />
          Awash Bank
        </span>
      );
    }
    if (accountName.includes('Dashen')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          <Landmark className="w-3 h-3 text-indigo-400" />
          Dashen Bank
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
        <Banknote className="w-3 h-3 text-neutral-400" />
        {accountName}
      </span>
    );
  };

  // High-level KPI aggregations
  const metrics = useMemo(() => {
    const accounts = Array.isArray(creditAccounts) ? creditAccounts : [];
    const entries = Array.isArray(creditEntries) ? creditEntries : [];
    const todayStr = new Date().toISOString().split('T')[0];

    const totalOutstanding = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const totalIssued = accounts.reduce((sum, a) => sum + (a.totalCreditIssued || 0), 0);
    const totalRepaid = accounts.reduce((sum, a) => sum + (a.totalRepaid || 0), 0);
    
    const activeDebtors = accounts.filter(a => (a.currentBalance || 0) > 0);
    const clearedDebtors = accounts.filter(a => (a.currentBalance || 0) === 0 && (a.totalCreditIssued || 0) > 0);
    const overdueDebtors = accounts.filter(a => {
      return (a.currentBalance || 0) > 0 && a.dueDate && a.dueDate < todayStr;
    });

    const recoveryRate = totalIssued > 0 ? (totalRepaid / totalIssued) * 100 : 0;

    return {
      totalOutstanding,
      totalIssued,
      totalRepaid,
      activeCount: activeDebtors.length,
      clearedCount: clearedDebtors.length,
      overdueCount: overdueDebtors.length,
      recoveryRate,
      totalCustomersCount: accounts.length,
      totalEntriesCount: entries.length,
    };
  }, [creditAccounts, creditEntries]);

  // Filtered customer accounts
  const filteredAccounts = useMemo(() => {
    const list = Array.isArray(creditAccounts) ? [...creditAccounts] : [];
    const q = searchQuery.trim().toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];

    let result = list.filter(acc => {
      // Search text match
      const matchesSearch = !q || 
        acc.customerName.toLowerCase().includes(q) ||
        (acc.phone && acc.phone.toLowerCase().includes(q)) ||
        (acc.companyOrOrg && acc.companyOrOrg.toLowerCase().includes(q)) ||
        (acc.notes && acc.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'active') {
        return (acc.currentBalance || 0) > 0;
      }
      if (statusFilter === 'cleared') {
        return (acc.currentBalance || 0) <= 0;
      }
      if (statusFilter === 'overdue') {
        return (acc.currentBalance || 0) > 0 && acc.dueDate && acc.dueDate < todayStr;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'balance_desc') {
        return (b.currentBalance || 0) - (a.currentBalance || 0);
      }
      if (sortBy === 'balance_asc') {
        return (a.currentBalance || 0) - (b.currentBalance || 0);
      }
      if (sortBy === 'name') {
        return a.customerName.localeCompare(b.customerName);
      }
      if (sortBy === 'activity') {
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      }
      return 0;
    });

    return result;
  }, [creditAccounts, searchQuery, statusFilter, sortBy]);

  // Filtered ledger entries
  const filteredEntries = useMemo(() => {
    const list = Array.isArray(creditEntries) ? [...creditEntries] : [];
    const q = searchQuery.trim().toLowerCase();

    return list.filter(entry => {
      const matchesSearch = !q ||
        entry.customerName.toLowerCase().includes(q) ||
        (entry.creditNumber && entry.creditNumber.toLowerCase().includes(q)) ||
        (entry.customerPhone && entry.customerPhone.toLowerCase().includes(q)) ||
        (entry.referenceNumber && entry.referenceNumber.toLowerCase().includes(q)) ||
        (entry.saleReceiptNumber && entry.saleReceiptNumber.toLowerCase().includes(q)) ||
        (entry.itemsSummary && entry.itemsSummary.toLowerCase().includes(q)) ||
        (entry.notes && entry.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (entryTypeFilter !== 'all' && entry.type !== entryTypeFilter) {
        return false;
      }

      if (accountFilter !== 'all' && entry.paymentAccount !== accountFilter) {
        return false;
      }

      return true;
    });
  }, [creditEntries, searchQuery, entryTypeFilter, accountFilter]);

  // Handlers for Issue Credit Modal
  const openIssueCreditModal = (preselectedCustomer?: CustomerCreditAccount) => {
    setIssueError(null);
    if (preselectedCustomer) {
      setIssueCustomerId(preselectedCustomer.id);
      setIssueCustomerName(preselectedCustomer.customerName);
      setIssueCustomerPhone(preselectedCustomer.phone || '');
      setIssueCustomerEmail(preselectedCustomer.email || '');
      setIssueCompany(preselectedCustomer.companyOrOrg || '');
      setIssueCreditLimit(preselectedCustomer.creditLimit ? String(preselectedCustomer.creditLimit) : '');
    } else {
      setIssueCustomerId('new');
      setIssueCustomerName('');
      setIssueCustomerPhone('');
      setIssueCustomerEmail('');
      setIssueCompany('');
      setIssueCreditLimit('');
    }
    setIssueAmount('');
    setIssueItemsSummary('');
    setIssueReceiptNumber('');
    setIssueNotes('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setIssueTime(new Date().toTimeString().slice(0, 5));
    setIsIssueModalOpen(true);
  };

  const handleCustomerSelectionChange = (cId: string) => {
    setIssueCustomerId(cId);
    if (cId === 'new') {
      setIssueCustomerName('');
      setIssueCustomerPhone('');
      setIssueCustomerEmail('');
      setIssueCompany('');
      setIssueCreditLimit('');
    } else {
      const found = creditAccounts.find(a => a.id === cId);
      if (found) {
        setIssueCustomerName(found.customerName);
        setIssueCustomerPhone(found.phone || '');
        setIssueCustomerEmail(found.email || '');
        setIssueCompany(found.companyOrOrg || '');
        setIssueCreditLimit(found.creditLimit ? String(found.creditLimit) : '');
      }
    }
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIssueError(null);

    const amountNum = parseFloat(issueAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setIssueError('Please enter a valid credit amount in ETB.');
      return;
    }

    const cleanName = issueCustomerName.trim();
    if (!cleanName) {
      setIssueError('Customer name is required.');
      return;
    }

    try {
      recordCreditIssuance({
        customerName: cleanName,
        phone: issueCustomerPhone.trim() || undefined,
        email: issueCustomerEmail.trim() || undefined,
        companyOrOrg: issueCompany.trim() || undefined,
        creditLimit: issueCreditLimit ? parseFloat(issueCreditLimit) : undefined,
        amount: amountNum,
        itemsSummary: issueItemsSummary.trim() || undefined,
        saleReceiptNumber: issueReceiptNumber.trim() || undefined,
        dueDate: issueDueDate || undefined,
        notes: issueNotes.trim() || undefined,
        date: issueDate,
        time: issueTime,
      });

      setIsIssueModalOpen(false);
    } catch (err: any) {
      setIssueError(err.message || 'Failed to record credit issuance.');
    }
  };

  // Handlers for Repayment Modal
  const openRepaymentModal = (preselectedCustomer?: CustomerCreditAccount) => {
    setRepayError(null);
    if (preselectedCustomer) {
      setRepayCustomerId(preselectedCustomer.id);
      setRepayAmount(preselectedCustomer.currentBalance > 0 ? String(preselectedCustomer.currentBalance) : '');
    } else {
      const activeFirst = creditAccounts.find(a => a.currentBalance > 0);
      setRepayCustomerId(activeFirst?.id || (creditAccounts[0]?.id || ''));
      setRepayAmount(activeFirst?.currentBalance ? String(activeFirst.currentBalance) : '');
    }
    setRepayPaymentAccount('Telebirr (Maria)');
    setRepayRefNumber('');
    setRepayNotes('');
    setRepayDate(new Date().toISOString().split('T')[0]);
    setRepayTime(new Date().toTimeString().slice(0, 5));
    setIsRepayModalOpen(true);
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRepayError(null);

    if (!repayCustomerId) {
      setRepayError('Please choose a customer account.');
      return;
    }

    const amountNum = parseFloat(repayAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setRepayError('Please enter a valid repayment amount in ETB.');
      return;
    }

    try {
      recordCreditRepayment({
        customerId: repayCustomerId,
        amount: amountNum,
        paymentAccount: repayPaymentAccount,
        referenceNumber: repayRefNumber.trim() || undefined,
        notes: repayNotes.trim() || undefined,
        date: repayDate,
        time: repayTime,
      });

      setIsRepayModalOpen(false);
    } catch (err: any) {
      setRepayError(err.message || 'Failed to record credit repayment.');
    }
  };

  // Customer Statement Drawer / Modal calculation
  const customerStatementEntries = useMemo(() => {
    if (!selectedCustomerForStatement) return [];
    return creditEntries
      .filter(e => e.customerId === selectedCustomerForStatement.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedCustomerForStatement, creditEntries]);

  // Export Customer Statement to CSV
  const exportCustomerStatementCSV = (customer: CustomerCreditAccount) => {
    const entries = creditEntries
      .filter(e => e.customerId === customer.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const headers = ['Entry ID', 'Date', 'Time', 'Type', 'Amount (ETB)', 'Balance After (ETB)', 'Account/Method', 'Reference/Receipt', 'Items/Details', 'Notes', 'Operator'];
    const rows = entries.map(e => [
      e.creditNumber || e.id,
      e.date,
      e.time,
      e.type === 'issue_credit' ? 'CREDIT ISSUED (DEBT)' : 'REPAYMENT (SETTLEMENT)',
      e.amount.toFixed(2),
      e.balanceAfter.toFixed(2),
      e.paymentAccount || (e.type === 'issue_credit' ? 'Customer Account' : 'Direct'),
      e.referenceNumber || e.saleReceiptNumber || '-',
      (e.itemsSummary || '').replace(/,/g, ';'),
      (e.notes || '').replace(/,/g, ';'),
      e.operatorName || 'System',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      `Customer Name: ${customer.customerName}\n` +
      `Phone: ${customer.phone || 'N/A'}\n` +
      `Company: ${customer.companyOrOrg || 'N/A'}\n` +
      `Total Borrowed: ${customer.totalCreditIssued.toFixed(2)} ETB\n` +
      `Total Paid: ${customer.totalRepaid.toFixed(2)} ETB\n` +
      `Current Balance: ${customer.currentBalance.toFixed(2)} ETB\n\n` +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `statement_${customer.customerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Statement exported for ${customer.customerName}`);
  };

  // Export entire Debtors directory to CSV
  const exportAllDebtorsCSV = () => {
    const headers = ['Customer Name', 'Phone', 'Company/Org', 'Status', 'Total Credit Issued (ETB)', 'Total Repaid (ETB)', 'Current Outstanding Debt (ETB)', 'Credit Limit', 'Due Date', 'Last Activity'];
    const rows = creditAccounts.map(a => [
      `"${a.customerName.replace(/"/g, '""')}"`,
      `"${a.phone || ''}"`,
      `"${(a.companyOrOrg || '').replace(/"/g, '""')}"`,
      a.currentBalance > 0 ? 'ACTIVE DEBT' : 'CLEARED',
      a.totalCreditIssued.toFixed(2),
      a.totalRepaid.toFixed(2),
      a.currentBalance.toFixed(2),
      a.creditLimit ? a.creditLimit.toFixed(2) : 'None',
      a.dueDate || '-',
      a.lastActivityDate || a.updatedAt || '-',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `credit_ledger_debtors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Debtors ledger exported to CSV.');
  };

  // Print customer statement
  const printCustomerStatement = () => {
    window.print();
  };

  const selectedRepayCustomer = creditAccounts.find(a => a.id === repayCustomerId);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 
        ========================================================================
        HEADER & COMMAND ACTION BAR
        ========================================================================
      */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
                Credit Ledger
                <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-neutral-800 text-amber-300 border border-amber-500/20">
                  ዕዳ ደብተር
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400">
                Track customer store credit, outstanding receivables & repayment settlements
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={exportAllDebtorsCSV}
            title="Download full debtors report"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => openRepaymentModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-900/20 transition-all cursor-pointer active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Record Repayment</span>
          </button>

          <button
            type="button"
            onClick={() => openIssueCreditModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
            <span>Issue Credit</span>
          </button>
        </div>
      </div>

      {/* 
        ========================================================================
        EXECUTIVE KPI DASHBOARD STRIP
        ========================================================================
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Outstanding Debt (Receivables) */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-amber-500/30 relative overflow-hidden shadow-lg shadow-black/40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-1.5">
            <span>Outstanding Debt</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-neutral-100">
            {formatCurrency(metrics.totalOutstanding)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-2">
            <span>Debtors with Balance:</span>
            <span className="font-semibold text-amber-300 font-mono">{metrics.activeCount} accounts</span>
          </div>
        </div>

        {/* KPI 2: Total Repayments Recovered */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-emerald-500/30 relative overflow-hidden shadow-lg shadow-black/40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-400/90 mb-1.5">
            <span>Recovered Payments</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-400">
            {formatCurrency(metrics.totalRepaid)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-2">
            <span>Recovery Rate:</span>
            <span className="font-semibold text-emerald-300 font-mono">
              {metrics.recoveryRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* KPI 3: Total Lifetime Credit Extended */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 relative overflow-hidden shadow-lg shadow-black/40">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
            <span>Total Credit Issued</span>
            <TrendingDown className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-neutral-200">
            {formatCurrency(metrics.totalIssued)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-2">
            <span>Cleared Accounts:</span>
            <span className="font-semibold text-neutral-300 font-mono">{metrics.clearedCount} cleared</span>
          </div>
        </div>

        {/* KPI 4: Overdue Attention Accounts */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-rose-500/30 relative overflow-hidden shadow-lg shadow-black/40">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-rose-400/90 mb-1.5">
            <span>Overdue Balance</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-400">
            {metrics.overdueCount}{' '}
            <span className="text-sm font-normal text-neutral-400">accounts</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-2">
            <span>Action Required:</span>
            <span className="text-rose-300 font-medium">Follow-up phone / SMS</span>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        SUB-NAV TOGGLE & FILTER CONTROLS
        ========================================================================
      */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/60 p-2 rounded-2xl border border-neutral-800">
        {/* Sub-view toggle tabs */}
        <div className="flex items-center p-1 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('accounts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeSubTab === 'accounts'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Customer Accounts ({creditAccounts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('entries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeSubTab === 'entries'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Transactions Ledger ({creditEntries.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeSubTab === 'accounts' ? "Search customer, phone, company..." : "Search ref, invoice, notes..."}
            className="w-full pl-9 pr-8 py-1.5 bg-neutral-950/80 border border-neutral-800 focus:border-amber-500/50 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View-specific Filter selects */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'accounts' ? (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-neutral-950/80 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Debt (&gt; 0 ETB)</option>
                <option value="cleared">Cleared / Settled (0 ETB)</option>
                <option value="overdue">Overdue Accounts</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-neutral-950/80 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50"
              >
                <option value="balance_desc">Highest Debt</option>
                <option value="balance_asc">Lowest Debt</option>
                <option value="name">Customer Name</option>
                <option value="activity">Recent Activity</option>
              </select>
            </>
          ) : (
            <>
              <select
                value={entryTypeFilter}
                onChange={(e) => setEntryTypeFilter(e.target.value as any)}
                className="bg-neutral-950/80 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Types</option>
                <option value="issue_credit">Credit Issued</option>
                <option value="repayment">Repayments</option>
              </select>

              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="bg-neutral-950/80 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Payment Accounts</option>
                {paymentAccounts.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* 
        ========================================================================
        SUBTAB 1: CUSTOMER DEBTORS DIRECTORY
        ========================================================================
      */}
      {activeSubTab === 'accounts' && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          {filteredAccounts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                <UserCheck className="w-6 h-6" />
              </div>
              <p className="text-neutral-300 font-semibold text-sm">No customer credit accounts found</p>
              <p className="text-neutral-500 text-xs max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No customer records match your filter criteria. Try resetting the filters.'
                  : 'Start by extending credit to trusted clients or recording customer debt.'}
              </p>
              <button
                type="button"
                onClick={() => openIssueCreditModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Issue First Customer Credit
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-950/90 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[10px] select-none font-semibold">
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Organization / Contact</th>
                    <th className="py-3 px-4 text-right">Total Borrowed</th>
                    <th className="py-3 px-4 text-right">Total Repaid</th>
                    <th className="py-3 px-4 text-right">Current Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredAccounts.map((customer) => {
                    const hasDebt = (customer.currentBalance || 0) > 0;
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isOverdue = hasDebt && customer.dueDate && customer.dueDate < todayStr;

                    return (
                      <tr 
                        key={customer.id}
                        className="hover:bg-neutral-800/40 transition-colors group"
                      >
                        {/* Customer Name & Limit */}
                        <td className="py-3.5 px-4 font-medium text-neutral-100">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                              hasDebt ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {customer.customerName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-neutral-100 text-xs sm:text-sm">
                                {customer.customerName}
                              </div>
                              {customer.creditLimit ? (
                                <div className="text-[10px] text-neutral-400">
                                  Limit: {formatCurrency(customer.creditLimit)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* Org & Contact Info */}
                        <td className="py-3.5 px-4 text-neutral-300">
                          <div className="space-y-0.5">
                            {customer.companyOrOrg && (
                              <div className="flex items-center gap-1 text-xs text-neutral-200">
                                <Building2 className="w-3 h-3 text-neutral-500" />
                                <span>{customer.companyOrOrg}</span>
                              </div>
                            )}
                            {customer.phone && customer.phone !== 'Not specified' ? (
                              <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                                <Phone className="w-3 h-3 text-neutral-500" />
                                <span>{customer.phone}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-neutral-500 italic">No phone recorded</span>
                            )}
                          </div>
                        </td>

                        {/* Total Borrowed */}
                        <td className="py-3.5 px-4 text-right font-mono text-neutral-300">
                          {formatCurrency(customer.totalCreditIssued)}
                        </td>

                        {/* Total Repaid */}
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                          {formatCurrency(customer.totalRepaid)}
                        </td>

                        {/* Current Outstanding Debt */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-bold text-sm">
                            {hasDebt ? (
                              <span className="text-amber-400">
                                {formatCurrency(customer.currentBalance)}
                              </span>
                            ) : (
                              <span className="text-emerald-400">
                                0.00 ETB
                              </span>
                            )}
                          </div>
                          {customer.dueDate && hasDebt && (
                            <div className={`text-[10px] font-mono ${isOverdue ? 'text-rose-400 font-semibold' : 'text-neutral-400'}`}>
                              Due: {customer.dueDate} {isOverdue && '(Overdue)'}
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              OVERDUE
                            </span>
                          ) : hasDebt ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              ACTIVE DEBT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              CLEARED
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasDebt && (
                              <button
                                type="button"
                                onClick={() => openRepaymentModal(customer)}
                                title="Collect payment from this customer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                                <span>Pay</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openIssueCreditModal(customer)}
                              title="Issue more credit to this customer"
                              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3 text-amber-400" />
                              <span>Credit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedCustomerForStatement(customer)}
                              title="View full customer statement & ledger history"
                              className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingCustomer(customer);
                                setIsEditModalOpen(true);
                              }}
                              title="Edit customer account profile"
                              className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 
        ========================================================================
        SUBTAB 2: TRANSACTIONS & REPAYMENTS AUDIT JOURNAL
        ========================================================================
      */}
      {activeSubTab === 'entries' && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-neutral-300 font-semibold text-sm">No credit transactions recorded</p>
              <p className="text-neutral-500 text-xs max-w-sm mx-auto">
                No credit issuance or repayment transactions match your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-950/90 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[10px] select-none font-semibold">
                    <th className="py-3 px-4">Transaction Code</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Channel / Account</th>
                    <th className="py-3 px-4">Items / Details</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Balance After</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredEntries.map((entry) => {
                    const isCredit = entry.type === 'issue_credit';
                    return (
                      <tr 
                        key={entry.id}
                        className="hover:bg-neutral-800/40 transition-colors"
                      >
                        {/* Transaction ID */}
                        <td className="py-3 px-4 font-mono font-medium text-neutral-200">
                          {entry.creditNumber || entry.id.slice(0, 12)}
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-4 text-neutral-300 whitespace-nowrap">
                          <div>{entry.date}</div>
                          <div className="text-[10px] text-neutral-500">{entry.time}</div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4 font-semibold text-neutral-100">
                          {entry.customerName}
                          {entry.customerPhone && (
                            <div className="text-[10px] text-neutral-400 font-normal font-mono">
                              {entry.customerPhone}
                            </div>
                          )}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-4">
                          {isCredit ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <ArrowUpRight className="w-3 h-3 text-amber-400" />
                              Credit Issued
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                              Repayment
                            </span>
                          )}
                        </td>

                        {/* Payment Account */}
                        <td className="py-3 px-4">
                          {entry.paymentAccount ? (
                            getAccountBadge(entry.paymentAccount)
                          ) : (
                            <span className="text-[11px] text-neutral-400">
                              {entry.saleReceiptNumber ? `Sale #${entry.saleReceiptNumber}` : 'Customer Credit Tab'}
                            </span>
                          )}
                          {entry.referenceNumber && (
                            <div className="text-[10px] font-mono text-neutral-400">
                              Ref: {entry.referenceNumber}
                            </div>
                          )}
                        </td>

                        {/* Items / Details / Notes */}
                        <td className="py-3 px-4 text-neutral-300 max-w-xs truncate">
                          {entry.itemsSummary || entry.notes || '—'}
                        </td>

                        {/* Amount */}
                        <td className={`py-3 px-4 text-right font-mono font-bold ${
                          isCredit ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {isCredit ? '+' : '-'}{formatCurrency(entry.amount)}
                        </td>

                        {/* Balance After */}
                        <td className="py-3 px-4 text-right font-mono text-neutral-300">
                          {formatCurrency(entry.balanceAfter)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete credit entry ${entry.creditNumber || entry.id}? This will not alter current customer balance.`)) {
                                deleteCreditEntry(entry.id);
                              }
                            }}
                            title="Remove transaction entry"
                            className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* 
        ========================================================================
        MODAL 1: ISSUE CREDIT / RECORD DEBT
        ========================================================================
      */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">Issue Store Credit / Record Debt</h3>
                  <p className="text-[11px] text-neutral-400">Extends customer debt with items summary and due date</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleIssueSubmit} className="p-5 space-y-4">
              {issueError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{issueError}</span>
                </div>
              )}

              {/* Customer Selector / Mode */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Select Customer Account
                </label>
                <select
                  value={issueCustomerId}
                  onChange={(e) => handleCustomerSelectionChange(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/60"
                >
                  <option value="new">+ Create New Customer Profile</option>
                  {creditAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.customerName} {acc.companyOrOrg ? `(${acc.companyOrOrg})` : ''} - Bal: {acc.currentBalance.toLocaleString()} ETB
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Profile Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Customer Full Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={issueCustomerName}
                    onChange={(e) => setIssueCustomerName(e.target.value)}
                    placeholder="e.g. Ato Yohannes Kebede"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={issueCustomerPhone}
                    onChange={(e) => setIssueCustomerPhone(e.target.value)}
                    placeholder="0911223344"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/60 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={issueCompany}
                    onChange={(e) => setIssueCompany(e.target.value)}
                    placeholder="Ministry of Health / Law Firm"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Credit Limit (ETB, Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={issueCreditLimit}
                    onChange={(e) => setIssueCreditLimit(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/60 font-mono"
                  />
                </div>
              </div>

              {/* Amount & Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-neutral-800">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-amber-300">
                    Credit Amount to Issue (ETB) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={issueAmount}
                      onChange={(e) => setIssueAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-neutral-950 border border-amber-500/40 rounded-xl pl-3 pr-14 py-2.5 text-sm font-bold font-mono text-neutral-100 focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
                      ETB
                    </span>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Items / Services Taken on Credit
                  </label>
                  <input
                    type="text"
                    value={issueItemsSummary}
                    onChange={(e) => setIssueItemsSummary(e.target.value)}
                    placeholder="e.g. 4x A4 Paper Reams, 25x Spiral Binders, 1x Stamp"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Related Invoice / Receipt #
                  </label>
                  <input
                    type="text"
                    value={issueReceiptNumber}
                    onChange={(e) => setIssueReceiptNumber(e.target.value)}
                    placeholder="REC-2026-..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/60 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Repayment Due Date
                  </label>
                  <input
                    type="date"
                    value={issueDueDate}
                    onChange={(e) => setIssueDueDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">Time</label>
                  <input
                    type="time"
                    value={issueTime}
                    onChange={(e) => setIssueTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-300">
                  Notes / Terms
                </label>
                <textarea
                  rows={2}
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="e.g. Promised payment on 15th via CBE"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/60 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Confirm &amp; Record Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL 2: RECORD REPAYMENT / SETTLEMENT
        ========================================================================
      */}
      {isRepayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-neutral-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">Record Customer Repayment</h3>
                  <p className="text-[11px] text-neutral-400">Choose received payment account and reduce customer balance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRepayModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRepaySubmit} className="p-5 space-y-4">
              {repayError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{repayError}</span>
                </div>
              )}

              {/* Customer Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Debtor Customer <span className="text-emerald-400">*</span>
                </label>
                <select
                  required
                  value={repayCustomerId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setRepayCustomerId(cId);
                    const found = creditAccounts.find(a => a.id === cId);
                    if (found && found.currentBalance > 0) {
                      setRepayAmount(String(found.currentBalance));
                    }
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500/60"
                >
                  <option value="" disabled>-- Select Customer Account --</option>
                  {creditAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.customerName} {acc.companyOrOrg ? `(${acc.companyOrOrg})` : ''} — Current Debt: {acc.currentBalance.toLocaleString()} ETB
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Customer Balance Insight */}
              {selectedRepayCustomer && (
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-400">Outstanding Debt:</span>{' '}
                    <span className="font-bold text-amber-400 font-mono text-sm">
                      {formatCurrency(selectedRepayCustomer.currentBalance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRepayAmount(String(selectedRepayCustomer.currentBalance))}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-semibold border border-emerald-500/30"
                    >
                      Pay Full
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepayAmount(String((selectedRepayCustomer.currentBalance / 2).toFixed(2)))}
                      className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-[10px] font-semibold"
                    >
                      50%
                    </button>
                  </div>
                </div>
              )}

              {/* Repayment Amount */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-emerald-300">
                  Repayment Amount (ETB) <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-neutral-950 border border-emerald-500/40 rounded-xl pl-3 pr-14 py-2.5 text-sm font-bold font-mono text-neutral-100 focus:outline-none focus:border-emerald-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
                    ETB
                  </span>
                </div>
              </div>

              {/* Designated Payment Account Selection (Explicitly 7 options required) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Payment Destination Account <span className="text-emerald-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {paymentAccounts.map((acc) => {
                    const isSelected = repayPaymentAccount === acc;
                    return (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => setRepayPaymentAccount(acc)}
                        className={`p-2 rounded-xl text-left border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                        }`}
                      >
                        {acc.includes('Telebirr') ? (
                          <Smartphone className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        ) : acc === 'Cash' ? (
                          <Banknote className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        ) : (
                          <Landmark className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                        )}
                        <span className="truncate">{acc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Bank / Telebirr Ref Number
                  </label>
                  <input
                    type="text"
                    value={repayRefNumber}
                    onChange={(e) => setRepayRefNumber(e.target.value)}
                    placeholder="e.g. TXN987654321 / CBE Slip #"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500/60 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">Date</label>
                  <input
                    type="date"
                    value={repayDate}
                    onChange={(e) => setRepayDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-300">
                  Repayment Notes
                </label>
                <input
                  type="text"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder="e.g. Partial settlement for invoice #REC-2026..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRepayModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                >
                  Confirm &amp; Record Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL 3: CUSTOMER STATEMENT & LEDGER DRAWER
        ========================================================================
      */}
      {selectedCustomerForStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    {selectedCustomerForStatement.customerName}
                    <span className="text-xs px-2 py-0.5 rounded font-normal bg-neutral-800 text-neutral-300">
                      Statement of Account
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {selectedCustomerForStatement.companyOrOrg ? `${selectedCustomerForStatement.companyOrOrg} • ` : ''}
                    Phone: {selectedCustomerForStatement.phone || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportCustomerStatementCSV(selectedCustomerForStatement)}
                  title="Export this customer statement as CSV"
                  className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => printCustomerStatement()}
                  title="Print customer statement"
                  className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForStatement(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Statement Summary Cards */}
            <div className="p-5 grid grid-cols-3 gap-3 border-b border-neutral-800 bg-neutral-950/40 text-xs">
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-neutral-400 text-[11px] mb-1">Total Credit Taken</div>
                <div className="font-mono font-bold text-sm text-neutral-200">
                  {formatCurrency(selectedCustomerForStatement.totalCreditIssued)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-neutral-400 text-[11px] mb-1">Total Repayments</div>
                <div className="font-mono font-bold text-sm text-emerald-400">
                  {formatCurrency(selectedCustomerForStatement.totalRepaid)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-amber-500/30">
                <div className="text-amber-400 text-[11px] font-semibold mb-1">Remaining Balance</div>
                <div className="font-mono font-bold text-sm text-amber-400">
                  {formatCurrency(selectedCustomerForStatement.currentBalance)}
                </div>
              </div>
            </div>

            {/* Statement Ledger List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Ledger Timeline &amp; Payment History
              </h4>

              {customerStatementEntries.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs">
                  No individual transaction entries found for this customer profile.
                </div>
              ) : (
                <div className="border border-neutral-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 text-[10px] uppercase font-semibold">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Description / Method</th>
                        <th className="py-2.5 px-3 text-right">Debit (+)</th>
                        <th className="py-2.5 px-3 text-right">Credit (-)</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {customerStatementEntries.map((entry) => {
                        const isCredit = entry.type === 'issue_credit';
                        return (
                          <tr key={entry.id} className="hover:bg-neutral-800/30">
                            <td className="py-2.5 px-3 text-neutral-300 font-mono text-[11px] whitespace-nowrap">
                              {entry.date} <span className="text-neutral-500">{entry.time}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              {isCredit ? (
                                <span className="text-amber-400 font-semibold text-[11px]">Credit Issued</span>
                              ) : (
                                <span className="text-emerald-400 font-semibold text-[11px]">Repayment</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-neutral-300 text-[11px]">
                              <div>{entry.itemsSummary || entry.notes || 'Transaction'}</div>
                              {entry.paymentAccount && (
                                <div className="text-[10px] text-neutral-500">
                                  via {entry.paymentAccount} {entry.referenceNumber ? `• Ref: ${entry.referenceNumber}` : ''}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                              {isCredit ? formatCurrency(entry.amount) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                              {!isCredit ? formatCurrency(entry.amount) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-100">
                              {formatCurrency(entry.balanceAfter)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const cust = selectedCustomerForStatement;
                  setSelectedCustomerForStatement(null);
                  openRepaymentModal(cust);
                }}
                disabled={selectedCustomerForStatement.currentBalance <= 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Collect Payment for this Customer
              </button>

              <button
                type="button"
                onClick={() => setSelectedCustomerForStatement(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL 4: EDIT CUSTOMER CREDIT PROFILE
        ========================================================================
      */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
              <h3 className="text-sm font-bold text-neutral-100">Edit Customer Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCustomerCreditAccount(editingCustomer.id, {
                  customerName: editingCustomer.customerName,
                  phone: editingCustomer.phone,
                  email: editingCustomer.email,
                  companyOrOrg: editingCustomer.companyOrOrg,
                  creditLimit: editingCustomer.creditLimit,
                  dueDate: editingCustomer.dueDate,
                  notes: editingCustomer.notes,
                });
                setIsEditModalOpen(false);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.customerName}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, customerName: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingCustomer.phone || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={editingCustomer.companyOrOrg || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, companyOrOrg: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Credit Limit (ETB)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingCustomer.creditLimit || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, creditLimit: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editingCustomer.dueDate || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, dueDate: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                {editingCustomer.currentBalance <= 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete customer ${editingCustomer.customerName}?`)) {
                        deleteCustomerCreditAccount(editingCustomer.id);
                        setIsEditModalOpen(false);
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                  >
                    Delete Profile
                  </button>
                ) : (
                  <span className="text-[10px] text-neutral-500">
                    Cannot delete profile while debt is active.
                  </span>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
