'use client';

import type { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Utensils } from 'lucide-react';
import { SelectModern } from '@/components/ui/select-modern';
import { withSorenessScore } from '@/lib/wellness/checkin-form';
import type { CheckinFormState, CheckinModalMode } from '@/lib/wellness/types/checkin-form';
import type { WellnessPlayerOption } from '@/lib/wellness/types/player';
import type { WellnessSource } from '@/lib/wellness/types/canonical-checkins';
import { QUESTIONS, INPUT_CLS } from './wellness-helpers';
import { Tr, usePageRest } from '@/i18n/page-rest';

interface CheckInModalProps {
  players: WellnessPlayerOption[];
  entryPlayer: string;
  onPlayerChange: (value: string) => void;
  formState: CheckinFormState;
  setFormState: Dispatch<SetStateAction<CheckinFormState>>;
  mode: CheckinModalMode;
  recordDate?: string;
  recordSource?: WellnessSource;
  recordPlayerName?: string;
  mealNote: string;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}

function sourceLabel(source?: WellnessSource) {
  if (source === 'whatsapp') return 'WhatsApp';
  if (source === 'staff') return 'Staff';
  if (source === 'web') return 'Web';
  return null;
}

export default function CheckInModal({
  players,
  entryPlayer,
  onPlayerChange,
  formState,
  setFormState,
  mode,
  recordDate,
  recordSource,
  recordPlayerName,
  mealNote,
  saving,
  onSave,
  onClose,
}: CheckInModalProps) {
  const L = usePageRest();
  const readOnly = mode === 'read-only';
  const detailsDisabled = readOnly || formState.scores.muscleSoreness === 5;

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose} onKeyDown={(e) => { if (e.currentTarget !== e.target) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }} role="button" tabIndex={0}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-background rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md shadow-2xl border border-line max-h-[90vh] overflow-y-auto"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex justify-center mb-4 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-ink/[0.1]" />
        </div>

        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-extralight text-foreground">
              {readOnly ? 'Wellness Check-in Details' : 'Wellness Check-in'}
            </h3>
            {recordDate && (
              <p className="mt-1 text-[11px] text-ink/40 font-light">
                {new Date(`${recordDate}T12:00:00`).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {sourceLabel(recordSource) ? ` · ${sourceLabel(recordSource)}` : ''}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-hover rounded-lg text-ink/50 hover:text-foreground transition-colors hidden sm:block">
            <span className="text-xs">x</span>
          </button>
        </div>

        <div className="mb-5">
          <label className="text-[10px] text-ink/60 uppercase tracking-wider font-light block mb-1.5">Player</label>
          {readOnly ? (
            <p className={`${INPUT_CLS} text-ink/70`}>{recordPlayerName ?? 'Unknown player'}</p>
          ) : players.length > 0 ? (
            <SelectModern
              value={entryPlayer}
              onChange={onPlayerChange}
              placeholder={L("Select player...")}
              options={[
                { value: '', label: 'Select player...' },
                ...players.map(player => ({
                  value: player.wellness_token_id,
                  label: player.player_name,
                })),
              ]}
            />
          ) : (
            <p className={`${INPUT_CLS} text-ink/40`}><Tr s={"Add an eligible player before logging a check-in."} /></p>
          )}
        </div>

        <div className="space-y-6 mb-5">
          {QUESTIONS.map(question => (
            <div key={question.key}>
              <label className="text-sm font-light text-foreground block mb-3" id={`checkin-q-${question.key}`}>{question.label}</label>
              <div className="flex items-center justify-between gap-2" role="group" aria-labelledby={`checkin-q-${question.key}`}>
                <span className="text-[10px] text-ink/40 font-light w-14 text-center">{question.lowLabel}</span>
                <div className="flex gap-2 flex-1 justify-center">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      type="button"
                      key={value}
                      disabled={readOnly}
                      onClick={() => setFormState(previous => (
                        question.key === 'muscleSoreness'
                          ? withSorenessScore(previous, value)
                          : {
                              ...previous,
                              scores: { ...previous.scores, [question.key]: value },
                            }
                      ))}
                      className={`w-11 h-11 sm:w-9 sm:h-9 rounded-full text-sm font-light transition-all ${
                        readOnly ? 'cursor-not-allowed opacity-60' : 'active:scale-90'
                      } ${
                        formState.scores[question.key] === value
                          ? value <= 2 ? 'bg-red-400 text-white shadow-sm' : value <= 3 ? 'bg-amber-400 text-white shadow-sm' : 'bg-emerald-400 text-white shadow-sm'
                          : 'bg-ink/[0.04] border border-line text-ink/50'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-ink/40 font-light w-14 text-center">{question.highLabel}</span>
              </div>

              {question.key === 'muscleSoreness' && (
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 ${detailsDisabled ? 'opacity-50' : ''}`}>
                  <div>
                    <label className="text-[10px] text-ink/60 uppercase tracking-wider font-light block mb-1.5" htmlFor="a11y-CheckInModal-147"><Tr s={"Body part (optional)"} /></label>
                    <input
                      value={formState.bodyPart}
                      onChange={event => setFormState(previous => ({ ...previous, bodyPart: event.target.value }))}
                      disabled={detailsDisabled}
                      placeholder={formState.scores.muscleSoreness === 5 ? 'No soreness' : 'e.g. Right leg'}
                      className={`${INPUT_CLS} disabled:cursor-not-allowed`}
                     id="a11y-CheckInModal-147"/>
                  </div>
                  <div>
                    <label className="text-[10px] text-ink/60 uppercase tracking-wider font-light block mb-1.5" htmlFor="a11y-CheckInModal-157"><Tr s={"Context (optional)"} /></label>
                    <input
                      value={formState.sorenessContext}
                      onChange={event => setFormState(previous => ({ ...previous, sorenessContext: event.target.value }))}
                      disabled={detailsDisabled}
                      placeholder={formState.scores.muscleSoreness === 5 ? 'No soreness' : 'e.g. After training'}
                      className={`${INPUT_CLS} disabled:cursor-not-allowed`}
                     id="a11y-CheckInModal-157"/>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mb-5">
          <label className="flex items-center gap-1.5 text-xs text-foreground font-light mb-1.5" htmlFor="checkin-meals">
            <Utensils className="w-3.5 h-3.5 text-emerald-500/70" />
            <Tr s={"What did the player eat today?"} />
          </label>
          <textarea
            id="checkin-meals"
            value={formState.meals}
            onChange={event => setFormState(previous => ({ ...previous, meals: event.target.value }))}
            disabled={readOnly || !entryPlayer}
            placeholder={L("One meal per line, e.g. Breakfast oatmeal and banana")}
            rows={3}
            className={`${INPUT_CLS} disabled:cursor-not-allowed disabled:opacity-60`}
          />
          <p className="text-[10px] text-ink/40 font-light mt-1.5">{mealNote}</p>
        </div>

        <div className="mb-5">
          <label className="text-[10px] text-ink/60 uppercase tracking-wider font-light block mb-1.5" htmlFor="a11y-CheckInModal-173"><Tr s={"Notes (optional)"} /></label>
          <textarea
            value={formState.notes}
            onChange={event => setFormState(previous => ({ ...previous, notes: event.target.value }))}
            disabled={readOnly}
            placeholder={L("Any additional observations...")}
            rows={2}
            className={`${INPUT_CLS} resize-none disabled:cursor-not-allowed disabled:opacity-60`}
           id="a11y-CheckInModal-173"/>
        </div>

        {readOnly ? (
          <button type="button" onClick={onClose} className="w-full py-3 bg-ink/[0.06] border border-line text-foreground rounded-2xl text-sm font-medium active:scale-[0.98] transition-all">
            Close
          </button>
        ) : (
          <button type="button" onClick={onSave} disabled={!entryPlayer || saving}
            className="w-full py-3 bg-ink/80 text-background dark:bg-ink/[0.14] dark:text-foreground border border-transparent hover:bg-ink/90 rounded-2xl text-sm font-medium disabled:opacity-30 active:scale-[0.98] transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Check-in'}
          </button>
        )}
      </motion.div>
    </div>
  );
}
