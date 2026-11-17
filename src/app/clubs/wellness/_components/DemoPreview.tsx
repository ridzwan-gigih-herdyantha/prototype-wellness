'use client';

import { useMemo } from 'react';
import type { WellnessRecord } from '@/lib/squad/types';
import { DEFAULT_WELLNESS_TIMEZONE } from '@/lib/wellness/timezone';
import { buildPlayerSummaries, buildTeamPulse } from './wellness-helpers';
import { TeamPulseChart } from './WellnessVisuals';
import PlayerCard from './PlayerCard';
import { Tr } from '@/i18n/page-rest';

const DEMO_PLAYERS = [
  { name: 'Kylian Mbappe', position: 'ST', base: 4 },
  { name: 'Antoine Griezmann', position: 'CAM', base: 4 },
  { name: 'Aurelien Tchouameni', position: 'CDM', base: 3 },
  { name: 'William Saliba', position: 'CB', base: 4 },
  { name: 'Mike Maignan', position: 'GK', base: 5 },
  { name: 'Ousmane Dembele', position: 'RW', base: 2 },
  { name: 'Theo Hernandez', position: 'LB', base: 3 },
  { name: 'Eduardo Camavinga', position: 'CM', base: 4 },
];

function generateDemoRecords(): WellnessRecord[] {
  const records: WellnessRecord[] = [];
  const today = new Date();
  let id = 1;
  for (const player of DEMO_PLAYERS) {
    for (let d = 0; d < 14; d++) {
      if (d > 0 && ((id * 7 + d) % 5 === 0)) continue;
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const v = () => Math.max(1, Math.min(5, player.base + ((id * 3 + d) % 3) - 1));
      const isLow = player.name === 'Ousmane Dembele';
      const adj = isLow && d < 4 ? -1 : 0;
      records.push({
        id: String(id++),
        club_profile_id: 'demo',
        player_name: player.name,
        muscle_soreness: Math.max(1, Math.min(5, v() + adj)),
        energy_level: Math.max(1, Math.min(5, v() + adj)),
        sleep_quality: Math.max(1, v()),
        notes: isLow && d < 2 ? 'Hamstring tightness' : null,
        recorded_by: 'demo',
        recorded_at: date.toISOString().split('T')[0],
      } as WellnessRecord);
    }
  }
  return records;
}

export default function DemoPreview({ onSetup, onLog }: { onSetup: () => void; onLog: () => void }) {
  const demoRecords = useMemo(() => generateDemoRecords(), []);
  const demoSummaries = useMemo(() => buildPlayerSummaries(
    demoRecords,
    new Set(['Kylian Mbappe', 'Antoine Griezmann']),
    DEFAULT_WELLNESS_TIMEZONE,
  ).sort((a, b) => (a.avg ?? 6) - (b.avg ?? 6)), [demoRecords]);
  const demoPulse = useMemo(() => buildTeamPulse(demoRecords, 14), [demoRecords]);

  return (
    <div className="relative">
      <div className="blur-[2px] opacity-60 pointer-events-none select-none space-y-4">
        <TeamPulseChart pulse={demoPulse} />
        <div className="space-y-3">
          {demoSummaries.slice(0, 4).map(s => (
            <PlayerCard
              key={s.name}
              summary={s}
              expanded={false}
              onToggle={() => {}}
              onLog={() => {}}
              onShowTodayDetails={() => {}}
              onShowHistoricalDetails={() => {}}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-background/90 backdrop-blur-md rounded-2xl border border-line p-6 sm:p-8 text-center max-w-sm mx-4 shadow-xl">
          <p className="text-[10px] text-ink/40 uppercase tracking-wider font-light mb-3"><Tr s={"Demo: France National Team"} /></p>
          <h3 className="text-lg font-light text-foreground mb-2"><Tr s={"See your real squad data"} /></h3>
          <p className="text-xs text-ink/50 font-light mb-6">
            Set up WhatsApp onboarding or log your first check-in to replace this preview with live wellness data from your players.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={onSetup} className="w-full px-5 py-2.5 bg-ink/80 text-background dark:bg-ink/[0.14] dark:text-foreground rounded-2xl text-sm font-medium hover:bg-ink/90 transition-all active:scale-95">
              Set up WhatsApp
            </button>
            <button onClick={onLog} className="w-full px-5 py-2.5 bg-background/60 backdrop-blur-sm border border-line text-ink/80 hover:bg-surface-overlay hover:shadow rounded-2xl text-sm font-medium transition-all active:scale-95">
              Log first check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
