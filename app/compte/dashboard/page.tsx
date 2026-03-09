'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Reservation } from '@/types';
import { formatCurrency, daysRemaining, resteAPayer, progressionPaiement, shortId, formatDate } from '@/lib/utils';
import Badge, { statutToVariant, statutLabel } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import CountdownTimer from '@/components/ui/CountdownTimer';
import PaymentModal from '@/components/consumer/PaymentModal';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Shield, CreditCard, CheckCircle, Clock, Plane,
  Wallet, TrendingUp, Package,
} from 'lucide-react';

export default function CompteDashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [payingReservation, setPayingReservation] = useState<Reservation | null>(null);

  const fetchReservations = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/reservations?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setReservations(data.data || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.email) {
        setLoading(false);
        return;
      }

      setUserEmail(user.email);
      fetchReservations(user.email);
    };

    loadUser();
  }, [fetchReservations]);

  const handlePaymentComplete = () => {
    setPayingReservation(null);
    setLoading(true);
    fetchReservations(userEmail);
  };

  // KPI calculations
  const actives = reservations.filter(r => r.statut === 'active');
  const finalisees = reservations.filter(r => r.statut === 'finalisee');
  const epargneTotale = actives.reduce((sum, r) => sum + (r.total_paye || 0), 0);
  const resteAVerser = actives.reduce((sum, r) => sum + resteAPayer(r.prix_bloque, r.total_paye || 0), 0);

  const kpiCards = [
    {
      label: 'Reservations actives',
      value: actives.length,
      format: 'number' as const,
      icon: Package,
      color: 'text-blue-primary',
      bgColor: 'bg-blue-light',
    },
    {
      label: 'Epargne totale',
      value: epargneTotale,
      format: 'currency' as const,
      icon: Wallet,
      color: 'text-success',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Reste a verser',
      value: resteAVerser,
      format: 'currency' as const,
      icon: Clock,
      color: 'text-yellow-dark',
      bgColor: 'bg-yellow-light',
    },
    {
      label: 'Finalisees',
      value: finalisees.length,
      format: 'number' as const,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-emerald-50',
    },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
          </div>
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
          Mes reservations
        </h1>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-blue-primary" />
          Vos fonds sont securises chez Moetly Pay. Vous pouvez retirer vos versements a tout moment (hors prime).
        </p>
      </div>

      {/* KPIs */}
      {reservations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {kpiCards.map(kpi => (
            <Card key={kpi.label} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  <p className={`text-xl font-[family-name:var(--font-sora)] font-bold mt-1 ${kpi.color}`}>
                    {kpi.format === 'currency' && formatCurrency(kpi.value)}
                    {kpi.format === 'number' && kpi.value}
                  </p>
                </div>
                <div className={`w-9 h-9 ${kpi.bgColor} rounded-xl flex items-center justify-center`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reservations list */}
      {reservations.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-blue-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-blue-primary" />
          </div>
          <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-2">
            Aucune reservation
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Vous n&apos;avez pas encore de reservation. Lorsqu&apos;un marchand vous enverra un lien de paiement, votre reservation apparaitra ici.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map(res => {
            const vol = res.vol;
            const lien = res.lien_paiement;
            const trajet = vol
              ? `${vol.ville_origine} → ${vol.ville_destination}`
              : lien
                ? `${lien.ville_origine} → ${lien.ville_destination}`
                : 'Reservation';
            const compagnie = vol?.compagnie || lien?.compagnie;
            const totalPaye = res.total_paye || 0;
            const reste = resteAPayer(res.prix_bloque, totalPaye);
            const pct = progressionPaiement(totalPaye, res.prix_bloque);
            const days = daysRemaining(res.date_expiration);

            return (
              <Card key={res.id} padding="md">
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-gray-400 font-mono">{shortId(res.id)}</span>
                      <Badge variant={statutToVariant(res.statut)}>
                        {statutLabel(res.statut)}
                      </Badge>
                    </div>
                    <h3 className="text-base sm:text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
                      {trajet}
                    </h3>
                    {compagnie && (
                      <p className="text-xs sm:text-sm text-gray-500">{compagnie}</p>
                    )}
                  </div>
                  <div className="sm:text-right flex items-center sm:block gap-2">
                    <p className="text-lg sm:text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
                      {formatCurrency(res.prix_bloque)}
                    </p>
                    <p className="text-xs text-gray-500">Prix bloque</p>
                  </div>
                </div>

                {/* Progress bar */}
                <ProgressBar current={totalPaye} total={res.prix_bloque} />

                {/* Amount details */}
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-gray-500">
                    <span className="font-semibold text-success">{formatCurrency(totalPaye)}</span> verse
                  </span>
                  <span className="text-gray-500">
                    <span className="font-semibold">{formatCurrency(res.prix_bloque)}</span> total
                  </span>
                </div>

                {/* Active reservation actions */}
                {res.statut === 'active' && reste > 0 && (
                  <div className="mt-4 bg-blue-light/50 border border-blue-primary/15 rounded-xl p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-primary" />
                        <span className={`text-xs sm:text-sm font-medium ${days <= 7 ? 'text-error' : 'text-gray-700'}`}>
                          {days > 0 ? `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}` : 'Expire aujourd\'hui'}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">
                        Reste : {formatCurrency(reste)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        variant="accent"
                        size="md"
                        className="flex-1"
                        onClick={() => setPayingReservation(res)}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Verser maintenant
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        className="flex-1"
                        onClick={() => {
                          alert('Pour retirer votre epargne (hors prime), contactez le support Moetly Pay.');
                        }}
                      >
                        Retirer mon epargne
                      </Button>
                    </div>
                  </div>
                )}

                {/* Finalized */}
                {res.statut === 'finalisee' && (
                  <div className="mt-4 bg-success/5 border border-success/20 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-success font-[family-name:var(--font-sora)] font-bold">
                        Reservation finalisee
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Votre epargne est complete. Le marchand procede a l&apos;emission de votre billet.
                    </p>
                  </div>
                )}

                {/* Expired / Cancelled */}
                {(res.statut === 'expiree' || res.statut === 'annulee') && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-error font-medium">
                      {res.statut === 'expiree' ? 'Cette reservation a expire.' : 'Cette reservation a ete annulee.'}
                    </p>
                  </div>
                )}

                {/* Expiration date */}
                {res.statut === 'active' && (
                  <div className="mt-3 text-xs text-gray-400 text-center">
                    Prix garanti jusqu&apos;au {formatDate(res.date_expiration)}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Trust banner */}
      {reservations.length > 0 && (
        <div className="mt-8 bg-blue-light border border-blue-primary/20 rounded-xl p-4 text-center">
          <p className="text-sm text-blue-dark flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-blue-primary" />
            Vos fonds sont securises chez Moetly Pay. Vous pouvez retirer vos versements a tout moment (hors prime).
          </p>
        </div>
      )}

      {/* Payment modal */}
      {payingReservation && (
        <PaymentModal
          reservation={payingReservation}
          onPaymentComplete={handlePaymentComplete}
          onClose={() => setPayingReservation(null)}
        />
      )}
    </div>
  );
}
