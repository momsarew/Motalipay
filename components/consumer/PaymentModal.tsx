'use client';

import { useState } from 'react';
import { Reservation } from '@/types';
import { formatCurrency, resteAPayer } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { X, CheckCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function StripePaymentForm({
  clientSecret,
  reservationId,
  montant,
  onSuccess,
}: {
  clientSecret: string;
  reservationId: string;
  montant: number;
  onSuccess: () => void;
}) {
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
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Une erreur est survenue');
      setProcessing(false);
    } else {
      // Paiement réussi sans redirection
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 bg-blue-light rounded-xl p-3 text-center">
        <p className="text-sm text-gray-600">Montant à payer</p>
        <p className="text-2xl font-[family-name:var(--font-sora)] font-bold text-blue-primary">
          {formatCurrency(montant)}
        </p>
      </div>
      <PaymentElement />
      {error && <p className="text-error text-sm mt-3">{error}</p>}
      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full mt-4"
        loading={processing}
        disabled={!stripe}
      >
        Confirmer le paiement
      </Button>
      <p className="text-xs text-gray-400 text-center mt-2">
        Mode test — Carte : 4242 4242 4242 4242 | Exp : 12/34 | CVC : 123
      </p>
    </form>
  );
}

interface PaymentModalProps {
  reservation: Reservation;
  onPaymentComplete: () => void;
  onClose: () => void;
}

export default function PaymentModal({ reservation, onPaymentComplete, onClose }: PaymentModalProps) {
  const reste = resteAPayer(reservation.prix_bloque, reservation.total_paye || 0);
  const [step, setStep] = useState<'amount' | 'stripe' | 'success'>('amount');
  const [montant, setMontant] = useState(reste);
  const [montantLibre, setMontantLibre] = useState('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const presetAmounts = [
    { label: `Tout payer (${formatCurrency(reste)})`, value: reste },
  ];
  // Ajouter des montants partiels si le reste > 100€
  if (reste > 100) {
    presetAmounts.push({ label: formatCurrency(Math.round(reste / 2)), value: Math.round(reste / 2) });
  }
  if (reste > 200) {
    presetAmounts.push({ label: formatCurrency(100), value: 100 });
  }

  const handleSelectAmount = (value: number) => {
    setMontant(value);
    setUseCustomAmount(false);
    setMontantLibre('');
  };

  const handleProceed = async () => {
    const finalMontant = useCustomAmount ? parseFloat(montantLibre) : montant;
    if (!finalMontant || finalMontant <= 0 || finalMontant > reste) {
      setError(`Le montant doit être entre 0,50€ et ${formatCurrency(reste)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: reservation.id,
          montant: finalMontant,
        }),
      });

      const data = await res.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setMontant(data.montant);
        setStep('stripe');
      } else {
        setError(data.error || 'Erreur lors de la création du paiement');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setStep('success');
    setTimeout(() => {
      onPaymentComplete();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
            {step === 'success' ? 'Paiement confirmé' : 'Effectuer un paiement'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          {/* Étape 1 : Choix du montant */}
          {step === 'amount' && (
            <>
              {/* Résumé */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Prix total du billet</span>
                  <span className="font-medium">{formatCurrency(reservation.prix_bloque)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Déjà payé</span>
                  <span className="font-medium text-success">{formatCurrency(reservation.total_paye || 0)}</span>
                </div>
                <div className="border-t border-gray-200 my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-gray-900">Reste à payer</span>
                  <span className="text-blue-primary">{formatCurrency(reste)}</span>
                </div>
              </div>

              {/* Montants prédéfinis */}
              <div className="space-y-2 mb-4">
                {presetAmounts.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectAmount(preset.value)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                      !useCustomAmount && montant === preset.value
                        ? 'border-blue-primary bg-blue-light text-blue-primary'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {i === 0 ? preset.label : `Payer ${preset.label}`}
                  </button>
                ))}

                {/* Montant libre */}
                <button
                  onClick={() => { setUseCustomAmount(true); setMontant(0); }}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                    useCustomAmount
                      ? 'border-blue-primary bg-blue-light text-blue-primary'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Autre montant
                </button>

                {useCustomAmount && (
                  <div className="mt-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={montantLibre}
                        onChange={e => setMontantLibre(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all text-lg font-semibold"
                        placeholder="0"
                        min="0.50"
                        max={reste}
                        step="0.01"
                        autoFocus
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">€</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Min : 0,50€ — Max : {formatCurrency(reste)}</p>
                  </div>
                )}
              </div>

              {error && <p className="text-error text-sm mb-3">{error}</p>}

              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={handleProceed}
                loading={loading}
                disabled={useCustomAmount ? !montantLibre || parseFloat(montantLibre) <= 0 : montant <= 0}
              >
                Procéder au paiement
              </Button>
            </>
          )}

          {/* Étape 2 : Stripe */}
          {step === 'stripe' && clientSecret && (
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
              <StripePaymentForm
                clientSecret={clientSecret}
                reservationId={reservation.id}
                montant={montant}
                onSuccess={handleSuccess}
              />
            </Elements>
          )}

          {/* Étape 3 : Succès */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-2">
                Paiement réussi !
              </h3>
              <p className="text-gray-500">
                {formatCurrency(montant)} ont été enregistrés sur votre réservation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
