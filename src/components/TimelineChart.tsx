'use client';

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { RegistroAccesoConUsuario } from '@/types/database';
import { formatTime, fullName } from '@/lib/utils';

interface TimelineChartProps {
  registros: RegistroAccesoConUsuario[];
}

interface TimelinePoint {
  x: number;
  y: number;
  tipo: 'Entrada' | 'Salida';
  matricula: string;
  nombre: string;
  hora: string;
}

function toHourDecimal(value: string) {
  const date = new Date(value);
  return date.getHours() + date.getMinutes() / 60;
}

function buildPoints(registros: RegistroAccesoConUsuario[]) {
  const points: TimelinePoint[] = [];

  registros.forEach((registro, index) => {
    const nombre = registro.usuarios_gimnasio ? fullName(registro.usuarios_gimnasio) : 'Sin usuario';

    points.push({
      x: toHourDecimal(registro.hora_entrada),
      y: index + 1,
      tipo: 'Entrada',
      matricula: registro.matricula,
      nombre,
      hora: formatTime(registro.hora_entrada)
    });

    if (registro.hora_salida) {
      points.push({
        x: toHourDecimal(registro.hora_salida),
        y: index + 1,
        tipo: 'Salida',
        matricula: registro.matricula,
        nombre,
        hora: formatTime(registro.hora_salida)
      });
    }
  });

  return points;
}

export default function TimelineChart({ registros }: TimelineChartProps) {
  const points = buildPoints(registros);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-zinc-50">Linea de Tiempo</h2>
        <p className="mt-1 text-xs font-medium text-zinc-400">Actividad de ingresos y salidas de 06:00 a 22:30 hrs</p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid stroke="#27272a" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[6, 22.5]}
              ticks={[6, 8, 10, 12, 14, 16, 18, 20, 22.5]}
              tickFormatter={(value) => `${Math.floor(Number(value)).toString().padStart(2, '0')}:00`}
              stroke="#a1a1aa"
              tick={{ fill: '#a1a1aa', fontSize: 12 }}
            />
            <YAxis type="number" dataKey="y" hide domain={[0, Math.max(points.length, 1)]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: '#22c55e' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as TimelinePoint;

                return (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 shadow-sm shadow-black/50">
                    <p className="text-xs font-medium text-zinc-400">{point.tipo}</p>
                    <p className="mt-1 text-sm font-normal text-zinc-50">{point.nombre}</p>
                    <p className="mt-1 font-mono text-xs font-medium text-green-500">{point.matricula}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-400">{point.hora}</p>
                  </div>
                );
              }}
            />
            <Scatter data={points} fill="#22c55e" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
