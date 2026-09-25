import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Loader2 } from 'lucide-react';

interface SlideToConfirmProps {
  label: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'emerald';
  disabled?: boolean;
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  label,
  confirmLabel = 'Confirmed!',
  onConfirm,
  isLoading = false,
  variant = 'danger',
  disabled = false,
}) => {
  const [sliderVal, setSliderVal] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [armed, setArmed] = useState(false);

  const variantStyles = {
    danger: {
      bg: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500/60',
      track: 'bg-rose-500/30',
      handle: 'bg-rose-500 text-white shadow-rose-500/30',
      text: 'text-rose-300',
      btn: 'bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border-rose-500/40',
    },
    warning: {
      bg: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
      track: 'bg-amber-500/30',
      handle: 'bg-amber-500 text-slate-950 shadow-amber-500/30',
      text: 'text-amber-300',
      btn: 'bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-slate-950 border-amber-500/40',
    },
    emerald: {
      bg: 'bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-500/60',
      track: 'bg-emerald-500/30',
      handle: 'bg-emerald-500 text-slate-950 shadow-emerald-500/30',
      text: 'text-emerald-300',
      btn: 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-200 hover:text-slate-950 border-emerald-500/40',
    },
  }[variant];

  const triggerConfirm = async () => {
    if (disabled || isLoading || confirmed) return;
    setConfirmed(true);
    setArmed(false);
    setSliderVal(100);
    try {
      await onConfirm();
    } catch {
      setConfirmed(false);
      setSliderVal(0);
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isLoading || confirmed) return;
    const val = Number(e.target.value);
    setSliderVal(val);
    if (val >= 85) {
      triggerConfirm();
    }
  };

  const handleRelease = () => {
    if (disabled || isLoading || confirmed) return;
    if (sliderVal >= 70) {
      triggerConfirm();
    } else {
      setSliderVal(0);
    }
  };

  useEffect(() => {
    if (!isLoading && confirmed) {
      const timer = setTimeout(() => {
        setConfirmed(false);
        setSliderVal(0);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, confirmed]);

  return (
    <div
      className={`relative h-13 w-full rounded-2xl border p-1 select-none overflow-hidden transition-all ${
        disabled
          ? 'opacity-40 pointer-events-none bg-slate-900 border-white/5'
          : variantStyles.bg
      }`}
    >
      {/* Background Track Progress Fill */}
      <div
        className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-75 ${variantStyles.track}`}
        style={{ width: `${Math.max(sliderVal, confirmed ? 100 : 8)}%` }}
      />

      {/* Center Prompt Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-14">
        <span className={`text-xs font-black uppercase tracking-wider ${variantStyles.text} flex items-center gap-1.5 truncate`}>
          {confirmed || isLoading ? (
            isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{confirmLabel}</span>
              </>
            )
          ) : armed ? (
            <>
              <span>Tap Confirm or Slide to Execute</span>
              <ChevronRight className="w-3.5 h-3.5 animate-bounce" />
            </>
          ) : (
            <>
              <span>{label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 animate-pulse" />
            </>
          )}
        </span>
      </div>

      {/* Visual Thumb Handle */}
      {!confirmed && !isLoading && (
        <div
          style={{
            left: `calc(${sliderVal}% - ${(sliderVal * 44) / 100}px + 4px)`,
          }}
          className={`absolute top-1 h-11 w-11 rounded-xl ${variantStyles.handle} shadow-lg flex items-center justify-center pointer-events-none transition-all duration-75 z-10`}
        >
          <ChevronRight className="w-5 h-5 font-black" />
        </div>
      )}

      {/* Native Range Input Overlay for 100% Reliable Touch & Mouse Dragging */}
      {!confirmed && !isLoading && (
        <input
          type="range"
          min={0}
          max={100}
          value={sliderVal}
          onChange={handleRangeChange}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          onClick={() => {
            if (sliderVal < 15) {
              if (armed) {
                triggerConfirm();
              } else {
                setArmed(true);
              }
            }
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing z-20"
        />
      )}

      {/* Quick Confirm Button on the Right when clicked/hovered */}
      {!confirmed && !isLoading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerConfirm();
          }}
          className={`absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all z-30 ${variantStyles.btn}`}
        >
          {armed ? 'Confirm ✓' : 'Run'}
        </button>
      )}
    </div>
  );
};
