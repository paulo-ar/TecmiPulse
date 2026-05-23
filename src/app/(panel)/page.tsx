'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import TimelineChart from '@/components/TimelineChart';
import { supabase } from '@/lib/supabase';
import { cn, dateRange, formatDate, formatTime, fullName, isSameDay } from '@/lib/utils';
import type { RegistroAccesoConUsuario } from '@/types/database';

function normalizeRecords(data: unknown): RegistroAccesoConUsuario[] {
  const records = (data || []) as Array<
    RegistroAccesoConUsuario & { usuarios_gimnasio?: RegistroAccesoConUsuario['usuarios_gimnasio'][] }
  >;

  return records.map((record) => ({
    ...record,
    usuarios_gimnasio: Array.isArray(record.usuarios_gimnasio)
      ? record.usuarios_gimnasio[0] || null
      : record.usuarios_gimnasio || null
  }));
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date);
}

function buildCalendarDays(baseDate: Date) {
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function recordName(record: RegistroAccesoConUsuario) {
  return record.usuarios_gimnasio ? fullName(record.usuarios_gimnasio) : 'Usuario no encontrado';
}

interface VisitsDialogProps {
  open: boolean;
  records: RegistroAccesoConUsuario[];
  selectedDate: Date;
  onClose: () => void;
}

function VisitsDialog({ open, records, selectedDate, onClose }: VisitsDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-sm shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-medium text-zinc-50">Total de visitas</h2>
            <p className="mt-1 text-xs font-medium text-zinc-400">{formatDate(selectedDate)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-300 transition-colors hover:bg-zinc-800/50"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-800">
          <VisitsTable records={records} emptyText="No hay visitas registradas para esta fecha." />
        </div>
      </div>
    </div>
  );
}

function VisitsTable({ records, emptyText }: { records: RegistroAccesoConUsuario[]; emptyText: string }) {
  return (
    <table className="w-full">
      <thead className="border-b border-zinc-800 bg-zinc-900 text-xs uppercase tracking-wider text-zinc-400">
        <tr>
          <th className="px-4 py-3 text-left font-medium">Matricula</th>
          <th className="px-4 py-3 text-left font-medium">Nombre</th>
          <th className="px-4 py-3 text-left font-medium">Hora de Entrada</th>
          <th className="px-4 py-3 text-left font-medium">Hora de Salida</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <tr key={record.id} className="text-sm font-normal text-zinc-300 transition-colors hover:bg-zinc-800/50">
            <td className="px-4 py-3 font-mono">{record.matricula}</td>
            <td className="px-4 py-3">{recordName(record)}</td>
            <td className="px-4 py-3">{formatTime(record.hora_entrada)}</td>
            <td className="px-4 py-3">{formatTime(record.hora_salida)}</td>
          </tr>
        ))}
        {records.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-4 py-6 text-center text-sm font-normal text-zinc-600">
              {emptyText}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [activeRecords, setActiveRecords] = useState<RegistroAccesoConUsuario[]>([]);
  const [selectedDateRecords, setSelectedDateRecords] = useState<RegistroAccesoConUsuario[]>([]);
  const [visitsDialogOpen, setVisitsDialogOpen] = useState(false);
  const [manualMatricula, setManualMatricula] = useState('');
  const [message, setMessage] = useState('');
  const isSelectedToday = isSameDay(selectedDate, new Date());
  const calendarDays = useMemo(() => buildCalendarDays(selectedDate), [selectedDate]);

  const loadDashboard = useCallback(async () => {
    const range = dateRange(selectedDate);

    const { data: recordsData } = await supabase
      .from('registros_acceso')
      .select('id, matricula, hora_entrada, hora_salida, estatus, usuarios_gimnasio(matricula, nombre, apellidos)')
      .gte('hora_entrada', range.start)
      .lte('hora_entrada', range.end)
      .order('hora_entrada', { ascending: true });

    setSelectedDateRecords(normalizeRecords(recordsData));

    if (isSameDay(selectedDate, new Date())) {
      const { data: activeData } = await supabase
        .from('registros_acceso')
        .select('id, matricula, hora_entrada, hora_salida, estatus, usuarios_gimnasio(matricula, nombre, apellidos)')
        .eq('estatus', 'abierto')
        .order('hora_entrada', { ascending: false });

      setActiveRecords(normalizeRecords(activeData));
      return;
    }

    setActiveRecords([]);
  }, [selectedDate]);

  useEffect(() => {
    loadDashboard();

    if (!isSelectedToday) return;

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
  }, [isSelectedToday, loadDashboard]);

  async function handleManualOpen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const matricula = manualMatricula.trim();
    if (!matricula || !isSelectedToday) return;

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Usuarios Actuales en Gimnasio</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
                {isSelectedToday ? activeRecords.length : 0}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVisitsDialogOpen(true)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-left transition-colors hover:bg-zinc-800/50"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {isSelectedToday ? 'Total de Visitas Hoy' : 'Total de Visitas'}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">{selectedDateRecords.length}</p>
            </button>
            <div className="rounded-lg border border-amber-800 bg-amber-950/50 p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Aviso</p>
              <p className="mt-3 text-sm font-normal text-amber-400">Cierre automatico programado a las 22:30 hrs</p>
            </div>
          </section>

          {isSelectedToday ? (
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
          ) : null}

          <TimelineChart registros={selectedDateRecords} />
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-zinc-50">Calendario</h2>
                <p className="mt-1 text-xs font-medium text-zinc-400 capitalize">{monthLabel(selectedDate)}</p>
              </div>
              <div className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white">
                {formatTime(new Date().toISOString())}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                <div key={`${day}-${index}`} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(new Date(day))}
                    className={cn(
                      'aspect-square rounded-md text-xs font-medium transition-colors',
                      isCurrentMonth ? 'text-zinc-300' : 'text-zinc-600',
                      isToday && 'bg-green-600 text-white',
                      !isToday && isSelected && 'border border-green-600 bg-zinc-950 text-zinc-50',
                      !isToday && !isSelected && 'hover:bg-zinc-800/50'
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              className="mt-4 w-full rounded-md bg-green-700 px-3 py-2 text-sm font-normal text-white transition-colors hover:bg-green-600"
            >
              Hoy
            </button>
          </section>
        </aside>
      </div>

      {isSelectedToday ? (
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
                  <td className="px-4 py-3">{recordName(record)}</td>
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
      ) : (
        <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 p-6">
            <h2 className="text-lg font-medium text-zinc-50">Total de visitas</h2>
          </div>
          <VisitsTable records={selectedDateRecords} emptyText="No hay visitas registradas para esta fecha." />
        </section>
      )}

      <VisitsDialog
        open={visitsDialogOpen}
        records={selectedDateRecords}
        selectedDate={selectedDate}
        onClose={() => setVisitsDialogOpen(false)}
      />
    </div>
  );
}
