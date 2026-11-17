'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useTypewriter } from '@/hooks/useTypewriter';
import WizardSearchableInput from './WizardSearchableInput';
import { SelectModern } from '@/components/ui/select-modern';

/* ── Types ─────────────────────────────────────────── */

const isDraftInput = (type?: WizardStep['inputType']) =>
  type === 'text' || type === 'textarea' || type === 'searchable' || type === 'select';

export interface WizardStep {
  key: string;
  question: string;
  placeholder?: string;
  inputType: 'text' | 'textarea' | 'choice' | 'multi-select' | 'searchable' | 'select';
  options?: { value: string; label: string; meta?: string; rank?: number }[];
  suggestions?: string[];
  required?: boolean;
  allowCustom?: boolean; // for 'searchable': allow free-typed values not in the list
}

export interface QAWizardProps {
  steps: WizardStep[];
  onComplete: (answers: Record<string, string | string[]>) => void | Promise<void>;
  completeLabel?: string;
  completingLabel?: string;
  initialValues?: Record<string, string | string[]>;
  /** Called when an answer changes — lets the host auto-fill dependent fields. */
  onAnswerChange?: (key: string, value: string | string[], answers: Record<string, string | string[]>) => Record<string, string | string[]> | void;
  /** If provided, shows a "Skip setup" link that calls this callback. */
  onSkipAll?: () => void;
}

/* ── Helpers ───────────────────────────────────────── */

const INPUT_CLS =
  'w-full px-3 py-3 rounded-lg border border-line-strong bg-background text-base text-foreground font-light placeholder:text-sm placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-foreground/[0.12] focus:border-transparent transition-colors';

function formatAnswer(val: string | string[] | undefined): string {
  if (!val) return '';
  if (Array.isArray(val)) return val.join(', ');
  return val;
}

/* ── Component ─────────────────────────────────────── */

