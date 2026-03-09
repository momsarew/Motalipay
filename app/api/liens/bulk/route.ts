import { createServiceClient } from '@/lib/supabase/server';
import { requireMarchandAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

function generateShortCode(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireMarchandAuth();
    if (auth.error) return auth.error;

    const { liens } = await req.json();

    if (!Array.isArray(liens) || liens.length === 0) {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
    }

    if (liens.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 liens par import' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const results: {
      success: number;
      failed: number;
      errors: Array<{ row: number; message: string }>;
      liens: unknown[];
    } = { success: 0, failed: 0, errors: [], liens: [] };

    for (let i = 0; i < liens.length; i++) {
      const lien = liens[i];

      if (!lien.ville_origine || !lien.ville_destination || !lien.prix) {
        results.errors.push({ row: i + 1, message: 'Champs requis manquants (ville_origine, ville_destination, prix)' });
        results.failed++;
        continue;
      }

      const prix = parseFloat(lien.prix);
      if (isNaN(prix) || prix <= 0) {
        results.errors.push({ row: i + 1, message: `Prix invalide : "${lien.prix}"` });
        results.failed++;
        continue;
      }

      const { data, error } = await supabase
        .from('liens_paiement')
        .insert({
          short_code: generateShortCode(),
          marchand_id: auth.marchand_id,
          ville_origine: lien.ville_origine,
          ville_destination: lien.ville_destination,
          origine: lien.origine || null,
          destination: lien.destination || null,
          prix,
          date_vol: lien.date_vol || null,
          compagnie: lien.compagnie || null,
          reference_billet: lien.reference_billet || null,
          note_marchand: null,
          usage_unique: false,
        })
        .select()
        .single();

      if (error) {
        results.errors.push({ row: i + 1, message: 'Erreur lors de la creation du lien' });
        results.failed++;
      } else {
        results.success++;
        results.liens.push(data);
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
