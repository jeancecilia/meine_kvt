'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Anmeldung fehlgeschlagen');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 text-teal-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">meinkvt</h1>
          <p className="text-sm text-slate-400 mt-1">AI Therapy Companion & Personal Workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 block">Passwort</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                required
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all pl-10"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
            <p className="text-[11px] text-slate-500">Standard-Passwort: <code className="text-slate-400">therapy2026</code></p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-teal-900/20 text-sm disabled:opacity-50"
          >
            {loading ? 'Wird angemeldet...' : 'Workspace öffnen'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Single-Patient Local Environment</span>
        </div>
      </div>
    </div>
  );
}
