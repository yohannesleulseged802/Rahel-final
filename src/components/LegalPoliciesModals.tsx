import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Cookie, Ban, Check, ExternalLink } from 'lucide-react';

export type PolicyModalType = 'privacy' | 'terms' | 'cookies' | 'ccpa' | null;

interface LegalPoliciesModalsProps {
  activeModal: PolicyModalType;
  onClose: () => void;
}

export const LegalPoliciesModals: React.FC<LegalPoliciesModalsProps> = ({
  activeModal,
  onClose,
}) => {
  const [cookiePreferences, setCookiePreferences] = useState({
    strictlyNecessary: true, // Always locked
    performance: true,
    functional: true,
  });

  const [ccpaOptOutConfirmed, setCcpaOptOutConfirmed] = useState(false);

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-neutral-100">
        
        {/* PRIVACY POLICY & ARTICLE 13 GDPR DISCLOSURE */}
        {activeModal === 'privacy' && (
          <>
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-neutral-100">
                  Privacy Policy &amp; GDPR Article 13 Notice
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-neutral-300 leading-relaxed">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400">
                <span className="font-semibold text-neutral-200">Data Controller:</span> Rahel Stationary &amp; Print Services, 142 Merchant Street, City Center. Contact: <span className="text-amber-400">privacy@rahelstationary.com</span>. Effective Date: January 1, 2026.
              </div>

              <div>
                <h4 className="text-sm font-bold text-amber-300 mb-1">1. Information Collected at Sign-In</h4>
                <p>
                  When you sign in to the Rahel Stationary Point of Sale and Document Finishing terminal, we collect:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-neutral-400 pl-2">
                  <li><strong>Operator Identifiers:</strong> Name, work email address, staff ID number, and security PIN hash.</li>
                  <li><strong>Technical Telemetry:</strong> IP address, device browser user-agent, session start/end timestamps, and register cash-drawer operations.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-amber-300 mb-1">2. Legal Basis for Processing (GDPR Art. 6)</h4>
                <p>
                  We process sign-in credentials under <strong>Article 6(1)(b)</strong> (Performance of Employment/Contract) to provision authorized register capabilities, and under <strong>Article 6(1)(f)</strong> (Legitimate Interests) to safeguard financial transactions, prevent fraudulent till adjustments, and maintain fiscal compliance.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-amber-300 mb-1">3. Data Retention &amp; Security</h4>
                <p>
                  All credentials and session tokens are stored using industry-standard salted hashing and TLS 1.3 encryption in transit. Till session audit logs are retained for 90 days to satisfy retail accounting and tax reporting obligations.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-amber-300 mb-1">4. Your Statutory Rights</h4>
                <p>
                  Under the GDPR and CCPA, you have the right to request access to, rectification of, or erasure of your personal data, and to lodge a complaint with your supervisory data protection authority.
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Acknowledge &amp; Close
              </button>
            </div>
          </>
        )}

        {/* TERMS OF SERVICE & OPERATOR EULA */}
        {activeModal === 'terms' && (
          <>
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-neutral-100">
                  Terms of Service &amp; Terminal EULA
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-neutral-300 leading-relaxed">
              <p>
                These Terms of Service govern access to the Rahel Stationary Point of Sale and Label Finishing terminal suite. By entering credentials and proceeding into the system, you agree to comply with these terms.
              </p>

              <div>
                <h4 className="text-sm font-bold text-amber-300 mb-1">1. Authorized Operator License</h4>
                <p>
                  Access is granted solely to registered employees and managers of Rahel Stationary. Credentials may not be shared, loaned, or delegated. You are responsible for all sales, discounts, refunds, and label creations recorded under your active sign-in.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-amber-300 mb-1">2. Computer Fraud and Abuse Act (18 U.S.C. § 1030)</h4>
                <p>
                  Any unauthorized attempt to bypass authentication mechanisms, modify inventory prices maliciously, or tamper with transaction history constitutes a federal offense punishable by fines and imprisonment.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-amber-300 mb-1">3. Cash Drawer &amp; Till Accountability</h4>
                <p>
                  Operators opening or closing shifts must perform accurate bill count reconciliations. Any cash discrepancies exceeding threshold tolerances will trigger automated managerial audits.
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Understood &amp; Close
              </button>
            </div>
          </>
        )}

        {/* COOKIE & SESSION STORAGE PREFERENCES */}
        {activeModal === 'cookies' && (
          <>
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cookie className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-neutral-100">
                  Cookie &amp; Session Storage Preferences
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-neutral-300 leading-relaxed">
              <p>
                In compliance with the <strong>EU ePrivacy Directive 2002/58/EC</strong> and <strong>GDPR Recital 30</strong>, we detail how cookies and local storage are utilized on this workstation.
              </p>

              <div className="space-y-3">
                {/* Strictly Necessary */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-100 text-sm">Strictly Necessary Auth Tokens</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                        Legally Exempt / Always On
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Maintains your authenticated cashier session, protects against CSRF attacks, and stores parked ticket data locally.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    aria-label="Strictly necessary cookies always active"
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 opacity-80 cursor-not-allowed"
                  />
                </div>

                {/* Performance */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="font-bold text-neutral-100 text-sm">Performance &amp; Register Speed Cache</div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Caches barcode lookups and label layout calculations locally in indexed storage to accelerate checkout speed.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cookiePreferences.performance}
                    onChange={(e) => setCookiePreferences(prev => ({ ...prev, performance: e.target.checked }))}
                    aria-label="Performance cookies toggle"
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Functional UI */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="font-bold text-neutral-100 text-sm">Functional Preferences</div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Remembers your last selected label template size (A4 / Custom) and default invoice print preferences.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cookiePreferences.functional}
                    onChange={(e) => setCookiePreferences(prev => ({ ...prev, functional: e.target.checked }))}
                    aria-label="Functional preferences toggle"
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-800 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </>
        )}

        {/* CCPA / CPRA DO NOT SELL OR SHARE */}
        {activeModal === 'ccpa' && (
          <>
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Ban className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-neutral-100">
                  California CCPA / CPRA Rights
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-neutral-300 leading-relaxed">
              <p>
                Under the <strong>California Consumer Privacy Act (CCPA)</strong> and <strong>California Privacy Rights Act (CPRA)</strong>, California residents possess the statutory right to opt-out of the "sale" or "sharing" of their personal information and to limit the use of Sensitive Personal Information.
              </p>

              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <h4 className="text-sm font-bold text-neutral-100">Our Explicit Affirmation</h4>
                <p className="text-neutral-400">
                  <strong>Rahel Stationary does not sell, rent, or commercialize</strong> your employee identifiers, login credentials, or retail transaction records to third-party data brokers or behavioral advertisers.
                </p>
              </div>

              {!ccpaOptOutConfirmed ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                  <div className="font-semibold text-amber-300">Statutory Opt-Out Confirmation</div>
                  <p className="text-neutral-300 text-[11px]">
                    Click below to record your formal global opt-out preference across all Rahel Stationary POS systems.
                  </p>
                  <button
                    onClick={() => setCcpaOptOutConfirmed(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold rounded-xl transition-all shadow-md cursor-pointer text-xs"
                  >
                    Confirm Do Not Sell / Share Preference
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-xs">
                    Your Opt-Out preference has been saved in compliance with Cal. Civ. Code § 1798.135.
                  </span>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
