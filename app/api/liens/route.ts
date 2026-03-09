import { createServiceClient } from '@/lib/supabase/server';
import { requireMarchandAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateShortCode(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  const auth = await requireMarchandAuth();
  if (auth.error) return auth.error;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('liens_paiement')
    .select('*')
    .eq('marchand_id', auth.marchand_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Liens GET error:', error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireMarchandAuth();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { secteur, ville_origine, ville_destination, prix, origine, destination, date_vol, compagnie, reference_billet, note_marchand, usage_unique } = body;

    if (!ville_origine || !ville_destination || !prix) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Input length validation
    if (ville_origine.length > 100) {
      return NextResponse.json({ error: 'ville_origine ne peut pas depasser 100 caracteres' }, { status: 400 });
    }
    if (ville_destination.length > 100) {
      return NextResponse.json({ error: 'ville_destination ne peut pas depasser 100 caracteres' }, { status: 400 });
    }
    if (note_marchand && note_marchand.length > 500) {
      return NextResponse.json({ error: 'note_marchand ne peut pas depasser 500 caracteres' }, { status: 400 });
    }

    // Prix validation
    const parsedPrix = parseFloat(prix);
    if (isNaN(parsedPrix) || parsedPrix <= 0) {
      return NextResponse.json({ error: 'Prix invalide' }, { status: 400 });
    }

    // Email validation if provided in body
    if (body.email && !EMAIL_REGEX.test(body.email)) {
      return NextResponse.json({ error: 'Format email invalide' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const short_code = generateShortCode();

    const { data, error } = await supabase
      .from('liens_paiement')
      .insert({
        short_code,
        marchand_id: auth.marchand_id,
        secteur: secteur || 'transport',
        ville_origine,
        ville_destination,
        origine: origine || null,
        destination: destination || null,
        prix: parsedPrix,
        date_vol: date_vol || null,
        compagnie: compagnie || null,
        reference_billet: reference_billet || null,
        note_marchand: note_marchand || null,
        usage_unique: usage_unique || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Liens POST error:', error.message);
      return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
