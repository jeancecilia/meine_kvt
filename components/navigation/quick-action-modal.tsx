'use client';

import Link from 'next/link';
import { X, Activity, MessageSquare, AlertCircle, Bookmark, Sparkles, Users, BrainCircuit } from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickActionModal({ isOpen, onClose }: QuickActionModalProps) {
  if (!isOpen) return null;

  const actions = [
    {
      label: '30-Sekunden Check-In',
      description: 'Stimmung und 10 Dimensionen erfassen',
      href: '/check-in',
      icon: Activity,
      color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    },
    {
      label: 'Situation protokollieren',
      description: 'Auslöser, Kognitionen & Verhalten erfassen',
      href: '/situations/new',
      icon: AlertCircle,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      label: 'Soziale Exposition protokollieren',
      description: 'Angst, Vermeidung, reale Reaktion & Learning erfassen',
      href: '/social-exposure',
      icon: Users,
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    },
    {
      label: 'Therapie-Sitzung starten',
      description: 'Strukturierte KI-Sitzung beginnen',
      href: '/therapy',
      icon: MessageSquare,
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      label: 'Langzeitgedächtnis',
      description: 'Alte Learnings suchen & Verlauf ansehen',
      href: '/memory',
      icon: BrainCircuit,
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    {
      label: 'Tagebuch-Eintrag / Gedanke',
      description: 'Freie Notiz oder Erkenntnis festhalten',
      href: '/journal',
      icon: Bookmark,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-semibold text-slate-100">Schnellaktion</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                onClick={onClose}
                className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 transition-all group"
              >
                <div className={`p-2.5 rounded-xl border ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-sm text-slate-200 group-hover:text-teal-300 transition-colors">
                    {action.label}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{action.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
