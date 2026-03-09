import { createServiceClient } from '@/lib/supabase/server';
import { requireMarchandAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('reservations')
    .select('*, vol:vols(*), lien_paiement:liens_paiement(*), paiements(*)')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Reservation non trouvee' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require merchant auth for PATCH
  const auth = await requireMarchandAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const supabase = createServiceClient();

  // Verify the reservation belongs to the authenticated merchant
  const { data: existingRes } = await supabase
    .from('reservations')
    .select('marchand_id')
    .eq('id', id)
    .single();

  if (!existingRes || existingRes.marchand_id !== auth.marchand_id) {
    return NextResponse.json({ error: 'Reservation non trouvee ou non autorisee' }, { status: 404 });
  }

  const allowedFields = ['statut'];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', id)
    .select('*, vol:vols(*), lien_paiement:liens_paiement(*), paiements(*)')
    .single();

  if (error) {
    console.error('Reservation PATCH error:', error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }

  return NextResponse.json(data);
}
