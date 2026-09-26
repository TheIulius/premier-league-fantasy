import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Clock, Copy, Check, Phone, RefreshCw, LogOut } from 'lucide-react';

export const PendingApprovalOverlay: React.FC = () => {
  const { authUser, logoutUser, refreshServerState, checkAuthSession } = useFPL();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
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

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setStatusMessage(null);
    try {
      const isApprovedNow = await checkAuthSession();
      if (isApprovedNow) {
        setStatusMessage('🎉 Your account is approved! Unlocking your team...');
        return;
      }
      refreshServerState();
      setStatusMessage('Still awaiting approval. We will activate your account as soon as your transfer is verified!');
    } catch {
      setStatusMessage('Could not verify status. Please try again shortly.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-md my-auto rounded-3xl bg-slate-900 border border-amber-500/30 p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100">
        {/* Pulsing Header Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Account Under Review</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">ID: {authUser?.username}</span>
        </div>

        {/* Title & Message */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            Your account is being approved
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Welcome <strong className="text-emerald-400">@{authUser?.username}</strong>! Your team{' '}
            <strong className="text-white font-semibold">"{authUser?.teamName}"</strong> has been created.
            Please transfer the <strong className="text-amber-300 font-bold">3 ₾</strong> charity league entry fee so the organizers can approve your account and activate your team.
          </p>
        </div>

        {/* Bank Details Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-200">💳 Charity Entry Fee Accounts</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              3.00 ₾
            </span>
          </div>

          <div className="space-y-2">
            {/* BOG */}
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/25 p-2">
              <span className="text-[9px] font-black text-orange-400 uppercase tracking-tight block mb-1">
                Bank of Georgia (BOG)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard('GE61BG0000000764495900', 'bog')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-orange-500/20 hover:border-orange-500/50 transition-colors group cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-orange-200 tracking-tight">
                  GE61BG0000000764495900
                </span>
                {copiedField === 'bog' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-orange-400/70 group-hover:text-orange-400 shrink-0" />
                )}
              </button>
            </div>

            {/* TBC */}
            <div className="rounded-xl bg-sky-500/10 border border-sky-500/25 p-2">
              <span className="text-[9px] font-black text-sky-400 uppercase tracking-tight block mb-1">
                TBC Bank
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard('GE33TB7616145061100136', 'tbc')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-sky-500/20 hover:border-sky-500/50 transition-colors group cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-sky-200 tracking-tight">
                  GE33TB7616145061100136
                </span>
                {copiedField === 'tbc' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-sky-400/70 group-hover:text-sky-400 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Description Warning */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-2.5 py-2 text-[10px] text-amber-300 flex items-start gap-1.5">
            <span className="font-bold shrink-0">⚠️ Notice:</span>
            <span className="leading-snug">
              In the transfer description / comment, please write: <strong className="text-white underline">@{authUser?.username}</strong> so we can instantly identify your payment.
            </span>
          </div>
        </div>

        {/* Contacts Section */}
        <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-3 space-y-3">
          <p className="text-[11px] font-bold text-slate-300">📞 Organizer Contacts</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Organizer 1: Ilia */}
            <div className="rounded-xl bg-slate-900/90 border border-white/5 p-2.5 space-y-1.5">
              <p className="text-[11px] text-white font-bold">Ilia Shinjiashvili</p>
              <button
                type="button"
                onClick={() => copyToClipboard('599100084', 'phone1')}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors group cursor-pointer w-full"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono font-bold text-[11px]">599 100 084</span>
                {copiedField === 'phone1' ? (
                  <Check className="w-3 h-3 text-emerald-400 ml-auto shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300 ml-auto shrink-0" />
                )}
              </button>
              <a
                href="https://www.instagram.com/theiuliuss/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-pink-400 hover:text-pink-300 transition-colors font-semibold"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                <span>@theiuliuss</span>
              </a>
            </div>

            {/* Organizer 2: Nika */}
            <div className="rounded-xl bg-slate-900/90 border border-white/5 p-2.5 space-y-1.5">
              <p className="text-[11px] text-white font-bold">Nika Chagalidze</p>
              <button
                type="button"
                onClick={() => copyToClipboard('557814114', 'phone2')}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors group cursor-pointer w-full"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono font-bold text-[11px]">557 814 114</span>
                {copiedField === 'phone2' ? (
                  <Check className="w-3 h-3 text-emerald-400 ml-auto shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300 ml-auto shrink-0" />
                )}
              </button>
              <a
                href="https://www.instagram.com/nika.chagalidze7/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-pink-400 hover:text-pink-300 transition-colors font-semibold"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                <span>@nika.chagalidze7</span>
              </a>
            </div>
          </div>

          {/* League Official Instagram */}
          <div className="pt-1 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Official Page:</span>
            <a
              href="https://www.instagram.com/k_charity_league/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition-colors font-bold"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              <span>@k_charity_league</span>
            </a>
          </div>
        </div>

        {/* Status Feedback */}
        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-center text-slate-300">
            {statusMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking Approval...' : 'Check Approval Status'}</span>
          </button>

          <button
            type="button"
            onClick={logoutUser}
            className="w-full py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
