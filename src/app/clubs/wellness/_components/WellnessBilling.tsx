'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, MessageCircle, Shield, Utensils, Activity, Check } from 'lucide-react';
import { Tr } from '@/i18n/page-rest';
import { activateBilling, getBilling, updateSeats } from '@/lib/store/billing-store';

interface WellnessBillingProps {
  userTier: string;
}

interface BillingState {
  active: boolean;
  firstTeamSeats: number;
  academySeats: number;
  billingInterval: 'month' | 'year';
}

const FT_MONTHLY = 9;
const AC_MONTHLY = 4;
const FT_ANNUAL_MO = 7.5;
const AC_ANNUAL_MO = 3.3;

const QUICK_PICKS = [15, 25, 50, 100];

const FEATURES = [
  { icon: MessageCircle, label: 'Daily WhatsApp check-ins', desc: 'Players report sleep, soreness, and energy in 30 seconds' },
  { icon: Utensils, label: 'AI nutrition plans', desc: 'Personalized 7-day meal plans generated per player' },
  { icon: Activity, label: 'Injury risk detection', desc: 'Automatic alerts when players trend toward injury risk' },
  { icon: Shield, label: 'Safeguarding built in', desc: 'Parental consent for minors, 10 languages, GDPR compliant' },
];

function QuickPickRow({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <p className="text-xs text-ink/50 font-light mb-2">{label}</p>
      <div className="flex items-center gap-0 mb-2 w-fit">
        <button onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 flex items-center justify-center rounded-l-lg border border-line bg-ink/[0.03] text-ink/40 hover:text-foreground hover:bg-ink/[0.08] transition-colors text-sm font-light">
          -
        </button>
        <input type="number" min={0} value={value} onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-14 h-9 px-1 border-y border-line bg-ink/[0.03] text-sm text-foreground font-light text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        <button onClick={() => onChange(value + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-r-lg border border-line bg-ink/[0.03] text-ink/40 hover:text-foreground hover:bg-ink/[0.08] transition-colors text-sm font-light">
          +
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PICKS.map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`px-3 py-1.5 rounded-lg text-xs tabular-nums font-light transition-all active:scale-95 ${
              value === n
                ? 'bg-ink/[0.1] text-foreground border border-ink/20'
                : 'bg-ink/[0.03] border border-line text-ink/40 hover:text-ink/60 hover:border-ink/15'
            }`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WellnessBilling({ userTier }: WellnessBillingProps) {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [ftSeats, setFtSeats] = useState(0);
  const [acSeats, setAcSeats] = useState(0);
  const [interval, setInterval] = useState<'month' | 'year'>('year');
  const [collapsed, setCollapsed] = useState(true);
  const [fetched, setFetched] = useState(false);
  const isEnterprise = userTier === 'club';

  const loadBilling = useCallback(async () => {
    const data = await getBilling();
    if (data.billing) {
      setBilling(data.billing);
      setFtSeats(data.billing.firstTeamSeats || 0);
      setAcSeats(data.billing.academySeats || 0);
      setInterval(data.billing.billingInterval || 'year');
    }
    setLoading(false);
  }, []);

  const fetchBilling = useCallback(async () => {
    if (fetched) return;
    setFetched(true);
    await loadBilling();
  }, [fetched, loadBilling]);

  // Fetch on first expand
  useEffect(() => { if (!collapsed) fetchBilling(); }, [collapsed, fetchBilling]);

  const ftRate = interval === 'year' ? FT_ANNUAL_MO : FT_MONTHLY;
  const acRate = interval === 'year' ? AC_ANNUAL_MO : AC_MONTHLY;
  const monthlyTotal = (ftSeats * ftRate) + (acSeats * acRate);
  const annualTotal = monthlyTotal * 12;

  const handleCheckout = async () => {
    if (ftSeats === 0 && acSeats === 0) return;
    setCheckoutLoading(true);
    try {
      await activateBilling(ftSeats, acSeats, interval);
      await loadBilling();
    } catch (err) { console.error('Wellness checkout failed:', err); }
    setCheckoutLoading(false);
  };

  const handleSeatUpdate = async () => {
    setCheckoutLoading(true);
    try {
      await updateSeats(ftSeats, acSeats);
      await loadBilling();
    } catch (err) { console.error('Wellness seat update failed:', err); }
    setCheckoutLoading(false);
  };

  if (loading && !collapsed) {
    return (
      <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-line overflow-hidden">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-hover transition-colors">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-4 h-4 text-ink/40" />
            <h3 className="text-sm font-medium text-foreground"><Tr s={"Wellness Tracking"} /></h3>
          </div>
          <span className="text-ink/25 text-xs">Hide</span>
        </button>
        <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-ink/30" /></div>
      </div>
    );
  }

  // Non-Enterprise: upgrade CTA
  if (!isEnterprise) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-6 sm:p-8 text-center">
          <MessageCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-4" />
          <h2 className="text-lg font-light text-foreground mb-2"><Tr s={"WhatsApp Wellness Tracking"} /></h2>
          <p className="text-sm text-ink/50 font-light max-w-md mx-auto mb-6">
            Capture daily sleep, soreness, and nutrition data from your players via WhatsApp. No app download required.
          </p>
          <a href="/pricing" className="inline-block px-6 py-2.5 bg-ink/80 text-background dark:bg-ink/[0.14] dark:text-foreground rounded-2xl text-sm font-medium hover:bg-ink/90 transition-all active:scale-95">
            View Plans
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(f => (
            <div key={f.label} className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-4 flex gap-3">
              <f.icon className="w-5 h-5 text-ink/25 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-light text-foreground">{f.label}</p>
                <p className="text-[11px] text-ink/40 font-light mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active subscription: manage seats
  if (billing?.active) {
    const seatsChanged = ftSeats !== billing.firstTeamSeats || acSeats !== billing.academySeats;
    const currentMonthly = ((billing.firstTeamSeats ?? 0) * ftRate) + ((billing.academySeats ?? 0) * acRate);

    return (
      <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-line overflow-hidden">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-hover transition-colors">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-4 h-4 text-ink/40" />
            <h3 className="text-sm font-medium text-foreground"><Tr s={"Wellness Tracking"} /></h3>
            <span className="text-[10px] text-emerald-500/70 font-light">Active</span>
          </div>
          <span className="text-ink/25 text-xs">{collapsed ? 'Show' : 'Hide'}</span>
        </button>
        {!collapsed && (
          <div className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-4 text-center">
                <span className="text-2xl font-light text-foreground tabular-nums">{billing.firstTeamSeats}</span>
                <p className="text-[10px] text-ink/40 font-light mt-1"><Tr s={"First team seats"} /></p>
              </div>
              <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-4 text-center">
                <span className="text-2xl font-light text-foreground tabular-nums">{billing.academySeats}</span>
                <p className="text-[10px] text-ink/40 font-light mt-1"><Tr s={"Academy seats"} /></p>
              </div>
              <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-4 text-center">
                <span className="text-2xl font-light text-foreground tabular-nums">EUR {currentMonthly.toFixed(0)}</span>
                <p className="text-[10px] text-ink/40 font-light mt-1">/month</p>
              </div>
              <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-4 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] text-emerald-500/70 uppercase tracking-wider font-medium px-2.5 py-1 bg-emerald-500/10 rounded-full">Active</span>
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-5 space-y-4">
              <p className="text-[10px] text-ink/40 uppercase tracking-wider font-light"><Tr s={"Adjust Seats"} /></p>
              <QuickPickRow value={ftSeats} onChange={setFtSeats} label="First team players" />
              <QuickPickRow value={acSeats} onChange={setAcSeats} label="Academy players" />
              {seatsChanged && (
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleSeatUpdate} disabled={checkoutLoading}
                    className="px-4 py-2 bg-ink/80 text-background dark:bg-ink/[0.14] dark:text-foreground rounded-2xl text-sm font-medium hover:bg-ink/90 transition-all disabled:opacity-30 active:scale-95">
                    {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Seats'}
                  </button>
                  <span className="text-[11px] text-ink/40 font-light tabular-nums"><Tr s={"New total:"} /> EUR {monthlyTotal.toFixed(0)}<Tr s={"/mo"} /></span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // No subscription: pricing calculator with quick-add
  return (
    <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-line overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-hover transition-colors">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-4 h-4 text-ink/40" />
          <h3 className="text-sm font-medium text-foreground"><Tr s={"Wellness Tracking"} /></h3>
          <span className="text-[10px] text-ink/35 font-light"><Tr s={"Not activated"} /></span>
        </div>
        <span className="text-ink/25 text-xs">{collapsed ? 'Show' : 'Hide'}</span>
      </button>
      {!collapsed && (
        <div className="px-5 pb-5 space-y-6">
          <div className="max-w-lg">
            <p className="text-sm text-ink/50 font-light mb-5">
              Daily WhatsApp check-ins for sleep, soreness, and nutrition. Per-player pricing that adjusts as your squad changes.
            </p>
            <div className="space-y-2 mb-6">
              {FEATURES.map(f => (
                <div key={f.label} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500/60 flex-shrink-0" />
                  <span className="text-xs text-ink/60 font-light">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interval toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface-elevated border border-line w-fit">
            <button onClick={() => setInterval('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-light transition-colors ${interval === 'year' ? 'bg-active text-foreground' : 'text-ink/50 hover:bg-hover'}`}>
              Annual (save 17%)
            </button>
            <button onClick={() => setInterval('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-light transition-colors ${interval === 'month' ? 'bg-active text-foreground' : 'text-ink/50 hover:bg-hover'}`}>
              Monthly
            </button>
          </div>

          {/* Pricing + quick picks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-baseline gap-0.5 mb-3">
                <span className="text-sm text-ink/40 font-light">EUR</span>
                <span className="text-xl font-light text-foreground tabular-nums">{ftRate.toFixed(ftRate % 1 === 0 ? 0 : 2)}</span>
                <span className="text-[11px] text-ink/40 font-light">/player/mo</span>
              </div>
              <QuickPickRow value={ftSeats} onChange={setFtSeats} label="First team players" />
            </div>
            <div>
              <div className="flex items-baseline gap-0.5 mb-3">
                <span className="text-sm text-ink/40 font-light">EUR</span>
                <span className="text-xl font-light text-foreground tabular-nums">{acRate.toFixed(acRate % 1 === 0 ? 0 : 2)}</span>
                <span className="text-[11px] text-ink/40 font-light">/player/mo</span>
              </div>
              <QuickPickRow value={acSeats} onChange={setAcSeats} label="Academy players" />
            </div>
          </div>

          {/* Total */}
          {(ftSeats > 0 || acSeats > 0) && (
            <div className="border-t border-line pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-ink/40 font-light mr-0.5">EUR</span>
                  <span className="text-2xl text-foreground font-extralight tabular-nums">{monthlyTotal.toFixed(0)}</span>
                  <span className="text-xs text-ink/50 font-light">/month</span>
                  {interval === 'year' && <span className="text-xs text-ink/40 font-light ml-2">(EUR {annualTotal.toFixed(0)}<Tr s={"/year"} />)</span>}
                </div>
                <p className="text-[10px] text-ink/40 font-light mt-0.5">
                  {ftSeats} first team + {acSeats} academy
                </p>
              </div>
              <button onClick={handleCheckout} disabled={checkoutLoading}
                className="px-6 py-2.5 bg-ink/80 text-background dark:bg-ink/[0.14] dark:text-foreground rounded-2xl text-sm font-medium hover:bg-ink/90 transition-all disabled:opacity-30 active:scale-95 w-full sm:w-auto">
                {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Activate Wellness'}
              </button>
            </div>
          )}

          {(ftSeats === 0 && acSeats === 0) && (
            <p className="text-[11px] text-ink/30 font-light text-center"><Tr s={"Select the number of players above to see pricing"} /></p>
          )}
        </div>
      )}
    </div>
  );
}
