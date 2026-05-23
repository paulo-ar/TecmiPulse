'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminLockProps {
  onUnlock: () => void;
}

export default function AdminLock({ onUnlock }: AdminLockProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user.email;

    if (!email) {
      setError('Sesion no valida.');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('La contrasena no coincide.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onUnlock();
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Area Restringida</h1>
        <p className="mt-2 text-sm font-normal text-zinc-400">
          Para gestionar administradores, por favor confirma tu contrasena.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contrasena"
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
            required
          />
          {error ? <p className="text-xs font-medium text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-normal text-white transition-colors hover:bg-green-600 disabled:text-zinc-600"
          >
            {loading ? 'Validando...' : 'Confirmar acceso'}
          </button>
        </div>
      </form>
    </div>
  );
}
