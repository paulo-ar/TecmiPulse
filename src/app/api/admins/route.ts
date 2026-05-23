import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdmin } from '@/lib/supabase';
import type { Administrador, AdministradorConCorreo } from '@/types/database';

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'No autorizado', status: 401, userId: null };

  const supabaseAdmin = createServerSupabaseAdmin();
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) return { error: 'Sesion no valida', status: 401, userId: null };

  const { data: adminData } = await supabaseAdmin
    .from('administradores')
    .select('id')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!adminData) return { error: 'No autorizado', status: 403, userId: null };

  return { error: null, status: 200, userId: userData.user.id };
}

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const supabaseAdmin = createServerSupabaseAdmin();
  const { data: adminsData, error } = await supabaseAdmin
    .from('administradores')
    .select('id, username, nombre_completo, rol_superadmin')
    .order('nombre_completo', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailById = new Map((authUsers.users || []).map((user) => [user.id, user.email || '']));

  const admins: AdministradorConCorreo[] = ((adminsData as Administrador[]) || []).map((admin) => ({
    ...admin,
    email: emailById.get(admin.id)
  }));

  return NextResponse.json({ admins });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await request.json();
  const supabaseAdmin = createServerSupabaseAdmin();

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || 'No fue posible crear usuario auth' }, { status: 400 });
  }

  const { error: profileError } = await supabaseAdmin.from('administradores').insert({
    id: created.user.id,
    username: body.username,
    nombre_completo: body.nombre_completo,
    rol_superadmin: Boolean(body.rol_superadmin)
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ id: created.user.id }, { status: 201 });
}
