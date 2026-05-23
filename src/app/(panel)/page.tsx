'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import TimelineChart from '@/components/TimelineChart';
import { supabase } from '@/lib/supabase';
import { formatTime, fullName, todayRange } from '@/lib/utils';
import type { RegistroAccesoConUsuario } from '@/types/database';

function normalizeRecords(data: unknown): RegistroAccesoConUsuario[] {
  const records = (data || []) as Array<RegistroAccesoConUsuario & { usuarios_gimnasio?: RegistroAccesoConUsuario['usuarios_gimnasio'][] }>;

  return records.map((record) => ({
    ...record,
    usuarios_gimnasio: Array.isArray(record.usuarios_gimnasio)
      ? record.usuarios_gimnasio[0] || null
      : record.usuarios_gimnasio || null
  }));
}

export default function DashboardPage() {
  const [activeRecords, setActiveRecords] = useState<RegistroAccesoConUsuario[]>([]);
  const [todayRecords, setTodayRecords] = useState<RegistroAccesoConUsuario[]>([]);
  const [manualMatricula, setManualMatricula] = useState('');
  const [message, setMessage] = useState('');

  const loadDashboard = useCallback(async () => {
    const range = todayRange();

    const { data: activeData } = await supabase
      .from('registros_acceso')
      .select('id, matricula, hora_entrada, hora_salida, estatus, usuarios_gimnasio(matricula, nombre, apellidos)')
      .eq('estatus', 'abierto')
      .order('hora_entrada', { ascending: false });

    const { data: todayData } = await supabase
      .from('registros_acceso')
      .select('id, matricula, hora_entrada, hora_salida, estatus, usuarios_gimnasio(matricula, nombre, apellidos)')
      .gte('hora_entrada', range.start)
      .lte('hora_entrada', range.end)
      .order('hora_entrada', { ascending: true });

    setActiveRecords(normalizeRecords(activeData));
    setTodayRecords(normalizeRecords(todayData));
  }, []);

  useEffect(() => {
    loadDashboard();

    const channel = supabase
      .channel('registros-acceso-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'registros_acceso' },
        () => loadDashboard()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'registros_acceso' },
        () => loadDashboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  async function handleManualOpen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const matricula = manualMatricula.trim();
    if (!matricula) return;

    const { data: existing } = await supabase
      .from('registros_acceso')
      .select('id')
      .eq('matricula', matricula)
      .eq('estatus', 'abierto')
      .maybeSingle();

    if (existing) {
      setMessage('La matricula ya tiene un registro abierto.');
      return;
    }

    const { error } = await supabase.from('registros_acceso').insert({
      matricula,
      hora_entrada: new Date().toISOString(),
      hora_salida: null,
      estatus: 'abierto'
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setManualMatricula('');
    setMessage('Registro manual abierto.');
    loadDashboard();
  }

  async function handleManualClose(id: string) {
    const { error } = await supabase
      .from('registros_acceso')
      .update({
        hora_salida: new Date().toISOString(),
        estatus: 'cerrado'
      })
      .eq('id', id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Registro cerrado manualmente.');
    loadDashboard();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Panel de Control en Tiempo Real</h1>
        <p className="mt-1 text-sm font-normal text-zinc-400">Monitoreo operativo de accesos NFC del gimnasio.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Usuarios Actuales en Gimnasio</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">{activeRecords.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total de Visitas Hoy</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">{todayRecords.length}</p>
        </div>
        <div className="rounded-lg border border-amber-800 bg-amber-950/50 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Aviso</p>
          <p className="mt-3 text-sm font-normal text-amber-400">Cierre automatico programado a las 22:30 hrs</p>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium text-zinc-50">Control Manual</h2>
        <form onSubmit={handleManualOpen} className="mt-4 flex flex-col gap-4 md:flex-row">
          <input
            value={manualMatricula}
            onChange={(event) => setManualMatricula(event.target.value)}
            placeholder="Matricula"
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1 md:max-w-xs"
          />
          <button
            type="submit"
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-normal text-white transition-colors hover:bg-green-600"
          >
            Abrir Registro Manual
          </button>
        </form>
        {message ? <p className="mt-3 text-xs font-medium text-zinc-400">{message}</p> : null}
      </section>

      <TimelineChart registros={todayRecords} />

      <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 p-6">
          <h2 className="text-lg font-medium text-zinc-50">Registros Abiertos</h2>
        </div>
        <table className="w-full">
          <thead className="border-b border-zinc-800 bg-zinc-900 text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Matricula</th>
              <th className="px-4 py-3 text-left font-medium">Nombre Completo</th>
              <th className="px-4 py-3 text-left font-medium">Hora de Entrada</th>
              <th className="px-4 py-3 text-right font-medium">Accion</th>
            </tr>
          </thead>
          <tbody>
            {activeRecords.map((record) => (
              <tr key={record.id} className="text-sm font-normal text-zinc-300 transition-colors hover:bg-zinc-800/50">
                <td className="px-4 py-3 font-mono">{record.matricula}</td>
                <td className="px-4 py-3">
                  {record.usuarios_gimnasio ? fullName(record.usuarios_gimnasio) : 'Usuario no encontrado'}
                </td>
                <td className="px-4 py-3">{formatTime(record.hora_entrada)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleManualClose(record.id)}
                    className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800/50"
                  >
                    Cerrar Registro Manualmente
                  </button>
                </td>
              </tr>
            ))}
            {activeRecords.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm font-normal text-zinc-600">
                  No hay usuarios activos en gimnasio.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
