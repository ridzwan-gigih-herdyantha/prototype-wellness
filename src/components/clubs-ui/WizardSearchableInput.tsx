'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { rankSearchOptions, hasExactMatch } from './wizard-search';
import type { RankableOption } from './wizard-search';

interface WizardSearchableInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  options: RankableOption[];
  placeholder?: string;
  allowCustom?: boolean;
  inputClassName: string;
  inputRef: React.RefObject<HTMLInputElement>;
}

const MAX_RESULTS = 30;

export default function WizardSearchableInput({
  value,
  onChange,
  onSubmit,
  options,
  placeholder,
  allowCustom,
  inputClassName,
  inputRef,
}: WizardSearchableInputProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = value.trim();
  const results = rankSearchOptions(options, query, MAX_RESULTS);
  const showCustom = !!allowCustom && !!query && !hasExactMatch(options, query);
  const showDropdown = open && (results.length > 0 || showCustom);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          enterKeyHint="next"
          autoComplete="off"
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onClick={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); return; }
            if (e.key === 'ArrowDown') { setOpen(true); return; }
            if (e.key === 'Enter') { e.preventDefault(); setOpen(false); onSubmit(); }
          }}
          placeholder={placeholder}
          className={`${inputClassName} pl-9`}
        />
      </div>
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-ink/[0.06] bg-background shadow-lg overflow-hidden">
          <div className="max-h-[45vh] sm:max-h-64 overflow-y-auto overscroll-contain py-1">
            {results.map(o => (
              <button
                key={`${o.value}-${o.meta || ''}`}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-ink/[0.02] ${o.value === value ? 'bg-ink/[0.02]' : ''}`}
              >
                <span className="text-foreground flex-1 truncate">{o.label}</span>
                {o.meta ? <span className="shrink-0 text-ink/45 text-xs truncate max-w-[40%]">{o.meta}</span> : null}
                {o.value === value && <Check className="w-3.5 h-3.5 text-ink/35 shrink-0" />}
              </button>
            ))}
            {results.length === MAX_RESULTS && (
              <p className="px-3 py-1.5 text-xs text-ink/35">Keep typing to narrow results</p>
            )}
            {showCustom && (
              <button
                type="button"
                onClick={() => { onChange(query); setOpen(false); }}
                className="w-full px-3 py-2.5 text-sm text-left text-ink/60 hover:bg-ink/[0.02] border-t border-ink/[0.04]"
              >
                Use &ldquo;{query}&rdquo;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
