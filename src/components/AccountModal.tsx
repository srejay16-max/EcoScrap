import React, { useState } from 'react';
import {
  Award,
  Check,
  Copy,
  KeyRound,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  UserPlus,
  X,
} from 'lucide-react';
import type { NavTab, PublicAccount, WorkspaceMode, WorkspaceSnapshot } from '../types';
import { api } from '../api/client';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  workspace: WorkspaceMode;
  snapshot: WorkspaceSnapshot | null;
  activeAccessCode: string | null;
  onAuthSuccess: (snapshot: WorkspaceSnapshot, accessCode?: string | null) => void;
  onLoggedOut: () => Promise<void>;
  onNavigate: (tab: NavTab) => void;
}

const DORM_OPTIONS = [
  { id: 'juniper', name: 'Juniper Hall' },
  { id: 'beacon', name: 'Beacon Hall' },
  { id: 'summit', name: 'Summit Hall' },
  { id: 'poplar', name: 'Poplar Hall' },
  { id: 'cypress', name: 'Cypress Hall' },
];

export const AccountModal: React.FC<AccountModalProps> = ({
  open,
  onClose,
  workspace,
  snapshot,
  activeAccessCode,
  onAuthSuccess,
  onLoggedOut,
  onNavigate,
}) => {
  const [authTab, setAuthTab] = useState<'guest' | 'register' | 'login'>('guest');
  const [loginMethod, setLoginMethod] = useState<'guest-code' | 'credentials'>('guest-code');

  // Guest creation fields
  const [guestName, setGuestName] = useState('');
  const [guestDorm, setGuestDorm] = useState('juniper');

  // Member registration fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDorm, setRegDorm] = useState('juniper');

  // Sign in fields
  const [guestCodeInput, setGuestCodeInput] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Guest upgrade fields
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeUsername, setUpgradeUsername] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!open) return null;

  const account: PublicAccount | null = snapshot?.account || null;

  const handleCopyAccessCode = async () => {
    if (!activeAccessCode) return;
    try {
      await navigator.clipboard.writeText(activeAccessCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Clipboard fallback ignored if denied
    }
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await api.createGuestAccount(workspace, {
        displayName: guestName.trim() || undefined,
        dormId: guestDorm,
      });
      onAuthSuccess(res.snapshot, res.accessCode || null);
      setSuccessMsg('Guest account created! Save your Guest Access Code below to return to your rewards anytime.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not create guest account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await api.registerAccount(workspace, {
        displayName: regName.trim(),
        username: regUsername.trim(),
        password: regPassword,
        dormId: regDorm,
      });
      setRegPassword('');
      onAuthSuccess(res.snapshot, null);
      setSuccessMsg('Account created! Your compost deposits and rewards are now tied to your profile.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      if (loginMethod === 'guest-code') {
        const res = await api.loginWithGuestCode(workspace, guestCodeInput.trim());
        onAuthSuccess(res.snapshot, res.accessCode || guestCodeInput.trim().toUpperCase());
        setSuccessMsg('Signed back into your Guest Account! Your rewards and vouchers are loaded.');
      } else {
        const res = await api.loginWithCredentials(workspace, loginUsername.trim(), loginPassword);
        setLoginPassword('');
        onAuthSuccess(res.snapshot, null);
        setSuccessMsg('Welcome back! Your rewards and compost progress are loaded.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpgradeGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await api.upgradeGuestAccount(workspace, {
        username: upgradeUsername.trim(),
        password: upgradePassword,
      });
      setUpgradePassword('');
      setShowUpgrade(false);
      onAuthSuccess(res.snapshot, activeAccessCode);
      setSuccessMsg('Guest account upgraded! You can now sign in with your username and password.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not upgrade guest account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      await api.logoutStudent();
      await onLoggedOut();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#143326]/15 bg-white shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#143326] px-5 py-4 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#84CC16] text-[#143326]">
              <UserCircle2 className="h-4 w-4" />
            </span>
            <div>
              <h2 id="account-modal-title" className="font-display text-base font-semibold">
                {account ? 'My EcoScrap Account' : 'EcoScrap Account & Guest Pass'}
              </h2>
              <p className="text-[11px] text-[#BEF264]">
                {account
                  ? account.accountType === 'guest'
                    ? 'Guest Account · Rewards & Vouchers Saved'
                    : `Member Account · @${account.username}`
                  : 'Create a Guest or Member account to track & access your rewards'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-[#B91C1C]/30 bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#991B1B]"
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-[#15803D]/30 bg-[#ECFDF5] px-3.5 py-2.5 text-xs text-[#15803D]">
              {successMsg}
            </div>
          )}

          {/* Signed-in Account View */}
          {account && snapshot ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#143326]/12 bg-[#FAF8F3] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-base font-semibold text-[#143326]">
                      {account.displayName}
                    </div>
                    <div className="text-xs text-[#4F775A]">
                      {DORM_OPTIONS.find((d) => d.id === account.dormId)?.name || 'Juniper Hall'}
                      {account.username ? ` · @${account.username}` : ' · Guest Profile'}
                    </div>
                  </div>
                  <span className="rounded-lg bg-[#ECFDF5] border border-[#15803D]/25 px-2.5 py-1 text-[11px] font-semibold text-[#15803D]">
                    {account.accountType === 'guest' ? 'Guest Pass' : 'Member'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#143326]/10 text-center">
                  <div className="rounded-xl bg-white border border-[#143326]/10 p-2.5">
                    <div className="font-mono-data text-sm font-semibold text-[#143326]">
                      {snapshot.student.verifiedWeightLbs.toFixed(1)} lbs
                    </div>
                    <div className="text-[10px] text-[#143326]/60">Verified</div>
                  </div>
                  <div className="rounded-xl bg-white border border-[#143326]/10 p-2.5">
                    <div className="font-mono-data text-sm font-semibold text-[#15803D]">
                      {snapshot.student.ecoPoints}
                    </div>
                    <div className="text-[10px] text-[#143326]/60">EcoPoints</div>
                  </div>
                  <div className="rounded-xl bg-white border border-[#143326]/10 p-2.5">
                    <div className="font-mono-data text-sm font-semibold text-[#143326]">
                      {snapshot.rewards.vouchers.length}
                    </div>
                    <div className="text-[10px] text-[#143326]/60">Vouchers</div>
                  </div>
                </div>
              </div>

              {/* Guest Access Code Box (for returning later) */}
              {(activeAccessCode || account.guestCodeHint) && (
                <div className="rounded-2xl border border-[#15803D]/25 bg-[#ECFDF5]/60 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#143326]">
                    <KeyRound className="h-3.5 w-3.5 text-[#15803D]" />
                    <span>Your Guest Access Code</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#143326]/75">
                    Save this code to sign back into your Guest Account and access your rewards from any device.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl border border-[#143326]/15 bg-white px-3 py-2 font-mono-data text-xs font-semibold tracking-wider text-[#143326]">
                      {activeAccessCode || account.guestCodeHint}
                    </div>
                    {activeAccessCode && (
                      <button
                        type="button"
                        onClick={() => void handleCopyAccessCode()}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#143326] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1E4A38] shrink-0 cursor-pointer"
                      >
                        {copiedCode ? (
                          <Check className="h-3.5 w-3.5 text-[#BEF264]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-[#BEF264]" />
                        )}
                        {copiedCode ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Optional Upgrade Guest to Full Account */}
              {account.accountType === 'guest' && (
                <div className="rounded-2xl border border-[#143326]/12 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#143326]">
                      <ShieldCheck className="h-4 w-4 text-[#15803D]" />
                      <span>Save with Username &amp; Password</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUpgrade((prev) => !prev)}
                      className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
                    >
                      {showUpgrade ? 'Cancel' : 'Upgrade Guest'}
                    </button>
                  </div>
                  {showUpgrade && (
                    <form onSubmit={handleUpgradeGuest} className="space-y-2.5 pt-1">
                      <input
                        type="text"
                        required
                        minLength={3}
                        maxLength={24}
                        value={upgradeUsername}
                        onChange={(e) => setUpgradeUsername(e.target.value)}
                        placeholder="Choose username (e.g., jordan_usf)"
                        className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#143326]"
                      />
                      <input
                        type="password"
                        required
                        minLength={6}
                        maxLength={64}
                        value={upgradePassword}
                        onChange={(e) => setUpgradePassword(e.target.value)}
                        placeholder="Choose password (min 6 characters)"
                        className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#143326]"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-[#143326] py-2 text-xs font-semibold text-white hover:bg-[#1E4A38] disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? 'Upgrading...' : 'Save Permanent Login (Keep Rewards)'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('rewards');
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#143326] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#1E4A38] cursor-pointer"
                >
                  <Award className="h-3.5 w-3.5 text-[#BEF264]" />
                  View My EcoRewards
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSignOut()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#143326]/20 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#143326] hover:bg-[#FEF2F2] hover:text-[#B91C1C] hover:border-[#B91C1C]/30 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Signed-out Auth Flow: Guest Account | Create Account | Sign In */
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#143326]/15 bg-[#FAF8F3] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthTab('guest');
                  }}
                  className={`rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    authTab === 'guest'
                      ? 'bg-[#143326] text-white'
                      : 'text-[#143326]/75 hover:bg-white'
                  }`}
                >
                  Guest Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthTab('register');
                  }}
                  className={`rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    authTab === 'register'
                      ? 'bg-[#143326] text-white'
                      : 'text-[#143326]/75 hover:bg-white'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthTab('login');
                  }}
                  className={`rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    authTab === 'login'
                      ? 'bg-[#143326] text-white'
                      : 'text-[#143326]/75 hover:bg-white'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {authTab === 'guest' && (
                <form onSubmit={handleCreateGuest} className="space-y-3">
                  <div className="rounded-xl border border-[#15803D]/20 bg-[#ECFDF5]/60 p-3 text-xs text-[#143326]/85 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-[#15803D] shrink-0 mt-0.5" />
                    <span>
                      Start instantly without a password. You&rsquo;ll get a unique{' '}
                      <strong>Guest Access Code</strong> so you can track your compost pounds and return to your
                      EcoRewards vouchers anytime.
                    </span>
                  </div>

                  <div>
                    <label htmlFor="guest-name" className="block text-xs font-medium text-[#143326]/80 mb-1">
                      Nickname (optional)
                    </label>
                    <input
                      id="guest-name"
                      type="text"
                      maxLength={48}
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g., Sam (or leave blank for auto Guest ID)"
                      className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-sm text-[#143326]"
                    />
                  </div>

                  <div>
                    <label htmlFor="guest-dorm" className="block text-xs font-medium text-[#143326]/80 mb-1">
                      USF Residence Hall Team
                    </label>
                    <select
                      id="guest-dorm"
                      value={guestDorm}
                      onChange={(e) => setGuestDorm(e.target.value)}
                      className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-sm text-[#143326]"
                    >
                      {DORM_OPTIONS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#143326] py-2.5 text-xs font-semibold text-white hover:bg-[#1E4A38] disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus className="h-4 w-4 text-[#BEF264]" />
                    {submitting ? 'Creating Guest Account...' : 'Create Guest Account & Track Rewards'}
                  </button>
                </form>
              )}

              {authTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label htmlFor="reg-name" className="block text-xs font-medium text-[#143326]/80 mb-1">
                      Display Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={48}
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g., Jordan Patel"
                      className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-sm text-[#143326]"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-username" className="block text-xs font-medium text-[#143326]/80 mb-1">
                      Username
                    </label>
                    <input
                      id="reg-username"
                      type="text"
                      required
                      minLength={3}
                      maxLength={24}
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g., jordan_usf"
                      className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-sm text-[#143326]"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-password" className="block text-xs font-medium text-[#143326]/80 mb-1">
                      Password (min 6 characters)
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      minLength={6}
                      maxLength={64}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-sm text-[#143326]"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-dorm" className="block text-xs font-medium text-[#143326]/80 mb-1">
                      USF Residence Hall Team
                    </label>
                    <select
                      id="reg-dorm"
                      value={regDorm}
                      onChange={(e) => setRegDorm(e.target.value)}
                      className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-sm text-[#143326]"
                    >
                      {DORM_OPTIONS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#143326] py-2.5 text-xs font-semibold text-white hover:bg-[#1E4A38] disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus className="h-4 w-4 text-[#BEF264]" />
                    {submitting ? 'Creating Account...' : 'Create EcoScrap Account'}
                  </button>
                </form>
              )}

              {authTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="inline-flex w-full rounded-xl border border-[#143326]/15 bg-[#FAF8F3] p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setLoginMethod('guest-code');
                      }}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold cursor-pointer ${
                        loginMethod === 'guest-code'
                          ? 'bg-white text-[#143326] shadow-xs'
                          : 'text-[#143326]/65'
                      }`}
                    >
                      Guest Access Code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setLoginMethod('credentials');
                      }}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold cursor-pointer ${
                        loginMethod === 'credentials'
                          ? 'bg-white text-[#143326] shadow-xs'
                          : 'text-[#143326]/65'
                      }`}
                    >
                      Username &amp; Password
                    </button>
                  </div>

                  {loginMethod === 'guest-code' ? (
                    <div>
                      <label htmlFor="login-guest-code" className="block text-xs font-medium text-[#143326]/80 mb-1">
                        Guest Access Code
                      </label>
                      <input
                        id="login-guest-code"
                        type="text"
                        required
                        value={guestCodeInput}
                        onChange={(e) => setGuestCodeInput(e.target.value)}
                        placeholder="ECO-XXXX-XXXX-XXXX"
                        className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-sm font-mono-data uppercase text-[#143326]"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label htmlFor="login-user" className="block text-xs font-medium text-[#143326]/80 mb-1">
                          Username
                        </label>
                        <input
                          id="login-user"
                          type="text"
                          required
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          placeholder="e.g., jordan_usf"
                          className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-sm text-[#143326]"
                        />
                      </div>
                      <div>
                        <label htmlFor="login-pass" className="block text-xs font-medium text-[#143326]/80 mb-1">
                          Password
                        </label>
                        <input
                          id="login-pass"
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-sm text-[#143326]"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#143326] py-2.5 text-xs font-semibold text-white hover:bg-[#1E4A38] disabled:opacity-50 cursor-pointer"
                  >
                    <LogIn className="h-4 w-4 text-[#BEF264]" />
                    {submitting ? 'Signing In...' : 'Access My Rewards'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
