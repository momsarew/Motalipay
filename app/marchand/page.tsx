'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Reservation, DashboardKPIs } from '@/types';
import { formatCurrency, formatDateShort, shortId, daysRemaining } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge, { statutToVariant, statutLabel } from '@/components/ui/Badge';
import { TrendingUp, Shield, DollarSign, Target, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MarchandDashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [marchandId, setMarchandId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Get marchand
      const { data: marchand } = await supabase
        .from('marchands')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!marchand) {
        setLoading(false);
        return;
      }

      setMarchandId(marchand.id);

      // Get reservations
      const res = await fetch(`/api/reservations?marchand_id=${marchand.id}`);
      const resData = await res.json();
      const allRes: Reservation[] = resData.data || [];
      setReservations(allRes);

      // Calculate KPIs
      const active = allRes.filter(r => r.statut === 'active');
      const finalisees = allRes.filter(r => r.statut === 'finalisee');
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const primesThisMonth = allRes
        .filter(r => new Date(r.created_at) >= monthStart)
        .reduce((sum, r) => sum + r.part_marchand, 0);

      const avgDays = active.length > 0
        ? active.reduce((sum, r) => sum + daysRemaining(r.date_expiration), 0) / active.length
        : 0;

      setKpis({
        reservations_actives: active.length,
        volume_garanti_total: active.reduce((sum, r) => sum + r.prix_bloque, 0),
        primes_collectees_mois: primesThisMonth,
        taux_finalisation: allRes.length > 0 ? (finalisees.length / allRes.length) * 100 : 0,
        jours_visibilite_moyenne: Math.round(avgDays),
      });

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Réservations actives',
      value: kpis?.reservations_actives || 0,
      format: 'number' as const,
      icon: Shield,
      color: 'text-blue-primary',
      bgColor: 'bg-blue-light',
    },
    {
      label: 'Volume garanti',
      value: kpis?.volume_garanti_total || 0,
      format: 'currency' as const,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Primes perçues ce mois',
      value: kpis?.primes_collectees_mois || 0,
      format: 'currency' as const,
      icon: DollarSign,
      color: 'text-yellow-dark',
      bgColor: 'bg-yellow-light',
    },
    {
      label: 'Taux de finalisation',
      value: kpis?.taux_finalisation || 0,
      format: 'percent' as const,
      icon: Target,
      color: 'text-blue-dark',
      bgColor: 'bg-blue-light',
    },
  ];

  // Weekly chart data (simplified)
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() + (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const volume = reservations
      .filter(r => r.statut === 'active')
      .filter(r => {
        const exp = new Date(r.date_expiration);
        return exp >= weekStart && exp < weekEnd;
      })
      .reduce((sum, r) => sum + r.prix_bloque, 0);

    return { week: `S+${i + 1}`, volume };
  });

  const maxVolume = Math.max(...weeklyData.map(d => d.volume), 1);

  const recentReservations = reservations.slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
          Bonjour !
        </h1>
        <p className="text-gray-500 mt-1">
          {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map(kpi => (
          <Card key={kpi.label} padding="md" hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className={`text-2xl font-[family-name:var(--font-sora)] font-bold mt-1 ${kpi.color}`}>
                  {kpi.format === 'currency' && formatCurrency(kpi.value)}
                  {kpi.format === 'number' && kpi.value}
                  {kpi.format === 'percent' && `${Math.round(kpi.value)}%`}
                </p>
              </div>
              <div className={`w-10 h-10 ${kpi.bgColor} rounded-xl flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card padding="lg" className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
              Vos ventes garanties par semaine
            </h2>
            <p className="text-sm text-gray-500">
              Basé sur vos {reservations.filter(r => r.statut === 'active').length} réservations actives
            </p>
          </div>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex items-end gap-3 h-48">
          {weeklyData.map((d) => (
            <div key={d.week} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">
                {d.volume > 0 ? formatCurrency(d.volume) : ''}
              </span>
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{
                  height: `${Math.max((d.volume / maxVolume) * 100, 4)}%`,
                  background: d.volume > 0
                    ? 'linear-gradient(180deg, var(--blue-primary), var(--blue-dark))'
                    : 'var(--gray-200)',
                }}
              />
              <span className="text-xs text-gray-500">{d.week}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent reservations */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
            Réservations récentes
          </h2>
          <Link href="/marchand/reservations" className="text-sm text-blue-primary hover:underline">
            Voir toutes &rarr;
          </Link>
        </div>

        {recentReservations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune réservation pour le moment</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-500 font-medium">ID</th>
                  <th className="text-left py-3 text-gray-500 font-medium">Destination</th>
                  <th className="text-left py-3 text-gray-500 font-medium">Montant</th>
                  <th className="text-left py-3 text-gray-500 font-medium">Statut</th>
                  <th className="text-left py-3 text-gray-500 font-medium">Expiration</th>
                </tr>
              </thead>
              <tbody>
                {recentReservations.map(res => (
                  <tr key={res.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 font-mono text-gray-400 text-xs">{shortId(res.id)}</td>
                    <td className="py-3 font-medium">
                      {res.vol ? `${res.vol.origine} → ${res.vol.destination}` : '-'}
                    </td>
                    <td className="py-3">{formatCurrency(res.prix_bloque)}</td>
                    <td className="py-3">
                      <Badge variant={statutToVariant(res.statut)}>{statutLabel(res.statut)}</Badge>
                    </td>
                    <td className="py-3 text-gray-500">{formatDateShort(res.date_expiration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
