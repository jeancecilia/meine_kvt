'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  Activity,
  MessageSquare,
  AlertCircle,
  FlaskConical,
  Compass,
  BookOpen,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

const navItems = [
  { label: 'Heute', href: '/dashboard', icon: Calendar },
  { label: 'Therapieplan', href: '/treatment-plan', icon: Target },
  { label: 'Check-in', href: '/check-in', icon: Activity },
  { label: 'Therapie', href: '/therapy', icon: MessageSquare },
  { label: 'Situationen', href: '/situations', icon: AlertCircle },
  { label: 'Soziale Exposition', href: '/social-exposure', icon: Users },
  { label: 'Experimente', href: '/experiments', icon: FlaskConical },
  { label: 'Werte', href: '/values', icon: Compass },
  { label: 'Tagebuch', href: '/journal', icon: BookOpen },
  { label: 'Fallformulierung', href: '/formulation', icon: FileText },
  { label: 'Fortschritt', href: '/progress', icon: TrendingUp },
  { label: 'Einstellungen', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900/60 p-4 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-3 py-3 mb-6 border-b border-slate-800/80">
        <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-100 tracking-wide">meinkvt</h1>
          <p className="text-[11px] text-slate-400">AI Therapy Workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Abmelden</span>
        </button>
      </div>
    </aside>
  );
}
