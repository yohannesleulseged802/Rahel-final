import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  UserCheck,
  UserPlus,
  Delete,
  Sparkles,
  HelpCircle,
  X,
  Dices,
  Copy,
  Key,
  Check,
  User as UserIcon,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { User, UserRole } from '../types';
import { RahelLogo } from './RahelLogo';
import { LegalPoliciesModals, PolicyModalType } from './LegalPoliciesModals';

export const LoginPage: React.FC = () => {
  const { 
    users, 
    isUsersLoaded,
    currentUser, 
    lastLockedUser,
    isSessionTimedOut, 
    settings,
    login, 
    loginWithCredentials, 
    signup,
    showToast, 
    setActiveTab, 
    lockTerminal,
    updateUserPassword,
    updateUserPin,
    generateRandomPassword
  } = usePOS();

  // Primary active tab: 'login' | 'signup' - default to 'login' across all devices
  const [activeTabMode, setActiveTabMode] = useState<'login' | 'signup'>('login');

  // Login sub-mode: 'credentials' (email/password) or 'pin' (counter keypad)
  const [authMode, setAuthMode] = useState<'credentials' | 'pin'>('credentials');

  // Selected user for PIN mode or quick credential autofill
  const [selectedUser, setSelectedUser] = useState<User | null>(() => {
    return lastLockedUser || (users.length > 0 ? users[0] : null);
  });

  // Credential form states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Signup form states - defaults to admin role for initial account or cashier for subsequent
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('cashier');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [signupMasterPasscode, setSignupMasterPasscode] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showMasterPasscode, setShowMasterPasscode] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  // Random Password generation indicator
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Change Password Modal
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  // Change PIN Modal
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [changePinError, setChangePinError] = useState<string | null>(null);

  // PIN mode states
  const [pin, setPin] = useState('');
  const [pinErrorShake, setPinErrorShake] = useState(false);

  // Fast unlock mode (if terminal was just locked or timed out)
  const [isQuickUnlock, setIsQuickUnlock] = useState(!!lastLockedUser);

  // Rate limiting / lockout protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);
  const MAX_ATTEMPTS = 5;

  // Legal Modal
  const [activePolicyModal, setActivePolicyModal] = useState<PolicyModalType>(null);

  // Sync selectedUser if users list changes
  useEffect(() => {
    if (users.length > 0) {
      if (!selectedUser || !users.some(u => u.id === selectedUser.id)) {
        setSelectedUser(users[0]);
      } else {
        const full = users.find(u => u.id === selectedUser.id);
        if (full && (!selectedUser.pinHash || !selectedUser.pinSalt)) {
          setSelectedUser(full);
        }
      }
    } else {
      setSelectedUser(null);
    }
  }, [users, selectedUser]);

  // If a user is selected, prefill their email for convenience
  useEffect(() => {
    if (selectedUser && !emailInput) {
      setEmailInput(selectedUser.email);
    }
  }, [selectedUser]);

  // Countdown timer for lockout
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLockedOut && lockoutSecondsRemaining > 0) {
      timer = setInterval(() => {
        setLockoutSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLockedOut, lockoutSecondsRemaining]);

  // Physical keyboard support for PIN mode
  useEffect(() => {
    if (activeTabMode !== 'login' || authMode !== 'pin' || isLockedOut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (pin.length > 0) verifyPin(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabMode, authMode, pin, isLockedOut, selectedUser]);

  // Record failed attempt and trigger lockout if >= MAX_ATTEMPTS
  const recordFailedAttempt = () => {
    const next = failedAttempts + 1;
    setFailedAttempts(next);
    if (next >= MAX_ATTEMPTS) {
      setIsLockedOut(true);
      setLockoutSecondsRemaining(30);
      showToast('Too many failed attempts. Workstation temporarily paused for 30s.');
    }
  };

  // PIN inputs
  const handleDigit = (digit: string) => {
    if (pin.length < 4 && !isLockedOut) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          verifyPin(nextPin);
        }, 120);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  // Verify PIN submission
  const verifyPin = async (pinToTest: string) => {
    if (isLockedOut) return;
    const clean = String(pinToTest ?? '').trim();
    if (!/^\d{4}$/.test(clean)) return;

    const target = selectedUser || (users.length === 1 ? users[0] : undefined);
    const success = await login(clean, target, rememberDevice);
    if (!success) {
      setPinErrorShake(true);
      setTimeout(() => setPinErrorShake(false), 500);
      setPin('');
      recordFailedAttempt();
      if (users.length === 0) {
        setErrorMessage('No registered operator account found. Please sign up or sign in with Email & Password.');
      } else {
        setErrorMessage('Incorrect 4-digit PIN. Please try again or switch to Email & Password.');
      }
    } else {
      setPin('');
      setFailedAttempts(0);
      setErrorMessage(null);
    }
  };

  // Verify email & password submission
  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    const query = emailInput.trim();
    if (!query) {
      setErrorMessage('Please enter your account email or operator username.');
      return;
    }
    if (!passwordInput) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const success = await loginWithCredentials(query, passwordInput, rememberDevice);
      if (!success) {
        setErrorMessage('Invalid credentials. Check email and password, or verify your account.');
        recordFailedAttempt();
      } else {
        setErrorMessage(null);
        setFailedAttempts(0);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please check network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Signup Form
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);

    if (!signupName.trim()) {
      setSignupError('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setSignupError('Please enter a valid workstation email address.');
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setSignupError('Password must be at least 4 characters long.');
      return;
    }
    if (!/^\d{4}$/.test(signupPin.trim())) {
      setSignupError('Quick PIN must be exactly 4 numeric digits (e.g. 1234).');
      return;
    }
    if (!signupMasterPasscode.trim()) {
      setSignupError('Master authorization passcode is required to create an account.');
      return;
    }

    setIsSubmitting(true);
    const res = await signup({
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      pin: signupPin,
      role: signupRole,
      masterPasscode: signupMasterPasscode
    });
    setIsSubmitting(false);

    if (!res.success) {
      setSignupError(res.error || 'Failed to create operator account.');
    } else {
      setSignupSuccess(`Account registered for ${signupName}! Please enter your password or PIN to sign in.`);
      setEmailInput(signupEmail);
      setTimeout(() => {
        setActiveTabMode('login');
        setSignupSuccess(null);
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupPin('');
        setSignupMasterPasscode('');
        showToast(`Account created for ${signupName}. Please sign in with your password.`);
      }, 1000);
    }
  };

  // "Generate Random Password" helper for signup
  const handleGenerateSignupPassword = () => {
    const randomPwd = generateRandomPassword();
    setSignupPassword(randomPwd);
    setShowSignupPassword(true);
    try {
      navigator.clipboard.writeText(randomPwd);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    } catch (e) {}
    showToast('Generated strong password & copied to clipboard.');
  };

  // Change Password Form Submission
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);

    if (!newPasswordInput || newPasswordInput.length < 4) {
      setChangePasswordError('Password must be at least 4 characters long.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordError('Passwords do not match. Please verify.');
      return;
    }

    const targetUserId = selectedUser?.id || users[0]?.id;
    if (!targetUserId) {
      setChangePasswordError('No user account selected.');
      return;
    }
    const success = await updateUserPassword(newPasswordInput, targetUserId);
    if (!success) {
      setChangePasswordError('Failed to update password. Please check your network connection.');
      return;
    }
    setPasswordInput(newPasswordInput);
    setChangePasswordSuccess(true);
    setTimeout(() => {
      setChangePasswordSuccess(false);
      setIsChangePasswordOpen(false);
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    }, 1400);
  };

  // Change PIN Form Submission
  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError(null);

    const clean = newPinInput.trim();
    if (!/^\d{4}$/.test(clean)) {
      setChangePinError('PIN must be exactly 4 numeric digits (e.g. 2026).');
      return;
    }

    const targetUserId = selectedUser?.id || users[0]?.id;
    if (!targetUserId) {
      setChangePinError('No user account selected.');
      return;
    }
    const success = await updateUserPin(clean, targetUserId);
    if (success) {
      setIsChangePinOpen(false);
      setNewPinInput('');
      setErrorMessage(null);
    } else {
      setChangePinError('Failed to update PIN in database. Please check connection.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden">
      
      {/* Subtle Warm Amber Glow Background */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.18),rgba(0,0,0,0))]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 max-w-xl mx-auto w-full">
        
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-2.5">
            <RahelLogo size={50} showWordmark={true} />
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium">
            Fine Papers, Office Supplies &amp; Document Finishing Bureau
          </p>
        </div>

        {/* INACTIVITY TIMEOUT BANNER: shown when session timed out */}
        {isSessionTimedOut && (
          <div className="mb-4 w-full p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 flex items-start gap-3 shadow-lg shadow-amber-500/5 animate-in fade-in slide-in-from-top-2 duration-200" role="alert">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-amber-300 block">Session Timed Out</span>
              Workstation was automatically locked due to inactivity to protect terminal security. Please sign in to resume.
            </div>
          </div>
        )}

        {/* If user is already authenticated */}
        {currentUser && (
          <div className="mb-4 w-full p-3.5 rounded-xl bg-neutral-900/90 border border-amber-500/40 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5 text-xs text-neutral-300">
              <div className={`w-8 h-8 rounded-full ${currentUser.avatarColor || 'bg-amber-600'} text-white flex items-center justify-center font-bold text-xs`}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-neutral-400 text-[11px] block">Active Session:</span>
                <span className="font-semibold text-neutral-100">{currentUser.name}</span>
                <span className="text-amber-400 text-[11px] ml-1.5 capitalize font-mono">({currentUser.role})</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={lockTerminal}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Lock
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
              >
                Open POS &rarr;
              </button>
            </div>
          </div>
        )}

        {/* FAST UNLOCK CARD (If terminal was locked) */}
        {isQuickUnlock && !currentUser && (
          <div className="w-full mb-4 bg-neutral-900/95 border border-amber-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${lastLockedUser?.avatarColor || 'bg-amber-600'} text-white flex items-center justify-center text-sm font-bold shadow-md`}>
                  {lastLockedUser?.name.charAt(0).toUpperCase() || 'R'}
                </div>
                <div>
                  <span className="text-[11px] text-amber-400 font-medium uppercase tracking-wider block">Locked Workstation</span>
                  <h3 className="text-sm font-bold text-neutral-100">{lastLockedUser?.name || 'Operator'}</h3>
                  <span className="text-[11px] text-neutral-400">{lastLockedUser?.email} · {lastLockedUser?.role || 'Staff'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickUnlock(false)}
                className="text-xs text-neutral-400 hover:text-amber-300 underline cursor-pointer"
              >
                Full Login
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-neutral-300 font-medium">
                Enter your 4-digit PIN to resume:
              </div>

              {/* Masked PIN display */}
              <div className={`flex justify-center gap-3 py-2 ${pinErrorShake ? 'animate-shake' : ''}`}>
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                        filled
                          ? 'border-amber-400 bg-amber-400/20 shadow-xs shadow-amber-400/40'
                          : 'border-neutral-750 bg-neutral-950/60'
                      }`}
                    >
                      {filled && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm" />}
                    </div>
                  );
                })}
              </div>

              {/* On-screen keypad for fast unlock */}
              <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigit(digit.toString())}
                    className="h-10 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-amber-500/40 hover:bg-neutral-850 text-base font-semibold text-neutral-100 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-10 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-850 text-xs font-semibold text-neutral-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  className="h-10 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-amber-500/40 hover:bg-neutral-850 text-base font-semibold text-neutral-100 transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-10 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-850 text-neutral-400 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTAINER: Tab Switcher (Sign In vs Sign Up) */}
        {(!isQuickUnlock || currentUser) && (
          <div className="w-full bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300">
            
            {/* Top Navigation Tabs: Sign In / Sign Up */}
            <div className="grid grid-cols-2 p-1.5 bg-neutral-950/80 border-b border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTabMode('login');
                  setErrorMessage(null);
                  setSignupError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTabMode === 'login'
                    ? 'bg-neutral-850 text-amber-400 shadow-xs border border-neutral-750'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTabMode('signup');
                  setErrorMessage(null);
                  setSignupError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTabMode === 'signup'
                    ? 'bg-neutral-850 text-amber-400 shadow-xs border border-neutral-750'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </button>
            </div>

            {/* TAB 1: SIGN IN VIEW */}
            {activeTabMode === 'login' && (
              <div>
                {/* Cloud Database Synchronization Indicator */}
                {!isUsersLoaded && (
                  <div className="px-5 py-2.5 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-center gap-2 text-xs text-amber-400">
                    <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span>Synchronizing registered accounts across workstations...</span>
                  </div>
                )}

                {/* Registered Operator Quick Select Pills */}
                {users.length > 0 && (
                  <div className="px-5 pt-4 pb-2 border-b border-neutral-800/80 bg-neutral-950/40">
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                      Registered Operators ({users.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {users.map((u) => {
                        const isSelected = selectedUser?.id === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setEmailInput(u.email);
                              setErrorMessage(null);
                            }}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'border-amber-400 bg-amber-400/10 text-neutral-100 shadow-xs shadow-amber-400/20'
                                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full ${u.avatarColor || 'bg-amber-600'} text-white flex items-center justify-center text-[10px] font-bold`}>
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="font-semibold">{u.name}</span>
                            <span className="text-[10px] text-amber-400/80 font-mono capitalize">
                              ({u.role})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-modes: Credentials vs PIN */}
                <div className="flex border-b border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setAuthMode('credentials')}
                    className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      authMode === 'credentials'
                        ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email &amp; Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMode('pin')}
                    className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      authMode === 'pin'
                        ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Quick Counter PIN</span>
                  </button>
                </div>

                <div className="p-6">
                  {/* Informational banner when cloud has no users yet */}
                  {isUsersLoaded && users.length === 0 && (
                    <div className="mb-4 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 shadow-sm">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-amber-300">Initial Workstation Setup</strong>
                        <span>No registered accounts detected. You can sign in if you already created an account on another device, or click </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTabMode('signup');
                            setErrorMessage(null);
                          }}
                          className="text-amber-400 font-bold underline cursor-pointer hover:text-amber-300 ml-1"
                        >
                          Sign Up
                        </button>
                        <span> to register your administrator account.</span>
                      </div>
                    </div>
                  )}

                  {/* RATE LIMIT LOCKOUT NOTICE */}
                  {isLockedOut && (
                    <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <strong className="block text-rose-300">Terminal Security Lockout</strong>
                        Too many failed sign-in attempts. Please wait <strong>{lockoutSecondsRemaining} seconds</strong> before trying again.
                      </div>
                    </div>
                  )}

                  {/* ERROR MESSAGE */}
                  {errorMessage && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* MODE 1: CREDENTIALS (Email & Password) */}
                  {authMode === 'credentials' && (
                    <form onSubmit={handleSubmitCredentials} className="space-y-4">
                      {/* Email / Username */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Operator Email or Username
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            disabled={isLockedOut || isSubmitting}
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="e.g. Rahel@RFStationary.site"
                            className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-sm pl-10 outline-hidden transition-all disabled:opacity-50"
                          />
                          <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-neutral-300">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsChangePasswordOpen(true)}
                            className="text-[11px] text-amber-400/80 hover:text-amber-300 hover:underline cursor-pointer"
                          >
                            Update Password
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            disabled={isLockedOut || isSubmitting}
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-sm pl-10 pr-10 outline-hidden transition-all font-mono disabled:opacity-50"
                          />
                          <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-neutral-500 hover:text-neutral-300 absolute right-3.5 top-3 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Device & Security Notice */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-300">
                          <input
                            type="checkbox"
                            checked={rememberDevice}
                            onChange={(e) => setRememberDevice(e.target.checked)}
                            className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>Remember this register</span>
                        </label>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isLockedOut || isSubmitting}
                        className="w-full py-3 px-4 rounded-xl font-bold text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Sign In to POS</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* MODE 2: COUNTER PIN KEYPAD */}
                  {authMode === 'pin' && (
                    <div className="space-y-4">
                      {users.length === 0 ? (
                        <div className="text-center py-6 space-y-3">
                          <div className="w-10 h-10 rounded-full bg-neutral-800 text-amber-400 mx-auto flex items-center justify-center">
                            <KeyRound className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                            Quick Counter PIN requires a registered operator profile. Please sign in using your Email &amp; Password.
                          </p>
                          <button
                            type="button"
                            onClick={() => setAuthMode('credentials')}
                            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                          >
                            Switch to Email &amp; Password
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-center">
                            <span className="text-xs text-neutral-400 font-medium block">
                              Operator Account:
                            </span>
                            <span className="text-sm font-bold text-amber-300">
                              {selectedUser?.name || 'Authorized Operator'}
                            </span>
                            <span className="text-[11px] text-neutral-500 block">
                              Enter your 4-digit security PIN to unlock
                            </span>
                          </div>

                          {/* PIN Dots Display */}
                          <div className={`flex justify-center gap-3 py-2 ${pinErrorShake ? 'animate-shake' : ''}`}>
                            {[0, 1, 2, 3].map((idx) => {
                              const filled = pin.length > idx;
                              return (
                                <div
                                  key={idx}
                                  className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${
                                    filled
                                      ? 'border-amber-400 bg-amber-400/20 shadow-xs shadow-amber-400/40'
                                      : 'border-neutral-750 bg-neutral-950/60'
                                  }`}
                                >
                                  {filled && <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-sm" />}
                                </div>
                              );
                            })}
                          </div>

                          {/* Numeric Keypad */}
                          <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto pt-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                              <button
                                key={digit}
                                type="button"
                                disabled={isLockedOut}
                                onClick={() => handleDigit(digit.toString())}
                                className="h-11 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-amber-500/40 hover:bg-neutral-850 text-lg font-mono-numbers font-semibold text-neutral-100 transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-40"
                              >
                                {digit}
                              </button>
                            ))}
                            <button
                              type="button"
                              disabled={isLockedOut}
                              onClick={handleClear}
                              className="h-11 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-850 text-xs font-semibold text-neutral-400 hover:text-white transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              disabled={isLockedOut}
                              onClick={() => handleDigit('0')}
                              className="h-11 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-amber-500/40 hover:bg-neutral-850 text-lg font-mono-numbers font-semibold text-neutral-100 transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-40"
                            >
                              0
                            </button>
                            <button
                              type="button"
                              disabled={isLockedOut}
                              onClick={handleBackspace}
                              className="h-11 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-850 text-neutral-400 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-40"
                            >
                              <Delete className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="pt-2 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800">
                            <button
                              type="button"
                              onClick={() => setIsChangePinOpen(true)}
                              className="text-amber-400/80 hover:text-amber-300 hover:underline cursor-pointer"
                            >
                              Change Quick PIN
                            </button>
                            <span className="text-[11px] text-neutral-500">
                              Keyboard numbers supported
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Switch to Signup Prompt */}
                  <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
                    <span className="text-xs text-neutral-400">
                      Need a new staff or cashier account?{' '}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTabMode('signup');
                        setErrorMessage(null);
                      }}
                      className="text-xs text-amber-400 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Create New Account</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SIGN UP VIEW */}
            {activeTabMode === 'signup' && (
              <div className="p-6">
                {/* Security Gate Banner */}
                <div className="mb-5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 flex items-start gap-3 shadow-sm">
                  <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-bold text-amber-300 block">
                      {users.length === 0 ? 'Primary Administrator Setup' : 'Authorized Staff Registration'}
                    </span>
                    {users.length === 0 ? (
                      <>Welcome! Register your custom store Administrator account to begin. Authorized Master Passcode required.</>
                    ) : (
                      <>New operator registration requires store authorization. Enter the authorized <strong>Master Passcode</strong> to proceed.</>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {signupError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{signupError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {signupSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{signupSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  
                  {/* Full Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="e.g. Rahel Fira"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-xs outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Workstation Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="operator@rfstationary.site"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-xs outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Operator Role */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Account Role &amp; Permissions
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSignupRole('cashier')}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          signupRole === 'cashier'
                            ? 'bg-amber-500/10 border-amber-400 text-amber-300'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <span className="text-xs font-bold block">Cashier</span>
                        <span className="text-[10px] text-neutral-500 leading-tight block">Register &amp; Sales</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignupRole('manager')}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          signupRole === 'manager'
                            ? 'bg-amber-500/10 border-amber-400 text-amber-300'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <span className="text-xs font-bold block">Manager</span>
                        <span className="text-[10px] text-neutral-500 leading-tight block">Stock, POs &amp; Shifts</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignupRole('admin')}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          signupRole === 'admin'
                            ? 'bg-amber-500/10 border-amber-400 text-amber-300'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <span className="text-xs font-bold block">Admin</span>
                        <span className="text-[10px] text-neutral-500 leading-tight block">Full Access &amp; Config</span>
                      </button>
                    </div>
                  </div>

                  {/* Password & PIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-neutral-300">
                          Password *
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateSignupPassword}
                          className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Generate</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min 4 characters"
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-xs font-mono outline-hidden pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        4-Digit Quick PIN *
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        pattern="\d{4}"
                        value={signupPin}
                        onChange={(e) => setSignupPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 2026"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-xs font-mono text-center tracking-widest outline-hidden"
                      />
                    </div>
                  </div>

                  {/* MASTER PASSCODE (CRITICAL REQUIREMENT) */}
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-amber-400" />
                        <span>Master Passcode (Required) *</span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showMasterPasscode ? 'text' : 'password'}
                        required
                        value={signupMasterPasscode}
                        onChange={(e) => setSignupMasterPasscode(e.target.value)}
                        placeholder="Enter authorization passcode"
                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 text-sm font-mono outline-hidden pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMasterPasscode(!showMasterPasscode)}
                        className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                      >
                        {showMasterPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1.5">
                      {users.length === 0 ? (
                        <>Initial store setup passcode: <strong className="text-amber-300 font-mono">RahelF1234</strong> (can be updated in Settings).</>
                      ) : (
                        'Authorized by the store administrator to protect register integrity.'
                      )}
                    </p>
                  </div>

                  {/* Submit Signup Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl font-bold text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Operator Account &amp; Sign In</span>
                      </>
                    )}
                  </button>

                  {/* Switch back to Login */}
                  <div className="pt-2 text-center">
                    <span className="text-xs text-neutral-400">
                      Already registered?{' '}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTabMode('login');
                        setSignupError(null);
                      }}
                      className="text-xs text-amber-400 font-semibold hover:underline cursor-pointer"
                    >
                      Sign in here &rarr;
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Quick credentials copy reminder toast */}
            {copiedNotification && (
              <div className="px-5 py-2 bg-neutral-950 text-emerald-400 text-xs flex items-center justify-between border-t border-neutral-800 animate-in fade-in">
                <span>Password copied to clipboard.</span>
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
        )}

      </div>

      {/* FOOTER: Legal & Compliance Links */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs text-neutral-500 border-t border-neutral-900 bg-neutral-950/60 backdrop-blur-xs">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-1.5">
          <button
            type="button"
            onClick={() => setActivePolicyModal('terms')}
            className="hover:text-amber-400 underline decoration-neutral-700 hover:decoration-amber-400 cursor-pointer transition-colors"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setActivePolicyModal('privacy')}
            className="hover:text-amber-400 underline decoration-neutral-700 hover:decoration-amber-400 cursor-pointer transition-colors"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setActivePolicyModal('cookies')}
            className="hover:text-amber-400 underline decoration-neutral-700 hover:decoration-amber-400 cursor-pointer transition-colors"
          >
            Cookie Preferences
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setActivePolicyModal('ccpa')}
            className="hover:text-amber-400 underline decoration-neutral-700 hover:decoration-amber-400 cursor-pointer transition-colors"
          >
            CCPA / Privacy Rights
          </button>
        </div>
        <p className="text-[11px] text-neutral-600">
          Rahel Stationary &amp; Print Services POS System · Addis Ababa, Ethiopia · Version 2.4.0
        </p>
      </footer>

      {/* LEGAL POLICIES MODALS */}
      <LegalPoliciesModals
        activeModal={activePolicyModal}
        onClose={() => setActivePolicyModal(null)}
      />

      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full text-neutral-100 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Update Operator Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {changePasswordSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs">
                <div>
                  <span className="block text-neutral-300 font-medium mb-1">New Password</span>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 characters"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 font-mono text-xs outline-hidden"
                  />
                </div>

                <div>
                  <span className="block text-neutral-300 font-medium mb-1">Confirm New Password</span>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 font-mono text-xs outline-hidden"
                  />
                </div>

                {changePasswordError && (
                  <p className="text-rose-400 text-[11px] font-medium">{changePasswordError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg cursor-pointer shadow-sm shadow-amber-500/20"
                  >
                    Save New Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CHANGE PIN MODAL */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full text-neutral-100 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Change 4-Digit Counter PIN</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePinOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePinSubmit} className="space-y-3.5 text-xs">
              <p className="text-neutral-300">
                Set a 4-digit numeric PIN for fast register unlocks:
              </p>

              <input
                type="text"
                maxLength={4}
                required
                pattern="\d{4}"
                placeholder="e.g. 2026"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 font-mono text-center text-lg tracking-widest outline-hidden"
              />

              {changePinError && (
                <p className="text-rose-400 text-[11px] font-medium">{changePinError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsChangePinOpen(false)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg cursor-pointer shadow-sm shadow-amber-500/20"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
