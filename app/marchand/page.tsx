'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Reservation, Paiement } from '@/types';
import { formatCurrency, formatDateShort, shortId, daysRemaining, resteAPayer, progressionPaiement } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge, { statutToVariant, statutLabel } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { TrendingUp, Shield, DollarSign, Target, Clock, CreditCard, CheckCircle, ArrowUpRight, AlertTriangle, Package, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function MarchandDashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
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

      // Get reservations with paiements
      const res = await fetch(`/api/reservations?marchand_id=${marchand.id}&limit=100`);
      const resData = await res.json();
      const allRes: Reservation[] = resData.data || [];
      setReservations(allRes);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // KPI calculations
  const actives = reservations.filter(r => r.statut === 'active');
  const finalisees = reservations.filter(r => r.statut === 'finalisee');
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Billets bloqués = somme des prix_bloque des actives
  const volumeGaranti = actives.reduce((sum, r) => sum + r.prix_bloque, 0);

  // Épargne restante = somme des restes à verser des actives
  const pipelineRestant = actives.reduce((sum, r) => sum + resteAPayer(r.prix_bloque, r.total_paye || 0), 0);

  // Versements clients ce mois (tous paiements confirmés)
  const allPaiements = reservations.flatMap(r => r.paiements || []);
  const paiementsThisMonth = allPaiements
    .filter(p => p.statut === 'confirme' && new Date(p.created_at) >= monthStart);
  const collectesMois = paiementsThisMonth.reduce((sum, p) => sum + p.montant, 0);

  // Primes acquises (seulement les primes confirmées)
  const primesAcquises = allPaiements
    .filter(p => p.statut === 'confirme' && p.type === 'prime')
    .reduce((sum, p) => sum + p.montant, 0);

  // Taux de finalisation
  const tauxFinalisation = reservations.length > 0
    ? (finalisees.length / reservations.length) * 100
    : 0;

  // Progression moyenne des actives
  const progressionMoyenne = actives.length > 0
    ? actives.reduce((sum, r) => sum + progressionPaiement(r.total_paye || 0, r.prix_bloque), 0) / actives.length
    : 0;

  // Derniers paiements reçus (top 5)
  const recentPaiements = allPaiements
    .filter(p => p.statut === 'confirme')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Map paiement → reservation pour le contexte
  const reservationMap = new Map(reservations.map(r => [r.id, r]));

  const kpiCards = [
    {
      label: 'Réservations actives',
      value: actives.length,
      format: 'number' as const,
      icon: Shield,
      color: 'text-blue-primary',
      bgColor: 'bg-blue-light',
    },
    {
      label: 'Billets bloqués',
      value: volumeGaranti,
      format: 'currency' as const,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Versements clients ce mois',
      value: collectesMois,
      format: 'currency' as const,
      icon: DollarSign,
      color: 'text-yellow-dark',
      bgColor: 'bg-yellow-light',
    },
    {
      label: 'Taux de finalisation',
      value: tauxFinalisation,
      format: 'percent' as const,
      icon: Target,
      color: 'text-blue-dark',
      bgColor: 'bg-blue-light',
    },
  ];

  // Weekly chart data
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() + (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const volume = actives
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
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
          Bonjour !
        </h1>
        <p className="text-gray-500 mt-1">
          {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

      {/* ===== GESTION DES STOCKS ===== */}
      {(() => {
        // Stock calculations from existing reservations data
        const produitsBloqués = actives.length;
        const completed = reservations.filter(r => ['finalisee', 'annulee', 'expiree'].includes(r.statut));
        const tauxFinalisationStock = completed.length > 0
          ? (finalisees.length / completed.length) * 100
          : 0;
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const expirentBientot = actives.filter(r => {
          const exp = new Date(r.date_expiration);
          return exp <= sevenDaysFromNow && exp > now;
        });
        const totalPrimesMarchand = reservations.reduce((sum, r) => sum + (r.part_marchand || 0), 0);

        // Alerts: expiring soon + high savings (>80%)
        const alertsExpiring = expirentBientot.map(r => {
          const vol = r.vol;
          const lien = r.lien_paiement;
          const trajet = vol
            ? `${vol.ville_origine} → ${vol.ville_destination}`
            : lien
              ? `${lien.ville_origine} → ${lien.ville_destination}`
              : shortId(r.id);
          const days = daysRemaining(r.date_expiration);
          return { id: r.id, type: 'expiring' as const, trajet, message: `Expire dans ${days} jour${days > 1 ? 's' : ''}`, days };
        });
        const alertsHighSavings = actives
          .filter(r => progressionPaiement(r.total_paye || 0, r.prix_bloque) >= 80)
          .map(r => {
            const vol = r.vol;
            const lien = r.lien_paiement;
            const trajet = vol
              ? `${vol.ville_origine} → ${vol.ville_destination}`
              : lien
                ? `${lien.ville_origine} → ${lien.ville_destination}`
                : shortId(r.id);
            const pct = Math.round(progressionPaiement(r.total_paye || 0, r.prix_bloque));
            return { id: r.id, type: 'high_savings' as const, trajet, message: `${pct}% épargné — finalisation proche`, days: 0 };
          });
        const allAlerts = [...alertsExpiring, ...alertsHighSavings].slice(0, 5);

        // Conversion rate by route
        const routeMap = new Map<string, { route: string; total: number; finalized: number; abandoned: number }>();
        reservations.forEach(r => {
          const vol = r.vol;
          const lien = r.lien_paiement;
          const route = vol
            ? `${vol.ville_origine} → ${vol.ville_destination}`
            : lien
              ? `${lien.ville_origine} → ${lien.ville_destination}`
              : 'Autre';
          const existing = routeMap.get(route) || { route, total: 0, finalized: 0, abandoned: 0 };
          existing.total++;
          if (r.statut === 'finalisee') existing.finalized++;
          if (r.statut === 'annulee' || r.statut === 'expiree') existing.abandoned++;
          routeMap.set(route, existing);
        });
        const conversionData = Array.from(routeMap.values())
          .sort((a, b) => b.total - a.total)
          .slice(0, 8);

        const stockKPIs = [
          {
            label: 'Produits bloqués',
            value: produitsBloqués,
            format: 'number' as const,
            icon: Package,
            color: 'text-blue-primary',
            bgColor: 'bg-blue-light',
          },
          {
            label: 'Taux de finalisation',
            value: tauxFinalisationStock,
            format: 'percent' as const,
            icon: Target,
            color: 'text-success',
            bgColor: 'bg-emerald-50',
          },
          {
            label: 'Expirent bientôt',
            value: expirentBientot.length,
            format: 'number' as const,
            icon: AlertTriangle,
            color: expirentBientot.length > 0 ? 'text-error' : 'text-gray-400',
            bgColor: expirentBientot.length > 0 ? 'bg-red-50' : 'bg-gray-50',
          },
          {
            label: 'Primes acquises',
            value: totalPrimesMarchand,
            format: 'currency' as const,
            icon: DollarSign,
            color: 'text-yellow-dark',
            bgColor: 'bg-yellow-light',
          },
        ];

        return (
          <>
            {/* Section header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-blue-light rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-primary" />
                </div>
                <h2 className="text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
                  Gestion des stocks
                </h2>
              </div>
              <p className="text-sm text-gray-500 ml-11">
                Suivi de vos produits bloqués, alertes et taux de conversion
              </p>
            </div>

            {/* Stock KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              {stockKPIs.map(kpi => (
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

            {/* Alerts + Conversion table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Alertes Stock */}
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
                    Alertes stock
                  </h3>
                  <AlertTriangle className="w-5 h-5 text-gray-400" />
                </div>
                {allAlerts.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucune alerte pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {allAlerts.map((alert, idx) => (
                      <div key={`${alert.id}-${alert.type}-${idx}`} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          alert.type === 'expiring' ? 'bg-red-50' : 'bg-emerald-50'
                        }`}>
                          {alert.type === 'expiring' ? (
                            <AlertTriangle className="w-4 h-4 text-error" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-success" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{alert.trajet}</p>
                          <p className={`text-xs ${alert.type === 'expiring' ? 'text-error' : 'text-success'}`}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Taux de conversion par produit */}
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
                    Conversion par produit
                  </h3>
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>
                {conversionData.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">Aucune donnée disponible</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-gray-500 font-medium text-xs">Route</th>
                          <th className="text-center py-2 text-gray-500 font-medium text-xs">Bloqués</th>
                          <th className="text-center py-2 text-gray-500 font-medium text-xs">Finalisés</th>
                          <th className="text-center py-2 text-gray-500 font-medium text-xs">Abandon</th>
                          <th className="text-right py-2 text-gray-500 font-medium text-xs">Taux</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversionData.map((row, idx) => {
                          const rate = (row.finalized + row.abandoned) > 0
                            ? (row.finalized / (row.finalized + row.abandoned)) * 100
                            : 0;
                          return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0">
                              <td className="py-2.5 font-medium text-gray-800 max-w-[140px] truncate" title={row.route}>
                                {row.route}
                              </td>
                              <td className="py-2.5 text-center text-gray-600">{row.total}</td>
                              <td className="py-2.5 text-center text-success font-semibold">{row.finalized}</td>
                              <td className="py-2.5 text-center text-error">{row.abandoned}</td>
                              <td className="py-2.5 text-right">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  rate >= 70 ? 'bg-emerald-100 text-emerald-700' :
                                  rate >= 40 ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {Math.round(rate)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </>
        );
      })()}

      {/* Pipeline + Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Pipeline restant */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
                Épargne en cours
              </h2>
              <p className="text-sm text-gray-500">
                Versements restants attendus de vos clients
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-[family-name:var(--font-sora)] font-bold text-blue-primary">
                {formatCurrency(pipelineRestant)}
              </p>
            </div>
          </div>
          <ProgressBar
            current={volumeGaranti - pipelineRestant}
            total={volumeGaranti || 1}
          />
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-success" />
              {formatCurrency(volumeGaranti - pipelineRestant)} versé
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-yellow-accent" />
              {formatCurrency(pipelineRestant)} restant
            </span>
          </div>
        </Card>

        {/* Progression moyenne */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
                Progression moyenne
              </h2>
              <p className="text-sm text-gray-500">
                Avancement épargne des réservations actives
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-[family-name:var(--font-sora)] font-bold text-blue-primary">
                {Math.round(progressionMoyenne)}%
              </p>
            </div>
          </div>
          {/* Mini barres par réservation active */}
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {actives.slice(0, 6).map(res => {
              const vol = res.vol;
              const lien = res.lien_paiement;
              const trajet = vol
                ? `${vol.ville_origine} → ${vol.ville_destination}`
                : lien
                  ? `${lien.ville_origine} → ${lien.ville_destination}`
                  : shortId(res.id);
              const pct = progressionPaiement(res.total_paye || 0, res.prix_bloque);

              return (
                <div key={res.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 truncate" title={trajet}>{trajet}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100
                          ? 'var(--success)'
                          : 'linear-gradient(90deg, var(--blue-primary), var(--yellow-accent))',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-10 text-right">{Math.round(pct)}%</span>
                </div>
              );
            })}
            {actives.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Aucune réservation active</p>
            )}
          </div>
        </Card>
      </div>

      {/* Activité récente + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Activité récente (derniers paiements) */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
              Derniers versements clients
            </h2>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          {recentPaiements.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun versement reçu</p>
          ) : (
            <div className="space-y-0">
              {recentPaiements.map(p => {
                const res = reservationMap.get(p.reservation_id);
                const vol = res?.vol;
                const lien = res?.lien_paiement;
                const trajet = vol
                  ? `${vol.ville_origine} → ${vol.ville_destination}`
                  : lien
                    ? `${lien.ville_origine} → ${lien.ville_destination}`
                    : 'Réservation';

                const typeLabel: Record<string, string> = {
                  prime: 'Prime acquise',
                  partiel: 'Épargne client',
                  solde: 'Finalisation',
                };

                return (
                  <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {typeLabel[p.type] || p.type} — {trajet}
                        </p>
                        <p className="text-xs text-gray-400">
                          {res?.consommateur_prenom} · {formatDateShort(p.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-success">
                      +{formatCurrency(p.montant)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Chart ventes garanties */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
                Billets bloqués par semaine
              </h2>
              <p className="text-sm text-gray-500">
                Basé sur {actives.length} réservation{actives.length > 1 ? 's' : ''} active{actives.length > 1 ? 's' : ''}
              </p>
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-end gap-1.5 sm:gap-3 h-36 sm:h-48">
            {weeklyData.map((d) => (
              <div key={d.week} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium truncate w-full text-center">
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
      </div>

      {/* Recent reservations table */}
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
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs sm:text-sm">ID</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs sm:text-sm">Trajet</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs sm:text-sm">Montant</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs sm:text-sm">Progression</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs sm:text-sm">Statut</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs sm:text-sm">Expiration</th>
                </tr>
              </thead>
              <tbody>
                {recentReservations.map(res => {
                  const vol = res.vol;
                  const lien = res.lien_paiement;
                  const trajet = vol
                    ? `${vol.ville_origine} → ${vol.ville_destination}`
                    : lien
                      ? `${lien.ville_origine} → ${lien.ville_destination}`
                      : '-';
                  const pct = progressionPaiement(res.total_paye || 0, res.prix_bloque);

                  return (
                    <tr key={res.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-mono text-gray-400 text-xs">{shortId(res.id)}</td>
                      <td className="py-3 font-medium">{trajet}</td>
                      <td className="py-3">{formatCurrency(res.prix_bloque)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: pct >= 100
                                  ? 'var(--success)'
                                  : 'linear-gradient(90deg, var(--blue-primary), var(--yellow-accent))',
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{Math.round(pct)}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant={statutToVariant(res.statut)}>{statutLabel(res.statut)}</Badge>
                      </td>
                      <td className="py-3 text-gray-500">{formatDateShort(res.date_expiration)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
