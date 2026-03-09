'use client';

import { useEffect, useState, use } from 'react';
import { Vol } from '@/types';
import { formatCurrency, formatDate, calculatePrime } from '@/lib/utils';
import { MOETLY_CONFIG } from '@/lib/constants';
import Button from '@/components/ui/Button';
import { ArrowLeft, Plane, Shield, CreditCard, Calendar, TrendingUp, Lock } from 'lucide-react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm({ clientSecret, reservationId }: { clientSecret: string; reservationId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
        disabled={!stripe}
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

export default function FlightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [vol, setVol] = useState<Vol | null>(null);
  const [loading, setLoading] = useState(true);
  const [duree, setDuree] = useState(60);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [prenom, setPrenom] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/vols`)
      .then(res => res.json())
      .then(data => {
        const found = Array.isArray(data) ? data.find((v: Vol) => v.id === id) : null;
        setVol(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!vol) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Vol non trouvé</p>
        <Link href="/" className="text-blue-primary hover:underline">Retour aux vols</Link>
      </div>
    );
  }

  const prime = calculatePrime(vol.prix_actuel, MOETLY_CONFIG.PRIME_RATE + (duree === 90 ? 0.005 : 0));
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
          vol_id: vol.id,
          consommateur_email: email,
          consommateur_prenom: prenom,
          duree_jours: duree,
          marchand_id: null,
        }),
      });

      const data = await res.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setReservationId(data.reservation_id);
      }
    } catch {
      console.error('Payment init error');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-primary rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-[family-name:var(--font-sora)] font-bold text-gray-900">
              Moetly<span className="text-yellow-accent">Pay</span>
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Flight info card */}
        <div className="bg-gradient-to-br from-blue-dark to-blue-primary rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{vol.compagnie}</span>
            <div className="flex items-center gap-1 text-yellow-accent text-sm">
              <TrendingUp className="w-4 h-4" />
              Prix en hausse
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-center min-w-0 flex-1">
              <p className="text-2xl sm:text-4xl font-[family-name:var(--font-sora)] font-bold">{vol.origine}</p>
              <p className="text-white/70 text-xs sm:text-sm mt-1 truncate">{vol.ville_origine}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 flex-shrink-0">
              <div className="w-6 sm:w-12 h-[2px] bg-white/30" />
              <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-accent" />
              <div className="w-6 sm:w-12 h-[2px] bg-white/30" />
            </div>
            <div className="text-center min-w-0 flex-1">
              <p className="text-2xl sm:text-4xl font-[family-name:var(--font-sora)] font-bold">{vol.destination}</p>
              <p className="text-white/70 text-xs sm:text-sm mt-1 truncate">{vol.ville_destination}</p>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(vol.date_vol)}
            </div>
            <p className="text-2xl sm:text-3xl font-[family-name:var(--font-sora)] font-bold">
              {formatCurrency(vol.prix_actuel)}
            </p>
          </div>

          <div className="mt-4 bg-yellow-accent/20 border border-yellow-accent/30 rounded-xl px-4 py-2 text-sm text-center">
            <Lock className="w-4 h-4 inline mr-1" />
            Prix garanti jusqu&apos;au {formatDate(expirationDate.toISOString())}
          </div>
        </div>

        {/* Calculator */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-6">
            Calculez votre réservation
          </h2>

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
              <span>Prix du billet</span>
              <span className="font-medium">{formatCurrency(vol.prix_actuel)}</span>
            </div>
            <div className="flex justify-between text-blue-primary font-semibold">
              <span>Prime de réservation ({Math.round((MOETLY_CONFIG.PRIME_RATE + (duree === 90 ? 0.005 : 0)) * 100 * 10) / 10}%)</span>
              <span>{formatCurrency(prime.montant_prime)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between text-lg font-[family-name:var(--font-sora)] font-bold text-blue-primary">
                <span>A regler aujourd&apos;hui</span>
                <span>{formatCurrency(prime.montant_prime)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Reste à payer avant le {formatDate(expirationDate.toISOString())}</span>
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
                <p className="text-sm text-gray-700"><span className="font-semibold">Prix bloqué</span> — Le prix de votre billet est garanti pendant la durée choisie</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                <p className="text-sm text-gray-700"><span className="font-semibold">Sans crédit</span> — Ce n&apos;est pas un prêt, juste une petite prime de réservation</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                <p className="text-sm text-gray-700"><span className="font-semibold">Payez plus tard</span> — Finalisez l&apos;achat de votre billet quand vous êtes prêt</p>
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
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={handleReserve}
                loading={paymentLoading}
                disabled={!email}
              >
                Procéder au paiement
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
              <PaymentForm clientSecret={clientSecret} reservationId={reservationId} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
