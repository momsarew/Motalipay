'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Reservation } from '@/types';
import { formatCurrency, formatDate, shortId } from '@/lib/utils';
import Badge, { statutToVariant, statutLabel } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { Plane, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }

    fetch(`/api/reservations?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        setReservations(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [email]);

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Aucun email spécifié</p>
        <Link href="/" className="text-blue-primary hover:underline">Retour aux vols</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          <span className="text-sm text-gray-500">{email}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-6">
          Mes réservations
        </h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-200" />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-16">
            <Plane className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Aucune réservation trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map(res => (
              <div key={res.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-400 font-mono">{shortId(res.id)}</span>
                      <Badge variant={statutToVariant(res.statut)}>
                        {statutLabel(res.statut)}
                      </Badge>
                    </div>
                    {res.vol && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
                          {res.vol.ville_origine} &rarr; {res.vol.ville_destination}
                        </span>
                      </div>
                    )}
                    {res.vol && (
                      <p className="text-sm text-gray-500 mt-1">
                        Vol le {formatDate(res.vol.date_vol)} &middot; {res.vol.compagnie}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
                      {formatCurrency(res.prix_bloque)}
                    </p>
                    <p className="text-sm text-gray-500">Prix bloqué</p>
                  </div>
                </div>

                {res.statut === 'active' && (
                  <>
                    <div className="mt-4">
                      <ProgressBar current={res.montant_prime} total={res.prix_bloque} />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <CountdownTimer targetDate={res.date_expiration} compact />
                      <button className="text-sm bg-yellow-accent text-gray-900 px-4 py-2 rounded-xl font-semibold hover:bg-yellow-dark transition-colors cursor-pointer">
                        Finaliser le paiement
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
