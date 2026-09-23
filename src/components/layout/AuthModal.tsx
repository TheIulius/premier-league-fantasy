import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Lock, UserCheck, LogOut, Key, User, Mail, ShieldCheck, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { authUser, loginUser, registerUser, logoutUser } = useFPL();
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

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both username/email and password.');
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
      setErrorMessage('All fields are required.');
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
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setLoginIdentifier('apex');
    setLoginPassword('fantasy123');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm md:max-w-md rounded-3xl bg-gradient-to-b from-[#2f0034] to-[#18001b] border border-[#610e6d] p-5 md:p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#00ff87]/20 text-[#00ff87]">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">
              {authUser ? 'Account Profile' : 'Manager Account'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ALREADY LOGGED IN VIEW */}
        {authUser ? (
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-[#00ff87]/20 text-[#00ff87] mx-auto flex items-center justify-center font-black text-lg">
                {authUser.managerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-black text-white text-base">{authUser.teamName}</h4>
                <p className="text-xs text-[#00ff87] font-semibold">{authUser.managerName}</p>
                <p className="text-[11px] text-gray-400">@{authUser.username}</p>
              </div>
            </div>

            <button
              onClick={() => {
                logoutUser();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* LOGIN OR REGISTER FORM */
          <>
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-black/40 rounded-xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMessage('');
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  tab === 'login' ? 'bg-[#00ff87] text-[#37003c]' : 'text-gray-400 hover:text-white'
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
                  tab === 'register' ? 'bg-[#00ff87] text-[#37003c]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {errorMessage && (
              <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-300">
                {errorMessage}
              </div>
            )}

            {tab === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Username or email"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#00ff87] to-[#00cc6a] text-[#37003c] shadow-glow-green hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-400">
                  <span>Demo user: apex / fantasy123</span>
                  <button
                    type="button"
                    onClick={handleQuickDemoLogin}
                    className="text-[#00ff87] font-bold hover:underline"
                  >
                    Auto Fill
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-300 block mb-0.5">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. oliver_pl"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-300 block mb-0.5">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="oliver@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-300 block mb-0.5">
                    Password (min 4 characters)
                  </label>
                  <input
                    type="password"
                    placeholder="Choose secure password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-300 block mb-0.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="Oliver"
                      value={regManagerName}
                      onChange={(e) => setRegManagerName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-300 block mb-0.5">
                      Team Name
                    </label>
                    <input
                      type="text"
                      placeholder="Ollie's XI"
                      value={regTeamName}
                      onChange={(e) => setRegTeamName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#00ff87] to-[#00cc6a] text-[#37003c] shadow-glow-green hover:opacity-90 disabled:opacity-50 transition-all mt-1"
                >
                  {isLoading ? 'Creating Account...' : 'Register & Create Team'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
