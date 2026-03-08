import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function generateShortCode(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marchand_id = searchParams.get('marchand_id');

  if (!marchand_id) {
    return NextResponse.json({ error: 'marchand_id requis' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('liens_paiement')
    .select('*')
    .eq('marchand_id', marchand_id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { marchand_id, ville_origine, ville_destination, prix, origine, destination, date_vol, compagnie, reference_billet, note_marchand, usage_unique } = body;

    if (!marchand_id || !ville_origine || !ville_destination || !prix) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const short_code = generateShortCode();

    const { data, error } = await supabase
      .from('liens_paiement')
      .insert({
        short_code,
        marchand_id,
        ville_origine,
        ville_destination,
        origine: origine || null,
        destination: destination || null,
        prix: parseFloat(prix),
        date_vol: date_vol || null,
        compagnie: compagnie || null,
        reference_billet: reference_billet || null,
        note_marchand: note_marchand || null,
        usage_unique: usage_unique || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
