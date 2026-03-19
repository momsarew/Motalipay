'use client';

import { useEffect, useState, use } from 'react';
import { LienPaiement } from '@/types';
import { formatCurrency, formatDate, calculatePrime } from '@/lib/utils';
import { MOETLY_CONFIG, SECTEURS, Secteur } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/skeleton';
import { Plane, Shield, CreditCard, Calendar, Lock, AlertCircle, Music, Building, Package } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm({ reservationId }: { reservationId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError('');

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/vol/confirmation?reservation_id=${reservationId}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Une erreur est survenue');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <PaymentElement />
      {error && <p className="text-error text-sm mt-3">{error}</p>}
      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full mt-6"
        loading={processing}
        disabled={!stripe || !elements || processing}
      >
        Confirmer le paiement
      </Button>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-gray-400 text-center mt-3">
          Mode test — Carte : 4242 4242 4242 4242 | Exp : 12/34 | CVC : 123
        </p>
      )}
    </form>
  );
}

export default function PaymentLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [lien, setLien] = useState<LienPaiement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [duree, setDuree] = useState(60);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [prenom, setPrenom] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/liens/${code}`)
      .then(res => {
        if (!res.ok) throw new Error('Lien non trouvé');
        return res.json();
      })
      .then(data => {
        setLien(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Ce lien de paiement est introuvable ou a expiré.');
        setLoading(false);
      });
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
            <div className="w-7 h-7 bg-blue-primary rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-[family-name:var(--font-sora)] font-bold text-gray-900">
              Moetly<span className="text-yellow-accent">Pay</span>
            </span>
            <div className="ml-auto flex items-center gap-2 text-sm text-blue-primary">
              <span className="w-2 h-2 rounded-full bg-yellow-accent animate-pulse" />
              Chargement...
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 space-y-5">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lien) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <p className="text-gray-700 font-medium text-lg text-center">{error || 'Lien non trouvé'}</p>
        <p className="text-gray-500 text-sm text-center">Vérifiez le lien auprès de votre vendeur.</p>
      </div>
    );
  }

  if (!lien.actif) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-yellow-dark" />
        </div>
        <p className="text-gray-700 font-medium text-lg text-center">Ce lien n&apos;est plus actif</p>
        <p className="text-gray-500 text-sm text-center">Contactez votre vendeur pour un nouveau lien.</p>
      </div>
    );
  }

  if (lien.usage_unique && lien.nb_paiements > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-yellow-dark" />
        </div>
        <p className="text-gray-700 font-medium text-lg text-center">Ce lien a déjà été utilisé</p>
        <p className="text-gray-500 text-sm text-center">Contactez votre vendeur pour un nouveau lien.</p>
      </div>
    );
  }

  const prix = lien.prix;
  const effectiveRate = MOETLY_CONFIG.PRIME_RATE + (duree === 90 ? 0.005 : 0);
  const prime = calculatePrime(prix, effectiveRate);
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + duree);

  const handleReserve = async () => {
    if (!email) return;
    setPaymentLoading(true);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lien_paiement_id: lien.id,
          consommateur_email: email,
          consommateur_prenom: prenom,
          duree_jours: duree,
        }),
      });

      const data = await res.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setReservationId(data.reservation_id);
      } else {
        setError(data.error || 'Erreur lors de la création du paiement');
      }
    } catch (err) {
      console.error('Payment init error:', err);
      setError('Erreur de connexion au service de paiement. Veuillez reessayer.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-primary rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-[family-name:var(--font-sora)] font-bold text-gray-900">
              Moetly<span className="text-yellow-accent">Pay</span>
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-sm text-gray-500">
            <Shield className="w-4 h-4 text-success" />
            Paiement sécurisé
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Merchant name */}
        {lien.compagnie && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-500">Vendu par</p>
            <p className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">{lien.compagnie}</p>
          </div>
        )}

        {/* Info card -- adapte au secteur */}
        {(() => {
          const s = (lien.secteur || 'transport') as Secteur;
          const cfg = SECTEURS[s];
          const SectorIcons = { transport: Plane, evenement: Music, hebergement: Building, autre: Package };
          const SIcon = SectorIcons[s];

          return (
            <div className="bg-gradient-to-br from-blue-dark to-blue-primary rounded-2xl p-6 sm:p-8 text-white">
              {/* Top badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  {lien.compagnie && (
                    <span className="text-xs sm:text-sm bg-white/20 px-2 sm:px-3 py-1 rounded-full">{lien.compagnie}</span>
                  )}
                  {s !== 'transport' && (
                    <span className="text-xs sm:text-sm bg-white/10 px-2 sm:px-3 py-1 rounded-full flex items-center gap-1">
                      <SIcon className="w-3.5 h-3.5" /> {cfg.label}
                    </span>
                  )}
                </div>
                {lien.date_vol && (
                  <div className="flex items-center gap-1 text-white/80 text-xs sm:text-sm">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {formatDate(lien.date_vol)}
                  </div>
                )}
              </div>

              {/* Content — route ou titre */}
              {cfg.display.showRoute ? (
                /* Transport: origine → destination */
                <div className="flex items-center justify-between">
                  <div className="text-center min-w-0 flex-1">
                    <p className="text-2xl sm:text-4xl font-[family-name:var(--font-sora)] font-bold">
                      {lien.origine || lien.ville_origine.substring(0, 3).toUpperCase()}
                    </p>
                    <p className="text-white/70 text-xs sm:text-sm mt-1 truncate">{lien.ville_origine}</p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 flex-shrink-0">
                    <div className="w-6 sm:w-12 h-[2px] bg-white/30" />
                    <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-accent" />
                    <div className="w-6 sm:w-12 h-[2px] bg-white/30" />
                  </div>
                  <div className="text-center min-w-0 flex-1">
                    <p className="text-2xl sm:text-4xl font-[family-name:var(--font-sora)] font-bold">
                      {lien.destination || lien.ville_destination.substring(0, 3).toUpperCase()}
                    </p>
                    <p className="text-white/70 text-xs sm:text-sm mt-1 truncate">{lien.ville_destination}</p>
                  </div>
                </div>
              ) : (
                /* Événement / Hébergement / Autre: titre + lieu */
                <div className="text-center py-2">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <SIcon className="w-8 h-8 text-yellow-accent" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-[family-name:var(--font-sora)] font-bold">
                    {lien.ville_destination || lien.ville_origine}
                  </p>
                  {lien.ville_destination && lien.ville_origine && (
                    <p className="text-white/70 text-sm mt-2">{lien.ville_origine}</p>
                  )}
                </div>
              )}

              {/* Prix */}
              <div className="mt-6 flex items-end justify-between">
                {!lien.compagnie && lien.date_vol && !cfg.display.showRoute && (
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Calendar className="w-4 h-4" />
                    {formatDate(lien.date_vol)}
                  </div>
                )}
                {(!lien.date_vol || cfg.display.showRoute) && <div />}
                <p className="text-2xl sm:text-3xl font-[family-name:var(--font-sora)] font-bold ml-auto">
                  {formatCurrency(prix)}
                </p>
              </div>

              <div className="mt-4 bg-yellow-accent/20 border border-yellow-accent/30 rounded-xl px-4 py-2 text-sm text-center">
                <Lock className="w-4 h-4 inline mr-1" />
                Bloquez ce prix jusqu&apos;au {formatDate(expirationDate.toISOString())}
              </div>
            </div>
          );
        })()}

        {/* Note from seller */}
        {lien.note_marchand && (
          <div className="mt-4 bg-blue-light border border-blue-primary/20 rounded-xl px-5 py-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-blue-dark">Note du vendeur :</span>{' '}
              {lien.note_marchand}
            </p>
          </div>
        )}

        {/* Calculator */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-2">
            Bloquez ce prix maintenant
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Versez une prime (frais de reservation non remboursables) pour bloquer ce prix. Epargnez le reste a votre rythme chez Moetly Pay.
          </p>

          {/* Duration selector */}
          <div className="flex gap-2 sm:gap-3">
            {MOETLY_CONFIG.DURATIONS.map(d => (
              <button
                key={d.days}
                onClick={() => setDuree(d.days)}
                className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  duree === d.days
                    ? 'bg-blue-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.label}
                {'recommended' in d && d.recommended && (
                  <span className="hidden sm:block text-[10px] font-normal mt-0.5 opacity-80">RECOMMANDÉ</span>
                )}
              </button>
            ))}
          </div>

          {/* Breakdown */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>{SECTEURS[(lien.secteur || 'transport') as Secteur].display.priceLabel}</span>
              <span className="font-medium">{formatCurrency(prix)}</span>
            </div>
            <div className="flex justify-between text-blue-primary font-semibold">
              <span>Prime de réservation ({Math.round(effectiveRate * 100 * 10) / 10}%)</span>
              <span>{formatCurrency(prime.montant_prime)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between text-lg font-[family-name:var(--font-sora)] font-bold text-blue-primary">
                <span>A regler aujourd&apos;hui</span>
                <span>{formatCurrency(prime.montant_prime)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Reste à verser avant le {formatDate(expirationDate.toISOString())}</span>
                <span>{formatCurrency(prime.reste_a_payer)}</span>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-6 bg-blue-light/50 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-dark uppercase tracking-wider mb-3">Comment ça marche</p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                <p className="text-sm text-gray-700"><span className="font-semibold">Prix bloqué</span> — Le prix est garanti pendant la durée choisie</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                <p className="text-sm text-gray-700"><span className="font-semibold">Fonds sécurisés</span> — Vos versements sont conservés chez Moetly Pay, retirables à tout moment</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                <p className="text-sm text-gray-700"><span className="font-semibold">Épargnez à votre rythme</span> — Finalisez quand vous êtes prêt, sans crédit ni engagement</p>
              </div>
            </div>
          </div>

          {/* CTA or Form */}
          {!showForm && !clientSecret && (
            <Button
              variant="accent"
              size="lg"
              className="w-full mt-6"
              onClick={() => setShowForm(true)}
            >
              Réserver pour {formatCurrency(prime.montant_prime)}
            </Button>
          )}

          {showForm && !clientSecret && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
              {error && !clientSecret && (
                <p className="text-error text-sm">{error}</p>
              )}
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={handleReserve}
                loading={paymentLoading}
                disabled={!email}
              >
                Proceder au paiement
              </Button>
            </div>
          )}

          {/* Stripe Payment */}
          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#1A6FC4',
                    colorBackground: '#ffffff',
                    fontFamily: 'Inter, sans-serif',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <PaymentForm reservationId={reservationId} />
            </Elements>
          )}
        </div>

        {/* Refund policy */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4">
          <p className="text-xs text-amber-800">
            <strong>Politique d&apos;annulation :</strong> Les frais de reservation ({(MOETLY_CONFIG.PRIME_RATE * 100).toFixed(0)}%) ne sont pas remboursables.
            Vos versements d&apos;epargne sont retirables a tout moment depuis votre espace personnel.
          </p>
        </div>

        {/* Footer trust badges */}
        <div className="mt-6 text-center text-xs text-gray-400 space-y-1">
          <p>Paiement securise via Stripe</p>
          <p>Moetly Pay — Bloquez le prix, epargnez a votre rythme</p>
        </div>

        {/* Account creation banner */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            <a href="/compte" className="text-blue-primary hover:underline">
              Creez votre compte Moetly Pay
            </a>{' '}
            pour suivre toutes vos reservations en un seul endroit.
          </p>
        </div>
      </div>
    </div>
  );
}
