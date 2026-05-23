'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function redirectIfAuthenticated() {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace('/');
    }

    redirectIfAuthenticated();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      setError('Credenciales invalidas.');
      setLoading(false);
      return;
    }

    router.replace('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Sistema de Acceso - Gimnasio Tecmilenio
        </h1>
        <p className="mt-2 text-sm font-normal text-zinc-400">Ingresa tus credenciales de administrador.</p>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-normal text-zinc-400">
            Correo electronico
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-normal text-zinc-400">
            Contrasena
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
              required
            />
          </label>

          {error ? <p className="text-xs font-medium text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-normal text-white transition-colors hover:bg-green-600 disabled:text-zinc-600"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesion'}
          </button>
        </div>
      </form>
    </main>
  );
}
