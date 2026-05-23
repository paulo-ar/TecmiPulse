import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UsuarioGimnasio } from '@/types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(value: string | null | undefined) {
  if (!value) return '--:--';

  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '--/--/----';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
}

export function dateRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function todayRange() {
  return dateRange(new Date());
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function docsCompleted(user: Pick<UsuarioGimnasio, 'doc_medico' | 'doc_responsiva' | 'doc_identificacion' | 'doc_reglamento'>) {
  return [user.doc_medico, user.doc_responsiva, user.doc_identificacion, user.doc_reglamento].filter(Boolean).length;
}

export function fullName(user: Pick<UsuarioGimnasio, 'nombre' | 'apellidos'>) {
  return `${user.nombre} ${user.apellidos}`.trim();
}
