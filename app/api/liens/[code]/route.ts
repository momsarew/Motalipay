import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = createServiceClient();

  // Récupérer le lien
  const { data, error } = await supabase
    .from('liens_paiement')
    .select('*')
    .eq('short_code', code)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Lien non trouvé' }, { status: 404 });
  }

  // Incrémenter le compteur de vues
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
  const { code } = await params;
  const body = await req.json();
  const supabase = createServiceClient();

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
