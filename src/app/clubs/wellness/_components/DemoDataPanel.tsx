'use client';

import React, { useState } from 'react';
import { Database } from 'lucide-react';
import { clearWellnessData, loadDemoData } from '@/lib/store/demo-data';

export default function DemoDataPanel({ onChange }: { onChange: (loaded: boolean) => void }) {
  const [collapsed, setCollapsed] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleLoad = () => {
    loadDemoData();
    onChange(true);
    window.scrollTo({ top: 0 });
  };

  const handleClear = () => {
    clearWellnessData();
    setConfirmClear(false);
    onChange(false);
  };

  return (
    <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-dashed border-line overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-hover transition-colors">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-ink/40" />
          <h3 className="text-sm font-medium text-foreground">Prototype Data</h3>
          <span className="text-[10px] text-ink/40 font-light">Stored in this browser</span>
        </div>
        <span className="text-ink/25 text-xs">{collapsed ? 'Show' : 'Hide'}</span>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 space-y-4">
          <p className="text-xs text-ink/50 font-light max-w-xl">
            Load 14 days of check-ins, meals and nutrition plans for the full squad to preview Team Pulse, alerts and trends.
            Loading replaces any check-ins and plans already saved here.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoad}
              className="px-4 py-2 bg-background/60 backdrop-blur-sm border border-line text-ink/80 hover:bg-surface-overlay hover:shadow rounded-2xl text-sm font-medium transition-all"
            >
              Load demo data
            </button>
            {confirmClear ? (
              <>
                <span className="text-[11px] text-ink/50 font-light">Delete all wellness data?</span>
                <button onClick={handleClear} className="px-3 py-1.5 text-[11px] rounded-xl bg-red-500/10 text-red-500/80 hover:bg-red-500/20 transition-colors">
                  Delete
                </button>
                <button onClick={() => setConfirmClear(false)} className="px-3 py-1.5 text-[11px] rounded-xl text-ink/50 hover:bg-hover transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="px-3 py-2 text-xs text-ink/40 hover:text-ink/70 transition-colors">
                Clear all data
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