export default function QAWizard({
  steps,
  onComplete,
  completeLabel = 'Save & start',
  completingLabel = 'Saving\u2026',
  initialValues = {},
  onAnswerChange,
  onSkipAll,
}: QAWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(initialValues);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const step = steps[currentStep];
  const { displayed, done } = useTypewriter(step?.question ?? '', 18);

  // Auto-focus input when typewriter finishes
  useEffect(() => {
    if (done && inputRef.current) inputRef.current.focus();
  }, [done, currentStep]);

  // Sync draft with existing answer when navigating back
  useEffect(() => {
    const existing = answers[step?.key];
    if (isDraftInput(step?.inputType)) {
      setDraft(typeof existing === 'string' ? existing : '');
    }
  }, [currentStep, step?.key, step?.inputType]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: string, val: string | string[]) =>
    setAnswers(prev => {
      const next = { ...prev, [key]: val };
      const overrides = onAnswerChange?.(key, val, next);
      return overrides ? { ...next, ...overrides } : next;
    });

  const currentValue = answers[step?.key];

  const canAdvance = (): boolean => {
    if (!step) return false;
    if (!step.required) return true;
    if (isDraftInput(step.inputType)) return !!draft.trim();
    if (step.inputType === 'choice') return !!currentValue;
    if (step.inputType === 'multi-select') return Array.isArray(currentValue) && currentValue.length > 0;
    return true;
  };

  const advance = async () => {
    if (!step) return;
    // Save text input to answers (use set() so onAnswerChange fires)
    if (isDraftInput(step.inputType)) {
      if (draft.trim()) set(step.key, draft.trim());
    }
    // Move forward or complete
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
      setDraft('');
    } else {
      setSaving(true);
      const finalAnswers = { ...answers };
      if (isDraftInput(step.inputType)) {
        if (draft.trim()) finalAnswers[step.key] = draft.trim();
      }
      try {
        await onComplete(finalAnswers);
      } finally {
        setSaving(false);
      }
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
      setDraft('');
    }
  };

  const toggleMultiSelect = (val: string) => {
    const arr = Array.isArray(currentValue) ? [...currentValue] : [];
    const idx = arr.indexOf(val);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(val);
    set(step.key, arr);
  };

  const isLastStep = currentStep === steps.length - 1;
  const buttonLabel = isLastStep
    ? saving ? completingLabel : completeLabel
    : canAdvance() ? 'Next' : 'Skip';

  /* ── Render ──────────────────────────────────────── */

  return (
    <div className="max-w-lg mx-auto pt-8 sm:pt-16">
      {/* Progress bar */}
      <div className="flex items-center gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= currentStep ? 'bg-foreground' : 'bg-ink/[0.08]'
            }`}
          />
        ))}
      </div>

      {/* Back button */}
      {currentStep > 0 && (
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-ink/40 hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}

      {/* Completed answers summary */}
      <AnimatePresence>
        {steps.slice(0, currentStep).map(s => {
          const val = answers[s.key];
          if (!val || (Array.isArray(val) && val.length === 0)) return null;
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <p className="text-xs text-ink/35 font-light">{s.question}</p>
              <p className="text-sm text-ink/70 mt-0.5">{formatAnswer(val)}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Current question with typewriter */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-2xl sm:text-3xl font-extralight text-foreground tracking-[-0.02em] mb-1 min-h-[2.5rem]">
            {displayed}
            {!done && (
              <span className="inline-block w-[2px] h-7 -mb-1 bg-ink/30 animate-pulse ml-0.5" />
            )}
          </h1>
          <p className="text-sm text-ink/40 font-light mb-6">
            {step?.required ? 'Required' : 'Optional \u2014 skip if unsure'}
          </p>

          {/* Input area */}
          {(step?.inputType === 'text' || step?.inputType === 'textarea') && (
            <>
              {step.inputType === 'textarea' ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  rows={3}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); advance(); }
                  }}
                  placeholder={step.placeholder}
                  className={`${INPUT_CLS} resize-none`}
                />
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); advance(); } }}
                  placeholder={step.placeholder}
                  className={INPUT_CLS}
                />
              )}

              {/* Suggestions */}
              {step.suggestions && step.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {step.suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDraft(s)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        draft === s
                          ? 'bg-ink text-background border border-ink font-medium'
                          : 'border border-line-emphasis text-ink/60 hover:border-ink/30 hover:text-ink'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Searchable dropdown: ranked so the closest name wins, not the first substring */}
          {step?.inputType === 'searchable' && step.options && (
            <WizardSearchableInput
              value={draft}
              onChange={setDraft}
              onSubmit={advance}
              options={step.options}
              placeholder={step.placeholder}
              allowCustom={step.allowCustom}
              inputClassName={INPUT_CLS}
              inputRef={inputRef as React.RefObject<HTMLInputElement>}
            />
          )}

          {/* Dropdown list: same control as the manual check-in player picker */}
          {step?.inputType === 'select' && step.options && (
            <SelectModern
              value={draft}
              onChange={setDraft}
              options={step.options}
              placeholder={step.placeholder}
              triggerClassName="border border-line-strong py-3"
            />
          )}

          {/* Choice (single-select pills) — auto-advance after selection */}
          {step?.inputType === 'choice' && step.options && (
            <div className="flex flex-wrap gap-2">
              {step.options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    set(step.key, opt.value);
                    // Auto-advance after a brief flash so the user sees their pick
                    const isLast = currentStep >= steps.length - 1;
                    setTimeout(() => {
                      if (!isLast) {
                        setCurrentStep(s => s + 1);
                        setDraft('');
                      } else {
                        // Last step: call onComplete with merged answers directly
                        // (avoids stale-closure issues with the `answers` state).
                        setSaving(true);
                        const merged = { ...answers, [step.key]: opt.value };
                        Promise.resolve(onComplete(merged)).finally(() => setSaving(false));
                      }
                    }, 300);
                  }}
                  className={`px-4 py-2.5 rounded-full text-sm transition-all ${
                    currentValue === opt.value
                      ? 'bg-ink text-[var(--background)] border border-ink font-medium'
                      : 'border border-line-emphasis text-ink/60 hover:border-ink/30 hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Multi-select pills */}
          {step?.inputType === 'multi-select' && step.options && (
            <div className="flex flex-wrap gap-2">
              {step.options.map(opt => {
                const selected = Array.isArray(currentValue) && currentValue.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleMultiSelect(opt.value)}
                    className={`px-4 py-2.5 rounded-full text-sm transition-all ${
                      selected
                        ? 'bg-ink text-[var(--background)] border border-ink font-medium'
                        : 'border border-line-emphasis text-ink/60 hover:border-ink/30 hover:text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Next / Skip / Save */}
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={advance}
              disabled={saving || (step?.required && !canAdvance())}
              className="px-6 py-2.5 bg-background/70 backdrop-blur-sm border border-line-emphasis text-ink/80 shadow-sm text-sm rounded-full hover:bg-surface-overlay hover:shadow transition-all font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {buttonLabel}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
            {!step?.required && currentStep < steps.length - 1 && (
              <button
                onClick={() => { setCurrentStep(s => s + 1); setDraft(''); }}
                className="text-sm text-ink/30 hover:text-ink/60 transition-colors"
              >
                Skip
              </button>
            )}
          </div>

          {/* Skip entire wizard */}
          {onSkipAll && (
            <button
              onClick={onSkipAll}
              className="mt-6 text-sm text-ink/25 hover:text-ink/50 transition-colors"
            >
              Skip setup, I&rsquo;ll do this later
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
