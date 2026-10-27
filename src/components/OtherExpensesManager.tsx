import React, { useState, useMemo } from 'react';
import { 
  Fuel, 
  Building2, 
  Users, 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Check, 
  Receipt, 
  Trash2, 
  ArrowUpRight, 
  Smartphone, 
  DollarSign, 
  FileText, 
  Printer, 
  Download, 
  X,
  CreditCard,
  Clock,
  ChevronDown,
  AlertCircle,
  Landmark,
  Banknote
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ExpenseCategory, ExpensePaymentAccount, ExpenseTransaction } from '../types';

export const OtherExpensesManager: React.FC = () => {
  const { 
    expenses, 
    recordExpense, 
    deleteExpense, 
    settings, 
    currentUser, 
    users,
    showToast 
  } = usePOS();

  // Modal / Drawer state for creating an expense
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('fuel');
  const [selectedAccount, setSelectedAccount] = useState<ExpensePaymentAccount>('Telebirr (Maria)');
  const [amountInput, setAmountInput] = useState('');
  const [paidToInput, setPaidToInput] = useState('');
  const [referenceCodeInput, setReferenceCodeInput] = useState('');
  const [periodMonthInput, setPeriodMonthInput] = useState(() => {
    const d = new Date();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  });
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeInput, setTimeInput] = useState(() => new Date().toTimeString().slice(0, 5));
  const [notesInput, setNotesInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filters for ledger
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>('all');

  // Quick Open Modal with preselected category
  // Quick Open Modal with preselected category
  const openExpenseModal = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setFormError(null);
    setAmountInput('');
    setReferenceCodeInput('');
    setNotesInput('');

    // Pre-fill smart defaults based on category
    if (category === 'fuel') {
      setPaidToInput('TotalEnergies Petrol Station');
      setSelectedAccount('Telebirr (Maria)');
    } else if (category === 'rent') {
      setPaidToInput('Main Bureau Building (Suite 4B)');
      setSelectedAccount('Telebirr (Rahel)');
    } else if (category === 'salary') {
      setPaidToInput(users.length > 0 ? users[0].name : 'Shop Assistant');
      setSelectedAccount('Telebirr (Maria)');
    } else {
      setPaidToInput('');
      setSelectedAccount('Telebirr (Maria)');
    }

    setIsModalOpen(true);
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return `${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${settings.currencySymbol || 'ETB'}`;
  };

  // Calculations & Analytics across all accounts
  const metrics = useMemo(() => {
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    const now = new Date();
    const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM

    let totalAllTime = 0;
    let totalThisMonth = 0;
    let totalFuel = 0;
    let totalRent = 0;
    let totalSalary = 0;
    let totalOther = 0;

    let mariaTotal = 0;
    let rahelTotal = 0;
    let cbeTotal = 0;
    let abyssiniaTotal = 0;
    let awashTotal = 0;
    let dashenTotal = 0;
    let cashTotal = 0;
    let otherAccountsTotal = 0;

    safeExpenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      totalAllTime += amt;

      if (exp.date && exp.date.startsWith(currentMonthStr)) {
        totalThisMonth += amt;
      }

      if (exp.category === 'fuel') totalFuel += amt;
      else if (exp.category === 'rent') totalRent += amt;
      else if (exp.category === 'salary') totalSalary += amt;
      else totalOther += amt;

      if (exp.paidAccount === 'Telebirr (Maria)') mariaTotal += amt;
      else if (exp.paidAccount === 'Telebirr (Rahel)') rahelTotal += amt;
      else if (exp.paidAccount === 'CBE') cbeTotal += amt;
      else if (exp.paidAccount === 'Abyssinia Bank') abyssiniaTotal += amt;
      else if (exp.paidAccount === 'Awash Bank') awashTotal += amt;
      else if (exp.paidAccount === 'Dashen Bank') dashenTotal += amt;
      else if (exp.paidAccount === 'Cash') cashTotal += amt;
      else otherAccountsTotal += amt;
    });

    return {
      totalAllTime,
      totalThisMonth,
      totalFuel,
      totalRent,
      totalSalary,
      totalOther,
      mariaTotal,
      rahelTotal,
      cbeTotal,
      abyssiniaTotal,
      awashTotal,
      dashenTotal,
      cashTotal,
      otherAccountsTotal,
      count: safeExpenses.length,
    };
  }, [expenses]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    const safe = Array.isArray(expenses) ? expenses : [];
    return safe.filter(exp => {
      if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
      if (accountFilter !== 'all' && exp.paidAccount !== accountFilter) return false;
      if (selectedYearMonth !== 'all' && exp.date && !exp.date.startsWith(selectedYearMonth)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = exp.expenseNumber?.toLowerCase().includes(q);
        const matchTo = exp.paidTo?.toLowerCase().includes(q);
        const matchRef = exp.referenceNumber?.toLowerCase().includes(q);
        const matchNotes = exp.notes?.toLowerCase().includes(q);
        const matchCategory = exp.categoryLabel?.toLowerCase().includes(q);
        const matchAccount = exp.paidAccount?.toLowerCase().includes(q);
        if (!matchNumber && !matchTo && !matchRef && !matchNotes && !matchCategory && !matchAccount) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, categoryFilter, accountFilter, selectedYearMonth, searchQuery]);

  // Available year-months for filtering
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // Handle Submit Form
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid expense amount greater than 0 ETB.');
      return;
    }

    if (!paidToInput.trim()) {
      setFormError('Please specify the recipient, payee, or service location.');
      return;
    }

    try {
      recordExpense({
        category: selectedCategory,
        amount: parsedAmount,
        paidAccount: selectedAccount,
        paidTo: paidToInput.trim(),
        referenceNumber: referenceCodeInput.trim() || undefined,
        periodMonth: periodMonthInput.trim() || undefined,
        notes: notesInput.trim() || undefined,
        date: dateInput,
        time: timeInput,
      });

      setIsModalOpen(false);
      setAmountInput('');
      setPaidToInput('');
      setReferenceCodeInput('');
      setNotesInput('');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to record expense.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      showToast('No expenses to export.');
      return;
    }

    const headers = [
      'Expense #',
      'Date',
      'Time',
      'Category',
      'Paid To / Payee',
      'Amount (ETB)',
      'Paid Account',
      'Telebirr / Ref Code',
      'Period Month',
      'Operator',
      'Notes'
    ];

    const rows = filteredExpenses.map(e => [
      e.expenseNumber,
      e.date,
      e.time,
      e.categoryLabel,
      `"${(e.paidTo || '').replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      `"${e.paidAccount}"`,
      `"${(e.referenceNumber || '').replace(/"/g, '""')}"`,
      `"${(e.periodMonth || '').replace(/"/g, '""')}"`,
      `"${(e.operatorName || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rahel_Stationary_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported expenses ledger to CSV.');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 tracking-tight flex items-center gap-2">
                <span>Other Expenses</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-neutral-800 border border-neutral-700 text-neutral-300">
                  Telebirr Accounts
                </span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Track shop operating expenses paid via <strong>Telebirr (Maria)</strong> or <strong>Telebirr (Rahel)</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => openExpenseModal('fuel')}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/15 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 3 Quick-Action Preset Cards for the User Requirements */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Card 1: Fuel Expenses */}
        <div 
          onClick={() => openExpenseModal('fuel')}
          className="group relative bg-neutral-900/80 hover:bg-neutral-850/90 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-lg shadow-black/40 hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <Fuel className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <span>+ Log Fuel</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-bold text-neutral-100 group-hover:text-amber-200 transition-colors">
              1. Fuel Expenses
            </h3>
            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
              Delivery van, generator &amp; staff travel fuel paid via Telebirr.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Total Spent:</span>
            <span className="font-mono font-bold text-neutral-200">{formatCurrency(metrics.totalFuel)}</span>
          </div>
        </div>

        {/* Card 2: Rent */}
        <div 
          onClick={() => openExpenseModal('rent')}
          className="group relative bg-neutral-900/80 hover:bg-neutral-850/90 border border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-lg shadow-black/40 hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-cyan-400/90 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <span>+ Log Rent</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-bold text-neutral-100 group-hover:text-cyan-200 transition-colors">
              2. Rent
            </h3>
            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
              Monthly store &amp; print atelier premise lease paid via Telebirr.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Total Spent:</span>
            <span className="font-mono font-bold text-neutral-200">{formatCurrency(metrics.totalRent)}</span>
          </div>
        </div>

        {/* Card 3: Salary */}
        <div 
          onClick={() => openExpenseModal('salary')}
          className="group relative bg-neutral-900/80 hover:bg-neutral-850/90 border border-emerald-500/30 hover:border-emerald-400 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-lg shadow-black/40 hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <span>+ Log Salary</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-bold text-neutral-100 group-hover:text-emerald-200 transition-colors">
              3. Salary
            </h3>
            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
              Cashier wages, print technicians &amp; staff payouts via Telebirr.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Total Spent:</span>
            <span className="font-mono font-bold text-neutral-200">{formatCurrency(metrics.totalSalary)}</span>
          </div>
        </div>

      </div>

      {/* Accounts Status Breakdown Banner */}
      <div className="space-y-3">
        {/* Top 2 Primary Telebirr Accounts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Account 1: Telebirr (Maria) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-100">Telebirr (Maria)</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Account #1
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Designated operator wallet for utility &amp; counter expenses
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-500 block uppercase tracking-wider font-semibold">Total Paid Out</span>
              <span className="text-base sm:text-lg font-bold font-mono text-cyan-300">
                {formatCurrency(metrics.mariaTotal)}
              </span>
            </div>
          </div>

          {/* Account 2: Telebirr (Rahel) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-100">Telebirr (Rahel)</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Account #2
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Executive store owner wallet for lease, salaries &amp; major payments
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-500 block uppercase tracking-wider font-semibold">Total Paid Out</span>
              <span className="text-base sm:text-lg font-bold font-mono text-amber-300">
                {formatCurrency(metrics.rahelTotal)}
              </span>
            </div>
          </div>

        </div>

        {/* Commercial Banks & Cash Expenses Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block font-semibold">CBE Bank</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-neutral-200 mt-0.5 block">{formatCurrency(metrics.cbeTotal)}</span>
          </div>
          <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block font-semibold">Abyssinia Bank</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-neutral-200 mt-0.5 block">{formatCurrency(metrics.abyssiniaTotal)}</span>
          </div>
          <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block font-semibold">Awash Bank</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-neutral-200 mt-0.5 block">{formatCurrency(metrics.awashTotal)}</span>
          </div>
          <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block font-semibold">Dashen Bank</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-neutral-200 mt-0.5 block">{formatCurrency(metrics.dashenTotal)}</span>
          </div>
          <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-neutral-400 block font-semibold">Cash Drawer</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-neutral-200 mt-0.5 block">{formatCurrency(metrics.cashTotal)}</span>
          </div>
        </div>
      </div>

      {/* Expenses Ledger & History Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        
        {/* Table Filters Bar */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses, reference #, recipient, or notes..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 focus:border-amber-400 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-neutral-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-neutral-500" /> Category:
            </span>
            {(['all', 'fuel', 'rent', 'salary'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-amber-400 text-neutral-950 shadow-xs'
                    : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Account Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-neutral-400 font-medium mr-1 flex items-center gap-1">
              <Wallet className="w-3 h-3 text-neutral-500" /> Account:
            </span>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="all">All Accounts</option>
              <optgroup label="Telebirr Accounts">
                <option value="Telebirr (Maria)">Telebirr (Maria)</option>
                <option value="Telebirr (Rahel)">Telebirr (Rahel)</option>
              </optgroup>
              <optgroup label="Commercial Banks">
                <option value="CBE">CBE (Commercial Bank of Ethiopia)</option>
                <option value="Abyssinia Bank">Abyssinia Bank</option>
                <option value="Awash Bank">Awash Bank</option>
                <option value="Dashen Bank">Dashen Bank</option>
              </optgroup>
              <optgroup label="Counter">
                <option value="Cash">Cash</option>
              </optgroup>
            </select>
          </div>

        </div>

        {/* Table Content */}
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-200">No Expenses Recorded</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              {searchQuery || categoryFilter !== 'all' || accountFilter !== 'all'
                ? 'No expenses matched your filter criteria. Try resetting the search or category filter.'
                : 'Click one of the buttons above (Fuel Expenses, Rent, or Salary) to record your first operational expense with Telebirr.'}
            </p>
            {categoryFilter === 'all' && accountFilter === 'all' && !searchQuery && (
              <button
                type="button"
                onClick={() => openExpenseModal('fuel')}
                className="mt-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20"
              >
                + Record Fuel Expense
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/80 text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date &amp; Ref #</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Paid To / Purpose</th>
                  <th className="py-3 px-4">Account Used</th>
                  <th className="py-3 px-4">Telebirr Ref / SMS</th>
                  <th className="py-3 px-4 text-right">Amount (ETB)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {filteredExpenses.map((exp) => {
                  const isFuel = exp.category === 'fuel';
                  const isRent = exp.category === 'rent';
                  const isSalary = exp.category === 'salary';

                  return (
                    <tr key={exp.id} className="hover:bg-neutral-850/50 transition-colors">
                      {/* Date & Ref */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-neutral-200">{exp.expenseNumber}</div>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-neutral-600" />
                          <span>{exp.date}</span>
                          <span className="text-neutral-600">·</span>
                          <Clock className="w-3 h-3 text-neutral-600" />
                          <span>{exp.time}</span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          isFuel 
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                            : isRent
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            : isSalary
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}>
                          {isFuel && <Fuel className="w-3.5 h-3.5" />}
                          {isRent && <Building2 className="w-3.5 h-3.5" />}
                          {isSalary && <Users className="w-3.5 h-3.5" />}
                          <span>{exp.categoryLabel}</span>
                        </span>
                      </td>

                      {/* Paid To & Notes */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-neutral-100 truncate">{exp.paidTo || '—'}</div>
                        {exp.periodMonth && (
                          <div className="text-[11px] text-amber-400/90 font-mono mt-0.5">
                            Period: {exp.periodMonth}
                          </div>
                        )}
                        {exp.notes && (
                          <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                            {exp.notes}
                          </div>
                        )}
                      </td>

                      {/* Account Used */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono ${
                          exp.paidAccount === 'Telebirr (Maria)'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : exp.paidAccount === 'Telebirr (Rahel)'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}>
                          <Smartphone className="w-3 h-3 shrink-0" />
                          <span>{exp.paidAccount}</span>
                        </span>
                      </td>

                      {/* Telebirr Reference Code */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        {exp.referenceNumber ? (
                          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                            {exp.referenceNumber}
                          </span>
                        ) : (
                          <span className="text-neutral-600 italic">No code</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-sm text-neutral-100">
                        {formatCurrency(exp.amount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete expense ${exp.expenseNumber} (${exp.amount} ETB for ${exp.paidTo})?`)) {
                              deleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Statistics */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <div>
            Showing <strong className="text-neutral-200">{filteredExpenses.length}</strong> of{' '}
            <strong className="text-neutral-200">{expenses.length}</strong> recorded expenses
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span>Subtotal filtered: </span>
              <strong className="font-mono text-neutral-100 text-sm">
                {formatCurrency(filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0))}
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* RECORD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full text-neutral-100 shadow-2xl overflow-hidden animate-in fade-in duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-100">Record Operational Expense</h3>
                  <p className="text-xs text-neutral-400">Select expense category &amp; Telebirr account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4 text-xs">
              
              {/* Form Error Notice */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Step 1: Category Selector (Fuel, Rent, Salary, Other) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Expense Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Fuel */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('fuel');
                      if (!paidToInput || paidToInput.includes('Building') || paidToInput.includes('Assistant')) {
                        setPaidToInput('TotalEnergies Petrol Station');
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedCategory === 'fuel'
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300 shadow-sm'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    <Fuel className="w-5 h-5" />
                    <span className="font-bold text-xs">1. Fuel Expenses</span>
                  </button>

                  {/* Rent */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('rent');
                      if (!paidToInput || paidToInput.includes('Petrol') || paidToInput.includes('Assistant')) {
                        setPaidToInput('Main Bureau Building (Suite 4B)');
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedCategory === 'rent'
                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300 shadow-sm'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="font-bold text-xs">2. Rent</span>
                  </button>

                  {/* Salary */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('salary');
                      if (!paidToInput || paidToInput.includes('Petrol') || paidToInput.includes('Building')) {
                        setPaidToInput(users.length > 0 ? users[0].name : 'Shop Assistant');
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedCategory === 'salary'
                        ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300 shadow-sm'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-bold text-xs">3. Salary</span>
                  </button>

                </div>
              </div>

              {/* Step 2: Choose Which Account Was Used to Pay It (CRITICAL REQUIREMENT) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-300">
                  Choose Which Account Was Used to Pay It <span className="text-amber-400">*</span>
                </label>

                {/* Section A: Telebirr Accounts (Maria & Rahel) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-semibold">
                    1. Telebirr Mobile Wallets (2 Accounts)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    
                    {/* Account 1: Telebirr (Maria) */}
                    <button
                      type="button"
                      onClick={() => setSelectedAccount('Telebirr (Maria)')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        selectedAccount === 'Telebirr (Maria)'
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedAccount === 'Telebirr (Maria)' ? 'bg-cyan-500 text-neutral-950' : 'bg-neutral-850 text-neutral-400'
                        }`}>
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs block text-neutral-100">Telebirr (Maria)</span>
                          <span className="text-[10px] text-cyan-300/80">Primary Operational Wallet</span>
                        </div>
                      </div>
                      {selectedAccount === 'Telebirr (Maria)' && (
                        <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                    </button>

                    {/* Account 2: Telebirr (Rahel) */}
                    <button
                      type="button"
                      onClick={() => setSelectedAccount('Telebirr (Rahel)')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        selectedAccount === 'Telebirr (Rahel)'
                          ? 'border-amber-400 bg-amber-950/40 text-amber-200 shadow-md shadow-amber-950/50 ring-1 ring-amber-400'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedAccount === 'Telebirr (Rahel)' ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-850 text-neutral-400'
                        }`}>
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs block text-neutral-100">Telebirr (Rahel)</span>
                          <span className="text-[10px] text-amber-300/80">Executive Owner Wallet</span>
                        </div>
                      </div>
                      {selectedAccount === 'Telebirr (Rahel)' && (
                        <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                    </button>

                  </div>
                </div>

                {/* Section B: Commercial Banks */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-semibold">
                    2. Commercial Bank Accounts
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'CBE', label: 'CBE', sub: 'Commercial Bank' },
                      { id: 'Abyssinia Bank', label: 'Abyssinia', sub: 'Bank of Abyssinia' },
                      { id: 'Awash Bank', label: 'Awash', sub: 'Awash Int. Bank' },
                      { id: 'Dashen Bank', label: 'Dashen', sub: 'Dashen Bank' }
                    ].map(bank => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedAccount(bank.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedAccount === bank.id
                            ? 'border-amber-400 bg-amber-950/30 text-amber-200 ring-1 ring-amber-400'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Landmark className={`w-3.5 h-3.5 ${selectedAccount === bank.id ? 'text-amber-400' : 'text-neutral-500'}`} />
                          {selectedAccount === bank.id && <Check className="w-3 h-3 text-amber-400" />}
                        </div>
                        <div className="mt-1.5">
                          <span className="font-bold text-xs block text-neutral-100 truncate">{bank.label}</span>
                          <span className="text-[9px] text-neutral-400 block truncate">{bank.sub}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section C: Cash Counter */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedAccount('Cash')}
                    className={`w-full p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedAccount === 'Cash'
                        ? 'border-emerald-400 bg-emerald-950/30 text-emerald-200 ring-1 ring-emerald-400'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Banknote className={`w-4 h-4 ${selectedAccount === 'Cash' ? 'text-emerald-400' : 'text-neutral-500'}`} />
                      <span className="text-xs font-semibold text-neutral-200">Cash Drawer / Physical Petty Cash</span>
                    </div>
                    {selectedAccount === 'Cash' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>
              </div>

              {/* Amount Input (ETB) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Amount in ETB <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="e.g. 1500.00"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-base font-mono pl-12 outline-none transition-all font-bold"
                  />
                  <span className="absolute left-3.5 top-3 text-xs font-mono font-bold text-amber-400">
                    ETB
                  </span>
                </div>
              </div>

              {/* Dynamic Contextual Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Paid To */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    {selectedCategory === 'fuel' 
                      ? 'Petrol Station / Vehicle / Driver' 
                      : selectedCategory === 'rent'
                      ? 'Building Landlord / Suite'
                      : selectedCategory === 'salary'
                      ? 'Employee / Staff Name'
                      : 'Payee / Purpose'} <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={paidToInput}
                    onChange={(e) => setPaidToInput(e.target.value)}
                    placeholder={
                      selectedCategory === 'fuel'
                        ? 'e.g. TotalEnergies (Delivery Van)'
                        : selectedCategory === 'rent'
                        ? 'e.g. Landlord Haile - Shop Suite 4B'
                        : selectedCategory === 'salary'
                        ? 'e.g. Yohannes L. (Print Master)'
                        : 'Recipient name'
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-xs outline-none"
                  />
                </div>

                {/* Period Month (for Rent and Salary) or Liters/Trip (for Fuel) */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    {selectedCategory === 'fuel' ? 'Liters or Trip Details' : 'Billing Period / Month'}
                  </label>
                  <input
                    type="text"
                    value={periodMonthInput}
                    onChange={(e) => setPeriodMonthInput(e.target.value)}
                    placeholder={selectedCategory === 'fuel' ? 'e.g. 25 Liters Diesel' : 'e.g. October 2026'}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Telebirr Reference Code & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Telebirr Confirmation Code / SMS Ref
                  </label>
                  <input
                    type="text"
                    value={referenceCodeInput}
                    onChange={(e) => setReferenceCodeInput(e.target.value)}
                    placeholder="e.g. TB948194829"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Expense Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Receipt number, breakdown, or approval memo..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-xs outline-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
                >
                  Save &amp; Record Expense
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
