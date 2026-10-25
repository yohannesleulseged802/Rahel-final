import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, UserCheck, X, Delete } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, login, logout, lockTerminal } = usePOS();
  const [selectedUser, setSelectedUser] = useState<User | undefined>(currentUser || (users.length > 0 ? users[0] : undefined));
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const full = users.find(u => u.id === currentUser.id);
      setSelectedUser(full || currentUser);
    } else if (users.length > 0) {
      setSelectedUser(prev => (prev && users.some(u => u.id === prev.id)) ? prev : users[0]);
    } else {
      setSelectedUser(undefined);
    }
  }, [currentUser, users]);

  useEffect(() => {
    if (isOpen) {
      setPin('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' && currentUser) {
        onClose();
      } else if (e.key === 'Enter') {
        handleSubmitPin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, selectedUser]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
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
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const verifyPin = async (pinToTest: string) => {
    if (!selectedUser) return;
    const success = await login(pinToTest, selectedUser);
    if (!success) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      setPin('');
    } else {
      setPin('');
      onClose();
    }
  };

  const handleSubmitPin = () => {
    if (pin.length === 0) return;
    verifyPin(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div 
        className={`bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full border border-neutral-800 overflow-hidden transition-transform duration-200 ${
          errorShake ? 'animate-bounce' : ''
        }`}
      >
        {/* Header in Black & Gold */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-semibold text-neutral-100">
              Terminal Security &amp; Cashier Sign-In
            </h3>
          </div>
          {currentUser && (
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {users.length === 0 && !currentUser ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-neutral-100">No Registered Accounts</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                All staff accounts have been removed. Please sign up to create your primary administrator account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20"
            >
              Go to Signup Screen
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* User selector chips if multiple operators exist */}
            {users.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(u);
                    setPin('');
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    selectedUser?.id === u.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${u.avatarColor || 'bg-amber-600'} text-white text-[9px] flex items-center justify-center font-bold`}>
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                  <span>{u.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Active Operator Badge */}
          <div className="mb-4 p-3.5 rounded-xl border border-amber-500/40 bg-neutral-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${selectedUser?.avatarColor || 'bg-amber-600'} text-white flex items-center justify-center text-sm font-black shadow-xs`}>
                {selectedUser?.name.charAt(0).toUpperCase() || 'O'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-100">{selectedUser?.name || 'Authorized Operator'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono capitalize">
                    {selectedUser?.role || 'Staff'}
                  </span>
                </div>
                <span className="text-xs text-neutral-400 font-mono">{selectedUser?.email}</span>
              </div>
            </div>
            {selectedUser && (
              <div className="text-right text-[11px] text-neutral-400">
                <span className="text-amber-400 font-medium">PIN Required</span>
              </div>
            )}
          </div>

          {/* PIN Display Dots with Golden Glow */}
          <div className="flex flex-col items-center justify-center my-4">
            <div className="text-xs font-medium text-neutral-400 mb-2">
              Enter 4-Digit Security PIN
            </div>
            <div className="flex items-center gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                      isFilled
                        ? 'bg-amber-400 border-amber-400 scale-110 shadow-md shadow-amber-400/50'
                        : 'border-neutral-700 bg-neutral-950'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Numeric Keypad in Obsidian & Gold */}
          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-12 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-amber-500/40 hover:bg-neutral-850 text-lg font-mono-numbers font-semibold text-neutral-100 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-850 text-xs font-semibold text-neutral-400 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-amber-500/40 hover:bg-neutral-850 text-lg font-mono-numbers font-semibold text-neutral-100 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-850 text-neutral-400 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Fast Switch & Lock Controls */}
          <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs">
            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  lockTerminal();
                  onClose();
                }}
                className="text-neutral-400 hover:text-amber-400 font-medium cursor-pointer transition-colors"
              >
                Lock Workstation
              </button>
            )}
            <span className="text-neutral-500 text-[11px] ml-auto">
              PIN verification required to authenticate
            </span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
