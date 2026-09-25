import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Users, Plus, Check, X } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Managers
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400">
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
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-slate-900 dark:text-white font-bold'
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{m.teamName}</div>
                      <div className="text-[10px] text-slate-400">{m.managerName}</div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-emerald-500" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>New Team</span>
            </button>
          </>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Fantasy Team Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dream XI"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="w-1/3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs"
              >
                Create
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
