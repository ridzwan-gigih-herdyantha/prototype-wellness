'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, ChevronUp, Lock, PanelLeftOpen, Plus, RefreshCw } from 'lucide-react';
import { mockClub } from '@/lib/mock-club';
import { IMPLEMENTED_ROUTES, NAV_GROUPS } from './nav-config';

export default function ClubsSidebar({ className }: { className: string }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(NAV_GROUPS.filter(g => g.children.some(c => pathname.startsWith(c.href))).map(g => g.key)),
  );
  const [profileOpen, setProfileOpen] = useState(false);

  const toggleGroup = (key: string) =>
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <aside className={`${className} border-r border-line flex-col w-40 bg-surface-muted backdrop-blur-xl px-3 py-5`}>
      <nav aria-label="Club navigation" className="flex-1 overflow-y-auto space-y-0.5">
        {NAV_GROUPS.map(group => {
          const isOpen = openGroups.has(group.key);
          const hasActiveChild = group.children.some(c => pathname.startsWith(c.href));
          return (
            <div key={group.key} className="pt-3 first:pt-0">
              <button onClick={() => toggleGroup(group.key)} className="w-full flex items-center gap-1 px-3 pb-1 group">
                <span
                  className="truncate flex-1 text-left text-[9px] font-medium uppercase tracking-widest transition-colors"
                  style={{ color: hasActiveChild ? 'rgb(var(--fc-text) / 0.7)' : 'rgb(var(--fc-text) / 0.5)' }}
                >
                  {group.label}
                </span>
                <ChevronRight
                  className={`w-2.5 h-2.5 flex-shrink-0 transition-all duration-150 ${isOpen ? 'rotate-90' : ''}`}
                  style={{ color: 'rgb(var(--fc-text) / 0.45)' }}
                />
              </button>
              {isOpen && (
                <div className="space-y-0.5">
                  {group.children.map(child => {
                    const isActive = pathname.startsWith(child.href);
                    const implemented = IMPLEMENTED_ROUTES.has(child.href);
                    return (
                      <div key={child.href} className="relative group/item">
                        <Link
                          href={implemented ? child.href : '#'}
                          aria-current={isActive ? 'page' : undefined}
                          className={`flex items-center gap-1.5 px-3 py-1.5 pr-7 rounded-lg text-[11px] font-light transition-all ${
                            isActive ? 'bg-active text-foreground' : 'hover:bg-hover'
                          }`}
                          style={isActive ? undefined : { color: `rgb(var(--fc-text) / ${child.comingSoon ? '0.38' : '0.65'})` }}
                        >
                          <span className="truncate">{child.label}</span>
                          {child.comingSoon && <Lock className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line mt-2 pt-2">
        <div className="flex items-center justify-between px-3 mb-1">
          <button className="p-1 rounded-md text-ink/40 hover:text-ink hover:bg-hover transition-colors" title="New chat">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] font-medium uppercase tracking-widest flex-1 text-center" style={{ color: 'rgb(var(--fc-text) / 0.5)' }}>
            Chats
          </span>
          <button className="p-1 rounded-md text-ink/30 hover:text-ink hover:bg-hover transition-colors" title="Expand">
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-0.5 overflow-y-auto scrollbar-hide transition-all duration-200 max-h-[25vh]">
          <div className="group/chat relative rounded-lg transition-all duration-150 hover:bg-hover">
            <button type="button" className="w-full flex items-start gap-2 px-2.5 py-2 text-left">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-light truncate text-ink/65">hi</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="px-1 mb-2">
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center mb-1">
            <span className="text-xs font-light text-ink/50 whitespace-nowrap">Credits</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-extralight tabular-nums text-foreground">40,000</span>
            <span className="text-xs text-ink/30 tabular-nums whitespace-nowrap">(€400.00)</span>
          </div>
          <span className="inline-block mt-1.5 text-[10px] font-light text-ink/40 underline-offset-2 hover:text-foreground hover:underline transition-colors cursor-pointer">
            Buy more
          </span>
          <div className="mt-3 pt-3 border-t border-line">
            <button className="flex items-center justify-between gap-2 w-full text-[11px] text-ink/40 hover:text-ink/60 transition-colors">
              <div className="flex items-center gap-1.5 min-w-0">
                <RefreshCw className="w-3 h-3 shrink-0" />
                <span className="whitespace-nowrap">Auto-reload</span>
                <span role="img" aria-label="off" className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink/20" />
              </div>
              <ChevronDown className="w-3 h-3 shrink-0 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto px-3 pb-4 pt-4 border-t border-line">
        {profileOpen && (
          <div className="mb-2 bg-surface-overlay backdrop-blur-xl rounded-xl shadow-xl border border-line overflow-hidden">
            <span className="flex items-center px-3 py-2 text-[13px] font-light text-foreground hover:bg-hover transition-colors border-b border-line">Settings</span>
            <span className="flex items-center w-full px-3 py-2 text-[13px] font-light text-foreground hover:bg-hover transition-colors">Sign Out</span>
          </div>
        )}
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-hover transition-all hover:bg-active"
        >
          <div className="text-left min-w-0">
            <p className="text-[11px] font-light truncate" style={{ color: 'rgb(var(--fc-text) / 0.75)' }}>{mockClub.clubProfile.club_name}</p>
            <p className="text-[10px] font-light" style={{ color: 'rgb(var(--fc-text) / 0.65)' }}>{mockClub.role}</p>
          </div>
          <ChevronUp
            className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${profileOpen ? '' : 'rotate-180'}`}
            style={{ color: 'rgb(var(--fc-text) / 0.65)' }}
          />
        </button>
      </div>
    </aside>
  );
}
