import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Users, Plus, Check, X, Shield } from 'lucide-react';

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManagerModal: React.FC<ManagerModalProps> = ({ isOpen, onClose }) => {
  const { currentManager, availableManagers, switchManager, registerManager } = useFPL();
  const [isCreating, setIsCreating] = useState(false);
  const [managerName, setManagerName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerName.trim() || !teamName.trim()) {
      setErrorMsg('Please enter both your name and team name.');
      return;
    }

    try {
      await registerManager(managerName.trim(), teamName.trim());
      setIsCreating(false);
      setManagerName('');
      setTeamName('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create team');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#300035] to-[#1a001d] border border-[#5d0e68] p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00ff87]" />
            <h3 className="text-sm font-black text-white uppercase tracking-tight">
              Manager Profiles
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-300">
            {errorMsg}
          </div>
        )}

        {!isCreating ? (
          <>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {availableManagers.map((m) => {
                const isActive = currentManager?.id === m.id;

                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      switchManager(m.id);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                      isActive
                        ? 'bg-[#00ff87]/20 border-[#00ff87] text-white shadow-glow-green'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-white">{m.teamName}</div>
                      <div className="text-[10px] text-gray-400">{m.managerName}</div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-[#00ff87]" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-1.5 border border-white/10"
            >
              <Plus className="w-4 h-4 text-[#00ff87]" />
              <span>Create New Friend Team</span>
            </button>
          </>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-300 block mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Liam or Alex"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 block mb-1">
                Fantasy Team Name
              </label>
              <input
                type="text"
                placeholder="e.g. Liam's XI or Gunners FC"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="w-1/3 py-2 rounded-xl text-xs font-bold text-gray-400 bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider bg-[#00ff87] text-[#37003c] shadow-glow-green"
              >
                Join Game
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
