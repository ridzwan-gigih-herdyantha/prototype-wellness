'use client';

import React from 'react';
import type { WellnessRecord } from '@/lib/squad/types';
import { wellnessAverage } from '@/lib/wellness/canonical-checkins';
import { Tr } from '@/i18n/page-rest';

export function WellnessBar({ value, size = 'md' }: { value: number | null; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2';
  const gap = size === 'sm' ? 'gap-0.5' : 'gap-[3px]';
  const fillColor = value !== null && value <= 2 ? 'bg-red-400/70' : value !== null && value <= 3 ? 'bg-amber-400/70' : 'bg-emerald-400/70';
  return (
    <div className={`flex ${gap} w-full`}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`${h} flex-1 rounded-full transition-colors ${value !== null && i <= value ? fillColor : 'bg-[#E8E2E1] dark:bg-ink/[0.08]'}`} />
      ))}
    </div>
  );
}

export function MiniSparkline({ history }: { history: WellnessRecord[] }) {
  const points = history.slice(0, 7).reverse();
  if (points.length < 2) return null;
  const values = points.map(record => wellnessAverage(record) ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const h = 24;
  const w = 56;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-14 h-6" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink/30" />
    </svg>
  );
}

export function ComplianceRing({ checked, total }: { checked: number; total: number }) {
  const pct = total > 0 ? checked / total : 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <div className="relative w-[72px] h-[72px] flex items-center justify-center">
      <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-ink/[0.06]" />
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="5" strokeLinecap="round" stroke="currentColor"
          strokeDasharray={circ} strokeDashoffset={offset}
          className={pct >= 0.7 ? 'text-emerald-400/70' : pct >= 0.4 ? 'text-amber-400/70' : 'text-red-400/70'}
        />
      </svg>
      <span className="absolute text-base font-light text-foreground tabular-nums">{checked}/{total}</span>
    </div>
  );
}

export function TeamPulseChart({ pulse }: { pulse: { date: string; avg: number; count: number }[] }) {
  const withData = pulse.filter(p => p.count > 0);
  if (withData.length < 2) return null;
  const maxVal = 5;
  const h = 48;
  const w = pulse.length * 20;

  return (
    <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-ink/40 uppercase tracking-wider font-light"><Tr s={"Team Pulse (14 days)"} /></span>
        <div className="flex items-center gap-3 text-[10px] text-ink/30 font-light">
          <span>1 = poor</span>
          <span>5 = excellent</span>
        </div>
      </div>
      <div className="scroll-x">
        <svg viewBox={`0 0 ${w} ${h + 16}`} className="w-full min-w-[280px]" style={{ height: 80 }} preserveAspectRatio="none">
          <line x1="0" y1={h - (2 / maxVal) * h} x2={w} y2={h - (2 / maxVal) * h} stroke="currentColor" strokeWidth="0.5" className="text-ink/[0.06]" />
          <line x1="0" y1={h - (4 / maxVal) * h} x2={w} y2={h - (4 / maxVal) * h} stroke="currentColor" strokeWidth="0.5" className="text-ink/[0.06]" />
          {pulse.map((p, i) => {
            if (p.count === 0) return null;
            const barH = (p.avg / maxVal) * h;
            const fill = p.avg <= 2 ? 'rgba(248,113,113,0.5)' : p.avg <= 3 ? 'rgba(251,191,36,0.5)' : 'rgba(52,211,153,0.4)';
            return (
              <g key={p.date}>
                <rect x={i * 20 + 4} y={h - barH} width={12} height={barH} rx={3} fill={fill} />
                <text x={i * 20 + 10} y={h + 12} textAnchor="middle" className="fill-ink/25" style={{ fontSize: 7 }}>
                  {new Date(p.date).getDate()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
