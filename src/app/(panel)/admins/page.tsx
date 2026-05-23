'use client';

import { FormEvent, useEffect, useState } from 'react';
import AdminLock from '@/components/AdminLock';
import { supabase } from '@/lib/supabase';
import type { AdministradorConCorreo } from '@/types/database';

interface AdminForm {
  nombre_completo: string;
  username: string;
  email: string;
  password: string;
  rol_superadmin: boolean;
}

const emptyAdminForm: AdminForm = {
  nombre_completo: '',
  username: '',
  email: '',
  password: '',
  rol_superadmin: false
};

export default function AdminsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [admins, setAdmins] = useState<AdministradorConCorreo[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AdminForm>(emptyAdminForm);
  const [message, setMessage] = useState('');

  async function authHeaders() {
    const { data } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${data.session?.access_token || ''}`,
      'Content-Type': 'application/json'
    };
  }

  async function loadAdmins() {
    const headers = await authHeaders();
    const response = await fetch('/api/admins', { headers });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || 'No fue posible cargar administradores.');
      return;
    }

    setAdmins(payload.admins || []);
  }

  useEffect(() => {
    if (unlocked) loadAdmins();
  }, [unlocked]);

  async function createAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const headers = await authHeaders();
    const response = await fetch('/api/admins', {
      method: 'POST',
      headers,
      body: JSON.stringify(form)
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || 'No fue posible crear el administrador.');
      return;
    }

    setMessage('Administrador creado.');
    setForm(emptyAdminForm);
    setFormOpen(false);
    loadAdmins();
  }

  if (!unlocked) {
    return <AdminLock onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Administradores</h1>
          <p className="mt-1 text-sm font-normal text-zinc-400">Control de cuentas con acceso al panel.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="rounded-md bg-green-700 px-3 py-2 text-sm font-normal text-white transition-colors hover:bg-green-600"
        >
          + Nuevo Administrador
        </button>
      </header>

      {message ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-xs font-medium text-zinc-400">{message}</div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full">
          <thead className="border-b border-zinc-800 bg-zinc-900 text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="px-4 py-3 text-left font-medium">Usuario</th>
              <th className="px-4 py-3 text-left font-medium">Correo</th>
              <th className="px-4 py-3 text-left font-medium">Rol</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="text-sm font-normal text-zinc-300 transition-colors hover:bg-zinc-800/50">
                <td className="px-4 py-3">{admin.nombre_completo}</td>
                <td className="px-4 py-3">{admin.username}</td>
                <td className="px-4 py-3">{admin.email || 'Sin correo'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full border border-blue-800 bg-blue-950/50 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                    {admin.rol_superadmin ? 'Superadmin' : 'Admin'}
                  </span>
                </td>
              </tr>
            ))}
            {admins.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm font-normal text-zinc-600">
                  Sin administradores para mostrar.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <form onSubmit={createAdmin} className="w-full max-w-xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-sm shadow-black/50">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-medium text-zinc-50">Nuevo Administrador</h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-300 transition-colors hover:bg-zinc-800/50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <input
                value={form.nombre_completo}
                onChange={(event) => setForm((current) => ({ ...current, nombre_completo: event.target.value }))}
                placeholder="Nombre completo"
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
                required
              />
              <input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="Usuario"
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
                required
              />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Correo"
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
                required
              />
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Contrasena temporal"
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
                required
              />
              <label className="flex items-center gap-3 text-sm font-normal text-zinc-400">
                <input
                  type="checkbox"
                  checked={form.rol_superadmin}
                  onChange={(event) => setForm((current) => ({ ...current, rol_superadmin: event.target.checked }))}
                  className="h-4 w-4 rounded-md border border-zinc-800 bg-zinc-950"
                />
                Superadmin
              </label>
            </div>

            <div className="mt-6 flex justify-end border-t border-zinc-800 pt-4">
              <button
                type="submit"
                className="rounded-md bg-green-700 px-3 py-2 text-sm font-normal text-white transition-colors hover:bg-green-600"
              >
                Crear Administrador
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
