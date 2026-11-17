'use client';

import React, { useState } from 'react';
import ClubsHeader from './_components/ClubsHeader';
import ClubsSidebar from './_components/ClubsSidebar';

export default function ClubsLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <ClubsHeader onOpenMenu={() => setMobileOpen(true)} />
      <ClubsSidebar className="hidden lg:flex fixed top-14 bottom-0 left-0 z-[55]" />

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-[58] bg-ink/30" onClick={() => setMobileOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="h-full w-fit bg-background">
            <ClubsSidebar className="flex h-full" />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 overflow-x-clip flex flex-col min-h-screen transition-all duration-200 lg:ml-40 pt-16">
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}
