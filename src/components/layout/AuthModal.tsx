import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Lock, LogOut, Key, User, X, ExternalLink, Ticket, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { authUser, loginUser, registerUser, logoutUser, paymentSettings } = useFPL();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login inputs
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regManagerName, setRegManagerName] = useState('');
  const [regTeamName, setRegTeamName] = useState('');
  const [regActivationCode, setRegActivationCode] = useState('');

  // Status
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      await loginUser(loginIdentifier.trim(), loginPassword.trim());
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword.trim() || !regManagerName.trim() || !regTeamName.trim()) {
      setErrorMessage('Username, password, your name, and team name are required.');
      return;
    }

    if (paymentSettings?.requireActivationCode && !regActivationCode.trim()) {
      setErrorMessage(`An activation code is required. Please pay ${paymentSettings.entryFeeGEL || 3} ₾ via BOG or TBC to receive your code.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      await registerUser({
        username: regUsername.trim(),
        email: regEmail.trim() || undefined,
        password: regPassword.trim(),
        managerName: regManagerName.trim(),
        teamName: regTeamName.trim(),
        activationCode: regActivationCode.trim() ? regActivationCode.trim().toUpperCase() : undefined,
      });
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPaymentLink = (bank: 'bog' | 'tbc') => {
    const defaultBog = 'https://egreve.bog.ge/KCL26_charity';
    const link = bank === 'bog' ? (paymentSettings?.bogLink?.trim() || defaultBog) : paymentSettings?.tbcLink?.trim();
    if (link && link.trim()) {
      window.open(link.trim(), '_blank', 'noopener,noreferrer');
    } else {
      alert(`${bank === 'bog' ? 'Bank of Georgia' : 'TBC Bank'} direct link will be activated shortly. Please contact Komarovi organizers directly for the account details.`);
    }
  };

  const handleQuickDemoLogin = () => {
    setLoginIdentifier('apex');
    setLoginPassword('fantasy123');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
              {authUser ? 'Profile' : 'Manager Account'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ALREADY LOGGED IN VIEW */}
        {authUser ? (
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-black text-lg">
                {authUser.managerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">{authUser.teamName}</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{authUser.managerName}</p>
                <p className="text-[11px] text-slate-400">@{authUser.username}</p>
              </div>
            </div>

            <button
              onClick={() => {
                logoutUser();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* LOGIN OR REGISTER FORM */
          <>
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMessage('');
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMessage('');
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {errorMessage && (
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400">
                {errorMessage}
              </div>
            )}

            {tab === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Username or email"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs disabled:opacity-50 transition-all"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Demo: apex / fantasy123</span>
                  <button
                    type="button"
                    onClick={handleQuickDemoLogin}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Auto Fill
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* Charity Entry Fee & Bank Payment Redirects */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                      Charity Entry Fee
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {paymentSettings?.entryFeeGEL || 3}.00 ₾
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tap your bank below to transfer the 3 ₾ entry fee directly to the school charity fund:
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {/* Bank of Georgia Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPaymentLink('bog')}
                      className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-left bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/30 text-orange-700 dark:text-orange-400 transition-colors"
                      title="Open Bank of Georgia eGreve charity page"
                    >
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-tight">Bank of Georgia</div>
                        <div className="text-[9px] font-semibold text-orange-600/80 dark:text-orange-400/80">eGreve Link</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* TBC Bank Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPaymentLink('tbc')}
                      className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-left bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-400 transition-colors"
                      title="Open TBC Bank payment link"
                    >
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-tight">TBC Bank</div>
                        <div className="text-[9px] font-semibold text-sky-600/80 dark:text-sky-400/80">Transfer Link</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Explicit amount reminder since BOG eGreve doesn't prefill the 3 GEL value */}
                  <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5 text-[10px] text-orange-600 dark:text-orange-300 flex items-start gap-1.5">
                    <span className="font-bold shrink-0">💡 Note:</span>
                    <span className="leading-snug">
                      On the Bank of Georgia eGreve page, please enter <strong>3.00 ₾</strong> manually as the transfer amount (თანხა: <strong>3 ₾</strong>).
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. gio_fpl"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="Giorgi"
                      value={regManagerName}
                      onChange={(e) => setRegManagerName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                      Team Name
                    </label>
                    <input
                      type="text"
                      placeholder="FC Komarovi"
                      value={regTeamName}
                      onChange={(e) => setRegTeamName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Activation / Receipt Code */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Ticket className="w-3 h-3 text-emerald-500" />
                      Activation Code
                    </label>
                    {paymentSettings?.requireActivationCode ? (
                      <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider">Required</span>
                    ) : (
                      <span className="text-[9px] font-semibold text-slate-400">Optional / 3 ₾ Receipt</span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. KCL-7X9B"
                    value={regActivationCode}
                    onChange={(e) => setRegActivationCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 uppercase"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    1-time code issued by tournament admins upon payment receipt.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs disabled:opacity-50 transition-all mt-1"
                >
                  {isLoading ? 'Creating...' : 'Register'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
