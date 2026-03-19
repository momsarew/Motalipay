import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed');
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 });
  }

  const supabase = createServiceClient();

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // 1. Trouver le paiement associé dans la table paiements
    const { data: paiement } = await supabase
      .from('paiements')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (paiement) {
      // 2. Marquer le paiement comme confirmé
      await supabase
        .from('paiements')
        .update({
          statut: 'confirme',
          stripe_charge_id: (paymentIntent.latest_charge as string) || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paiement.id);

      // 3. Recalculer total_paye depuis tous les paiements confirmés
      const { data: allPaiements } = await supabase
        .from('paiements')
        .select('montant')
        .eq('reservation_id', paiement.reservation_id)
        .eq('statut', 'confirme');

      const newTotal = allPaiements?.reduce((sum, p) => sum + parseFloat(String(p.montant)), 0) || 0;

      // 4. Récupérer la réservation pour vérifier si tout est payé
      const { data: reservation } = await supabase
        .from('reservations')
        .select('prix_bloque')
        .eq('id', paiement.reservation_id)
        .single();

      // 5. Mettre à jour la réservation
      const updateData: Record<string, unknown> = {
        total_paye: Math.round(newTotal * 100) / 100,
        updated_at: new Date().toISOString(),
      };

      // Compatibilité : si c'est la prime, marquer aussi prime_payee
      if (paiement.type === 'prime') {
        updateData.prime_payee = true;
        updateData.stripe_charge_id = (paymentIntent.latest_charge as string) || null;
      }

      // 6. Auto-finalisation si tout est payé
      if (reservation && newTotal >= parseFloat(String(reservation.prix_bloque))) {
        updateData.statut = 'finalisee';
      }

      await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', paiement.reservation_id);

      console.log('[Moetly] Payment confirmed');
    } else {
      // Fallback : ancien système sans table paiements
      await supabase
        .from('reservations')
        .update({
          prime_payee: true,
          stripe_charge_id: (paymentIntent.latest_charge as string) || null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      console.log('[Moetly] Payment confirmed (legacy)');
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    await supabase
      .from('paiements')
      .update({
        statut: 'echoue',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    console.log('[Moetly] Payment failed');
  }

  return NextResponse.json({ received: true });
}
