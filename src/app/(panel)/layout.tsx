'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace('/login');
        return;
      }

      setChecking(false);
    }

    checkSession();
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm font-normal text-zinc-400">Validando sesion...</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
