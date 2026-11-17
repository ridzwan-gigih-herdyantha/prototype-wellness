'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Printer, Send, Utensils, RefreshCw, Plus } from 'lucide-react';
import QAWizard from '@/components/clubs-ui/QAWizard';
import type { WizardStep } from '@/components/clubs-ui/QAWizard';
import { SelectModern } from '@/components/ui/select-modern';
import { Tr, usePageRest } from '@/i18n/page-rest';
import { InfiniteSentinel } from '@/components/ui/InfiniteSentinel';
import GeneratingPlan from './GeneratingPlan';
import { addPlan, listPlans, updatePlan } from '@/lib/store/nutrition-store';
import { estimateMeal, generatePlan, swapOptions as mockSwapOptions } from '@/lib/store/mock-ai';
import type { MealPlan } from '@/lib/store/nutrition-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const PLANS_PAGE_SIZE = 10;

interface NutritionSectionProps {
  playerNames: string[];
}

// ---------------------------------------------------------------------------
// Wizard steps
// ---------------------------------------------------------------------------

const POSITION_OPTIONS = [
  { value: 'GK', label: 'Goalkeeper' },
  { value: 'CB', label: 'Centre-Back' },
  { value: 'FB', label: 'Full-Back' },
  { value: 'CM', label: 'Central Midfield' },
  { value: 'CAM', label: 'Attacking Midfield' },
  { value: 'W', label: 'Winger' },
  { value: 'ST', label: 'Striker' },
];

function buildWizardSteps(playerNames: string[]): WizardStep[] {
  return [
    {
      key: 'playerName',
      question: 'Which player is this nutrition plan for?',
      placeholder: 'Select player...',
      inputType: 'select',
      options: playerNames.map(n => ({ value: n, label: n })),
      required: true,
    },
    {
      key: 'position',
      question: 'What position do they play?',
      placeholder: 'Select position...',
      inputType: 'searchable',
      allowCustom: false,
      options: POSITION_OPTIONS,
      required: true,
    },
    {
      key: 'weight',
      question: 'Current weight in kg?',
      placeholder: 'e.g. 78',
      inputType: 'text',
      required: false,
    },
    {
      key: 'targetWeight',
      question: 'Target weight in kg? (leave blank if maintaining)',
      placeholder: 'e.g. 75',
      inputType: 'text',
      required: false,
    },
    {
      key: 'dietaryNotes',
      question: 'Any dietary requirements, restrictions, or food allergies?',
      placeholder: 'e.g. Halal, no nuts, lactose intolerant, vegetarian...',
      inputType: 'text',
      required: false,
    },
    {
      key: 'foodDislikes',
      question: 'Any foods they dislike or refuse to eat?',
      placeholder: 'e.g. mushrooms, liver, fish, broccoli...',
      inputType: 'text',
      required: false,
    },
    {
      key: 'foodPreferences',
      question: 'Favourite foods or meals they enjoy?',
      placeholder: 'e.g. pasta dishes, grilled chicken, smoothies...',
      inputType: 'text',
      required: false,
    },
    {
      key: 'mealsPerDay',
      question: 'How many meals per day does the player prefer?',
      placeholder: 'e.g. 3 main + 2 snacks',
      inputType: 'text',
      required: false,
    },
    {
      key: 'injuryStatus',
      question: 'Current injury status?',
      placeholder: 'e.g. Fit, recovering from hamstring strain, knee rehab...',
      inputType: 'text',
      required: false,
    },
    {
      key: 'language',
      question: 'What language should the meal plan be written in?',
      placeholder: 'e.g. English, Slovenian, Spanish...',
      inputType: 'text',
      required: false,
    },
  ];
}

// ---------------------------------------------------------------------------
// Plan viewer
// ---------------------------------------------------------------------------

