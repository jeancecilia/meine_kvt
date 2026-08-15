'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/navigation/sidebar';
import { MobileNav } from '@/components/navigation/mobile-nav';
import { QuickActionModal } from '@/components/navigation/quick-action-modal';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 min-w-0 pb-20 md:pb-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>

      <MobileNav onOpenQuickAction={() => setQuickActionOpen(true)} />
      <QuickActionModal isOpen={quickActionOpen} onClose={() => setQuickActionOpen(false)} />
    </div>
  );
}
