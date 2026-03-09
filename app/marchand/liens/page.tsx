'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LienPaiement, TemplateRoute, ParsedBooking, BulkCreateResult } from '@/types';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { SECTEURS, Secteur } from '@/lib/constants';
import { parseCSV, generateTemplateCSV } from '@/lib/csv-parser';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  Plus, Copy, Check, ExternalLink, Eye, CreditCard,
  ToggleLeft, ToggleRight, Send, MessageCircle,
  ClipboardPaste, FileUp, Bookmark, X, Sparkles,
  AlertCircle, Download, Trash2, Loader2,
  Plane, Music, Building, Package,
} from 'lucide-react';

// ============================================
// Types locaux
// ============================================

type ModalType = 'none' | 'paste' | 'csv';

const SECTEUR_ICONS = {
  transport: Plane,
  evenement: Music,
  hebergement: Building,
  autre: Package,
} as const;

// ============================================
// Composant principal
// ============================================

export default function LiensPage() {
  const [liens, setLiens] = useState<LienPaiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [marchandId, setMarchandId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Form state
  const [secteur, setSecteur] = useState<Secteur>('transport');
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

  // Templates state
  const [templates, setTemplates] = useState<TemplateRoute[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Paste & Extract state
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [pasteText, setPasteText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedBooking | null>(null);

  // CSV import state
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkCreateResult | null>(null);

  // ---- Data loading ----

  const fetchLiens = useCallback(async (mid: string) => {
    setLoading(true);
    const res = await fetch(`/api/liens?marchand_id=${mid}`);
    const data = await res.json();
    setLiens(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  const fetchTemplates = useCallback(async (mid: string) => {
    const res = await fetch(`/api/templates?marchand_id=${mid}`);
    const data = await res.json();
    setTemplates(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: marchand } = await supabase
        .from('marchands')
        .select('id')
        .eq('user_id', data.user.id)
        .single();
      if (marchand) {
        setMarchandId(marchand.id);
        fetchLiens(marchand.id);
        fetchTemplates(marchand.id);
      }
    });
  }, [fetchLiens, fetchTemplates]);

  // ---- Helpers ----

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

  const handleShareWhatsApp = (shortCode: string, villeOrig: string, villeDest: string, lienPrix: number, lienSecteur?: string) => {
    const url = getLienUrl(shortCode);
    const s = (lienSecteur || 'transport') as Secteur;
    const cfg = SECTEURS[s];
    const desc = cfg.display.showRoute
      ? `${villeOrig} → ${villeDest}`
      : (villeDest || villeOrig);
    const text = `Bonjour ! Voici le lien pour bloquer le prix (${formatCurrency(lienPrix)}) :\n${desc}\n\n${url}\n\nVersez une prime pour bloquer et épargnez à votre rythme. — Moetly Pay`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = (shortCode: string, villeOrig: string, villeDest: string, lienPrix: number, lienSecteur?: string) => {
    const url = getLienUrl(shortCode);
    const s = (lienSecteur || 'transport') as Secteur;
    const cfg = SECTEURS[s];
    const desc = cfg.display.showRoute
      ? `${villeOrig} → ${villeDest}`
      : (villeDest || villeOrig);
    const subject = `Bloquez le prix — ${desc}`;
    const body = `Bonjour,\n\nVoici le lien pour bloquer le prix de ${desc} à ${formatCurrency(lienPrix)} :\n\n${url}\n\nVersez une prime pour bloquer et épargnez le reste à votre rythme.\n\nCordialement`;
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
    setSecteur('transport');
    setVilleOrigine(''); setVilleDestination('');
    setOrigine(''); setDestination('');
    setPrix(''); setDateVol('');
    setCompagnie(''); setReferenceBillet('');
    setNoteMarchand(''); setUsageUnique(false);
    setShowSaveTemplate(false); setTemplateName('');
  };

  const prefillForm = (data: Partial<{
    ville_origine: string; ville_destination: string;
    origine: string; destination: string;
    prix: number | string; date_vol: string;
    compagnie: string; reference_billet: string;
  }>) => {
    if (data.ville_origine) setVilleOrigine(data.ville_origine);
    if (data.ville_destination) setVilleDestination(data.ville_destination);
    if (data.origine) setOrigine(data.origine);
    if (data.destination) setDestination(data.destination);
    if (data.prix) setPrix(String(data.prix));
    if (data.date_vol) setDateVol(data.date_vol);
    if (data.compagnie) setCompagnie(data.compagnie);
    if (data.reference_billet) setReferenceBillet(data.reference_billet);
    setShowForm(true);
    setNewLinkUrl('');
  };

  // ---- Create link ----

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
          secteur,
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
        // Sauvegarder comme template si demandé
        if (showSaveTemplate && templateName.trim()) {
          await handleSaveTemplate();
        }
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

  // ---- Paste & Extract ----

  const handleParse = async () => {
    if (!pasteText.trim()) return;
    setParsing(true);
    setParseResult(null);

    try {
      const res = await fetch('/api/liens/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      });
      const data: ParsedBooking = await res.json();
      setParseResult(data);
    } catch {
      console.error('Parse error');
    } finally {
      setParsing(false);
    }
  };

  const handleApplyParsed = () => {
    if (!parseResult) return;
    prefillForm({
      ville_origine: parseResult.ville_origine,
      ville_destination: parseResult.ville_destination,
      origine: parseResult.origine,
      destination: parseResult.destination,
      prix: parseResult.prix,
      date_vol: parseResult.date_vol,
      compagnie: parseResult.compagnie,
      reference_billet: parseResult.reference_billet,
    });
    setActiveModal('none');
    setPasteText('');
    setParseResult(null);
  };

  // ---- Templates ----

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !villeOrigine || !villeDestination) return;
    setSavingTemplate(true);
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marchand_id: marchandId,
          nom: templateName.trim(),
          ville_origine: villeOrigine,
          ville_destination: villeDestination,
          origine: origine || undefined,
          destination: destination || undefined,
          compagnie: compagnie || undefined,
          prix_defaut: prix ? parseFloat(prix) : undefined,
        }),
      });
      fetchTemplates(marchandId);
    } catch {
      console.error('Error saving template');
    } finally {
      setSavingTemplate(false);
      setShowSaveTemplate(false);
      setTemplateName('');
    }
  };

  const handleApplyTemplate = (t: TemplateRoute) => {
    resetForm();
    prefillForm({
      ville_origine: t.ville_origine,
      ville_destination: t.ville_destination,
      origine: t.origine,
      destination: t.destination,
      prix: t.prix_defaut,
      compagnie: t.compagnie,
    });
  };

  const handleDeleteTemplate = async (id: string) => {
    await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
    fetchTemplates(marchandId);
  };

  // ---- CSV Import ----

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { rows, errors } = parseCSV(text);
      setCsvRows(rows);
      setCsvErrors(errors);
      setImportResult(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleCSVImport = async () => {
    if (csvRows.length === 0) return;
    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/liens/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marchand_id: marchandId, liens: csvRows }),
      });
      const data: BulkCreateResult = await res.json();
      setImportResult(data);
      if (data.success > 0) {
        fetchLiens(marchandId);
      }
    } catch {
      console.error('Import error');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = generateTemplateCSV();
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'moetly-template-liens.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // ---- Confidence helper ----
  const confColor = (field: string, result: ParsedBooking) => {
    const conf = result.confidence[field] || 0;
    if (conf >= 0.8) return 'border-success/50 bg-success/5';
    if (conf >= 0.5) return 'border-yellow-accent/50 bg-yellow-light';
    return '';
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* ===== PAGE HEADER ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
            Liens de paiement
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Créez des liens à envoyer à vos clients par WhatsApp, email ou SMS.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => { setShowForm(!showForm); setNewLinkUrl(''); }}>
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Nouveau lien</span>
          </Button>
          <button
            onClick={() => { setActiveModal('paste'); setPasteText(''); setParseResult(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-primary text-blue-primary text-sm font-semibold hover:bg-blue-light transition-all cursor-pointer"
          >
            <ClipboardPaste className="w-4 h-4" />
            Coller & Extraire
          </button>
          <button
            onClick={() => { setActiveModal('csv'); setCsvRows([]); setCsvErrors([]); setImportResult(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition-all cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            Import CSV
          </button>
        </div>
      </div>

      {/* ===== TEMPLATES STRIP ===== */}
      {templates.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="w-4 h-4 text-blue-primary" />
            <span className="text-sm font-medium text-gray-600">Mes templates</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {templates.map(t => (
              <div
                key={t.id}
                className="shrink-0 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:border-blue-primary hover:shadow-sm transition-all group"
              >
                <button
                  onClick={() => handleApplyTemplate(t)}
                  className="text-sm font-medium text-gray-700 group-hover:text-blue-primary cursor-pointer"
                >
                  <span className="font-semibold">{t.nom}</span>
                  <span className="text-gray-400 ml-1.5">
                    {t.ville_origine} → {t.ville_destination}
                    {t.prix_defaut ? ` · ${formatCurrency(t.prix_defaut)}` : ''}
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteTemplate(t.id)}
                  className="p-1 rounded-lg hover:bg-error/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  title="Supprimer"
                >
                  <X className="w-3 h-3 text-error" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== NEW LINK RESULT ===== */}
      {newLinkUrl && (
        <div className="mb-6 bg-success/10 border border-success/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-5 h-5 text-success" />
            <p className="font-semibold text-gray-900">Lien créé avec succès !</p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-200">
            <input type="text" value={newLinkUrl} readOnly className="flex-1 text-sm text-gray-700 bg-transparent outline-none" />
            <button
              onClick={() => { navigator.clipboard.writeText(newLinkUrl); setCopiedId('new'); setTimeout(() => setCopiedId(null), 2000); }}
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
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
            <button
              onClick={() => {
                const code = newLinkUrl.split('/r/')[1];
                const lien = liens.find(l => l.short_code === code);
                if (lien) handleShareEmail(lien.short_code, lien.ville_origine, lien.ville_destination, lien.prix);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" /> Email
            </button>
          </div>
        </div>
      )}

      {/* ===== CREATE FORM ===== */}
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate}>
            <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-4">
              Nouveau lien de paiement
            </h2>

            {/* Sélecteur de secteur */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.entries(SECTEURS) as [Secteur, typeof SECTEURS[Secteur]][]).map(([key, cfg]) => {
                  const Icon = SECTEUR_ICONS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSecteur(key)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                        secteur === key
                          ? 'border-blue-primary bg-blue-light text-blue-primary'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{cfg.emoji} {cfg.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-1">{SECTEURS[secteur].description}</p>
            </div>

            {/* Champs dynamiques selon le secteur */}
            {(() => {
              const fields = SECTEURS[secteur].fields;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields.ville_origine.visible && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{fields.ville_origine.label} {fields.ville_origine.required && <span className="text-error">*</span>}</label>
                      <input type="text" value={villeOrigine} onChange={e => setVilleOrigine(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none text-sm" placeholder={fields.ville_origine.placeholder} required={fields.ville_origine.required} />
                    </div>
                  )}
                  {fields.ville_destination.visible && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{fields.ville_destination.label} {fields.ville_destination.required && <span className="text-error">*</span>}</label>
                      <input type="text" value={villeDestination} onChange={e => setVilleDestination(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none text-sm" placeholder={fields.ville_destination.placeholder} required={fields.ville_destination.required} />
                    </div>
                  )}
                  {fields.origine.visible && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{fields.origine.label}</label>
                      <input type="text" value={origine} onChange={e => setOrigine(e.target.value.toUpperCase().slice(0, 3))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none text-sm uppercase" placeholder={fields.origine.placeholder} maxLength={3} />
                    </div>
                  )}
                  {fields.destination.visible && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{fields.destination.label}</label>
                      <input type="text" value={destination} onChange={e => setDestination(e.target.value.toUpperCase().slice(0, 3))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none text-sm uppercase" placeholder={fields.destination.placeholder} maxLength={3} />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{SECTEURS[secteur].display.priceLabel} (€) <span className="text-error">*</span></label>
                    <input type="number" value={prix} onChange={e => setPrix(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none text-sm" placeholder="ex: 680" min="1" step="0.01" required />
                  </div>
                  {fields.date_vol.visible && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{fields.date_vol.label}</label>
                      <input type="date" value={dateVol} onChange={e => setDateVol(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none text-sm" />
                    </div>
                  )}
                  {fields.compagnie.visible && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{fields.compagnie.label}</label>
                      <input type="text" value={compagnie} onChange={e => setCompagnie(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none text-sm" placeholder={fields.compagnie.placeholder} />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Référence interne</label>
                    <input type="text" value={referenceBillet} onChange={e => setReferenceBillet(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none text-sm" placeholder="Votre référence interne" />
                  </div>
                </div>
              );
            })()}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note pour le client</label>
              <textarea value={noteMarchand} onChange={e => setNoteMarchand(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none text-sm" placeholder="Message visible par le client sur la page de paiement" rows={2} />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={() => setUsageUnique(!usageUnique)} className="cursor-pointer">
                {usageUnique ? <ToggleRight className="w-8 h-8 text-blue-primary" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
              </button>
              <span className="text-sm text-gray-700">Lien à usage unique (1 seul paiement)</span>
            </div>

            {/* Sauvegarder comme template */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              {!showSaveTemplate ? (
                <button
                  type="button"
                  onClick={() => setShowSaveTemplate(true)}
                  className="flex items-center gap-2 text-sm text-blue-primary hover:text-blue-dark transition-colors cursor-pointer"
                >
                  <Bookmark className="w-4 h-4" />
                  Sauvegarder comme template
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-blue-primary shrink-0" />
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-blue-primary/30 text-sm outline-none focus:ring-2 focus:ring-blue-primary/20"
                    placeholder="Nom du template (ex: Paris-Dakar été)"
                  />
                  <button type="button" onClick={() => setShowSaveTemplate(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="submit" variant="accent" loading={creating} disabled={!villeOrigine || !villeDestination || !prix}>
                Créer le lien
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ===== PASTE & EXTRACT MODAL ===== */}
      {activeModal === 'paste' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setActiveModal('none')}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-light rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">Coller & Extraire</h2>
                  <p className="text-xs text-gray-500">Collez une confirmation de réservation</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('none')} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full h-40 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none text-sm resize-none font-mono"
              placeholder={"Collez ici le texte de confirmation...\n\nExemple :\nConfirmation AF 680\nParis CDG → Dakar DSS\n15 mars 2025\n680,00 EUR\nRef: AB1C2D"}
            />

            <Button
              variant="accent"
              className="w-full mt-3"
              onClick={handleParse}
              loading={parsing}
              disabled={!pasteText.trim()}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Analyser le texte
              </span>
            </Button>

            {/* Résultat du parsing */}
            {parseResult && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Champs extraits</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'ville_origine', label: 'Ville origine', value: parseResult.ville_origine },
                    { key: 'ville_destination', label: 'Ville destination', value: parseResult.ville_destination },
                    { key: 'origine', label: 'Code IATA origine', value: parseResult.origine },
                    { key: 'destination', label: 'Code IATA destination', value: parseResult.destination },
                    { key: 'prix', label: 'Prix', value: parseResult.prix ? `${parseResult.prix} €` : undefined },
                    { key: 'date_vol', label: 'Date de vol', value: parseResult.date_vol },
                    { key: 'compagnie', label: 'Compagnie', value: parseResult.compagnie },
                    { key: 'reference_billet', label: 'Référence', value: parseResult.reference_billet },
                  ].map(({ key, label, value }) => (
                    <div key={key} className={`p-3 rounded-xl border ${value ? confColor(key, parseResult) : 'border-gray-100 bg-gray-50'}`}>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                      <p className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-300'}`}>
                        {value || '—'}
                      </p>
                      {value && (parseResult.confidence[key] || 0) < 0.7 && (
                        <p className="text-[10px] text-yellow-dark mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> À vérifier
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={handleApplyParsed}
                  disabled={!parseResult.ville_origine && !parseResult.prix}
                >
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Utiliser ces données
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CSV IMPORT MODAL ===== */}
      {activeModal === 'csv' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setActiveModal('none')}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-light rounded-xl flex items-center justify-center">
                  <FileUp className="w-5 h-5 text-blue-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">Import CSV</h2>
                  <p className="text-xs text-gray-500">Créez plusieurs liens en une fois</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('none')} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Template download + Upload */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Télécharger le modèle CSV
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-blue-primary/30 text-sm text-blue-primary font-medium hover:bg-blue-light transition-colors cursor-pointer">
                <FileUp className="w-4 h-4" />
                Choisir un fichier CSV
                <input type="file" accept=".csv,.txt" onChange={handleCSVFile} className="hidden" />
              </label>
            </div>

            {/* Erreurs CSV */}
            {csvErrors.length > 0 && (
              <div className="mb-4 bg-error/5 border border-error/20 rounded-xl p-3">
                <p className="text-sm font-semibold text-error mb-1">Erreurs détectées :</p>
                {csvErrors.map((err, i) => (
                  <p key={i} className="text-xs text-error/80">{err}</p>
                ))}
              </div>
            )}

            {/* Prévisualisation */}
            {csvRows.length > 0 && (
              <>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500 uppercase tracking-wider">
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Origine</th>
                        <th className="px-3 py-2">Destination</th>
                        <th className="px-3 py-2">Prix</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Compagnie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {csvRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 font-medium">{row.ville_origine}</td>
                          <td className="px-3 py-2 font-medium">{row.ville_destination}</td>
                          <td className="px-3 py-2">{row.prix} €</td>
                          <td className="px-3 py-2 text-gray-500">{row.date_vol || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">{row.compagnie || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvRows.length > 10 && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      ... et {csvRows.length - 10} autres lignes
                    </p>
                  )}
                </div>

                <Button
                  variant="accent"
                  className="w-full"
                  onClick={handleCSVImport}
                  loading={importing}
                >
                  <span className="flex items-center gap-2">
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                    Créer {csvRows.length} lien{csvRows.length > 1 ? 's' : ''}
                  </span>
                </Button>
              </>
            )}

            {/* Résultat import */}
            {importResult && (
              <div className="mt-4 bg-success/5 border border-success/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-900">
                  Import terminé : {importResult.success} créé{importResult.success > 1 ? 's' : ''}
                  {importResult.failed > 0 && <span className="text-error"> · {importResult.failed} échoué{importResult.failed > 1 ? 's' : ''}</span>}
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-error">Ligne {err.row} : {err.message}</p>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { setActiveModal('none'); setCsvRows([]); setImportResult(null); }}
                  className="mt-3 text-sm text-blue-primary font-medium hover:underline cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== LINKS TABLE ===== */}
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden -mx-4 sm:mx-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-3 sm:px-5 py-3">Description</th>
                  <th className="px-3 sm:px-5 py-3">Prix</th>
                  <th className="px-3 sm:px-5 py-3">Vues</th>
                  <th className="px-3 sm:px-5 py-3">Paiements</th>
                  <th className="px-3 sm:px-5 py-3">Statut</th>
                  <th className="px-3 sm:px-5 py-3">Date</th>
                  <th className="px-3 sm:px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liens.map(lien => (
                  <tr key={lien.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      {(() => {
                        const s = lien.secteur || 'transport';
                        const SIcon = SECTEUR_ICONS[s];
                        const cfg = SECTEURS[s];
                        return (
                          <div>
                            <div className="flex items-center gap-2">
                              <SIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {cfg.display.showRoute ? (
                                <>
                                  <span className="font-semibold text-gray-900">{lien.ville_origine}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="font-semibold text-gray-900">{lien.ville_destination}</span>
                                </>
                              ) : (
                                <span className="font-semibold text-gray-900">
                                  {lien.ville_destination || lien.ville_origine}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {!cfg.display.showRoute && lien.ville_origine && lien.ville_destination && (
                                <span>{lien.ville_origine} · </span>
                              )}
                              {lien.compagnie && <span>{lien.compagnie}</span>}
                              {!lien.compagnie && <span className="text-gray-400">{cfg.label}</span>}
                            </p>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{formatCurrency(lien.prix)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-gray-600"><Eye className="w-4 h-4" />{lien.nb_vues}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-gray-600"><CreditCard className="w-4 h-4" />{lien.nb_paiements}</div>
                    </td>
                    <td className="px-5 py-4">
                      {lien.actif ? <Badge variant="active">Actif</Badge> : <Badge variant="info">Inactif</Badge>}
                      {lien.usage_unique && <span className="block text-[10px] text-gray-400 mt-0.5">Usage unique</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{formatDateShort(lien.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleCopy(lien.short_code)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" title="Copier le lien">
                          {copiedId === lien.short_code ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-gray-500" />}
                        </button>
                        <button onClick={() => handleShareWhatsApp(lien.short_code, lien.ville_origine, lien.ville_destination, lien.prix, lien.secteur)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" title="WhatsApp">
                          <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        </button>
                        <button onClick={() => handleShareEmail(lien.short_code, lien.ville_origine, lien.ville_destination, lien.prix, lien.secteur)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" title="Email">
                          <Send className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => window.open(getLienUrl(lien.short_code), '_blank')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" title="Ouvrir">
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => handleToggle(lien.short_code, lien.actif)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" title={lien.actif ? 'Désactiver' : 'Activer'}>
                          {lien.actif ? <ToggleRight className="w-5 h-5 text-blue-primary" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
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