function PlanViewer({ plan, onShare, onUpdatePlan }: { plan: MealPlan; onShare: (plan: MealPlan) => void; onUpdatePlan: (plan: MealPlan) => void }) {
  const [activeDay, setActiveDay] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [swapping, setSwapping] = useState<string | null>(null); // "dayIdx-mealIdx"
  const [swapOptions, setSwapOptions] = useState<{ items: string[]; calories: number; protein_g: number; carbs_g: number; fat_g: number }[]>([]);
  const [customMealOpen, setCustomMealOpen] = useState(false);
  const [customMealText, setCustomMealText] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<{ items: string[]; calories: number; protein_g: number; carbs_g: number; fat_g: number } | null>(null);
  const L = usePageRest();
  const content = plan.plan_content;

  if (!content || !content.days) {
    return (
      <div className="py-4 text-sm text-ink/60 font-light"><Tr s={"Plan generation failed. Try again."} /></div>
    );
  }

  const day = content.days[activeDay];

  const handleSwapMeal = async (mealIdx: number) => {
    const meal = day?.meals[mealIdx];
    if (!meal || !content) return;
    const key = `${activeDay}-${mealIdx}`;
    setSwapping(key);
    setSwapOptions([]);
    try {
      setSwapOptions(await mockSwapOptions(meal.meal, meal.items, meal.calories));
    } catch { /* silent */ }
    setSwapping(key === swapping ? null : key);
  };

  const applySwap = (mealIdx: number, option: { items: string[]; calories: number }) => {
    if (!content?.days) return;
    const updated = { ...content, days: content.days.map((d, di) =>
      di === activeDay
        ? { ...d, meals: d.meals.map((m, mi) => mi === mealIdx ? { ...m, items: option.items, calories: option.calories } : m) }
        : d
    )};
    onUpdatePlan({ ...plan, plan_content: updated });
    setSwapping(null);
    setSwapOptions([]);
  };

  const handleEstimateCustom = async () => {
    if (!customMealText.trim()) return;
    setEstimating(true);
    setEstimate(null);
    try {
      setEstimate(await estimateMeal(customMealText));
    } catch { /* silent */ }
    setEstimating(false);
  };

  const printPlan = () => {
    const printWindow = window.open('', '_blank', 'width=820,height=1000');
    if (!printWindow || !content) return;

    const typeColor: Record<string, string> = { match: '#DC2626', recovery: '#2563EB', training: '#6B7280' };
    const typeLabel = (type: string) =>
      `<span style="display:inline-block;padding:1px 5px;border-radius:6px;font-size:6px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;color:white;background:${typeColor[type] || typeColor.training}">${type}</span>`;

    const mealRow = (m: { meal: string; items: string[]; calories: number }) =>
      `<tr><td style="width:22%;padding:3px 8px;border-bottom:1px solid #F3F4F6;vertical-align:top"><span style="font-weight:600;color:#374151">${m.meal}</span></td><td style="padding:3px 8px;border-bottom:1px solid #F3F4F6;color:#4B5563">${m.items.join(', ')}</td><td style="width:12%;padding:3px 8px;border-bottom:1px solid #F3F4F6;text-align:right;color:#9CA3AF;font-variant-numeric:tabular-nums">${m.calories} kcal</td></tr>`;

    // Portrait A4: days stacked top to bottom, one row per meal
    const daysList = content.days?.map(d => {
      const dayTotal = d.meals.reduce((sum, m) => sum + m.calories, 0);
      return `
      <div style="break-inside:avoid;page-break-inside:avoid;margin-bottom:8px;border:1px solid #E5E7EB;border-radius:4px;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:#F9FAFB;border-bottom:1.5px solid ${typeColor[d.type] || '#E5E7EB'}">
          <span style="display:flex;align-items:center;gap:6px"><span style="font-weight:600;color:#111;font-size:9px">${d.day}</span>${typeLabel(d.type)}</span>
          <span style="color:#6B7280;font-variant-numeric:tabular-nums">${dayTotal} kcal</span>
        </div>
        <table>${d.meals.map(mealRow).join('')}</table>
      </div>`;
    }).join('') || '';

    // Grocery list as compact columns
    const groceryHtml = content.grocery_list ? `
      <div style="margin-top:8px;padding-top:6px;border-top:1.5px solid #111">
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <span style="font-weight:600;color:#111;font-size:7.5px;text-transform:uppercase;letter-spacing:0.5px;width:100%">Grocery List</span>
          ${Object.entries(content.grocery_list).map(([cat, items]) => `
            <div style="flex:1;min-width:80px">
              <div style="font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:2px">${cat}</div>
              ${(items as string[]).map(item => `<div style="color:#374151;padding-left:6px;border-left:1.5px solid #C9817D">${item}</div>`).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Extras inline
    const extras: string[] = [];
    if (content.hydration) extras.push(`<span style="font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.3px">Hydration</span> ${content.hydration}`);
    if (content.supplements?.length) extras.push(`<span style="font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.3px">Supplements</span> ${content.supplements.join(', ')}`);
    const extrasHtml = extras.length ? `<div style="margin-top:6px;display:flex;gap:20px">${extras.map(e => `<div style="flex:1">${e}</div>`).join('')}</div>` : '';

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Nutrition Plan - ${plan.player_name}</title>
      <style>
        @page { margin: 10mm 12mm; size: A4 portrait; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: -apple-system, 'Helvetica Neue', sans-serif; margin: 0; padding: 12px 16px; color: #111; font-size: 8px; line-height: 1.4; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      </style>
    </head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #111">
        <div>
          <div style="font-size:8px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#6B7280">Weekly Nutrition Plan</div>
          <div style="font-size:18px;font-weight:300;color:#111;margin-top:1px">${plan.player_name}</div>
        </div>
        <div style="text-align:right;color:#6B7280;font-size:7.5px">
          ${content.daily_calories ? `${content.daily_calories} kcal/day` : ''}
          ${content.macro_split ? `<br/>P ${content.macro_split.protein_pct}% · C ${content.macro_split.carbs_pct}% · F ${content.macro_split.fat_pct}%` : ''}
        </div>
      </div>
      ${daysList}
      ${groceryHtml}
      ${extrasHtml}
      <div style="margin-top:6px;padding-top:4px;border-top:1px solid #E5E7EB;text-align:right">
        <span style="font-size:6.5px;color:#9CA3AF;letter-spacing:0.3px">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Football Analytics AI</span>
      </div>
      <script>window.onload=()=>window.print()</script>
    </body></html>`);
    printWindow.document.close();
  };

  const DAY_TYPE_STYLE: Record<string, string> = {
    match: 'border-red-500/30 text-red-500/80',
    recovery: 'border-blue-500/30 text-blue-500/80',
    training: 'border-ink/10 text-ink/60',
  };

  return (
    <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-hover transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Utensils className="w-4 h-4 text-ink/40 flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{plan.player_name}</span>
          {content.daily_calories && (
            <span className="text-[10px] text-ink/35 font-light tabular-nums">{content.daily_calories} kcal/day</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-ink/35 font-light">
            {new Date(plan.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
          <span className="text-ink/25 text-xs">{expanded ? 'Hide' : 'Show'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {content.summary && (
            <p className="text-xs text-ink/50 font-light">{content.summary}</p>
          )}

          {/* Macro bars */}
          {content.macro_split && (
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500/60 rounded-l-full" style={{ width: `${content.macro_split.protein_pct}%` }} title={`Protein ${content.macro_split.protein_pct}%`} />
              <div className="bg-amber-400/60" style={{ width: `${content.macro_split.carbs_pct}%` }} title={`Carbs ${content.macro_split.carbs_pct}%`} />
              <div className="bg-rose-400/50 rounded-r-full" style={{ width: `${content.macro_split.fat_pct}%` }} title={`Fat ${content.macro_split.fat_pct}%`} />
            </div>
          )}
          {content.macro_split && (
            <div className="flex items-center gap-4 text-[10px] text-ink/40 font-light">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500/60" />Protein {content.macro_split.protein_pct}%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400/60" />Carbs {content.macro_split.carbs_pct}%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400/50" />Fat {content.macro_split.fat_pct}%</span>
            </div>
          )}

          {/* Day selector */}
          <div className="flex flex-wrap gap-1.5">
            {content.days.map((d, i) => (
              <button
                key={d.day}
                onClick={() => setActiveDay(i)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl text-[11px] font-light whitespace-nowrap transition-all border ${
                  i === activeDay
                    ? 'bg-ink/[0.06] border-ink/15 text-foreground'
                    : `bg-transparent hover:bg-hover ${DAY_TYPE_STYLE[d.type] || DAY_TYPE_STYLE.training}`
                }`}
              >
                <span className="font-medium">{d.day.slice(0, 3)}</span>
                <span className="text-[9px] mt-0.5 opacity-60">{d.type}</span>
              </button>
            ))}
          </div>

          {/* Meals for selected day */}
          {day && (
            <div className="space-y-0 rounded-xl border border-line overflow-hidden">
              {day.meals.map((meal, i) => {
                const isSwapping = swapping === `${activeDay}-${i}`;
                return (
                  <div key={i}>
                    <div className="flex gap-3 px-4 py-3 border-b border-ink/[0.04] last:border-0 group hover:bg-ink/[0.02] transition-colors">
                      <div className="w-20 sm:w-24 flex-shrink-0">
                        <span className="text-xs text-foreground font-medium block">{meal.meal}</span>
                        <span className="text-[10px] text-ink/35 tabular-nums">{meal.calories} kcal</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink/60 font-light leading-relaxed">{meal.items.join(', ')}</p>
                      </div>
                      <button
                        onClick={() => isSwapping ? setSwapping(null) : handleSwapMeal(i)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-[10px] text-ink/40 hover:text-foreground bg-ink/[0.04] hover:bg-ink/[0.08] rounded-lg transition-all flex-shrink-0 self-center"
                        title={L("Get alternative meal suggestions")}
                      >
                        <RefreshCw className={`w-3 h-3 ${isSwapping && swapOptions.length === 0 ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Swap</span>
                      </button>
                    </div>
                    {/* Swap options */}
                    {isSwapping && swapOptions.length > 0 && (
                      <div className="px-4 py-3 bg-ink/[0.02] border-b border-ink/[0.04] space-y-2">
                        <p className="text-[10px] text-ink/40 font-light"><Tr s={"Pick an alternative:"} /></p>
                        {swapOptions.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => applySwap(i, opt)}
                            className="block w-full text-left px-3 py-2.5 rounded-xl border border-line hover:border-ink/15 hover:bg-ink/[0.03] transition-all"
                          >
                            <p className="text-xs text-ink/70 font-light">{opt.items.join(', ')}</p>
                            <p className="text-[10px] text-ink/40 tabular-nums mt-1">
                              {opt.calories} kcal | P {opt.protein_g}g | C {opt.carbs_g}g | F {opt.fat_g}g
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom meal entry */}
          <div className="pt-1">
            {!customMealOpen ? (
              <button
                onClick={() => setCustomMealOpen(true)}
                className="flex items-center gap-1.5 text-[11px] text-ink/40 hover:text-foreground transition-colors"
              >
                <Plus className="w-3 h-3" /> Estimate a custom meal
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-ink/40 font-light"><Tr s={"Describe what you ate or want to eat:"} /></p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customMealText}
                    onChange={e => setCustomMealText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEstimateCustom()}
                    placeholder={L("e.g. 2 eggs, toast with avocado, orange juice")}
                    className="flex-1 px-3 py-2 rounded-xl border border-line bg-ink/[0.02] text-sm font-light text-foreground placeholder:text-ink/30 focus:outline-none focus:border-ink/20"
                  />
                  <button
                    onClick={handleEstimateCustom}
                    disabled={!customMealText.trim() || estimating}
                    className="px-3 py-2 text-[11px] font-medium text-ink/60 hover:text-foreground bg-ink/[0.04] hover:bg-ink/[0.08] rounded-xl transition-colors disabled:opacity-40"
                  >
                    {estimating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Estimate'}
                  </button>
                </div>
                {estimate && (
                  <div className="px-3 py-2.5 rounded-xl bg-ink/[0.02] border border-line">
                    <p className="text-xs text-ink/70 font-light">{estimate.items?.join(', ')}</p>
                    <p className="text-[10px] text-ink/40 tabular-nums mt-1">
                      {estimate.calories} kcal | Protein {estimate.protein_g}g | Carbs {estimate.carbs_g}g | Fat {estimate.fat_g}g
                    </p>
                  </div>
                )}
                <button
                  onClick={() => { setCustomMealOpen(false); setCustomMealText(''); setEstimate(null); }}
                  className="text-[10px] text-ink/40 hover:text-ink/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Hydration + supplements */}
          {(content.hydration || (content.supplements && content.supplements.length > 0)) && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-line">
              {content.hydration && (
                <div className="flex items-center gap-1.5 text-[11px] text-ink/50 font-light">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
                  {content.hydration}
                </div>
              )}
              {content.supplements && content.supplements.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-ink/50 font-light">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                  {content.supplements.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => onShare(plan)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-ink/50 hover:text-foreground bg-ink/[0.03] hover:bg-ink/[0.06] border border-line rounded-xl transition-colors"
            >
              <Send className="w-3 h-3" /> Share via WhatsApp
            </button>
            <button
              onClick={printPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-ink/50 hover:text-foreground bg-ink/[0.03] hover:bg-ink/[0.06] border border-line rounded-xl transition-colors"
            >
              <Printer className="w-3 h-3" /> Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NutritionSection({ playerNames }: NutritionSectionProps) {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingFor, setGeneratingFor] = useState('');

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const loadedFromServer = useRef(0);

  // Fetch one page of existing plans; later pages append, skipping rows already shown.
  const fetchPlans = useCallback(async (offset = 0) => {
    try {
      const json = await listPlans(PLANS_PAGE_SIZE, offset);
      const page: MealPlan[] = json.data;
      loadedFromServer.current = offset + page.length;
      setHasMore(json.hasMore);
      setPlans(prev => {
        if (offset === 0) return page;
        const seen = new Set(prev.map(p => p.id));
        return [...prev, ...page.filter(p => !seen.has(p.id))];
      });
    } catch { setHasMore(false); }
    setLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    await fetchPlans(loadedFromServer.current);
    setLoadingMore(false);
  }, [fetchPlans, loadingMore]);

  useEffect(() => { fetchPlans(0); }, [fetchPlans]);

  const handleGenerate = async (answers: Record<string, string | string[]>) => {
    setGenerating(true);
    try {
      const dietaryNotes = typeof answers.dietaryNotes === 'string' ? answers.dietaryNotes : '';
      const foodDislikes = typeof answers.foodDislikes === 'string' ? answers.foodDislikes : '';
      const foodPreferences = typeof answers.foodPreferences === 'string' ? answers.foodPreferences : '';
      const mealsPerDay = typeof answers.mealsPerDay === 'string' ? answers.mealsPerDay : '';
      const injuryStatus = typeof answers.injuryStatus === 'string' ? answers.injuryStatus : '';
      const language = typeof answers.language === 'string' ? answers.language : 'English';

      const playerName = typeof answers.playerName === 'string' ? answers.playerName : '';
      setGeneratingFor(playerName);
      const plan = await generatePlan(playerName, {
        position: answers.position,
        weight: answers.weight ? Number(answers.weight) : null,
        targetWeight: answers.targetWeight ? Number(answers.targetWeight) : null,
        dietaryRequirements: dietaryNotes ? [dietaryNotes] : [],
        foodDislikes: foodDislikes || null,
        foodPreferences: foodPreferences || null,
        mealsPerDay: mealsPerDay || null,
        injuryStatus: injuryStatus || null,
        language: language || 'English',
      });
      addPlan(plan);
      setPlans(prev => [plan, ...prev]);
    } catch { /* generation failed */ }
    setGenerating(false);
    setShowWizard(false);
  };

  const handleShare = async (plan: MealPlan) => {
    // For now, copy a shareable summary to clipboard
    const content = plan.plan_content;
    if (!content) return;
    const text = [
      `Nutrition Plan for ${plan.player_name}`,
      content.summary || '',
      `${content.daily_calories || ''} kcal/day`,
      '',
      ...(content.days || []).map(d =>
        `${d.day} (${d.type}):\n${d.meals.map(m => `  ${m.meal}: ${m.items.join(', ')} (${m.calories} kcal)`).join('\n')}`
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* clipboard failed */ }
  };

  const wizardSteps = buildWizardSteps(playerNames);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs text-ink/60 uppercase tracking-widest font-light"><Tr s={"Nutrition Plans"} /></h3>
          <p className="text-[11px] text-ink/50 font-light mt-0.5"><Tr s={"Custom meal plans generated for each player"} /></p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-background/60 backdrop-blur-sm border border-line text-ink/80 hover:bg-surface-overlay hover:shadow transition-all rounded-2xl text-sm font-medium disabled:opacity-40"
        >
          {generating ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
          ) : (
            'New Plan'
          )}
        </button>
      </div>

      {/* Wizard */}
      <AnimatePresence>
        {showWizard && !generating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="max-w-xl mx-auto py-4">
              <QAWizard
                steps={wizardSteps}
                onComplete={handleGenerate}
                completeLabel="Generate Plan"
                completingLabel="Generating..."
                onSkipAll={() => setShowWizard(false)}
              />
              <button
                onClick={() => setShowWizard(false)}
                className="block mx-auto mt-4 text-xs text-ink/30 hover:text-ink/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {generating && <GeneratingPlan key="generating" playerName={generatingFor} />}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-ink/50" />
        </div>
      )}

      {/* Plans list */}
      {!loading && plans.length > 0 && (
        <div className="space-y-3">
          {plans.map(plan => (
            <PlanViewer
              key={plan.id}
              plan={plan}
              onShare={handleShare}
              onUpdatePlan={(updated) => { updatePlan(updated); setPlans(prev => prev.map(p => p.id === updated.id ? updated : p)); }}
            />
          ))}
          {hasMore && (
            <>
              <InfiniteSentinel itemCount={plans.length} loading={loadingMore} onVisible={loadMore} />
              {loadingMore && (
                <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-ink/30" /></div>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && plans.length === 0 && !showWizard && (
        <div className="py-12 text-center">
          <Utensils className="w-8 h-8 text-ink/15 mx-auto mb-3" />
          <p className="text-sm text-ink/60 font-light mb-1"><Tr s={"No nutrition plans yet"} /></p>
          <p className="text-xs text-ink/50 font-light mb-4"><Tr s={"Generate personalized 7-day meal plans for your players."} /></p>
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-background/60 backdrop-blur-sm border border-line text-ink/80 hover:bg-surface-overlay hover:shadow rounded-2xl text-sm font-medium transition-all"
          >
            Create first plan
          </button>
        </div>
      )}

      {/* GPS vest integration teaser */}
      <div className="border border-dashed border-line rounded-xl px-4 py-3">
        <p className="text-[11px] text-ink/30 font-light">
          Coming soon: Connect Kinexon, StatsSports, or Catapult GPS vest data to auto-adjust calorie targets based on actual training load and match intensity.
        </p>
      </div>
    </div>
  );
}
