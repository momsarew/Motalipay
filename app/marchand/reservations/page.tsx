'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Reservation } from '@/types';
import { formatCurrency, formatDateShort, shortId, daysRemaining, progressionPaiement } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge, { statutToVariant, statutLabel } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const TABS = [
  { value: 'all', label: 'Toutes' },
  { value: 'active', label: 'Actives' },
  { value: 'finalisee', label: 'Finalisées' },
  { value: 'expiree', label: 'Expirées' },
];

const SECTEUR_OPTIONS = [
  { value: 'all', label: 'Tous secteurs' },
  { value: 'transport', label: 'Transport' },
  { value: 'evenement', label: 'Événement' },
  { value: 'hebergement', label: 'Hébergement' },
  { value: 'autre', label: 'Autre' },
];

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [secteur, setSecteur] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [marchandId, setMarchandId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    const getMarchand = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: marchand } = await supabase
        .from('marchands')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (marchand) {
        setMarchandId(marchand.id);
      }
    };
    getMarchand();
  }, []);

  useEffect(() => {
    if (!marchandId) return;

    const loadReservations = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        marchand_id: marchandId,
        page: page.toString(),
        limit: limit.toString(),
      });
      if (tab !== 'all') params.set('statut', tab);

      const res = await fetch(`/api/reservations?${params}`);
      const data = await res.json();
      setReservations(data.data || []);
      setTotal(data.count || 0);
      setLoading(false);
    };

    loadReservations();
  }, [marchandId, tab, page]);

  const filtered = reservations.filter(r => {
    const matchesSearch =
      !search ||
      r.consommateur_email.toLowerCase().includes(search.toLowerCase()) ||
      r.consommateur_prenom?.toLowerCase().includes(search.toLowerCase());

    const reservationSecteur = r.lien_paiement?.secteur || 'transport';
    const matchesSecteur = secteur === 'all' || reservationSecteur === secteur;

    return matchesSearch && matchesSecteur;
  });

  const handleMarkFinalized = async (id: string) => {
    await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'finalisee' }),
    });

    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, statut: 'finalisee' } : r)
    );
  };

  const exportCSV = () => {
    const headers = ['ID', 'Trajet', 'Montant', 'Statut', 'Progression', 'Expiration', 'Email client'];
    const rows = filtered.map(r => {
      const vol = r.vol;
      const lien = r.lien_paiement;
      const trajet = vol
        ? `${vol.ville_origine}-${vol.ville_destination}`
        : lien
          ? `${lien.ville_origine}-${lien.ville_destination}`
          : '-';
      const pct = progressionPaiement(r.total_paye || 0, r.prix_bloque);

      return [
        shortId(r.id),
        trajet,
        r.prix_bloque.toFixed(2),
        r.statut,
        `${Math.round(pct)}%`,
        formatDateShort(r.date_expiration),
        r.consommateur_email,
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moetly-reservations-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
          Réservations
        </h1>
        <Button variant="ghost" size="sm" onClick={exportCSV}>
          <span className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter CSV
          </span>
        </Button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setPage(1); }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                tab === t.value
                  ? 'bg-blue-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none"
            />
          </div>
          <select
            value={secteur}
            onChange={(e) => setSecteur(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none"
          >
            {SECTEUR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Card padding="sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune réservation trouvée</div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 sm:p-4 text-gray-500 font-medium text-xs">ID</th>
                  <th className="text-left p-3 sm:p-4 text-gray-500 font-medium text-xs">Trajet</th>
                  <th className="text-left p-3 sm:p-4 text-gray-500 font-medium text-xs">Client</th>
                  <th className="text-right p-3 sm:p-4 text-gray-500 font-medium text-xs">Montant</th>
                  <th className="text-left p-3 sm:p-4 text-gray-500 font-medium text-xs">Épargne</th>
                  <th className="text-right p-3 sm:p-4 text-gray-500 font-medium text-xs">Prime</th>
                  <th className="text-left p-3 sm:p-4 text-gray-500 font-medium text-xs">Statut</th>
                  <th className="text-left p-3 sm:p-4 text-gray-500 font-medium text-xs">Expiration</th>
                  <th className="text-right p-3 sm:p-4 text-gray-500 font-medium text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(res => {
                  const vol = res.vol;
                  const lien = res.lien_paiement;
                  const trajet = vol
                    ? `${vol.ville_origine} → ${vol.ville_destination}`
                    : lien
                      ? `${lien.ville_origine} → ${lien.ville_destination}`
                      : '-';
                  const pct = progressionPaiement(res.total_paye || 0, res.prix_bloque);

                  return (
                    <tr key={res.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono text-gray-400 text-xs">{shortId(res.id)}</td>
                      <td className="p-4 font-medium">{trajet}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{res.consommateur_prenom}</p>
                          <p className="text-xs text-gray-400">{res.consommateur_email}</p>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">{formatCurrency(res.prix_bloque)}</td>
                      <td className="p-4">
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
                          <span className="text-xs text-gray-500 w-10">{Math.round(pct)}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium text-success">
                        {formatCurrency(res.part_marchand)}
                      </td>
                      <td className="p-4">
                        <Badge variant={statutToVariant(res.statut)}>{statutLabel(res.statut)}</Badge>
                      </td>
                      <td className="p-4 text-gray-500">
                        <div>
                          <p>{formatDateShort(res.date_expiration)}</p>
                          {res.statut === 'active' && (
                            <p className="text-xs text-blue-primary">{daysRemaining(res.date_expiration)}j restants</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {res.statut === 'active' && (
                          <button
                            onClick={() => handleMarkFinalized(res.id)}
                            className="text-xs bg-success/10 text-success px-3 py-1.5 rounded-lg hover:bg-success/20 transition-colors cursor-pointer"
                          >
                            Finaliser
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {page} sur {totalPages} ({total} résultats)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
