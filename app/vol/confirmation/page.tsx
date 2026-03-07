'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Reservation } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import ProgressBar from '@/components/ui/ProgressBar';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Button from '@/components/ui/Button';
import { CheckCircle, Plane, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservation_id');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reservationId) {
      setLoading(false);
      return;
    }

    fetch(`/api/reservations/${reservationId}`)
      .then(res => res.json())
      .then(data => {
        setReservation(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [reservationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!reservation || !reservation.vol) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Réservation non trouvée</p>
        <Link href="/" className="text-blue-primary hover:underline">Retour aux vols</Link>
      </div>
    );
  }

  const vol = reservation.vol;

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
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
        </motion.div>

        {/* Confirmation card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8"
        >
          <h1 className="text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900 text-center">
            Réservation confirmée !
          </h1>

          {/* Flight recap */}
          <div className="mt-6 bg-blue-light rounded-xl p-5">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-[family-name:var(--font-sora)] font-bold text-blue-dark">{vol.origine}</p>
                <p className="text-sm text-gray-500">{vol.ville_origine}</p>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-8 h-[2px] bg-blue-primary/30" />
                <Plane className="w-4 h-4 text-blue-primary" />
                <div className="w-8 h-[2px] bg-blue-primary/30" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-[family-name:var(--font-sora)] font-bold text-blue-dark">{vol.destination}</p>
                <p className="text-sm text-gray-500">{vol.ville_destination}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Prix bloqué</span>
              <span className="font-semibold">{formatCurrency(reservation.prix_bloque)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Prime payée</span>
              <span className="font-semibold text-blue-primary">{formatCurrency(reservation.montant_prime)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Garanti jusqu&apos;au</span>
              <span className="font-semibold">{formatDate(reservation.date_expiration)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <ProgressBar current={reservation.montant_prime} total={reservation.prix_bloque} />
          </div>

          {/* Countdown */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-3">Temps restant pour finaliser</p>
            <CountdownTimer targetDate={reservation.date_expiration} />
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Link href={`/dashboard?email=${encodeURIComponent(reservation.consommateur_email)}`}>
              <Button variant="primary" size="lg" className="w-full">
                Voir ma réservation
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="md" className="w-full">
                Retour aux vols
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
