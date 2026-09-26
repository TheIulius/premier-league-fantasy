import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Lock, Key, User, ExternalLink, Ticket, CreditCard, Eye, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AuthLandingView: React.FC = () => {
  const { loginUser, registerUser, paymentSettings, enterDemoMode } = useFPL();
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter your username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      await loginUser(loginIdentifier.trim(), loginPassword.trim());
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
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
      setErrorMessage(
        `An activation code is required. Please transfer ${paymentSettings.entryFeeGEL || 3} ₾ via BOG or TBC to receive your code.`
      );
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
      alert(
        `${
          bank === 'bog' ? 'Bank of Georgia' : 'TBC Bank'
        } direct link will be activated shortly. Please contact Komarovi organizers directly for the account details.`
      );
    }
  };

  const handleQuickDemoLogin = () => {
    setLoginIdentifier('apex');
    setLoginPassword('fantasy123');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 select-none relative overflow-hidden">
      {/* Ambient pitch glow background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-sky-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md mx-auto space-y-5 relative z-10 my-auto py-6">
        {/* Tournament Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="flex items-center justify-center space-x-3">
            <img
              src="/kcl-logo.png"
              alt="Komarovi Charity League"
              className="w-16 h-16 rounded-2xl object-contain shadow-xl border border-white/10"
            />
            <img
              src="/komarovi-logo.png"
              alt="Komarovi School"
              className="h-10 w-auto object-contain opacity-85"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-display">
              Komarovi <span className="text-emerald-400">Charity League</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Official School Fantasy Football Tournament</p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl text-xs font-bold border border-white/5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage('');
              }}
              className={`py-2 rounded-xl transition-all ${
                tab === 'login'
                  ? 'bg-slate-800 text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
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
              className={`py-2 rounded-xl transition-all ${
                tab === 'register'
                  ? 'bg-slate-800 text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-400 animate-shake">
              {errorMessage}
            </div>
          )}

          {tab === 'login' ? (
            /* SIGN IN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Username or Email</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md disabled:opacity-50 transition-all cursor-pointer font-black"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-400">
                <span>Demo account: apex / fantasy123</span>
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Auto Fill
                </button>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Charity Entry Fee & Bank Payment Redirects */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    Charity Entry Fee
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {paymentSettings?.entryFeeGEL || 3}.00 ₾
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Tap below to transfer the 3 ₾ entry fee to the school charity fund:
                </p>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {/* Bank of Georgia Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenPaymentLink('bog')}
                    className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-left bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/30 text-orange-400 transition-colors"
                    title="Open Bank of Georgia eGreve charity page"
                  >
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-tight">Bank of Georgia</div>
                      <div className="text-[9px] font-semibold text-orange-400/80">eGreve Link</div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* TBC Bank Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenPaymentLink('tbc')}
                    className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-left bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/30 text-sky-400 transition-colors"
                    title="Open TBC Bank payment link"
                  >
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-tight">TBC Bank</div>
                      <div className="text-[9px] font-semibold text-sky-400/80">Transfer Link</div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Explicit amount reminder since BOG eGreve doesn't prefill the 3 GEL value */}
                <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5 text-[10px] text-orange-300 flex items-start gap-1.5">
                  <span className="font-bold shrink-0">💡 Note:</span>
                  <span className="leading-snug">
                    On the Bank of Georgia eGreve page, please enter <strong>3.00 ₾</strong> manually as the transfer amount (თანხა: <strong>3 ₾</strong>).
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-0.5">Username</label>
                <input
                  type="text"
                  placeholder="e.g. gio_fpl"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-0.5">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-0.5">Password</label>
                <input
                  type="password"
                  placeholder="Create password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-0.5">Your Name</label>
                  <input
                    type="text"
                    placeholder="Giorgi"
                    value={regManagerName}
                    onChange={(e) => setRegManagerName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-0.5">Team Name</label>
                  <input
                    type="text"
                    placeholder="FC Komarovi"
                    value={regTeamName}
                    onChange={(e) => setRegTeamName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Activation / Receipt Code */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                    <Ticket className="w-3 h-3 text-emerald-400" />
                    Activation Code
                  </label>
                  {paymentSettings?.requireActivationCode ? (
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider">Required</span>
                  ) : (
                    <span className="text-[9px] font-semibold text-slate-400">Optional / 3 ₾ Receipt</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. KCL-7X9B"
                  value={regActivationCode}
                  onChange={(e) => setRegActivationCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono font-bold tracking-wider text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase"
                />
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Single-use code given upon 3 ₾ payment confirmation.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md disabled:opacity-50 transition-all mt-1 font-black cursor-pointer"
              >
                {isLoading ? 'Creating...' : 'Register & Create Team'}
              </button>
            </form>
          )}
        </div>

        {/* OR DEMO PREVIEW BUTTON */}
        <div className="space-y-3 pt-1">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-slate-950 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Or Preview
            </span>
          </div>

          <button
            type="button"
            onClick={enterDemoMode}
            className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white transition-all group flex flex-col items-center justify-center space-y-0.5 cursor-pointer shadow-lg active:scale-98"
          >
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-400 group-hover:text-amber-300">
              <Eye className="w-4 h-4" />
              <span>Explore in Demo Mode</span>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Browse locked sample team, pitch, transfer market, standings and fixtures without logging in.
            </p>
          </button>
        </div>

        {/* Footer info */}
        <footer className="text-center text-[10px] text-slate-500 space-y-1 pt-2">
          <p>© Komarovi Charity League (KCL) • Created by Theiulius & Chaga</p>
        </footer>
      </div>
    </div>
  );
};
