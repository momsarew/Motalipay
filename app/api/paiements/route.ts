import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { MOETLY_CONFIG } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reservation_id = searchParams.get('reservation_id');

  if (!reservation_id) {
    return NextResponse.json({ error: 'reservation_id requis' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('paiements')
    .select('*')
    .eq('reservation_id', reservation_id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const { reservation_id, montant } = await req.json();

    if (!reservation_id || !montant || montant <= 0) {
      return NextResponse.json({ error: 'reservation_id et montant (> 0) requis' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Récupérer la réservation
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*, vol:vols(*), lien_paiement:liens_paiement(*)')
      .eq('id', reservation_id)
      .single();

    if (resError || !reservation) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // 2. Vérifier que la réservation est active
    if (reservation.statut !== 'active') {
      return NextResponse.json({ error: 'Cette réservation n\'est plus active' }, { status: 400 });
    }

    // 3. Vérifier que la réservation n'est pas expirée
    if (new Date(reservation.date_expiration) < new Date()) {
      return NextResponse.json({ error: 'Cette réservation a expiré' }, { status: 400 });
    }

    // 4. Calculer le reste à payer
    const totalPaye = parseFloat(reservation.total_paye) || 0;
    const prixBloque = parseFloat(reservation.prix_bloque);
    const resteAPayer = Math.round((prixBloque - totalPaye) * 100) / 100;

    if (resteAPayer <= 0) {
      return NextResponse.json({ error: 'Cette réservation est déjà entièrement payée' }, { status: 400 });
    }

    // 5. Valider le montant (ne peut pas dépasser le reste à payer)
    const montantEffectif = Math.min(montant, resteAPayer);
    const amountCents = Math.max(Math.round(montantEffectif * 100), MOETLY_CONFIG.STRIPE_MIN_AMOUNT_CENTS);

    // 6. Déterminer le type de paiement
    const type = montantEffectif >= resteAPayer ? 'solde' : 'partiel';

    // 7. Description pour Stripe
    const vol = reservation.vol;
    const lien = reservation.lien_paiement;
    const trajet = vol
      ? `${vol.ville_origine} → ${vol.ville_destination}`
      : lien
        ? `${lien.ville_origine} → ${lien.ville_destination}`
        : 'Réservation';

    // 8. Créer le PaymentIntent Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      metadata: {
        reservation_id,
        paiement_type: type,
        consommateur_email: reservation.consommateur_email,
        marchand_id: reservation.marchand_id || '',
      },
      receipt_email: reservation.consommateur_email,
      description: `Moetly Pay — ${type === 'solde' ? 'Solde' : 'Versement'} ${trajet}`,
    });

    // 9. Insérer le paiement en base
    const { data: paiement, error: paiError } = await supabase
      .from('paiements')
      .insert({
        reservation_id,
        montant: montantEffectif,
        type,
        stripe_payment_intent_id: paymentIntent.id,
        statut: 'en_attente',
      })
      .select()
      .single();

    if (paiError) {
      return NextResponse.json({ error: paiError.message }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paiement_id: paiement.id,
      montant: montantEffectif,
      type,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Paiement error:', errorMessage);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
