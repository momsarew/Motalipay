import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { MOETLY_CONFIG } from '@/lib/constants';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { vol_id, lien_paiement_id, consommateur_email, consommateur_prenom, duree_jours, marchand_id } = await req.json();

    if (!consommateur_email || !duree_jours) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    if (!vol_id && !lien_paiement_id) {
      return NextResponse.json({ error: 'vol_id ou lien_paiement_id requis' }, { status: 400 });
    }

    const supabase = createServiceClient();

    let prix: number;
    let ville_origine: string;
    let ville_destination: string;
    let resolvedMarchandId = marchand_id;

    if (lien_paiement_id) {
      // MODE LIEN DE PAIEMENT
      const { data: lien, error: lienError } = await supabase
        .from('liens_paiement')
        .select('*')
        .eq('id', lien_paiement_id)
        .single();

      if (lienError || !lien) {
        return NextResponse.json({ error: 'Lien de paiement non trouvé' }, { status: 404 });
      }

      if (!lien.actif) {
        return NextResponse.json({ error: 'Ce lien de paiement n\'est plus actif' }, { status: 400 });
      }

      if (lien.usage_unique && lien.nb_paiements > 0) {
        return NextResponse.json({ error: 'Ce lien a déjà été utilisé' }, { status: 400 });
      }

      prix = parseFloat(lien.prix);
      ville_origine = lien.ville_origine;
      ville_destination = lien.ville_destination;
      resolvedMarchandId = lien.marchand_id;
    } else {
      // MODE VOL (existant)
      const { data: vol, error: volError } = await supabase
        .from('vols')
        .select('*')
        .eq('id', vol_id)
        .single();

      if (volError || !vol) {
        return NextResponse.json({ error: 'Vol non trouvé' }, { status: 404 });
      }

      prix = parseFloat(vol.prix_actuel);
      ville_origine = vol.ville_origine;
      ville_destination = vol.ville_destination;
    }

    // Calculate the premium
    const rate = MOETLY_CONFIG.PRIME_RATE;
    const durationConfig = MOETLY_CONFIG.DURATIONS.find(d => d.days === duree_jours);
    const surcharge = durationConfig && 'surcharge' in durationConfig ? durationConfig.surcharge : 0;
    const effectiveRate = rate + (surcharge || 0);
    const montant_prime = Math.round(prix * effectiveRate * 100) / 100;
    const amountCents = Math.max(Math.round(montant_prime * 100), MOETLY_CONFIG.STRIPE_MIN_AMOUNT_CENTS);

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      metadata: {
        vol_id: vol_id || '',
        lien_paiement_id: lien_paiement_id || '',
        consommateur_email,
        consommateur_prenom: consommateur_prenom || '',
        duree_jours: duree_jours.toString(),
        marchand_id: resolvedMarchandId || '',
        prix_bloque: prix.toString(),
      },
      receipt_email: consommateur_email,
      description: `Moetly Pay — Réservation ${ville_origine} → ${ville_destination}`,
    });

    // Create reservation in DB
    const date_expiration = new Date();
    date_expiration.setDate(date_expiration.getDate() + duree_jours);

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .insert({
        vol_id: vol_id || null,
        lien_paiement_id: lien_paiement_id || null,
        consommateur_email,
        consommateur_prenom: consommateur_prenom || '',
        prix_bloque: prix,
        taux_prime: effectiveRate,
        montant_prime,
        part_moetly: Math.round(montant_prime * MOETLY_CONFIG.MOETLY_SHARE * 100) / 100,
        part_marchand: Math.round(montant_prime * MOETLY_CONFIG.MARCHAND_SHARE * 100) / 100,
        duree_jours,
        date_expiration: date_expiration.toISOString(),
        statut: 'active',
        stripe_payment_intent_id: paymentIntent.id,
        marchand_id: resolvedMarchandId || null,
      })
      .select()
      .single();

    if (resError) {
      return NextResponse.json({ error: resError.message }, { status: 500 });
    }

    // Insérer le 1er paiement (prime) dans la table paiements
    await supabase.from('paiements').insert({
      reservation_id: reservation.id,
      montant: montant_prime,
      type: 'prime',
      stripe_payment_intent_id: paymentIntent.id,
      statut: 'en_attente',
    });

    // Incrémenter le compteur de paiements du lien
    if (lien_paiement_id) {
      const { data: lien } = await supabase
        .from('liens_paiement')
        .select('nb_paiements')
        .eq('id', lien_paiement_id)
        .single();

      await supabase
        .from('liens_paiement')
        .update({ nb_paiements: (lien?.nb_paiements || 0) + 1 })
        .eq('id', lien_paiement_id);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      reservation_id: reservation.id,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Checkout error:', errorMessage);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
