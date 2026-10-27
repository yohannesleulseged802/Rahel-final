import React, { useState } from 'react';
import { 
  Home,
  ShoppingBag,
  Truck,
  Printer, 
  Package, 
  BarChart3, 
  Lock, 
  User as UserIcon,
  RotateCcw,
  QrCode,
  Check,
  LogOut,
  Barcode,
  Cloud,
  Settings as SettingsIcon,
  Calendar,
  AlertTriangle,
  X,
  Trash2,
  Wallet
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { RahelLogo } from './RahelLogo';

interface HeaderProps {}

export const Header: React.FC<HeaderProps> = () => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    setIsAuthModalOpen, 
    resetAllData,
    resetYearlyData,
    fullResetWithUserRemoval,
    showToast,
    lockTerminal,
    logout,
    openScanner,
    isCloudConnected
  } = usePOS();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmMode, setResetConfirmMode] = useState<'yearly' | 'full' | null>(null);
  const [resetInput, setResetInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const navItems = [
    { id: 'home' as const, label: 'Home', fullLabel: 'Executive Home & Command Overview', icon: Home },
    { id: 'sales' as const, label: 'Sales', fullLabel: 'Record Sales & Deduct Stock', icon: ShoppingBag },
    { id: 'purchase' as const, label: 'Purchase', fullLabel: 'Record Purchases & Add Stock', icon: Truck },
    { id: 'inventory' as const, label: 'Inventory', fullLabel: 'Inventory Catalog & Stock Records', icon: Package },
    { id: 'services' as const, label: 'Services', fullLabel: 'Services Desk & Job Costing', icon: Printer },
    { id: 'expenses' as const, label: 'Other Expenses', fullLabel: 'Other Expenses (Fuel, Rent, Salary via Telebirr)', icon: Wallet },
    { id: 'reports' as const, label: 'Reports', fullLabel: 'Business Reports & PO Analysis', icon: BarChart3 },
    { id: 'labels' as const, label: 'Labels', fullLabel: 'Barcode & QR Label Studio', icon: QrCode },
    { id: 'settings' as const, label: 'Settings', fullLabel: 'Store & Terminal Settings', icon: SettingsIcon },
  ];


  return (
    <header className="bg-neutral-950/95 border-b border-amber-500/20 select-none sticky top-0 z-40 shadow-md backdrop-blur-md w-full">
      {/* Compact Top Bar: 3 Zones with balanced, streamlined spacing */}
      <div className="w-full px-2 sm:px-3 lg:px-4 h-11 sm:h-12 flex items-center justify-between gap-1 sm:gap-2">
        
        {/* Zone 1: Rahel Logo & Brand Wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          title="Return to Home Command Center"
          className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-left cursor-pointer group focus:outline-none"
        >
          <RahelLogo size={26} />
          <div className="flex items-baseline gap-1">
            <span className="text-xs sm:text-sm font-bold tracking-tight text-neutral-100 group-hover:text-amber-200 transition-colors whitespace-nowrap leading-tight">
              Rahel Stationary
            </span>
            <span className="text-amber-400 font-serif italic text-[10px] hidden sm:inline">
              POS
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Tabs - Compact segmented nav on desktop/tablet, hidden on mobile in favor of bottom nav */}
        <nav 
          aria-label="Desktop Navigation"
          className="hidden md:flex items-center gap-0.5 sm:gap-1 p-0.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 shrink-0 overflow-x-auto no-scrollbar"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                title={item.fullLabel}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-1.5 sm:px-2 md:px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-neutral-800 text-amber-300 font-semibold border border-amber-500/40 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                <span className="leading-none">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Cashier Profile - touch target optimized */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* Quick Universal Barcode / QR Scanner Button - 44px touch target on mobile */}
          <button
            type="button"
            onClick={() => openScanner('lookup')}
            title="Scan Barcode or QR Code with camera or laser wand"
            className="min-h-[40px] px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Barcode className="w-4 h-4 text-neutral-950 shrink-0" />
            <span className="font-bold">Scan</span>
          </button>

          {/* User profile & Workstation Controls */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Profile Pill */}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 min-h-[40px] rounded-xl border border-neutral-800 hover:border-amber-500/40 bg-neutral-900 hover:bg-neutral-850 transition-colors cursor-pointer active:scale-95"
                title={`${currentUser.name} (${currentUser.role})`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center text-[10px] font-black shadow-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden lg:block leading-none">
                  <div className="text-[11px] font-semibold text-neutral-200 truncate max-w-[64px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                </div>
              </button>

              {/* Lock Workstation Button */}
              <button
                onClick={lockTerminal}
                className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-neutral-800 hover:border-amber-500/40 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer shrink-0 flex items-center justify-center active:scale-95"
                title="Lock Workstation (password required to resume)"
              >
                <Lock className="w-4 h-4" />
              </button>

              {/* Sign Out of Device Button */}
              <button
                onClick={logout}
                className="hidden sm:flex min-h-[40px] min-w-[40px] p-2 rounded-xl border border-neutral-800 hover:border-rose-500/40 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0 items-center justify-center active:scale-95"
                title="Sign Out of this device"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => lockTerminal()}
              className="px-2 py-1 text-[11px] font-semibold text-neutral-950 bg-gradient-to-r from-amber-300 to-amber-500 rounded-md flex items-center gap-1 cursor-pointer shrink-0 shadow-xs shadow-amber-500/20"
            >
              <UserIcon className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          )}

          {/* Reset Options Button */}
          <button
            type="button"
            onClick={() => {
              setIsResetModalOpen(true);
              setResetConfirmMode(null);
              setResetInput('');
            }}
            title="System Reset: 'Yearly' or 'Full reset with user removal'"
            className="px-2 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 hover:border-amber-500/50 text-neutral-300 hover:text-amber-300 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

      </div>

      {/* Reset Options Modal ("Yearly" & "Full reset with user removal") */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-auto animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 text-neutral-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-100">Store &amp; System Reset Options</h3>
                  <p className="text-xs text-neutral-400">Choose the type of reset to perform</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetConfirmMode(null);
                  setResetInput('');
                }}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Choose Reset Type */}
            {resetConfirmMode === null && (
              <div className="space-y-3.5">
                {/* 1. Yearly Reset Card */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-100 flex items-center gap-2">
                          <span>Yearly Reset</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 font-semibold">
                            Fiscal Year-End
                          </span>
                        </h4>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                          Clears all sales transactions, purchase orders, drawer shift histories, and held tickets for the closed fiscal year.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
                    <Check className="w-3 h-3 shrink-0" />
                    <span>Preserves all inventory products, current stock levels, user logins, and store settings.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResetConfirmMode('yearly');
                      setResetInput('');
                    }}
                    className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Select "Yearly" Reset
                  </button>
                </div>

                {/* 2. Full Reset with User Removal Card */}
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 hover:border-rose-500/60 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-rose-200 flex items-center gap-2">
                          <span>Full reset with user removal</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 font-semibold">
                            Factory Wipe
                          </span>
                        </h4>
                        <p className="text-[11px] text-rose-300/80 mt-1 leading-relaxed">
                          Complete factory system wipe. Clears all transactions, resets custom catalog and settings, and <strong>removes all user accounts</strong> &amp; active device sessions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-rose-300 bg-rose-950/40 border border-rose-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3 h-3 shrink-0 text-rose-400" />
                    <span>Forces logout immediately and restores initial pristine administrator credentials.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResetConfirmMode('full');
                      setResetInput('');
                    }}
                    className="w-full py-2 px-3 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Select "Full reset with user removal"
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Confirm Yearly Reset */}
            {resetConfirmMode === 'yearly' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Confirm "Yearly" Reset</span>
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    This will clear all sales receipts, purchase orders, drawer shifts, and held tickets to start a fresh financial year.
                  </p>
                  <ul className="text-[11px] text-neutral-400 space-y-1 pt-1 list-disc list-inside">
                    <li><strong className="text-emerald-400">Kept:</strong> All product items, current inventory stock quantities, and prices</li>
                    <li><strong className="text-emerald-400">Kept:</strong> All staff/operator accounts, passwords, and PINs</li>
                    <li><strong className="text-rose-400">Cleared:</strong> Sales history, purchase logs, shift register reports</li>
                  </ul>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetConfirmMode(null)}
                    className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={async () => {
                      setIsResetting(true);
                      try {
                        await resetYearlyData();
                        setIsResetModalOpen(false);
                        setResetConfirmMode(null);
                      } finally {
                        setIsResetting(false);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    {isResetting ? 'Running Reset...' : 'Yes, Run Yearly Reset'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Confirm Full reset with user removal */}
            {resetConfirmMode === 'full' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2">
                  <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Confirm "Full reset with user removal"</span>
                  </h4>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    This is a destructive total factory wipe. All sales, purchases, custom inventory products, and <strong>all user accounts &amp; login sessions will be removed</strong>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400">
                    Type <strong className="text-rose-400 font-mono">RESET</strong> to confirm full factory wipe:
                  </label>
                  <input
                    type="text"
                    value={resetInput}
                    onChange={e => setResetInput(e.target.value)}
                    placeholder="RESET"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 font-mono text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => {
                      setResetConfirmMode(null);
                      setResetInput('');
                    }}
                    className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={resetInput.trim().toUpperCase() !== 'RESET' || isResetting}
                    onClick={async () => {
                      setIsResetting(true);
                      try {
                        await fullResetWithUserRemoval();
                        setIsResetModalOpen(false);
                        setResetConfirmMode(null);
                        setResetInput('');
                      } finally {
                        setIsResetting(false);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-rose-600/30"
                  >
                    {isResetting ? 'Wiping Database...' : 'Yes, Full Reset with User Removal'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
