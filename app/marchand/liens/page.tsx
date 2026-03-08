'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LienPaiement } from '@/types';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Plus, Copy, Check, ExternalLink, Eye, CreditCard, ToggleLeft, ToggleRight, Send, MessageCircle } from 'lucide-react';

export default function LiensPage() {
  const [liens, setLiens] = useState<LienPaiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [marchandId, setMarchandId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Form state
  const [villeOrigine, setVilleOrigine] = useState('');
  const [villeDestination, setVilleDestination] = useState('');
  const [origine, setOrigine] = useState('');
  const [destination, setDestination] = useState('');
  const [prix, setPrix] = useState('');
  const [dateVol, setDateVol] = useState('');
  const [compagnie, setCompagnie] = useState('');
  const [referenceBillet, setReferenceBillet] = useState('');
  const [noteMarchand, setNoteMarchand] = useState('');
  const [usageUnique, setUsageUnique] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;

      // Get marchand_id
      const { data: marchand } = await supabase
        .from('marchands')
        .select('id')
        .eq('user_id', data.user.id)
        .single();

      if (marchand) {
        setMarchandId(marchand.id);
        fetchLiens(marchand.id);
      }
    });
  }, []);

  const fetchLiens = async (mid: string) => {
    setLoading(true);
    const res = await fetch(`/api/liens?marchand_id=${mid}`);
    const data = await res.json();
    setLiens(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const getLienUrl = (shortCode: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/r/${shortCode}`;
  };

  const handleCopy = async (shortCode: string) => {
    const url = getLienUrl(shortCode);
    await navigator.clipboard.writeText(url);
    setCopiedId(shortCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWhatsApp = (shortCode: string, villeOrig: string, villeDest: string, lienPrix: number) => {
    const url = getLienUrl(shortCode);
    const text = `Bonjour ! Voici le lien pour bloquer le prix de votre billet ${villeOrig} → ${villeDest} (${formatCurrency(lienPrix)}) :\n\n${url}\n\nVous payez une petite prime maintenant et le reste plus tard. — Moetly Pay`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = (shortCode: string, villeOrig: string, villeDest: string, lienPrix: number) => {
    const url = getLienUrl(shortCode);
    const subject = `Bloquez le prix de votre billet ${villeOrig} → ${villeDest}`;
    const body = `Bonjour,\n\nVoici le lien pour bloquer le prix de votre billet ${villeOrig} → ${villeDest} à ${formatCurrency(lienPrix)} :\n\n${url}\n\nPayez une petite prime maintenant et le reste plus tard.\n\nCordialement`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handleToggle = async (shortCode: string, currentActif: boolean) => {
    await fetch(`/api/liens/${shortCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif: !currentActif }),
    });
    fetchLiens(marchandId);
  };

  const resetForm = () => {
    setVilleOrigine('');
    setVilleDestination('');
    setOrigine('');
    setDestination('');
    setPrix('');
    setDateVol('');
    setCompagnie('');
    setReferenceBillet('');
    setNoteMarchand('');
    setUsageUnique(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!villeOrigine || !villeDestination || !prix) return;
    setCreating(true);

    try {
      const res = await fetch('/api/liens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marchand_id: marchandId,
          ville_origine: villeOrigine,
          ville_destination: villeDestination,
          origine: origine || undefined,
          destination: destination || undefined,
          prix: parseFloat(prix),
          date_vol: dateVol || undefined,
          compagnie: compagnie || undefined,
          reference_billet: referenceBillet || undefined,
          note_marchand: noteMarchand || undefined,
          usage_unique: usageUnique,
        }),
      });

      const data = await res.json();

      if (data.short_code) {
        setNewLinkUrl(getLienUrl(data.short_code));
        resetForm();
        setShowForm(false);
        fetchLiens(marchandId);
      }
    } catch {
      console.error('Error creating link');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
            Liens de paiement
          </h1>
          <p className="text-gray-500 mt-1">
            Créez des liens à envoyer à vos clients par WhatsApp, email ou SMS.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => { setShowForm(!showForm); setNewLinkUrl(''); }}
        >
          <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Nouveau lien</span>
        </Button>
      </div>

      {/* New link result */}
      {newLinkUrl && (
        <div className="mb-6 bg-success/10 border border-success/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-5 h-5 text-success" />
            <p className="font-semibold text-gray-900">Lien créé avec succès !</p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-200">
            <input
              type="text"
              value={newLinkUrl}
              readOnly
              className="flex-1 text-sm text-gray-700 bg-transparent outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(newLinkUrl);
                setCopiedId('new');
                setTimeout(() => setCopiedId(null), 2000);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-primary text-white text-sm font-medium hover:bg-blue-dark transition-colors cursor-pointer"
            >
              {copiedId === 'new' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedId === 'new' ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                const code = newLinkUrl.split('/r/')[1];
                const lien = liens.find(l => l.short_code === code);
                if (lien) handleShareWhatsApp(lien.short_code, lien.ville_origine, lien.ville_destination, lien.prix);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] text-white text-sm font-medium hover:bg-[#20bd5a] transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={() => {
                const code = newLinkUrl.split('/r/')[1];
                const lien = liens.find(l => l.short_code === code);
                if (lien) handleShareEmail(lien.short_code, lien.ville_origine, lien.ville_destination, lien.prix);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Email
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate}>
            <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-4">
              Nouveau lien de paiement
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Required fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville d&apos;origine <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={villeOrigine}
                  onChange={e => setVilleOrigine(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all text-sm"
                  placeholder="ex: Paris"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville de destination <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={villeDestination}
                  onChange={e => setVilleDestination(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all text-sm"
                  placeholder="ex: Dakar"
                  required
                />
              </div>

              {/* IATA codes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code IATA origine
                </label>
                <input
                  type="text"
                  value={origine}
                  onChange={e => setOrigine(e.target.value.toUpperCase().slice(0, 3))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all text-sm uppercase"
                  placeholder="ex: CDG"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code IATA destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value.toUpperCase().slice(0, 3))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all text-sm uppercase"
                  placeholder="ex: DSS"
                  maxLength={3}
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix du billet (€) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  value={prix}
                  onChange={e => setPrix(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all text-sm"
                  placeholder="ex: 680"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de vol
                </label>
                <input
                  type="date"
                  value={dateVol}
                  onChange={e => setDateVol(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all text-sm"
                />
              </div>

              {/* Compagnie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compagnie aérienne
                </label>
                <input
                  type="text"
                  value={compagnie}
                  onChange={e => setCompagnie(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all text-sm"
                  placeholder="ex: Air Sénégal"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Référence billet
                </label>
                <input
                  type="text"
                  value={referenceBillet}
                  onChange={e => setReferenceBillet(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all text-sm"
                  placeholder="Votre référence interne"
                />
              </div>
            </div>

            {/* Note */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note pour le client
              </label>
              <textarea
                value={noteMarchand}
                onChange={e => setNoteMarchand(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all text-sm"
                placeholder="Message visible par le client sur la page de paiement"
                rows={2}
              />
            </div>

            {/* Usage unique */}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUsageUnique(!usageUnique)}
                className="cursor-pointer"
              >
                {usageUnique ? (
                  <ToggleRight className="w-8 h-8 text-blue-primary" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>
              <span className="text-sm text-gray-700">Lien à usage unique (1 seul paiement)</span>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button
                type="submit"
                variant="accent"
                loading={creating}
                disabled={!villeOrigine || !villeDestination || !prix}
              >
                Créer le lien
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowForm(false); resetForm(); }}
              >
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Links list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : liens.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-blue-light rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-blue-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun lien créé</h3>
          <p className="text-gray-500 text-sm mb-6">
            Créez votre premier lien de paiement et envoyez-le à votre client.
          </p>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Créer un lien</span>
          </Button>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Trajet</th>
                  <th className="px-5 py-3">Prix</th>
                  <th className="px-5 py-3">Vues</th>
                  <th className="px-5 py-3">Paiements</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liens.map(lien => (
                  <tr key={lien.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {lien.ville_origine}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="font-semibold text-gray-900">
                          {lien.ville_destination}
                        </span>
                      </div>
                      {lien.compagnie && (
                        <p className="text-xs text-gray-500 mt-0.5">{lien.compagnie}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {formatCurrency(lien.prix)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Eye className="w-4 h-4" />
                        {lien.nb_vues}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <CreditCard className="w-4 h-4" />
                        {lien.nb_paiements}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {lien.actif ? (
                        <Badge variant="active">Actif</Badge>
                      ) : (
                        <Badge variant="info">Inactif</Badge>
                      )}
                      {lien.usage_unique && (
                        <span className="block text-[10px] text-gray-400 mt-0.5">Usage unique</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {formatDateShort(lien.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCopy(lien.short_code)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Copier le lien"
                        >
                          {copiedId === lien.short_code ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(lien.short_code, lien.ville_origine, lien.ville_destination, lien.prix)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Partager sur WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        </button>
                        <button
                          onClick={() => handleShareEmail(lien.short_code, lien.ville_origine, lien.ville_destination, lien.prix)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Partager par email"
                        >
                          <Send className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => window.open(getLienUrl(lien.short_code), '_blank')}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Ouvrir le lien"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleToggle(lien.short_code, lien.actif)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          title={lien.actif ? 'Désactiver' : 'Activer'}
                        >
                          {lien.actif ? (
                            <ToggleRight className="w-5 h-5 text-blue-primary" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
