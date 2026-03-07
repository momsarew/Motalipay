import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { MOETLY_CONFIG } from '@/lib/constants';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { vol_id, consommateur_email, consommateur_prenom, duree_jours, marchand_id } = await req.json();

    if (!vol_id || !consommateur_email || !duree_jours) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Get the flight
    const { data: vol, error: volError } = await supabase
      .from('vols')
      .select('*')
      .eq('id', vol_id)
      .single();

    if (volError || !vol) {
      return NextResponse.json({ error: 'Vol non trouvé' }, { status: 404 });
    }

    // 2. Calculate the premium
    const rate = MOETLY_CONFIG.PRIME_RATE;
    const durationConfig = MOETLY_CONFIG.DURATIONS.find(d => d.days === duree_jours);
    const surcharge = durationConfig && 'surcharge' in durationConfig ? durationConfig.surcharge : 0;
    const effectiveRate = rate + (surcharge || 0);
    const montant_prime = Math.round(vol.prix_actuel * effectiveRate * 100) / 100;
    const amountCents = Math.max(Math.round(montant_prime * 100), MOETLY_CONFIG.STRIPE_MIN_AMOUNT_CENTS);

    // 3. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      metadata: {
        vol_id,
        consommateur_email,
        consommateur_prenom: consommateur_prenom || '',
        duree_jours: duree_jours.toString(),
        marchand_id: marchand_id || '',
        prix_bloque: vol.prix_actuel.toString(),
      },
      receipt_email: consommateur_email,
      description: `Moetly Pay — Réservation ${vol.ville_origine} → ${vol.ville_destination}`,
    });

    // 4. Create reservation in DB
    const date_expiration = new Date();
    date_expiration.setDate(date_expiration.getDate() + duree_jours);

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .insert({
        vol_id,
        consommateur_email,
        consommateur_prenom: consommateur_prenom || '',
        prix_bloque: vol.prix_actuel,
        taux_prime: effectiveRate,
        montant_prime,
        part_moetly: Math.round(montant_prime * MOETLY_CONFIG.MOETLY_SHARE * 100) / 100,
        part_marchand: Math.round(montant_prime * MOETLY_CONFIG.MARCHAND_SHARE * 100) / 100,
        duree_jours,
        date_expiration: date_expiration.toISOString(),
        statut: 'active',
        stripe_payment_intent_id: paymentIntent.id,
        marchand_id: marchand_id || null,
      })
      .select()
      .single();

    if (resError) {
      return NextResponse.json({ error: resError.message }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      reservation_id: reservation.id,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
