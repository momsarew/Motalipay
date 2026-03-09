import { createServiceClient } from '@/lib/supabase/server';
import { requireMarchandAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const marchand_id = searchParams.get('marchand_id');
  const statut = searchParams.get('statut');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // If marchand_id is used, require auth and verify it matches
  if (marchand_id) {
    const auth = await requireMarchandAuth();
    if (auth.error) return auth.error;
    if (auth.marchand_id !== marchand_id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }
  }

  const supabase = createServiceClient();

  let query = supabase
    .from('reservations')
    .select('*, vol:vols(*), lien_paiement:liens_paiement(*), paiements(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (email) query = query.eq('consommateur_email', email);
  if (marchand_id) query = query.eq('marchand_id', marchand_id);
  if (statut && statut !== 'all') query = query.eq('statut', statut);

  const { data, error, count } = await query;

  if (error) {
    console.error('Reservations GET error:', error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }

  return NextResponse.json({ data, count, page, limit });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();

    // Whitelist allowed fields to prevent mass assignment
    const {
      vol_id,
      lien_paiement_id,
      consommateur_email,
      consommateur_prenom,
      prix_bloque,
      taux_prime,
      montant_prime,
      part_moetly,
      part_marchand,
      duree_jours,
      date_expiration,
      statut,
      stripe_payment_intent_id,
      marchand_id,
    } = body;

    const insertData: Record<string, unknown> = {};
    if (vol_id !== undefined) insertData.vol_id = vol_id;
    if (lien_paiement_id !== undefined) insertData.lien_paiement_id = lien_paiement_id;
    if (consommateur_email !== undefined) insertData.consommateur_email = consommateur_email;
    if (consommateur_prenom !== undefined) insertData.consommateur_prenom = consommateur_prenom;
    if (prix_bloque !== undefined) insertData.prix_bloque = prix_bloque;
    if (taux_prime !== undefined) insertData.taux_prime = taux_prime;
    if (montant_prime !== undefined) insertData.montant_prime = montant_prime;
    if (part_moetly !== undefined) insertData.part_moetly = part_moetly;
    if (part_marchand !== undefined) insertData.part_marchand = part_marchand;
    if (duree_jours !== undefined) insertData.duree_jours = duree_jours;
    if (date_expiration !== undefined) insertData.date_expiration = date_expiration;
    if (statut !== undefined) insertData.statut = statut;
    if (stripe_payment_intent_id !== undefined) insertData.stripe_payment_intent_id = stripe_payment_intent_id;
    if (marchand_id !== undefined) insertData.marchand_id = marchand_id;

    const { data, error } = await supabase
      .from('reservations')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Reservations POST error:', error.message);
      return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
