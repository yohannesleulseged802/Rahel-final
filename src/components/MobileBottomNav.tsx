import React, { useState } from 'react';
import { 
  Home, 
  ShoppingBag, 
  Truck, 
  Package, 
  Layers, 
  Printer, 
  BarChart3, 
  QrCode, 
  Settings as SettingsIcon,
  Lock,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
  Barcode,
  Wallet,
  BookOpen
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { TabType } from '../types';

export const MobileBottomNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    lockTerminal, 
    logout, 
    setIsAuthModalOpen,
    openScanner,
    isCloudConnected
  } = usePOS();

  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Primary 4 operational tabs + 1 "More" hub for mobile bottom bar
  const primaryTabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
    { id: 'purchase', label: 'Purchase', icon: Truck },
    { id: 'inventory', label: 'Inventory', icon: Package },
  ];

  // Secondary destinations for the "More" bottom sheet
  const secondaryTabs = [
    { 
      id: 'services' as TabType, 
      label: 'Services Atelier', 
      desc: 'Job costing, printing, binding & copy services', 
      icon: Printer 
    },
    { 
      id: 'expenses' as TabType, 
      label: 'Other Expenses', 
      desc: 'Fuel, Rent & Salary via Telebirr & Banks', 
      icon: Wallet 
    },
    { 
      id: 'credit_ledger' as TabType, 
      label: 'Credit Ledger', 
      desc: 'Customer credit debt, receivables & repayments', 
      icon: BookOpen 
    },
    { 
      id: 'reports' as TabType, 
      label: 'Reports & Analytics', 
      desc: 'Profit & loss, sales ledgers & PDF export', 
      icon: BarChart3 
    },
    { 
      id: 'labels' as TabType, 
      label: 'Label Studio', 
      desc: 'Barcode & QR thermal price tags', 
      icon: QrCode 
    },
    { 
      id: 'settings' as TabType, 
      label: 'Store Settings', 
      desc: 'Ethiopian VAT, receipts & system configuration', 
      icon: SettingsIcon 
    },
  ];

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setIsMoreDrawerOpen(false);
  };

  const isSecondaryActive = secondaryTabs.some(t => t.id === activeTab);

  return (
    <>
      {/* 
        ========================================================================
        MOBILE BOTTOM TAB BAR (Pattern 1 & Hoober's Law of the Thumb)
        Visible only on mobile / small screens (< md: 768px).
        Fixed in the natural thumb zone with >= 48px touch targets.
        ========================================================================
      */}
      <nav 
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-amber-500/25 md:hidden select-none"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="grid grid-cols-5 items-center h-15 max-w-lg mx-auto px-1">
          {primaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`flex flex-col items-center justify-center min-h-[48px] w-full py-1 px-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
                  isActive 
                    ? 'text-amber-400 font-bold' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-amber-400' : 'text-neutral-400'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-1 leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 5th Tab: "More" Hub */}
          <button
            type="button"
            onClick={() => setIsMoreDrawerOpen(true)}
            className={`flex flex-col items-center justify-center min-h-[48px] w-full py-1 px-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isSecondaryActive || isMoreDrawerOpen
                ? 'text-amber-400 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <Layers className={`w-5 h-5 transition-transform ${isSecondaryActive || isMoreDrawerOpen ? 'scale-110 text-amber-400' : 'text-neutral-400'}`} />
              {isSecondaryActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1 leading-tight">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* 
        ========================================================================
        MOBILE "MORE" ACTION DRAWER / BOTTOM SHEET (Pattern 3 & Fitts's Law)
        Slides up into the Natural Reach Zone with full touch targets >= 48px.
        ========================================================================
      */}
      {isMoreDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsMoreDrawerOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-Up Bottom Sheet */}
          <div 
            className="relative z-10 w-full bg-neutral-900 border-t border-amber-500/30 rounded-t-3xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250 select-none"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Drag Handle Bar Affordance */}
            <div className="w-12 h-1.5 bg-neutral-700 hover:bg-neutral-600 rounded-full mx-auto mb-4" />

            {/* Header with Title & Close */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">Workstation Hub</h3>
                  <p className="text-[11px] text-neutral-400">All tools &amp; operator options</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreDrawerOpen(false)}
                className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Secondary Modules List */}
            <div className="space-y-1.5 mb-4">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block px-1 mb-1">
                Store Modules
              </span>
              {secondaryTabs.map((item) => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between min-h-[52px] cursor-pointer active:scale-[0.99] transition-all ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-400/80 text-neutral-100 shadow-xs shadow-amber-400/10'
                        : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCurrent ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-850 text-amber-400'
                      }`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="text-xs font-bold text-neutral-100 truncate">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Quick Operator Actions */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-800">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block px-1 mb-1">
                Workstation Controls
              </span>
              
              {/* Scan Barcode shortcut */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreDrawerOpen(false);
                  openScanner('lookup');
                }}
                className="w-full p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 hover:border-amber-500/40 text-left flex items-center justify-between min-h-[50px] cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Barcode className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-100">Quick Barcode Scanner</div>
                    <div className="text-[11px] text-neutral-400">Scan product tag with camera</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </button>

              {/* Operator Profile modal */}
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 hover:border-amber-500/40 text-left flex items-center justify-between min-h-[50px] cursor-pointer active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-black text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-100">{currentUser.name}</div>
                      <div className="text-[11px] text-amber-400 capitalize">{currentUser.role} · Switch profile</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </button>
              )}

              {/* Lock & Logout Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    lockTerminal();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all min-h-[44px]"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Terminal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    logout();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/40 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all min-h-[44px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
