'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface SelectModernOption {
  value: string;
  label: string;
}

interface SelectModernProps {
  options: SelectModernOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  label?: string;
}

export function SelectModern({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  triggerClassName = '',
  disabled = false,
  label,
}: SelectModernProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Close on click outside (desktop only - mobile uses backdrop)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
      }
    }
  }, [isOpen]);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[focusedIndex]) {
        (items[focusedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
      setFocusedIndex(-1);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen && focusedIndex >= 0) {
            handleSelect(options[focusedIndex].value);
          } else {
            setIsOpen(true);
            setFocusedIndex(options.findIndex((o) => o.value === value));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(options.findIndex((o) => o.value === value));
          } else {
            setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case 'Tab':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    },
    [disabled, isOpen, focusedIndex, options, value, handleSelect],
  );

  const optionItems = options.map((option, index) => {
    const isSelected = option.value === value;
    const isFocused = index === focusedIndex;

    return (
      <button
        key={option.value}
        id={`option-${index}`}
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={() => handleSelect(option.value)}
        onMouseEnter={() => setFocusedIndex(index)}
        className={`w-full flex items-center justify-between px-4 py-3 md:px-3 md:py-2 text-sm font-light text-left transition-colors duration-100
          ${isSelected ? 'text-ink' : 'text-ink/70'}
          ${isFocused ? 'bg-ink/[0.03]' : ''}
        `}
      >
        <span className="truncate">{option.label}</span>
        {isSelected && <Check className="w-3.5 h-3.5 text-ink/50 flex-shrink-0" />}
      </button>
    );
  });

  return (
    <div className={`relative ${isOpen ? 'z-[70]' : ''} ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setFocusedIndex(options.findIndex((o) => o.value === value));
            }
          }
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label ? `${label}. ${selectedOption?.label || placeholder}` : undefined}
        className={`flex items-center justify-between gap-2 w-full px-3 py-2 text-sm font-light rounded-xl
          transition-all duration-200 cursor-pointer
          ${disabled
            ? 'bg-background text-ink/30 cursor-not-allowed'
            : 'bg-background text-ink/80 hover:text-ink'
          }
          ${isOpen ? 'ring-1 ring-ink/20' : ''}
          ${triggerClassName}
        `}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-ink/40 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Desktop dropdown (md+) */}
      <div
        className={`hidden md:block surface-popover absolute top-full left-0 w-full mt-1 rounded-xl z-[71]
          transition-all duration-200 origin-top
          ${isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
          }
        `}
        role="listbox"
        aria-activedescendant={focusedIndex >= 0 ? `option-${focusedIndex}` : undefined}
      >
        <div ref={listRef} className="max-h-60 py-1 scroll-y">
          {optionItems}
        </div>
      </div>

      {/* Mobile bottom sheet (below md) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 surface-scrim"
            onClick={() => setIsOpen(false)}
          onKeyDown={(e) => { if (e.currentTarget !== e.target) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }} role="button" tabIndex={0} />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 surface-modal rounded-t-3xl max-h-[70vh] flex flex-col">
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-ink/5">
              <div>
                <div className="w-10 h-1 rounded-full bg-ink/10 mx-auto mb-3" />
                <span className="text-sm font-light text-ink/50">{label || placeholder}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-ink/5 transition-colors"
               aria-label="Close">
                <X className="w-4 h-4 text-ink/40" />
              </button>
            </div>
            {/* Options */}
            <div className="flex-1 py-2 scroll-y" role="listbox">
              {optionItems}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
