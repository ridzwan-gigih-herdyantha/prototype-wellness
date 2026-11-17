'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, ChevronDown, Menu, Moon, Settings, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import { mockClub } from '@/lib/mock-club';
import { NAV_GROUPS } from './nav-config';

export default function ClubsHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const group = NAV_GROUPS.find(g => g.children.some(c => pathname.startsWith(c.href)));
  const active = group?.children.find(c => pathname.startsWith(c.href));

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] h-14 bg-surface backdrop-blur-2xl border-b border-line">
      <div className="h-full px-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/clubs/wellness" className="flex items-center gap-2.5 min-w-0">
            <img src="/football-analytics-ai-transparent.webp" alt="Football Analytics AI" aria-hidden="true" className="h-6 w-auto object-contain flex-shrink-0" />
            <span className="sr-only sm:hidden">{mockClub.clubProfile.club_name}</span>
            <span className="text-sm font-semibold tracking-tight text-foreground truncate hidden sm:block">
              {mockClub.clubProfile.club_name}
            </span>
          </Link>

          {group && active && (
            <motion.span
              key={pathname}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:flex items-center gap-2 border-l border-line-emphasis pl-6"
              style={{ color: 'rgb(var(--fc-text) / 0.65)' }}
            >
              <span className="text-[10px] font-light">{group.label}</span>
              <span className="text-[10px] font-light opacity-40">/</span>
              <span className="text-[10px] font-light">{active.label}</span>
            </motion.span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button className="relative p-1.5 rounded-md transition-all duration-150 text-ink/60 hover:text-foreground hover:bg-hover" aria-label="Notifications">
            <Bell className="w-3.5 h-3.5" />
          </button>
          <div className="relative inline-block">
            <button className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              ENG
              <ChevronDown className="w-3 h-3 transition-transform" aria-hidden="true" />
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md transition-all duration-150 text-ink/60 hover:text-foreground hover:bg-hover"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" aria-hidden="true" /> : <Moon className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
          <button className="p-1.5 rounded-md transition-all duration-150 text-ink/60 hover:text-foreground hover:bg-hover" aria-label="Settings">
            <Settings className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            onClick={onOpenMenu}
            className="lg:hidden p-1.5 rounded-md transition-all duration-150 text-ink/60 hover:text-foreground hover:bg-hover ml-0.5"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
