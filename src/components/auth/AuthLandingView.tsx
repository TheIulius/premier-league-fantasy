import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Lock, Key, User, Eye, Sparkles, Copy, Check, Phone } from 'lucide-react';
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

    setIsLoading(true);
    setErrorMessage('');
    try {
      await registerUser({
        username: regUsername.trim(),
        email: regEmail.trim() || undefined,
        password: regPassword.trim(),
        managerName: regManagerName.trim(),
        teamName: regTeamName.trim(),
      });
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy-to-clipboard feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
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
              {/* Charity Entry Fee & Manual Bank Transfer */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    💳 Charity Entry Fee
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {paymentSettings?.entryFeeGEL || 3}.00 ₾
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Transfer <strong className="text-slate-200">3 ₾</strong> to one of the accounts below. In the transfer description, <strong className="text-amber-400">write your username</strong> so we can verify your payment.
                </p>

                {/* Bank Account Numbers */}
                <div className="space-y-2">
                  {/* BOG Account */}
                  <div className="rounded-xl bg-orange-500/8 border border-orange-500/20 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-orange-400 uppercase tracking-tight">Bank of Georgia (BOG)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('GE61BG0000000764495900', 'bog')}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-orange-500/15 hover:border-orange-500/40 transition-colors group cursor-pointer"
                    >
                      <span className="text-[10px] font-mono font-bold text-orange-300/90 tracking-tight select-all">
                        GE61BG0000000764495900
                      </span>
                      {copiedField === 'bog' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-orange-400/60 group-hover:text-orange-400 shrink-0 transition-colors" />
                      )}
                    </button>
                  </div>

                  {/* TBC Account */}
                  <div className="rounded-xl bg-sky-500/8 border border-sky-500/20 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-sky-400 uppercase tracking-tight">TBC Bank</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('GE33TB7616145061100136', 'tbc')}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-sky-500/15 hover:border-sky-500/40 transition-colors group cursor-pointer"
                    >
                      <span className="text-[10px] font-mono font-bold text-sky-300/90 tracking-tight select-all">
                        GE33TB7616145061100136
                      </span>
                      {copiedField === 'tbc' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-sky-400/60 group-hover:text-sky-400 shrink-0 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Username reminder */}
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-[10px] text-amber-300 flex items-start gap-1.5">
                  <span className="font-bold shrink-0">⚠️</span>
                  <span className="leading-snug">
                    Write your <strong>username</strong> in the transfer description/comment so we can match your payment!
                  </span>
                </div>

                {/* Organizer Contact Info */}
                <div className="rounded-xl bg-slate-800/60 border border-white/5 p-2.5 space-y-2">
                  <p className="text-[10px] font-bold text-slate-300">📞 Contact Organizer</p>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-200 font-semibold">Ilia Shinjiashvili</p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('599100084', 'phone')}
                      className="flex items-center gap-1.5 text-[10px] text-slate-300 hover:text-white transition-colors group cursor-pointer"
                    >
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span className="font-mono font-semibold">599 100 084</span>
                      {copiedField === 'phone' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
                      )}
                    </button>
                    <div className="flex items-center gap-3">
                      <a
                        href="https://www.instagram.com/theiuliuss/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-pink-400 hover:text-pink-300 transition-colors font-semibold"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        @theiuliuss
                      </a>
                      <a
                        href="https://www.instagram.com/k_charity_league/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-pink-400 hover:text-pink-300 transition-colors font-semibold"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        @k_charity_league
                      </a>
                    </div>
                  </div>
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
