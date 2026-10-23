import React, { useState } from 'react';
import { 
  Store, 
  Receipt, 
  Percent, 
  Package, 
  ShieldCheck, 
  Database, 
  Save, 
  Check, 
  RotateCcw, 
  Download, 
  Upload, 
  Lock, 
  Key, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  HelpCircle,
  FileText,
  Printer,
  Smartphone,
  CheckCircle2,
  Cloud,
  Leaf,
  Calendar,
  Trash2,
  Users,
  UserPlus,
  ShieldAlert
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { StoreSettings, User } from '../types';
import { RahelLogo } from './RahelLogo';
import { generateSaleReceiptPDF } from '../utils/pdfExport';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    currentUser, 
    users,
    updateUserPin, 
    updateUserPassword, 
    updateMasterPasscode,
    deleteUserAccount,
    removeAllUsers,
    generateRandomPassword,
    resetAllData,
    resetYearlyData,
    fullResetWithUserRemoval,
    importDatabaseBackup,
    products,
    transactions,
    purchases,
    isCloudConnected,
    showToast
  } = usePOS();

  // Active navigation tab within Settings
  const [activeSettingsSection, setActiveSettingsSection] = useState<
    'store' | 'tax' | 'receipt' | 'inventory' | 'security' | 'database' | 'reset'
  >('store');

  // Local draft state for settings inputs
  const [formData, setFormData] = useState<StoreSettings>({
    ...settings,
    currencySymbol: 'ETB',
    taxRate: settings.taxRate ?? 0.15,
    taxEnabled: settings.taxEnabled ?? true,
    tinNumber: settings.tinNumber ?? '0048291048-TIN',
    receiptHeader: settings.receiptHeader ?? 'Official Sales Receipt & Invoice',
    receiptPaperSize: settings.receiptPaperSize ?? '80mm',
    autoPrintReceipt: settings.autoPrintReceipt ?? true,
    showCashierOnReceipt: settings.showCashierOnReceipt ?? true,
    showTinOnReceipt: settings.showTinOnReceipt ?? true,
    negativeStockAllowed: settings.negativeStockAllowed ?? false,
    defaultMarkupPercent: settings.defaultMarkupPercent ?? 40,
    barcodeFormat: settings.barcodeFormat ?? 'CODE128',
    inactivityTimeoutMinutes: settings.inactivityTimeoutMinutes ?? 10,
    requirePinForRefund: settings.requirePinForRefund ?? true,
    soundEffects: settings.soundEffects ?? true,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security credentials state
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  // Master Registration Passcode state
  const [masterPasscodeInput, setMasterPasscodeInput] = useState('');
  const [showMasterPasscode, setShowMasterPasscode] = useState(false);
  const [masterPasscodeMessage, setMasterPasscodeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPasscode, setIsUpdatingPasscode] = useState(false);

  // Reset confirmation modal state ("Yearly" & "Full reset with user removal")
  const [resetModalType, setResetModalType] = useState<'yearly' | 'full' | null>(null);
  const [resetInputMatch, setResetInputMatch] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Backup restore file state
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Track changes
  const handleInputChange = <K extends keyof StoreSettings>(field: K, value: StoreSettings[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  // Save changes to POSContext and Cloud Firestore
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings({
      ...formData,
      currencySymbol: 'ETB'
    });
    setHasUnsavedChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Quick sound tester using Web Audio API synthesizer
  const playSoundSample = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      showToast('Played sound effect sample.');
    } catch (e) {
      showToast('Audio preview unavailable.');
    }
  };

  // Change Operator PIN
  const handleUpdatePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(newPin)) {
      setPinMessage('PIN must be 4 to 6 numeric digits.');
      return;
    }
    const success = await updateUserPin(newPin);
    if (success) {
      setPinMessage('Operator PIN updated successfully.');
      setNewPin('');
      setTimeout(() => setPinMessage(null), 3500);
    } else {
      setPinMessage('Failed to update PIN.');
    }
  };

  // Change Operator Password
  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters.');
      return;
    }
    const success = await updateUserPassword(newPassword);
    if (success) {
      setPasswordMessage('Operator password updated successfully.');
      setNewPassword('');
      setTimeout(() => setPasswordMessage(null), 3500);
    } else {
      setPasswordMessage('Failed to update password.');
    }
  };

  // Generate a random strong password
  const handleGeneratePassword = () => {
    const generated = generateRandomPassword();
    setNewPassword(generated);
    setShowPassword(true);
  };

  // Master Passcode updates (Changeable by admins/managers)
  const handleUpdateMasterPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPasscodeInput.trim() || masterPasscodeInput.trim().length < 4) {
      setMasterPasscodeMessage({ type: 'error', text: 'Master passcode must be at least 4 characters long.' });
      return;
    }
    setIsUpdatingPasscode(true);
    const res = await updateMasterPasscode(masterPasscodeInput.trim());
    setIsUpdatingPasscode(false);
    if (res.success) {
      setMasterPasscodeMessage({ type: 'success', text: 'Master passcode successfully updated.' });
      setMasterPasscodeInput('');
      setTimeout(() => setMasterPasscodeMessage(null), 4000);
    } else {
      setMasterPasscodeMessage({ type: 'error', text: res.error || 'Failed to update master passcode.' });
    }
  };

  const handleResetMasterPasscodeDefault = async () => {
    setIsUpdatingPasscode(true);
    const res = await updateMasterPasscode('RahelF1234');
    setIsUpdatingPasscode(false);
    if (res.success) {
      setMasterPasscodeMessage({ type: 'success', text: 'Master passcode reset to factory default.' });
      setTimeout(() => setMasterPasscodeMessage(null), 4000);
    } else {
      setMasterPasscodeMessage({ type: 'error', text: res.error || 'Failed to reset master passcode.' });
    }
  };

  // Export JSON Database Backup
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      storeName: formData.storeName,
      currency: 'ETB',
      settings: formData,
      productsCount: products.length,
      transactionsCount: transactions.length,
      purchasesCount: purchases.length,
      products,
      transactions,
      purchases
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `rahel_stationary_backup_${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`Exported full backup (${filename}).`);
  };

  // Import JSON Database Backup
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json || typeof json !== 'object') {
          setImportStatus('Invalid JSON backup file.');
          return;
        }

        const success = importDatabaseBackup(json);
        if (success) {
          setImportStatus('Backup loaded successfully! Refreshing local configuration...');
          if (json.settings) {
            setFormData({
              ...json.settings,
              currencySymbol: 'ETB'
            });
          }
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('Failed to restore backup structure.');
        }
      } catch (err) {
        setImportStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  // Handle Confirmed Resets
  const handleConfirmYearlyReset = async () => {
    setIsResetting(true);
    try {
      await resetYearlyData();
      setResetModalType(null);
      setResetInputMatch('');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmFullReset = async () => {
    if (resetInputMatch.trim().toUpperCase() !== 'RESET') {
      showToast('Type RESET in uppercase to confirm.');
      return;
    }
    setIsResetting(true);
    try {
      await fullResetWithUserRemoval();
      setResetModalType(null);
      setResetInputMatch('');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
              Store &amp; Terminal Settings
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ETB
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Configure store identity, Ethiopian Birr financial rules, thermal receipts, inventory thresholds &amp; cloud sync.
            </p>
          </div>
        </div>

        {/* Global Save Button & Unsaved Pill */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {hasUnsavedChanges && (
            <span className="text-xs font-semibold text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 rounded-lg animate-pulse">
              Unsaved changes
            </span>
          )}
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
          <button
            type="button"
            onClick={() => setActiveSettingsSection('reset')}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 hover:border-amber-500/50 text-neutral-300 hover:text-amber-300 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Options</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Tabs Sidebar & Right Active Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1.5">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            <button
              type="button"
              onClick={() => setActiveSettingsSection('store')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left whitespace-nowrap cursor-pointer w-full ${
                activeSettingsSection === 'store'
                  ? 'bg-neutral-900 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <Store className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Store Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSettingsSection('tax')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left whitespace-nowrap cursor-pointer w-full ${
                activeSettingsSection === 'tax'
                  ? 'bg-neutral-900 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <Percent className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Tax &amp; VAT Rules</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSettingsSection('receipt')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left whitespace-nowrap cursor-pointer w-full ${
                activeSettingsSection === 'receipt'
                  ? 'bg-neutral-900 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Receipt &amp; Printing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSettingsSection('inventory')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left whitespace-nowrap cursor-pointer w-full ${
                activeSettingsSection === 'inventory'
                  ? 'bg-neutral-900 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <Package className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Inventory Policies</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSettingsSection('security')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left whitespace-nowrap cursor-pointer w-full ${
                activeSettingsSection === 'security'
                  ? 'bg-neutral-900 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Security &amp; Staff</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSettingsSection('database')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left whitespace-nowrap cursor-pointer w-full ${
                activeSettingsSection === 'database'
                  ? 'bg-neutral-900 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <Database className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Cloud &amp; Backup</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSettingsSection('reset')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left whitespace-nowrap cursor-pointer w-full ${
                activeSettingsSection === 'reset'
                  ? 'bg-neutral-900 text-rose-300 border border-rose-500/50 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">Store Reset Center</span>
            </button>
          </nav>

          {/* Quick Info Box */}
          <div className="hidden lg:block p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-2.5 mt-4">
            <div className="flex items-center gap-2 text-neutral-300 font-semibold">
              <Cloud className="w-4 h-4 text-amber-400" />
              <span>Live Cloud Sync</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              All settings are synced automatically with Google Cloud Firestore and will reflect immediately across all counter workstations.
            </p>
            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Currency:</span>
              <span className="font-mono font-bold text-amber-300">ETB (Permanent)</span>
            </div>
          </div>
        </div>

        {/* Section Content Area */}
        <div className="lg:col-span-3 space-y-6">

          {/* SECTION 1: STORE PROFILE */}
          {activeSettingsSection === 'store' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-5">
                <div className="border-b border-neutral-800 pb-3">
                  <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-400" />
                    Store Profile &amp; Business Information
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    This information appears on customer receipts, PDF reports, and supplier purchase orders.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Store Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Store / Business Name *
                    </label>
                    <input
                      type="text"
                      value={formData.storeName}
                      onChange={e => handleInputChange('storeName', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="e.g. Rahel Stationary & Print Services"
                      required
                    />
                  </div>

                  {/* Tagline */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Tagline / Business Subtitle
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={e => handleInputChange('tagline', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="e.g. Fine Papers, Office Supplies & Document Finishing Bureau"
                    />
                  </div>

                  {/* Physical Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Store Physical Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={e => handleInputChange('address', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="e.g. 142 Merchant Street, City Center, Addis Ababa, Ethiopia"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Contact Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="+251 911 382 749"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Business Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="contact@rahelstationary.site"
                    />
                  </div>

                  {/* Tax Identification Number (TIN) */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      TIN / VAT Registration Number
                    </label>
                    <input
                      type="text"
                      value={formData.tinNumber || ''}
                      onChange={e => handleInputChange('tinNumber', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="0048291048-TIN"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Printed on customer receipts for Ethiopian tax compliance.
                    </span>
                  </div>

                  {/* Currency (Locked) */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Default Currency
                    </label>
                    <div className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-amber-500/40 text-amber-300 text-sm font-mono font-bold flex items-center justify-between">
                      <span>ETB (Ethiopian Birr)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase tracking-wider font-sans font-semibold">
                        Permanent
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      System currency locked to ETB across all registers, catalogs, and PDFs.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: TAX & PAYMENT RULES */}
          {activeSettingsSection === 'tax' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-5">
                <div className="border-b border-neutral-800 pb-3">
                  <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-400" />
                    Taxation &amp; VAT Configuration
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure sales tax, VAT calculation percentages, and pricing display rules.
                  </p>
                </div>

                {/* Tax Enabled Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div>
                    <span className="text-sm font-semibold text-neutral-200 block">
                      Enable Value Added Tax (VAT) Calculation
                    </span>
                    <span className="text-xs text-neutral-400">
                      When enabled, tax is automatically calculated on taxable stationery and service items.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.taxEnabled !== false}
                      onChange={e => handleInputChange('taxEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-200 after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Tax Rate Percentage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Standard VAT Rate Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={((formData.taxRate || 0.15) * 100).toFixed(1)}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          handleInputChange('taxRate', val / 100);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors pr-10"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-neutral-400 font-mono">
                        %
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-neutral-500">Presets:</span>
                      <button
                        type="button"
                        onClick={() => handleInputChange('taxRate', 0.15)}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-800 hover:bg-neutral-750 text-amber-300 border border-neutral-700 cursor-pointer"
                      >
                        15% (Ethiopia VAT)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('taxRate', 0.10)}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 cursor-pointer"
                      >
                        10%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('taxRate', 0)}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 cursor-pointer"
                      >
                        0% (Exempt)
                      </button>
                    </div>
                  </div>

                  {/* Live Simulation Card */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Live Tax Simulation (100.00 ETB Item)
                    </span>
                    <div className="space-y-1 pt-2 font-mono text-xs">
                      <div className="flex justify-between text-neutral-400">
                        <span>Item Subtotal:</span>
                        <span>ETB 100.00</span>
                      </div>
                      <div className="flex justify-between text-amber-400">
                        <span>VAT ({((formData.taxRate || 0.15) * 100).toFixed(1)}%):</span>
                        <span>ETB {(100 * (formData.taxRate || 0.15)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-neutral-100 pt-1 border-t border-neutral-800">
                        <span>Total Customer Due:</span>
                        <span>ETB {(100 * (1 + (formData.taxRate || 0.15))).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Inclusive / Exclusive Option */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <span className="text-xs font-semibold text-neutral-300 block">
                    Tax Treatment on Shelf Prices
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                      !formData.taxIncludedInPrice 
                        ? 'bg-neutral-900 border-amber-500/50 text-amber-300' 
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}>
                      <input
                        type="radio"
                        name="taxIncludedInPrice"
                        checked={!formData.taxIncludedInPrice}
                        onChange={() => handleInputChange('taxIncludedInPrice', false)}
                        className="mt-0.5 text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="text-xs font-bold block text-neutral-200">Exclusive (Added at register)</span>
                        <span className="text-[11px] text-neutral-400">Shelf price is net; VAT is calculated and added during checkout.</span>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                      formData.taxIncludedInPrice 
                        ? 'bg-neutral-900 border-amber-500/50 text-amber-300' 
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}>
                      <input
                        type="radio"
                        name="taxIncludedInPrice"
                        checked={!!formData.taxIncludedInPrice}
                        onChange={() => handleInputChange('taxIncludedInPrice', true)}
                        className="mt-0.5 text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="text-xs font-bold block text-neutral-200">Inclusive (Included in price)</span>
                        <span className="text-[11px] text-neutral-400">Shelf price already includes VAT; receipt breaks out the tax amount.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: RECEIPT & PRINTING */}
          {activeSettingsSection === 'receipt' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                
                {/* Receipt Controls */}
                <div className="xl:col-span-3 p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-5">
                  <div className="border-b border-neutral-800 pb-3">
                    <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      Receipt Format &amp; Printer Preferences
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Tailor the thermal receipt slip header, footer notes, paper width, and auto-print triggers.
                    </p>
                  </div>

                  {/* Receipt Header Note */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Receipt Title / Header
                    </label>
                    <input
                      type="text"
                      value={formData.receiptHeader || ''}
                      onChange={e => handleInputChange('receiptHeader', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="e.g. Official Sales Receipt & Invoice"
                    />
                  </div>

                  {/* Receipt Footer Message */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Receipt Footer Customer Thank-You Note
                    </label>
                    <textarea
                      rows={3}
                      value={formData.receiptFooterMessage}
                      onChange={e => handleInputChange('receiptFooterMessage', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
                      placeholder="e.g. Thank you for choosing Rahel Stationary! Please come again."
                    />
                  </div>

                  {/* Paper Width Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Target Receipt Paper Width
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: '80mm', label: '80mm Thermal', desc: 'Standard POS Roll' },
                        { id: '58mm', label: '58mm Thermal', desc: 'Compact Mobile' },
                        { id: 'A4', label: 'A4 Sheet', desc: 'Formal Invoice' },
                      ].map(paper => (
                        <button
                          key={paper.id}
                          type="button"
                          onClick={() => handleInputChange('receiptPaperSize', paper.id as any)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            formData.receiptPaperSize === paper.id
                              ? 'bg-neutral-900 border-amber-500/50 text-amber-300 shadow-xs'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <span className="text-xs font-bold block">{paper.label}</span>
                          <span className="text-[10px] text-neutral-500">{paper.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Print Behavior Toggles */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                      <span className="text-neutral-200">Auto-prompt print receipt upon completing checkout</span>
                      <input
                        type="checkbox"
                        checked={formData.autoPrintReceipt !== false}
                        onChange={e => handleInputChange('autoPrintReceipt', e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                      <span className="text-neutral-200">Show Cashier / Operator Name on receipt</span>
                      <input
                        type="checkbox"
                        checked={formData.showCashierOnReceipt !== false}
                        onChange={e => handleInputChange('showCashierOnReceipt', e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                      <span className="text-neutral-200">Show TIN / Tax Registration on receipt header</span>
                      <input
                        type="checkbox"
                        checked={formData.showTinOnReceipt !== false}
                        onChange={e => handleInputChange('showTinOnReceipt', e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* "No Receipt" Paperless Policy Configuration */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                          <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                          Enable "No Receipt" Option on Checkout Desk
                        </span>
                        <span className="text-[11px] text-neutral-400 block mt-0.5">
                          Allows cashiers to quickly complete transactions without printing when customer declines paper receipt.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.allowNoReceiptOption !== false}
                        onChange={e => handleInputChange('allowNoReceiptOption', e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 border-t border-neutral-900">
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Default Receipt Choice for New Sales
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleInputChange('defaultReceiptOption', 'print')}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            formData.defaultReceiptOption !== 'no_receipt' || formData.allowNoReceiptOption === false
                              ? 'bg-neutral-900 border-amber-500/50 text-amber-300 shadow-xs'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <Printer className="w-3.5 h-3.5" />
                            Issue Receipt by Default
                          </span>
                          <span className="text-[10px] text-neutral-500 block mt-0.5">
                            Cashier prints receipt unless customer requests otherwise.
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={formData.allowNoReceiptOption === false}
                          onClick={() => handleInputChange('defaultReceiptOption', 'no_receipt')}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            formData.allowNoReceiptOption === false
                              ? 'opacity-40 cursor-not-allowed bg-neutral-950 border-neutral-900 text-neutral-600'
                              : formData.defaultReceiptOption === 'no_receipt'
                              ? 'bg-neutral-900 border-emerald-500/50 text-emerald-300 shadow-xs cursor-pointer'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 cursor-pointer'
                          }`}
                        >
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                            No Receipt by Default (Eco)
                          </span>
                          <span className="text-[10px] text-neutral-500 block mt-0.5">
                            {formData.allowNoReceiptOption === false
                              ? 'Enable "No Receipt" option above first to set as default.'
                              : 'Paperless mode; receipt only generated if requested.'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Thermal Receipt Preview */}
                <div className="xl:col-span-2 p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col items-center">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3 flex items-center gap-1.5 self-start">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    Live Receipt Slip Preview
                  </span>

                  {/* Thermal Paper Simulation */}
                  <div className="w-full max-w-[280px] bg-neutral-100 text-neutral-900 p-4 rounded-md shadow-2xl font-mono text-[11px] leading-tight select-none border-t-4 border-amber-500">
                    <div className="text-center space-y-1 border-b border-dashed border-neutral-400 pb-2.5">
                      <div className="font-bold text-xs uppercase tracking-tight">
                        {formData.storeName || 'RAHEL STATIONARY'}
                      </div>
                      <div className="text-[10px] text-neutral-600">
                        {formData.address || 'Addis Ababa, Ethiopia'}
                      </div>
                      <div className="text-[10px] text-neutral-600">
                        Tel: {formData.phone || '+251 911 382 749'}
                      </div>
                      {formData.showTinOnReceipt && formData.tinNumber && (
                        <div className="text-[10px] font-semibold text-neutral-700">
                          TIN: {formData.tinNumber}
                        </div>
                      )}
                      <div className="text-[9px] uppercase tracking-wider text-neutral-500 pt-1">
                        {formData.receiptHeader || 'OFFICIAL CASH RECEIPT'}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="py-2 text-[10px] text-neutral-600 border-b border-dashed border-neutral-400 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Rcpt: #REC-2026-0842</span>
                        <span>10:45 AM</span>
                      </div>
                      {formData.showCashierOnReceipt && (
                        <div>Cashier: {currentUser?.name || 'Rahel Fira'}</div>
                      )}
                    </div>

                    {/* Sample Items */}
                    <div className="py-2 border-b border-dashed border-neutral-400 space-y-1.5">
                      <div className="flex justify-between">
                        <span>1x Rhodia A5 Dot Grid</span>
                        <span className="font-bold">ETB 24.50</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2x Pilot G2 0.7mm Black</span>
                        <span className="font-bold">ETB 37.80</span>
                      </div>
                      <div className="flex justify-between text-neutral-600">
                        <span>1x Color Laser Binding</span>
                        <span className="font-bold">ETB 85.00</span>
                      </div>
                    </div>

                    {/* Totals in ETB */}
                    <div className="py-2 border-b border-neutral-400 space-y-1">
                      <div className="flex justify-between text-neutral-700">
                        <span>Subtotal:</span>
                        <span>ETB 147.30</span>
                      </div>
                      <div className="flex justify-between text-neutral-700">
                        <span>VAT ({((formData.taxRate || 0.15) * 100).toFixed(0)}%):</span>
                        <span>ETB {(147.3 * (formData.taxRate || 0.15)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-xs pt-1 border-t border-neutral-900">
                        <span>TOTAL DUE:</span>
                        <span>ETB {(147.3 * (1 + (formData.taxRate || 0.15))).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 text-center text-[9px] text-neutral-600 leading-normal">
                      <p>{formData.receiptFooterMessage || 'Thank you for your visit!'}</p>
                      <p className="font-bold pt-1 text-neutral-800">*** KEEP THIS RECEIPT ***</p>
                    </div>
                  </div>

                  {/* Sample PDF thermal receipt tester */}
                  <button
                    type="button"
                    onClick={() => {
                      const mockTx: any = {
                        id: 'sample-tx',
                        receiptNumber: 'REC-2026-0842',
                        timestamp: new Date().toISOString(),
                        cashierId: currentUser?.id || 'cashier-1',
                        cashierName: currentUser?.name || 'Rahel Fira',
                        customerName: 'Walk-in Client',
                        items: [
                          { name: 'Rhodia A5 Dot Grid Notebook', quantity: 1, unitPrice: 24.50 },
                          { name: 'Pilot G2 0.7mm Black Gel Pen', quantity: 2, unitPrice: 18.90 },
                          { name: 'Color Laser Document Binding', quantity: 1, unitPrice: 85.00 },
                        ],
                        subtotal: 147.30,
                        discountTotal: 0,
                        taxTotal: Number((147.30 * (formData.taxRate || 0.15)).toFixed(2)),
                        taxRate: formData.taxRate || 0.15,
                        total: Number((147.30 * (1 + (formData.taxRate || 0.15))).toFixed(2)),
                        costTotal: 60.00,
                        grossProfit: 87.30,
                        payment: { method: 'cash' },
                        status: 'completed',
                        shiftId: 'shift-1'
                      };
                      generateSaleReceiptPDF(mockTx, formData);
                      showToast('Sample PDF thermal receipt generated.');
                    }}
                    className="mt-4 w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sample PDF Receipt</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: INVENTORY POLICIES */}
          {activeSettingsSection === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-5">
                <div className="border-b border-neutral-800 pb-3">
                  <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    Inventory &amp; Stock Management Rules
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Define reorder alert thresholds, negative stock handling, and default retail markup margins.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Low Stock Threshold */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Global Low Stock Alert Threshold (Units)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={formData.lowStockThreshold}
                      onChange={e => handleInputChange('lowStockThreshold', parseInt(e.target.value, 10) || 5)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Products with stock under this number trigger red alerts in Home and PO Reorder.
                    </span>
                  </div>

                  {/* Default Markup % */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Suggested Retail Markup Margin (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={formData.defaultMarkupPercent || 40}
                        onChange={e => handleInputChange('defaultMarkupPercent', parseFloat(e.target.value) || 40)}
                        className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors pr-10"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-neutral-400 font-mono">
                        %
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Automatically calculates suggested selling price when logging purchase invoices.
                    </span>
                  </div>
                </div>

                {/* Negative Stock Policy */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <span className="text-xs font-semibold text-neutral-300 block">
                    Zero / Out-of-Stock Sale Policy
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                      !formData.negativeStockAllowed 
                        ? 'bg-neutral-900 border-amber-500/50 text-amber-300' 
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}>
                      <input
                        type="radio"
                        name="negativeStockAllowed"
                        checked={!formData.negativeStockAllowed}
                        onChange={() => handleInputChange('negativeStockAllowed', false)}
                        className="mt-0.5 text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="text-xs font-bold block text-neutral-200">Strict (Prevent 0-stock sales)</span>
                        <span className="text-[11px] text-neutral-400">Cashier cannot add or checkout items that have 0 remaining stock.</span>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                      formData.negativeStockAllowed 
                        ? 'bg-neutral-900 border-amber-500/50 text-amber-300' 
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}>
                      <input
                        type="radio"
                        name="negativeStockAllowed"
                        checked={!!formData.negativeStockAllowed}
                        onChange={() => handleInputChange('negativeStockAllowed', true)}
                        className="mt-0.5 text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="text-xs font-bold block text-neutral-200">Flexible (Allow backorders)</span>
                        <span className="text-[11px] text-neutral-400">Permits sale with a low-stock alert; stock count can decrease below 0.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Barcode Studio Format */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Default Barcode Studio Symbology
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('barcodeFormat', 'CODE128')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        formData.barcodeFormat === 'CODE128'
                          ? 'bg-neutral-900 border-amber-500/50 text-amber-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      <span className="text-xs font-bold block">Code-128 (Recommended)</span>
                      <span className="text-[10px] text-neutral-500">Supports alphanumeric SKUs, stationery tags &amp; fast wand laser scans.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInputChange('barcodeFormat', 'EAN13')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        formData.barcodeFormat === 'EAN13'
                          ? 'bg-neutral-900 border-amber-500/50 text-amber-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      <span className="text-xs font-bold block">EAN-13 (Standard Retail)</span>
                      <span className="text-[10px] text-neutral-500">13-digit retail barcode for standard books and commercial stationery.</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: SECURITY & STAFF */}
          {activeSettingsSection === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Terminal Security Settings */}
              <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-5">
                <div className="border-b border-neutral-800 pb-3">
                  <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    Register Terminal Inactivity &amp; Sound
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Prevent unauthorized register operations with automatic workstation lock.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Auto-Lock Inactivity Timeout */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Auto-Lock Workstation Inactivity Timeout
                    </label>
                    <select
                      value={formData.inactivityTimeoutMinutes ?? 10}
                      onChange={e => handleInputChange('inactivityTimeoutMinutes', parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value={2}>2 Minutes (High Security)</option>
                      <option value={5}>5 Minutes</option>
                      <option value={10}>10 Minutes (Standard)</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={0}>Disabled (Never Auto-Lock)</option>
                    </select>
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Prompts for operator PIN or password after idle period.
                    </span>
                  </div>

                  {/* Sound Effects & Test Button */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Auditory Feedback &amp; Scans
                    </label>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      <div className="flex items-center gap-2">
                        {formData.soundEffects !== false ? (
                          <Volume2 className="w-4 h-4 text-amber-400" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-neutral-500" />
                        )}
                        <span className="text-xs text-neutral-200">Audio scan chimes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={playSoundSample}
                          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-850 hover:bg-neutral-800 text-amber-300 border border-neutral-700 cursor-pointer"
                        >
                          Test Sound
                        </button>
                        <input
                          type="checkbox"
                          checked={formData.soundEffects !== false}
                          onChange={e => handleInputChange('soundEffects', e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Require Manager PIN for Refund */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                  <div>
                    <span className="text-neutral-200 font-semibold block">Require Manager PIN for Order Refunds</span>
                    <span className="text-neutral-500">Junior operators must request manager approval to refund completed receipts.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.requirePinForRefund !== false}
                    onChange={e => handleInputChange('requirePinForRefund', e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              {/* Operator Credentials Card */}
              <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-5">
                <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      Current Operator Credentials: {currentUser?.name || 'Rahel Fira'}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Role: <span className="font-semibold text-amber-400 capitalize">{currentUser?.role || 'manager'}</span> • Email: <span className="font-mono text-neutral-300">{currentUser?.email}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Change PIN Form */}
                  <form onSubmit={handleUpdatePinSubmit} className="space-y-3 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-xs font-bold text-neutral-200 block">Update Register Quick PIN</span>
                    <p className="text-[11px] text-neutral-400">4 to 6 numeric digits for fast workstation unlock.</p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        maxLength={6}
                        pattern="\d*"
                        value={newPin}
                        onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="New 4-digit PIN"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer"
                      >
                        Set PIN
                      </button>
                    </div>
                    {pinMessage && (
                      <p className={`text-[11px] ${pinMessage.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pinMessage}
                      </p>
                    )}
                  </form>

                  {/* Change Password Form */}
                  <form onSubmit={handleUpdatePasswordSubmit} className="space-y-3 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-200">Update Account Password</span>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generate Strong
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-400">Used for signing in and full manager access.</p>
                    <div className="relative flex gap-2">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="New password (min 6 chars)"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 font-mono text-xs focus:outline-none focus:border-amber-500 pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-18 top-2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                    {passwordMessage && (
                      <p className={`text-[11px] ${passwordMessage.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {passwordMessage}
                      </p>
                    )}
                  </form>
                </div>
              </div>

              {/* Master Registration Passcode Card (Changeable by Admins) */}
              <div className="p-6 rounded-2xl bg-neutral-900/80 border border-amber-500/30 space-y-5">
                <div className="border-b border-neutral-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      Store Master Registration Passcode
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      New employees and cashiers must enter this master passcode to create an account on this register terminal.
                    </p>
                  </div>
                </div>

                {/* Only Admin / Manager can change master passcode */}
                {(currentUser?.role === 'admin' || currentUser?.role === 'manager' || !currentUser) ? (
                  <div className="space-y-4">
                    {/* Current Master Passcode Display */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-neutral-300 block mb-0.5">
                          Current Active Passcode
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-amber-400 tracking-wider">
                            {showMasterPasscode 
                              ? (settings.masterPasscode || '••••••••••')
                              : '••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowMasterPasscode(!showMasterPasscode)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-200 cursor-pointer"
                            title={showMasterPasscode ? 'Hide passcode' : 'Show passcode'}
                          >
                            {showMasterPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUpdatingPasscode}
                          onClick={handleResetMasterPasscodeDefault}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Reset to Default
                        </button>
                      </div>
                    </div>

                    {/* Change Master Passcode Form */}
                    <form onSubmit={handleUpdateMasterPasscode} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <span className="text-xs font-bold text-neutral-200 block">
                        Change Master Passcode
                      </span>
                      <p className="text-[11px] text-neutral-400">
                        Update the master authorization code required for new staff to sign up on this POS register.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="text"
                          required
                          value={masterPasscodeInput}
                          onChange={(e) => setMasterPasscodeInput(e.target.value)}
                          placeholder="Enter new master passcode"
                          className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-amber-400 text-neutral-100 font-mono text-xs outline-hidden"
                        />
                        <button
                          type="submit"
                          disabled={isUpdatingPasscode}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs cursor-pointer shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Update Master Passcode</span>
                        </button>
                      </div>

                      {masterPasscodeMessage && (
                        <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                          masterPasscodeMessage.type === 'success' 
                            ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300' 
                            : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                        }`}>
                          {masterPasscodeMessage.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span>{masterPasscodeMessage.text}</span>
                        </div>
                      )}
                    </form>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Master registration passcode can only be viewed and edited by Store Managers or Administrators.</span>
                  </div>
                )}
              </div>

              {/* Staff Accounts Roster Card */}
              <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
                <div className="border-b border-neutral-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      Registered Staff Accounts ({users.length})
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Operators authorized to ring sales, manage stock, and open cash drawer shifts.
                    </p>
                  </div>
                  {users.length > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Are you sure you want to remove ALL registered accounts? All login credentials will be permanently erased. You will be signed out and will need to create your own new administrator account on the signup page.')) {
                          await removeAllUsers();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Remove All Accounts</span>
                    </button>
                  )}
                </div>

                {users.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-950 border border-neutral-850 rounded-xl space-y-2">
                    <Users className="w-8 h-8 text-neutral-600 mx-auto" />
                    <h3 className="text-sm font-bold text-neutral-200">No Staff Accounts Registered</h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                      All previous user accounts have been removed. New accounts can be registered from the Login screen using your authorized Master Passcode.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/80 border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
                    {users.map((u) => {
                      const isSelf = currentUser?.id === u.id;
                      return (
                        <div key={u.id} className="p-3 sm:p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${u.avatarColor || 'bg-amber-600'} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-neutral-100">{u.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase ${
                                  u.role === 'admin' 
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : u.role === 'manager'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : 'bg-neutral-800 text-neutral-300'
                                }`}>
                                  {u.role}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] text-amber-400 font-medium">
                                    (Current Session)
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-neutral-400 font-mono block">
                                {u.email} · PIN: ••••
                              </span>
                            </div>
                          </div>

                          {(currentUser?.role === 'admin' || currentUser?.role === 'manager' || users.length === 1) && (
                            <button
                              type="button"
                              onClick={() => {
                                const msg = isSelf
                                  ? `Remove your own account (${u.name})? You will be signed out immediately.`
                                  : `Remove staff account for ${u.name}?`;
                                if (confirm(msg)) {
                                  deleteUserAccount(u.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 transition-colors cursor-pointer"
                              title={`Remove ${u.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 6: CLOUD & BACKUP */}
          {activeSettingsSection === 'database' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Cloud Status Card */}
              <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-5">
                <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-400" />
                      Google Cloud Firestore Database
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Real-time synchronization across all store tablets, counter screens &amp; back-office devices.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                    <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="font-semibold text-neutral-200">
                      {isCloudConnected ? 'Live Cloud Connected' : 'Syncing with Firestore...'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <span className="text-[11px] text-neutral-400 block">Catalog SKUs</span>
                    <span className="text-lg font-bold font-mono text-neutral-100">{products.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <span className="text-[11px] text-neutral-400 block">Recorded Sales</span>
                    <span className="text-lg font-bold font-mono text-amber-300">{transactions.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <span className="text-[11px] text-neutral-400 block">Logged Purchases</span>
                    <span className="text-lg font-bold font-mono text-neutral-100">{purchases.length}</span>
                  </div>
                </div>
              </div>

              {/* Data Backup & Restore Hub */}
              <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-5">
                <div className="border-b border-neutral-800 pb-3">
                  <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-400" />
                    Database Backup &amp; Offline Restoration
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Export a portable JSON archive of all store inventory, sales, and purchases, or restore an earlier snapshot.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Export Backup Card */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-xs font-bold text-neutral-200 block flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        Export Complete Store Backup
                      </span>
                      <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                        Saves an instant JSON snapshot of all products, purchase invoices, sales receipts, and configuration.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="w-full py-2 px-3 bg-neutral-850 hover:bg-neutral-800 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Backup JSON</span>
                    </button>
                  </div>

                  {/* Import Backup Card */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-xs font-bold text-neutral-200 block flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        Restore From Backup File
                      </span>
                      <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                        Load a previously exported backup file (.json) to restore catalogs, ledgers, and store settings.
                      </p>
                    </div>
                    <label className="w-full py-2 px-3 bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Select Backup File (.json)</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleImportBackupFile}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {importStatus && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{importStatus}</span>
                  </div>
                )}
              </div>

              {/* Reset Center: "Yearly" & "Full reset with user removal" */}
              <div className="space-y-4">
                <div className="border-b border-neutral-800 pb-2">
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Store Reset Center</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Perform financial fiscal year-end resets or complete factory wipes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: "Yearly" Reset Card */}
                  <div className="p-5 rounded-2xl bg-neutral-950 border border-amber-500/30 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-neutral-100">"Yearly" Reset</h4>
                            <span className="text-[10px] text-amber-300 font-mono font-semibold uppercase">
                              Fiscal Year-End Close
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Clears all sales transactions, purchase order records, shift logs, and held tickets to start a fresh financial fiscal year.
                      </p>
                      <div className="text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Data Preserved:</span>
                        </div>
                        <ul className="list-disc list-inside text-neutral-300 space-y-0.5 text-[10px]">
                          <li>All products &amp; stock quantities remain intact</li>
                          <li>All staff user accounts &amp; PINs remain active</li>
                          <li>TIN, tax rules, and receipt settings preserved</li>
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setResetModalType('yearly');
                        setResetInputMatch('');
                      }}
                      className="w-full py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shadow-amber-500/10"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Yearly Reset</span>
                    </button>
                  </div>

                  {/* Option 2: "Full reset with user removal" Card */}
                  <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-rose-200">"Full reset with user removal"</h4>
                            <span className="text-[10px] text-rose-300 font-mono font-semibold uppercase">
                              Factory Wipe
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-rose-200/90 leading-relaxed">
                        Total system wipe. Clears transactions, wipes inventory catalog, and <strong>removes all user accounts</strong> and active device sessions.
                      </p>
                      <div className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Destructive Action:</span>
                        </div>
                        <ul className="list-disc list-inside text-rose-200/80 space-y-0.5 text-[10px]">
                          <li>Wipes all staff &amp; cashier operator logins</li>
                          <li>Clears all sales, purchases, and custom items</li>
                          <li>Signs out immediately to initial login screen</li>
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setResetModalType('full');
                        setResetInputMatch('');
                      }}
                      className="w-full py-2.5 px-4 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/50 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shadow-rose-600/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Full reset with user removal</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: STORE RESET CENTER */}
          {activeSettingsSection === 'reset' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-6">
                <div className="border-b border-neutral-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                      <RotateCcw className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-neutral-100">Store Reset Center</h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Choose between a fiscal "Yearly" reset or a complete "Full reset with user removal".
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Option 1: "Yearly" Reset Card */}
                  <div className="p-5 rounded-2xl bg-neutral-950 border border-amber-500/30 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-neutral-100">"Yearly" Reset</h4>
                          <span className="text-[10px] text-amber-300 font-mono font-semibold uppercase">
                            Fiscal Year-End Close
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Clears all customer sales receipts, purchase orders, drawer shift histories, and held tickets to start a fresh financial year.
                      </p>
                      <div className="text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Data Preserved:</span>
                        </div>
                        <ul className="list-disc list-inside text-neutral-300 space-y-0.5 text-[10px]">
                          <li>All catalog products &amp; current stock counts</li>
                          <li>All staff user accounts, passwords &amp; PINs</li>
                          <li>Store profile, tax rate, and receipt configurations</li>
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setResetModalType('yearly');
                        setResetInputMatch('');
                      }}
                      className="w-full py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shadow-amber-500/10"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Yearly Reset</span>
                    </button>
                  </div>

                  {/* Option 2: "Full reset with user removal" Card */}
                  <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-rose-200">"Full reset with user removal"</h4>
                          <span className="text-[10px] text-rose-300 font-mono font-semibold uppercase">
                            Complete Factory Wipe
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-rose-200/90 leading-relaxed">
                        Total system wipe. Clears transactions, wipes inventory catalog, and <strong>removes all user accounts</strong> and active device sessions.
                      </p>
                      <div className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Destructive Action:</span>
                        </div>
                        <ul className="list-disc list-inside text-rose-200/80 space-y-0.5 text-[10px]">
                          <li>Wipes all staff &amp; cashier operator logins</li>
                          <li>Clears all sales, purchases, and custom items</li>
                          <li>Signs out immediately to initial login screen</li>
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setResetModalType('full');
                        setResetInputMatch('');
                      }}
                      className="w-full py-2.5 px-4 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/50 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shadow-rose-600/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Full reset with user removal</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full text-neutral-100 shadow-2xl space-y-4">
            {resetModalType === 'yearly' ? (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-100">Confirm "Yearly" Reset</h3>
                    <p className="text-xs text-amber-400">Fiscal Year-End Operation</p>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  This will archive and clear all customer sales records, purchase orders, shift drawer logs, and held tickets to start a brand new financial year.
                </p>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block font-semibold">Safety Summary:</span>
                  <div className="text-emerald-400 flex items-center gap-1.5 text-[11px]">
                    <Check className="w-3.5 h-3.5" />
                    <span>Catalog inventory &amp; stock numbers will NOT be touched</span>
                  </div>
                  <div className="text-emerald-400 flex items-center gap-1.5 text-[11px]">
                    <Check className="w-3.5 h-3.5" />
                    <span>All operator accounts &amp; passwords remain intact</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalType(null);
                      setResetInputMatch('');
                    }}
                    className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleConfirmYearlyReset}
                    className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    {isResetting ? 'Running Reset...' : 'Yes, Run Yearly Reset'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-100">Confirm "Full reset with user removal"</h3>
                    <p className="text-xs text-rose-400">Complete System Wipe</p>
                  </div>
                </div>

                <p className="text-xs text-rose-200/90 leading-relaxed">
                  This is a permanent destructive reset. All sales, purchases, and custom products will be cleared, and <strong>all user accounts &amp; sessions will be removed</strong>.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400">
                    Type <strong className="text-rose-400 font-mono">RESET</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={resetInputMatch}
                    onChange={e => setResetInputMatch(e.target.value)}
                    placeholder="RESET"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 font-mono text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => {
                      setResetModalType(null);
                      setResetInputMatch('');
                    }}
                    className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={resetInputMatch.trim().toUpperCase() !== 'RESET' || isResetting}
                    onClick={handleConfirmFullReset}
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-rose-600/30"
                  >
                    {isResetting ? 'Wiping Database...' : 'Yes, Full Reset with User Removal'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
