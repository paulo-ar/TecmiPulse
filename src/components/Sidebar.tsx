'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/usuarios', label: 'Gestion de Usuarios' },
  { href: '/admins', label: 'Administradores' }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    async function loadAdmin() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) return;

      const { data } = await supabase
        .from('administradores')
        .select('nombre_completo, username')
        .eq('id', user.id)
        .maybeSingle();

      setAdminName(data?.nombre_completo || data?.username || user.email || 'Admin');
    }

    loadAdmin();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-zinc-800 bg-zinc-950 p-6">
      <div className="border-b border-zinc-800 pb-6">
        <p className="text-lg font-medium text-zinc-50">Gym Control - Tecmilenio</p>
        <p className="mt-1 text-xs font-medium text-zinc-400">Sistema de Acceso NFC</p>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-normal transition-colors',
                isActive ? 'bg-zinc-900 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50'
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 pt-6">
        <p className="text-xs font-medium text-zinc-400">Hola,</p>
        <p className="mt-1 text-sm font-normal text-zinc-50">{adminName}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-normal text-zinc-300 transition-colors hover:bg-zinc-800/50"
        >
          Cerrar Sesion
        </button>
      </div>
    </aside>
  );
}
