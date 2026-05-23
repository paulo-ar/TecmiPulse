'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import UserOverlay from '@/components/UserOverlay';
import { supabase } from '@/lib/supabase';
import { cn, docsCompleted, fullName } from '@/lib/utils';
import type { NivelEducativo, UsuarioGimnasio } from '@/types/database';

const emptyUser: UsuarioGimnasio = {
  matricula: '',
  nfc_id: '',
  nombre: '',
  apellidos: '',
  edad: 18,
  nivel: 'Prepa',
  doc_medico: false,
  doc_responsiva: false,
  doc_identificacion: false,
  doc_reglamento: false
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<UsuarioGimnasio[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UsuarioGimnasio | null>(null);
  const [formUser, setFormUser] = useState<UsuarioGimnasio | null>(null);
  const [editingMatricula, setEditingMatricula] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) => {
      return (
        user.matricula.toLowerCase().includes(term) ||
        fullName(user).toLowerCase().includes(term) ||
        user.nfc_id.toLowerCase().includes(term)
      );
    });
  }, [search, users]);

  async function loadUsers() {
    const { data } = await supabase
      .from('usuarios_gimnasio')
      .select('matricula, nfc_id, nombre, apellidos, edad, nivel, doc_medico, doc_responsiva, doc_identificacion, doc_reglamento, created_at')
      .order('created_at', { ascending: false });

    setUsers((data as UsuarioGimnasio[]) || []);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openCreate() {
    setEditingMatricula(null);
    setFormUser(emptyUser);
  }

  function openEdit(user: UsuarioGimnasio) {
    setEditingMatricula(user.matricula);
    setFormUser(user);
  }

  function updateForm<K extends keyof UsuarioGimnasio>(key: K, value: UsuarioGimnasio[K]) {
    setFormUser((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value };

      if (key === 'nivel' && value === 'Profesional') {
        next.doc_identificacion = true;
      }

      return next;
    });
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formUser) return;

    const payload: UsuarioGimnasio = {
      ...formUser,
      matricula: formUser.matricula.trim(),
      nfc_id: formUser.nfc_id.trim(),
      nombre: formUser.nombre.trim(),
      apellidos: formUser.apellidos.trim(),
      doc_identificacion: formUser.nivel === 'Profesional' ? true : formUser.doc_identificacion
    };

    const query = editingMatricula
      ? supabase.from('usuarios_gimnasio').update(payload).eq('matricula', editingMatricula)
      : supabase.from('usuarios_gimnasio').insert(payload);

    const { error } = await query;

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Usuario guardado.');
    setFormUser(null);
    setEditingMatricula(null);
    loadUsers();
  }

  async function deleteUser() {
    if (!editingMatricula) return;
    const confirmed = window.confirm('Esta accion eliminara el usuario seleccionado. Deseas continuar?');
    if (!confirmed) return;

    const { error } = await supabase.from('usuarios_gimnasio').delete().eq('matricula', editingMatricula);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Usuario eliminado.');
    setFormUser(null);
    setEditingMatricula(null);
    loadUsers();
  }

  async function deleteAllRecords() {
    const confirmed = window.confirm('Esta accion eliminara todos los registros de acceso. Deseas continuar?');
    if (!confirmed) return;

    const { error } = await supabase.from('registros_acceso').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Todos los registros fueron eliminados.');
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Gestion de Alumnos y Usuarios</h1>
        <p className="mt-1 text-sm font-normal text-zinc-400">Alta, consulta y mantenimiento de credenciales NFC.</p>
      </header>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por matricula o nombre..."
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
          />
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-normal text-white transition-colors hover:bg-green-600"
          >
            + Registrar Nuevo Usuario
          </button>
          <button
            type="button"
            onClick={deleteAllRecords}
            className="rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm font-normal text-red-400 transition-colors hover:bg-zinc-800/50"
          >
            Eliminar Todos los Registros
          </button>
        </div>
        {message ? <p className="mt-3 text-xs font-medium text-zinc-400">{message}</p> : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full">
          <thead className="border-b border-zinc-800 bg-zinc-900 text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Matricula</th>
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="px-4 py-3 text-left font-medium">Nivel</th>
              <th className="px-4 py-3 text-left font-medium">Docs</th>
              <th className="px-4 py-3 text-left font-medium">NFC ID</th>
              <th className="px-4 py-3 text-right font-medium">Editar</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const completed = docsCompleted(user);

              return (
                <tr
                  key={user.matricula}
                  onClick={() => setSelectedUser(user)}
                  className="cursor-pointer text-sm font-normal text-zinc-300 transition-colors hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 font-mono">{user.matricula}</td>
                  <td className="px-4 py-3">{fullName(user)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full border border-blue-800 bg-blue-950/50 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                      {user.nivel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                        completed === 4
                          ? 'border-emerald-800 bg-emerald-950/50 text-emerald-400'
                          : 'border-red-800 bg-red-950/50 text-red-400'
                      )}
                    >
                      {completed}/4
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{user.nfc_id}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(user);
                      }}
                      className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800/50"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm font-normal text-zinc-600">
                  Sin usuarios para mostrar.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <UserOverlay user={selectedUser} onClose={() => setSelectedUser(null)} />

      {formUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <form onSubmit={saveUser} className="w-full max-w-3xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-sm shadow-black/50">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-medium text-zinc-50">
                {editingMatricula ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
              </h2>
              <button
                type="button"
                onClick={() => setFormUser(null)}
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-300 transition-colors hover:bg-zinc-800/50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-normal text-zinc-400">
                Matricula
                <input
                  value={formUser.matricula}
                  onChange={(event) => updateForm('matricula', event.target.value)}
                  disabled={Boolean(editingMatricula)}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1 disabled:text-zinc-600"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-normal text-zinc-400">
                NFC ID
                <input
                  value={formUser.nfc_id}
                  onChange={(event) => updateForm('nfc_id', event.target.value)}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-normal text-zinc-400">
                Nombre
                <input
                  value={formUser.nombre}
                  onChange={(event) => updateForm('nombre', event.target.value)}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-normal text-zinc-400">
                Apellidos
                <input
                  value={formUser.apellidos}
                  onChange={(event) => updateForm('apellidos', event.target.value)}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-normal text-zinc-400">
                Edad
                <input
                  type="number"
                  min={1}
                  value={formUser.edad}
                  onChange={(event) => updateForm('edad', Number(event.target.value))}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-normal text-zinc-400">
                Nivel
                <select
                  value={formUser.nivel}
                  onChange={(event) => updateForm('nivel', event.target.value as NivelEducativo)}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-green-600 focus:outline-none focus:ring-1"
                >
                  <option value="Prepa">Prepa</option>
                  <option value="Profesional">Profesional</option>
                </select>
              </label>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['doc_medico', 'Documento medico'],
                ['doc_responsiva', 'Responsiva'],
                ['doc_identificacion', 'Identificacion'],
                ['doc_reglamento', 'Reglamento']
              ].map(([key, label]) => {
                const typedKey = key as keyof Pick<
                  UsuarioGimnasio,
                  'doc_medico' | 'doc_responsiva' | 'doc_identificacion' | 'doc_reglamento'
                >;
                const disabled = typedKey === 'doc_identificacion' && formUser.nivel === 'Profesional';

                return (
                  <label key={key} className="flex items-center gap-3 text-sm font-normal text-zinc-400">
                    <input
                      type="checkbox"
                      checked={Boolean(formUser[typedKey])}
                      disabled={disabled}
                      onChange={(event) => updateForm(typedKey, event.target.checked)}
                      className="h-4 w-4 rounded-md border border-zinc-800 bg-zinc-950"
                    />
                    <span className={disabled ? 'text-zinc-600' : 'text-zinc-400'}>{label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between gap-4 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={deleteUser}
                disabled={!editingMatricula}
                className="rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm font-normal text-red-400 transition-colors hover:bg-zinc-800/50 disabled:border-zinc-800 disabled:bg-zinc-950 disabled:text-zinc-600"
              >
                Eliminar Usuario
              </button>
              <button
                type="submit"
                className="rounded-md bg-green-700 px-3 py-2 text-sm font-normal text-white transition-colors hover:bg-green-600"
              >
                Guardar Usuario
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
