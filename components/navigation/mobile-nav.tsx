'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, MessageSquare, Plus, TrendingUp, Target } from 'lucide-react';

interface MobileNavProps {
  onOpenQuickAction: () => void;
}

export function MobileNav({ onOpenQuickAction }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 border-t border-slate-800 backdrop-blur-lg px-4 py-2 flex items-center justify-around">
      <Link href="/dashboard" className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${pathname === '/dashboard' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}>
        <Calendar className="w-5 h-5" /><span>Heute</span>
      </Link>

      <Link href="/therapy" className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${pathname.startsWith('/therapy') ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}>
        <MessageSquare className="w-5 h-5" /><span>Therapie</span>
      </Link>

      <button onClick={onOpenQuickAction} className="h-12 w-12 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 flex items-center justify-center -mt-5 shadow-lg shadow-teal-900/40 border-2 border-slate-900 transition-transform active:scale-95">
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      <Link href="/progress" className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${pathname.startsWith('/progress') ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}>
        <TrendingUp className="w-5 h-5" /><span>Verlauf</span>
      </Link>

      <Link href="/treatment-plan" className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${pathname.startsWith('/treatment-plan') ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}>
        <Target className="w-5 h-5" /><span>Plan</span>
      </Link>
    </div>
  );
}
