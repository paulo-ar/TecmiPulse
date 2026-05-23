'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn, docsCompleted, formatDate, formatTime, fullName } from '@/lib/utils';
import type { RegistroAcceso, UsuarioGimnasio } from '@/types/database';

interface UserOverlayProps {
  user: UsuarioGimnasio | null;
  onClose: () => void;
}

export default function UserOverlay({ user, onClose }: UserOverlayProps) {
  const [history, setHistory] = useState<RegistroAcceso[]>([]);
  const completed = user ? docsCompleted(user) : 0;

  useEffect(() => {
    async function loadHistory() {
      if (!user) return;

      const { data } = await supabase
        .from('registros_acceso')
        .select('id, matricula, hora_entrada, hora_salida, estatus')
        .eq('matricula', user.matricula)
        .order('hora_entrada', { ascending: false })
        .limit(10);

      setHistory((data as RegistroAcceso[]) || []);
    }

    loadHistory();
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-sm shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-medium text-zinc-50">{fullName(user)}</h2>
            <p className="mt-1 font-mono text-xs font-medium text-zinc-400">{user.matricula}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-300 transition-colors hover:bg-zinc-800/50"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-blue-800 bg-blue-950/50 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
            {user.nivel}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
              completed === 4
                ? 'border-emerald-800 bg-emerald-950/50 text-emerald-400'
                : 'border-red-800 bg-red-950/50 text-red-400'
            )}
          >
            Docs {completed}/4
          </span>
          <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-mono text-xs font-semibold text-zinc-400">
            NFC {user.nfc_id}
          </span>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full">
            <thead className="border-b border-zinc-800 bg-zinc-900 text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-left font-medium">Entrada</th>
                <th className="px-4 py-3 text-left font-medium">Salida</th>
                <th className="px-4 py-3 text-left font-medium">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {history.map((registro) => (
                <tr key={registro.id} className="text-sm font-normal text-zinc-300 transition-colors hover:bg-zinc-800/50">
                  <td className="px-4 py-3">{formatDate(registro.hora_entrada)}</td>
                  <td className="px-4 py-3">{formatTime(registro.hora_entrada)}</td>
                  <td className="px-4 py-3">{formatTime(registro.hora_salida)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                        registro.estatus === 'sin_cierre'
                          ? 'border-amber-800 bg-amber-950/50 text-amber-400'
                          : registro.estatus === 'abierto'
                            ? 'border-emerald-800 bg-emerald-950/50 text-emerald-400'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      )}
                    >
                      {registro.estatus}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm font-normal text-zinc-600">
                    Sin historial registrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
