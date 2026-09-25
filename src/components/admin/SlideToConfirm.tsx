import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight, Check, AlertTriangle, Loader2 } from 'lucide-react';

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
  confirmLabel = 'Confirmed',
  onConfirm,
  isLoading = false,
  variant = 'danger',
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [maxDrag, setMaxDrag] = useState(200);

  const x = useMotionValue(0);

  useEffect(() => {
    if (containerRef.current) {
      // 52px is handle width
      const width = containerRef.current.clientWidth - 52 - 8;
      setMaxDrag(Math.max(width, 100));
    }
  }, []);

  const variantStyles = {
    danger: {
      bg: 'bg-rose-950/40 border-rose-800/60',
      track: 'bg-rose-500/25',
      handle: 'bg-rose-500 text-white shadow-rose-500/30',
      text: 'text-rose-300',
    },
    warning: {
      bg: 'bg-amber-950/40 border-amber-800/60',
      track: 'bg-amber-500/25',
      handle: 'bg-amber-500 text-slate-950 shadow-amber-500/30',
      text: 'text-amber-300',
    },
    emerald: {
      bg: 'bg-emerald-950/40 border-emerald-800/60',
      track: 'bg-emerald-500/25',
      handle: 'bg-emerald-500 text-slate-950 shadow-emerald-500/30',
      text: 'text-emerald-300',
    },
  }[variant];

  const handleDragEnd = () => {
    if (disabled || isLoading) return;
    if (x.get() >= maxDrag * 0.85) {
      setConfirmed(true);
      x.set(maxDrag);
      try {
        onConfirm();
      } catch (e) {
        setConfirmed(false);
        x.set(0);
      }
    } else {
      x.set(0);
    }
  };

  // Reset confirmation if loading finishes and we want to allow retry
  useEffect(() => {
    if (!isLoading && confirmed) {
      const timer = setTimeout(() => {
        setConfirmed(false);
        x.set(0);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, confirmed, x]);

  return (
    <div
      ref={containerRef}
      className={`relative h-13 w-full rounded-2xl border p-1 select-none overflow-hidden transition-all ${
        disabled
          ? 'opacity-40 pointer-events-none bg-slate-900 border-white/5'
          : variantStyles.bg
      }`}
    >
      {/* Background Track Fill */}
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-xl ${variantStyles.track}`}
        style={{ width: useTransform(x, (val) => `${val + 52}px`) }}
      />

      {/* Center Prompt Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`text-xs font-black uppercase tracking-wider ${variantStyles.text} flex items-center gap-1.5`}>
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
          ) : (
            <>
              <span>{label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 animate-pulse" />
            </>
          )}
        </span>
      </div>

      {/* Draggable Thumb / Handle */}
      {!confirmed && !isLoading && (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: maxDrag }}
          dragElastic={0.05}
          dragMomentum={false}
          style={{ x }}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 1.05 }}
          className={`h-11 w-11 rounded-xl ${variantStyles.handle} shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center z-10`}
        >
          <ChevronRight className="w-5 h-5 font-black" />
        </motion.div>
      )}
    </div>
  );
};
