'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plus, Calendar } from 'lucide-react';
import { mockClub } from '@/lib/mock-club';
import { listWellness, listPlayers, upsertCheckin } from '@/lib/store/wellness-store';
import { listPlans } from '@/lib/store/nutrition-store';
import { formatCalendarDate } from '@/lib/date';
import FadeIn from '@/components/clubs-ui/FadeIn';
import WellnessOnboarding from './_components/WellnessOnboarding';
import DemoDataPanel from './_components/DemoDataPanel';
import NutritionSection from './_components/NutritionSection';
import WellnessBilling from './_components/WellnessBilling';
import PlayerCard from './_components/PlayerCard';
import { InfiniteSentinel } from '@/components/ui/InfiniteSentinel';
import { replaceOrPrependWellnessRecord } from '@/lib/wellness/record-list';
import { emptyCheckinFormState, formStateFromRecord } from '@/lib/wellness/checkin-form';
import DemoPreview from './_components/DemoPreview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CheckInModal from './_components/CheckInModal';
import { ComplianceRing, WellnessBar, TeamPulseChart } from './_components/WellnessVisuals';
import {
  buildPlayerSummaries,
  buildTeamPulse,
  buildTodayMetrics,
  daysAgo,
  detectSorenessDips,
  mealsAsLines,
  mealsForDay,
  mealSourceNote,
} from './_components/wellness-helpers';
import type { WellnessRecord } from '@/lib/squad/types';
import type { WellnessPlayer } from '@/lib/wellness/types/player';
import { dateKeyInTimeZone, DEFAULT_WELLNESS_TIMEZONE } from '@/lib/wellness/timezone';
import type { CheckinModalMode } from '@/lib/wellness/types/checkin-form';
import type { PlayerMeal, PlayerSummary, NutritionPlanSummary, ViewMode, SortKey } from './_components/wellness-types';

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

const PLAYERS_PAGE_SIZE = 10;

function WellnessSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 animate-pulse">
      {/* Header + button */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 rounded-lg bg-ink/[0.06]" />
        <div className="h-9 w-9 sm:w-28 rounded-2xl bg-ink/[0.04]" />
      </div>
      {/* Stat tiles: 2x2 mobile, 4-col desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 rounded-2xl border border-line bg-ink/[0.03] flex flex-col items-center justify-center gap-2">
            <div className="h-6 w-10 rounded bg-ink/[0.06]" />
            <div className="h-2.5 w-16 rounded bg-ink/[0.04]" />
          </div>
        ))}
      </div>
      {/* Alert pills */}
      <div className="flex gap-2">
        <div className="h-7 w-24 rounded-xl bg-ink/[0.03]" />
        <div className="h-7 w-32 rounded-xl bg-ink/[0.03] hidden sm:block" />
      </div>
      {/* Team pulse chart */}
      <div className="h-28 rounded-2xl border border-line bg-ink/[0.02]" />
      {/* View toggle */}
      <div className="h-8 w-48 rounded-xl bg-ink/[0.04]" />
      {/* Player cards */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl border border-line bg-ink/[0.02] flex items-center px-4 gap-3">
            <div className="w-10 h-10 rounded-full bg-ink/[0.05] flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-28 rounded bg-ink/[0.06]" />
              <div className="h-2.5 w-40 rounded bg-ink/[0.04]" />
            </div>
            <div className="h-5 w-16 rounded-full bg-ink/[0.04] hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const SCREEN_STRINGS: Record<string, string> = {
  wellTitle: 'Player Wellness',
  wellLog: 'Log Check-in',
  wellToday: 'Checked in today',
  wellAvg: 'Avg wellness',
  wellRisk: 'High risk',
  wellDecline: '{count} declining',
  wellPlans: 'Nutrition plans',
  wellMissing: '{count} missing',
};

function tr(key: string, values?: { count: number }): string {
  const text = SCREEN_STRINGS[key] ?? key;
  return values ? text.replace('{count}', String(values.count)) : text;
}

export default function WellnessPage() {
  const { tier } = mockClub;
  const [records, setRecords] = useState<WellnessRecord[]>([]);
  const [meals, setMeals] = useState<PlayerMeal[]>([]);
  const [wellnessPlayers, setWellnessPlayers] = useState<WellnessPlayer[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlanSummary[]>([]);
  const [timeZone, setTimeZone] = useState(DEFAULT_WELLNESS_TIMEZONE);
  const [loading, setLoading] = useState(true);
  const noAccess = false;
  const [view, setView] = useState<ViewMode>('players');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [visiblePlayers, setVisiblePlayers] = useState(PLAYERS_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<SortKey>('risk');

  // Entry modal
  const [showEntry, setShowEntry] = useState(false);
  const [entryPlayer, setEntryPlayer] = useState('');
  const [formState, setFormState] = useState(emptyCheckinFormState);
  const [modalMode, setModalMode] = useState<CheckinModalMode>('edit');
  const [modalRecord, setModalRecord] = useState<WellnessRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch records + nutrition plans
  const fetchData = useCallback(async () => {
    const [wellness, nutrition, players] = await Promise.all([listWellness(30), listPlans(), listPlayers()]);
    setRecords(wellness.records);
    setMeals(wellness.meals);
    setTimeZone(wellness.timezone);
    setNutritionPlans(nutrition.data.map(p => ({
      player_name: p.player_name,
      status: p.status,
      daily_calories: p.plan_content?.daily_calories ?? null,
    })));
    setWellnessPlayers(players.players);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const nutritionPlanSet = useMemo(() => new Set(nutritionPlans.map(p => p.player_name)), [nutritionPlans]);

  const summaries: PlayerSummary[] = useMemo(
    () => buildPlayerSummaries(records, nutritionPlanSet, timeZone, new Date(), meals),
    [records, nutritionPlanSet, timeZone, meals],
  );

  const sorted = [...summaries].sort((a, b) => {
    if (sortBy === 'risk') return (a.avg ?? Number.POSITIVE_INFINITY) - (b.avg ?? Number.POSITIVE_INFINITY);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'soreness') return (a.today?.muscle_soreness ?? 6) - (b.today?.muscle_soreness ?? 6);
    if (sortBy === 'energy') return (a.today?.energy_level ?? 6) - (b.today?.energy_level ?? 6);
    if (sortBy === 'sleep') return (a.today?.sleep_quality ?? 6) - (b.today?.sleep_quality ?? 6);
    return daysAgo(a.latest.recorded_at) - daysAgo(b.latest.recorded_at);
  });

  const expandedIndex = expandedPlayer ? sorted.findIndex(s => s.name === expandedPlayer) : -1;
  const shownPlayers = Math.max(visiblePlayers, expandedIndex + 1);

  const totalPlayers = summaries.length;
  const { checkedInToday, avgScore, highRisk } = useMemo(
    () => buildTodayMetrics(summaries),
    [summaries],
  );
  const declining = summaries.filter(s => s.trend === 'declining');
  const staleCount = summaries.filter(s => daysAgo(s.latest.recorded_at) > 3).length;
  const withoutPlan = summaries.filter(s => !s.hasNutritionPlan).length;
  const teamPulse = useMemo(() => buildTeamPulse(records, 14), [records]);
  const sorenessDips = useMemo(() => detectSorenessDips(records, 14), [records]);
  const modalPlayers = useMemo(() => {
    const byToken = new Map(wellnessPlayers.map(player => [player.wellness_token_id, player]));
    return Array.from(byToken.values()).sort((a, b) => a.player_name.localeCompare(b.player_name));
  }, [wellnessPlayers]);
  const playerNames = useMemo(
    () => Array.from(new Set([...wellnessPlayers.map(player => player.player_name), ...summaries.map(s => s.name)]))
      .sort((a, b) => a.localeCompare(b)),
    [wellnessPlayers, summaries],
  );
  const hasPlayers = totalPlayers > 0;
  const mealNote = useMemo(() => {
    const playerName = modalRecord?.player_name
      ?? modalPlayers.find(player => player.wellness_token_id === entryPlayer)?.player_name;
    const dateKey = modalRecord?.recorded_at.slice(0, 10) ?? dateKeyInTimeZone(new Date(), timeZone);
    return mealSourceNote(playerName ? mealsForDay(meals, playerName, dateKey) : [], timeZone);
  }, [meals, modalRecord, modalPlayers, entryPlayer, timeZone]);

  useEffect(() => {
    if (!loading && !hasPlayers && !noAccess) setView('onboarding');
  }, [loading, hasPlayers, noAccess]);

  const handleSave = async () => {
    if (!entryPlayer) return;
    setSaving(true);
    try {
      const data = await upsertCheckin({
        wellnessTokenId: entryPlayer,
        muscleSoreness: formState.scores.muscleSoreness,
        energyLevel: formState.scores.energyLevel,
        sleepQuality: formState.scores.sleepQuality,
        notes: formState.notes || null,
        bodyPart: formState.bodyPart,
        sorenessContext: formState.sorenessContext,
        meals: formState.meals,
        recordedAt: dateKeyInTimeZone(new Date(), timeZone),
      });
      if (data.record) {
        setRecords(prev => replaceOrPrependWellnessRecord(prev, data.record));
        const savedDate = data.record.recorded_at.slice(0, 10);
        setMeals(prev => [
          ...prev.filter(meal => !(meal.player_name === data.record.player_name && meal.log_date.slice(0, 10) === savedDate)),
          ...data.meals,
        ]);
        setShowEntry(false);
        setEntryPlayer('');
        setFormState(emptyCheckinFormState());
        setModalRecord(null);
      }
    } catch (err) { console.error('Failed to save wellness check-in:', err); }
    setSaving(false);
  };

  const findTodayRecord = useCallback((wellnessTokenId: string) => {
    const today = dateKeyInTimeZone(new Date(), timeZone);
    return records.find(record => (
      record.wellness_token_id === wellnessTokenId && record.recorded_at === today
    )) ?? null;
  }, [records, timeZone]);

  const mealsTextFor = useCallback((playerName: string | undefined, dateKey: string) => (
    playerName ? mealsAsLines(mealsForDay(meals, playerName, dateKey)) : ''
  ), [meals]);

  const selectEntryPlayer = (wellnessTokenId: string) => {
    setEntryPlayer(wellnessTokenId);
    const record = wellnessTokenId ? findTodayRecord(wellnessTokenId) : null;
    const playerName = wellnessPlayers.find(player => player.wellness_token_id === wellnessTokenId)?.player_name;
    const mealsText = mealsTextFor(playerName, dateKeyInTimeZone(new Date(), timeZone));
    setModalRecord(record);
    setFormState(record ? formStateFromRecord(record, mealsText) : { ...emptyCheckinFormState(), meals: mealsText });
  };

  const openNewCheckin = () => {
    setModalMode('edit');
    setEntryPlayer('');
    setModalRecord(null);
    setFormState(emptyCheckinFormState());
    setShowEntry(true);
  };

  const openLogFor = (wellnessTokenId: string) => {
    setModalMode('edit');
    selectEntryPlayer(wellnessTokenId);
    setShowEntry(true);
  };

  const openTodayDetails = (record: WellnessRecord) => {
    setModalMode('edit');
    setEntryPlayer(record.wellness_token_id);
    setModalRecord(record);
    setFormState(formStateFromRecord(record, mealsTextFor(record.player_name, record.recorded_at.slice(0, 10))));
    setShowEntry(true);
  };

  const openHistoricalDetails = (record: WellnessRecord) => {
    setModalMode('read-only');
    setEntryPlayer(record.wellness_token_id);
    setModalRecord(record);
    setFormState(formStateFromRecord(record, mealsTextFor(record.player_name, record.recorded_at.slice(0, 10))));
    setShowEntry(true);
  };

  if (loading) return <WellnessSkeleton />;

  return (
    <FadeIn>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="t-page-title">{tr('wellTitle')}</h1>
          <button onClick={openNewCheckin}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-background/60 backdrop-blur-sm border border-line text-ink/80 hover:bg-surface-overlay hover:shadow rounded-2xl text-sm font-medium active:scale-95 transition-all">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{tr('wellLog')}</span>
          </button>
        </div>

        {/* Stat tiles */}
        {hasPlayers && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-4 flex flex-col items-center justify-center">
              <ComplianceRing checked={checkedInToday} total={totalPlayers} />
              <span className="text-[10px] text-ink/40 font-light mt-2">{tr('wellToday')}</span>
            </div>
            <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-4 flex flex-col items-center justify-center">
              <span className={`text-2xl font-light tabular-nums ${avgScore === null ? 'text-ink/40' : avgScore <= 2 ? 'text-red-400/80' : avgScore <= 3 ? 'text-amber-400/80' : 'text-emerald-500/70'}`}>
                {avgScore === null ? '--' : avgScore.toFixed(1)}
              </span>
              <span className="text-[10px] text-ink/40 font-light mt-1">{tr('wellAvg')}</span>
              <div className="w-16 mt-2"><WellnessBar value={avgScore === null ? null : Math.round(avgScore)} size="sm" /></div>
            </div>
            <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-4 flex flex-col items-center justify-center">
              <span className={`text-2xl font-light tabular-nums ${highRisk.length > 0 ? 'text-red-400/80' : 'text-foreground'}`}>{highRisk.length}</span>
              <span className="text-[10px] text-ink/40 font-light mt-1">{tr('wellRisk')}</span>
              {declining.length > 0 && <span className="text-[10px] text-amber-400/80 font-light mt-1">{tr('wellDecline', { count: declining.length })}</span>}
            </div>
            <div className="rounded-2xl border border-line bg-background/60 backdrop-blur-sm p-4 flex flex-col items-center justify-center">
              <span className={`text-2xl font-light tabular-nums ${withoutPlan > 0 ? 'text-ink/40' : 'text-emerald-500/70'}`}>{totalPlayers - withoutPlan}/{totalPlayers}</span>
              <span className="text-[10px] text-ink/40 font-light mt-1">{tr('wellPlans')}</span>
              {withoutPlan > 0 && <button onClick={() => setView('nutrition')} className="text-[10px] text-amber-400/80 font-light mt-1 hover:underline">{tr('wellMissing', { count: withoutPlan })}</button>}
            </div>
          </div>
        )}

        {/* Alerts */}
        {(highRisk.length > 0 || staleCount > 0 || sorenessDips.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {highRisk.map(h => (
              <button key={h.name} onClick={() => setExpandedPlayer(expandedPlayer === h.name ? null : h.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/5 border border-red-500/10 text-[11px] text-red-500/80 font-light active:scale-95 transition-all">
                <AlertTriangle className="w-3 h-3" />{h.name}
              </button>
            ))}
            {sorenessDips.map(dip => (
              <span key={dip.date} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-500/80 font-light">
                <Calendar className="w-3 h-3" />
                Soreness spike {formatCalendarDate(dip.date, { day: 'numeric', month: 'short' }, 'en-GB')} (avg {dip.avgSoreness.toFixed(1)}/5, {dip.playerCount} players)
              </span>
            ))}
            {staleCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink/[0.03] border border-line text-[11px] text-ink/40 font-light">
                {staleCount} player{staleCount > 1 ? 's' : ''} missing 3+ days
              </span>
            )}
          </div>
        )}

        {/* Team Pulse */}
        {hasPlayers && view === 'players' && <TeamPulseChart pulse={teamPulse} />}

        {/* View toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface-elevated border border-line w-fit flex-wrap">
          {([
            { id: 'players' as const, label: 'Players' },
            { id: 'nutrition' as const, label: 'Nutrition' },
            { id: 'onboarding' as const, label: 'Setup' },
          ]).map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-light transition-colors whitespace-nowrap ${view === v.id ? 'bg-active text-foreground' : 'text-ink/50 hover:bg-hover'}`}>
              {v.label}
            </button>
          ))}
        </div>

        {view === 'nutrition' && <NutritionSection playerNames={playerNames} />}
        {view === 'onboarding' && (
          <div className="space-y-6">
            <WellnessBilling userTier={tier} />
            <WellnessOnboarding />
            <DemoDataPanel onChange={async loaded => { await fetchData(); setView(loaded ? 'players' : 'onboarding'); }} />
          </div>
        )}

        {/* Players view */}
        {view === 'players' && sorted.length > 0 && (
          <>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-[10px] text-ink/30 uppercase tracking-wider font-light flex-shrink-0">Sort</span>
              {([
                { key: 'risk' as const, label: 'Worst first' },
                { key: 'soreness' as const, label: 'Soreness' },
                { key: 'energy' as const, label: 'Energy' },
                { key: 'sleep' as const, label: 'Sleep' },
                { key: 'name' as const, label: 'A-Z' },
                { key: 'recent' as const, label: 'Recent' },
              ]).map(s => (
                <button key={s.key} onClick={() => { setSortBy(s.key); setVisiblePlayers(PLAYERS_PAGE_SIZE); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-light transition-colors whitespace-nowrap ${sortBy === s.key ? 'bg-ink/[0.08] text-foreground' : 'text-ink/35 hover:text-ink/60'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {sorted.slice(0, shownPlayers).map(s => (
                <PlayerCard key={s.name} summary={s} expanded={expandedPlayer === s.name}
                  onToggle={() => setExpandedPlayer(expandedPlayer === s.name ? null : s.name)}
                  onLog={() => openLogFor(s.latest.wellness_token_id)}
                  onShowTodayDetails={openTodayDetails}
                  onShowHistoricalDetails={openHistoricalDetails} />
              ))}
              {shownPlayers < sorted.length && (
                <InfiniteSentinel
                  itemCount={shownPlayers}
                  onVisible={() => setVisiblePlayers(count => count + PLAYERS_PAGE_SIZE)}
                />
              )}
            </div>
          </>
        )}

        {view === 'players' && sorted.length === 0 && !loading && noAccess && (
          <Alert>
            <AlertDescription>
              Your account does not have permission to view player wellness data. Ask a club admin to change your staff role.
            </AlertDescription>
          </Alert>
        )}

        {view === 'players' && sorted.length === 0 && !loading && !noAccess && (
          <DemoPreview onSetup={() => setView('onboarding')} onLog={openNewCheckin} />
        )}

        {/* Entry modal */}
        <AnimatePresence>
          {showEntry && (
            <CheckInModal
              players={modalPlayers}
              entryPlayer={entryPlayer}
              onPlayerChange={selectEntryPlayer}
              formState={formState}
              setFormState={setFormState}
              mode={modalMode}
              recordDate={modalRecord?.recorded_at}
              recordSource={modalRecord?.source}
              recordPlayerName={modalRecord?.player_name}
              mealNote={mealNote}
              saving={saving} onSave={handleSave} onClose={() => setShowEntry(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </FadeIn>
  );
}
