import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nfcId = typeof body.nfc_id === 'string' ? body.nfc_id.trim() : '';

    if (!nfcId) {
      return NextResponse.json({ ok: false, error: 'nfc_id requerido' }, { status: 400 });
    }

    const supabaseAdmin = createServerSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc('procesar_acceso_nfc', {
      nfc_id: nfcId
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: 'Payload invalido' }, { status: 400 });
  }
}
