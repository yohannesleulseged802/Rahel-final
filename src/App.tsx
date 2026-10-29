/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { SalesManager } from './components/SalesManager';
import { PurchaseManager } from './components/PurchaseManager';
import { ServicesDesk } from './components/ServicesDesk';
import { InventoryManager } from './components/InventoryManager';
import { OtherExpensesManager } from './components/OtherExpensesManager';
import { CreditLedgerManager } from './components/CreditLedgerManager';
import { ReportsDashboard } from './components/ReportsDashboard';
import { LabelStudio } from './components/LabelStudio';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CheckCircle2, Clock } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    activeTab, 
    isAuthModalOpen, 
    setIsAuthModalOpen,
    toastMessage,
    currentUser,
    showInactivityWarning,
    inactivitySecondsLeft,
    staySignedIn,
    lockTerminal,
    isScannerOpen,
    closeScanner,
    scannerTarget
  } = usePOS();

  // Insist on Login: If user is not authenticated on this device or session, show dedicated full-screen LoginPage
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
        <LoginPage />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-neutral-900 border border-amber-500/40 text-neutral-100 text-xs sm:text-sm shadow-xl shadow-amber-500/10 transition-all">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Header */}
      <Header />

      {/* Main Viewport Workspace - with pb-24 on mobile so bottom bar does not clip content */}
      <main className="flex-1 pb-24 md:pb-12">
        {activeTab === 'home' && (
          <HomeDashboard />
        )}

        {activeTab === 'sales' && (
          <SalesManager />
        )}

        {activeTab === 'purchase' && (
          <PurchaseManager />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager />
        )}

        {activeTab === 'services' && (
          <ServicesDesk />
        )}

        {activeTab === 'expenses' && (
          <OtherExpensesManager />
        )}

        {activeTab === 'credit_ledger' && (
          <CreditLedgerManager />
        )}

        {activeTab === 'labels' && (
          <LabelStudio />
        )}

        {activeTab === 'reports' && (
          <ReportsDashboard />
        )}

        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar (Fitts's Law & Hoober's Law of the Thumb) */}
      <MobileBottomNav />

      {/* Security & Operator Modal */}
      <LoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Universal Barcode & QR Code Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={closeScanner}
        target={scannerTarget}
      />

      {/* Session Inactivity Auto-Lock Warning Modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-amber-500/60 rounded-2xl p-6 max-w-sm w-full text-neutral-100 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-100">Session Expiring Soon</h3>
                <p className="text-xs text-neutral-400">Inactivity detected</p>
              </div>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              To protect workstation register transactions, your session will automatically lock in{' '}
              <strong className="text-amber-400 font-mono text-sm">{inactivitySecondsLeft}</strong> seconds.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={lockTerminal}
                className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Lock Terminal
              </button>
              <button
                type="button"
                onClick={staySignedIn}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-amber-500/20"
              >
                Stay Signed In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Notification Pill in Black & Gold */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-amber-300 px-4 py-2.5 rounded-xl shadow-xl shadow-black/60 border border-amber-500/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <MainLayout />
    </POSProvider>
  );
}
