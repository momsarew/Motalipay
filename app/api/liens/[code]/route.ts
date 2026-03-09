import { createServiceClient } from '@/lib/supabase/server';
import { requireMarchandAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = createServiceClient();

  // Recuperer le lien
  const { data, error } = await supabase
    .from('liens_paiement')
    .select('*')
    .eq('short_code', code)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Lien non trouve' }, { status: 404 });
  }

  // Incrementer le compteur de vues
  // NOTE: Known limitation - race condition on concurrent views.
  // For production, use a Supabase RPC with atomic increment:
  // e.g. supabase.rpc('increment_views', { lien_id: data.id })
  await supabase
    .from('liens_paiement')
    .update({ nb_vues: (data.nb_vues || 0) + 1 })
    .eq('id', data.id);

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // Require merchant auth for PATCH
  const auth = await requireMarchandAuth();
  if (auth.error) return auth.error;

  const { code } = await params;
  const supabase = createServiceClient();

  // Verify the lien belongs to the authenticated merchant
  const { data: existingLien } = await supabase
    .from('liens_paiement')
    .select('marchand_id')
    .eq('short_code', code)
    .single();

  if (!existingLien || existingLien.marchand_id !== auth.marchand_id) {
    return NextResponse.json({ error: 'Lien non trouve ou non autorise' }, { status: 404 });
  }

  const body = await req.json();
  const allowedFields = ['actif'];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from('liens_paiement')
    .update(updates)
    .eq('short_code', code)
    .select()
    .single();

  if (error) {
    console.error('Lien PATCH error:', error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }

  return NextResponse.json(data);
}
