'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Utensils } from 'lucide-react';

const STEPS = [
  'Reading player profile',
  'Calculating calorie targets',
  'Balancing macros for training load',
  'Building 7-day menu',
  'Adding hydration and supplements',
];

const STEP_MS = 650;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function GeneratingPlan({ playerName }: { playerName: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <motion.span
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex-shrink-0"
          >
            <Utensils className="w-4 h-4 text-emerald-500/70" />
          </motion.span>
          <span className="text-sm font-medium text-foreground truncate">{playerName}</span>
          <span className="text-[10px] text-ink/35 font-light">Generating plan...</span>
        </div>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-ink/40" />
      </div>

      <div className="h-0.5 bg-ink/[0.04]">
        <motion.div
          className="h-full bg-emerald-500/60"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="px-5 py-5 grid gap-6 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <ul className="space-y-2.5">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className="flex items-center gap-2.5">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  done ? 'bg-emerald-500/15' : active ? 'bg-ink/[0.06]' : 'bg-ink/[0.03]'
                }`}>
                  {done && <Check className="w-2.5 h-2.5 text-emerald-500/80" />}
                  {active && <Loader2 className="w-2.5 h-2.5 animate-spin text-ink/50" />}
                </span>
                <span className={`text-[11px] font-light transition-colors ${
                  done ? 'text-ink/40' : active ? 'text-foreground' : 'text-ink/25'
                }`}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="space-y-4 animate-pulse min-w-0" aria-hidden="true">
          <div className="space-y-1.5">
            <div className="h-2.5 w-full rounded bg-ink/[0.05]" />
            <div className="h-2.5 w-2/3 rounded bg-ink/[0.05]" />
          </div>
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500/20 w-[25%]" />
            <div className="bg-amber-400/20 w-[50%]" />
            <div className="bg-rose-400/20 w-[25%]" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map(d => (
              <div key={d} className="flex flex-col items-center px-3 py-2 rounded-xl border border-line">
                <span className="text-[11px] font-medium text-ink/20">{d}</span>
                <span className="mt-1 h-1.5 w-8 rounded bg-ink/[0.05]" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-line overflow-hidden">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex gap-3 px-4 py-3 border-b border-ink/[0.04] last:border-0">
                <div className="w-20 sm:w-24 flex-shrink-0 space-y-1.5">
                  <div className="h-2.5 w-14 rounded bg-ink/[0.06]" />
                  <div className="h-2 w-10 rounded bg-ink/[0.04]" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-full rounded bg-ink/[0.04]" />
                  <div className="h-2.5 w-1/2 rounded bg-ink/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
