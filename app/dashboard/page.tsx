'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Reservation, Paiement } from '@/types';
import { formatCurrency, formatDate, formatDateShort, shortId, resteAPayer } from '@/lib/utils';
import Badge, { statutToVariant, statutLabel } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Button from '@/components/ui/Button';
import PaymentModal from '@/components/consumer/PaymentModal';
import { Plane, ArrowLeft, CreditCard, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import Link from 'next/link';

function PaiementHistoryItem({ paiement }: { paiement: Paiement }) {
  const typeLabels: Record<string, string> = {
    prime: 'Prime initiale',
    partiel: 'Versement partiel',
    solde: 'Solde final',
  };
  const statutIcons: Record<string, React.ReactNode> = {
    confirme: <CheckCircle className="w-4 h-4 text-success" />,
    en_attente: <Clock className="w-4 h-4 text-yellow-accent" />,
    echoue: <XCircle className="w-4 h-4 text-error" />,
  };

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        {statutIcons[paiement.statut] || <Clock className="w-4 h-4 text-gray-400" />}
        <div>
          <p className="text-sm font-medium text-gray-800">
            {typeLabels[paiement.type] || paiement.type}
          </p>
          <p className="text-xs text-gray-400">
            {formatDateShort(paiement.created_at)}
          </p>
        </div>
      </div>
      <span className={`text-sm font-semibold ${
        paiement.statut === 'confirme' ? 'text-success' :
        paiement.statut === 'echoue' ? 'text-error' :
        'text-gray-600'
      }`}>
        {paiement.statut === 'confirme' ? '+' : ''}{formatCurrency(paiement.montant)}
      </span>
    </div>
  );
}

function ReservationCard({
  res,
  onPay,
}: {
  res: Reservation;
  onPay: (reservation: Reservation) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);

  const vol = res.vol;
  const lien = res.lien_paiement;
  const trajetLabel = vol
    ? `${vol.ville_origine} → ${vol.ville_destination}`
    : lien
      ? `${lien.ville_origine} → ${lien.ville_destination}`
      : 'Réservation';
  const volDate = vol?.date_vol || lien?.date_vol;
  const compagnie = vol?.compagnie || lien?.compagnie;

  const totalPaye = res.total_paye || 0;
  const reste = resteAPayer(res.prix_bloque, totalPaye);
  const estFinalisee = res.statut === 'finalisee' || reste <= 0;
  const paiementsConfirmes = (res.paiements || []).filter(p => p.statut === 'confirme');
  const allPaiements = res.paiements || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <span className="text-xs sm:text-sm text-gray-400 font-mono">{shortId(res.id)}</span>
            <Badge variant={statutToVariant(res.statut)}>
              {statutLabel(res.statut)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
              {trajetLabel}
            </span>
          </div>
          {(volDate || compagnie) && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {volDate && <>Vol le {formatDate(volDate)}</>}
              {volDate && compagnie && <> &middot; </>}
              {compagnie}
            </p>
          )}
        </div>
        <div className="sm:text-right flex items-center sm:block gap-2">
          <p className="text-xl sm:text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
            {formatCurrency(res.prix_bloque)}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">Prix bloqué</p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mt-4">
        <ProgressBar current={totalPaye} total={res.prix_bloque} />
      </div>

      {/* Réservation active — Actions de paiement */}
      {res.statut === 'active' && !estFinalisee && (
        <div className="mt-4 bg-blue-light/50 border border-blue-primary/15 rounded-xl p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <CountdownTimer targetDate={res.date_expiration} compact />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              Reste à verser : {formatCurrency(reste)}
            </span>
          </div>
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={() => onPay(res)}
          >
            <span className="flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5" />
              Verser maintenant
            </span>
          </Button>
          <div className="flex gap-2 mt-3">
            <a
              href={`mailto:?subject=${encodeURIComponent(`Finalisation réservation ${shortId(res.id)}`)}&body=${encodeURIComponent(`Bonjour,\n\nJe souhaite finaliser ma réservation ${shortId(res.id)} pour le trajet ${trajetLabel}.\n\nPrix bloqué : ${formatCurrency(res.prix_bloque)}\nDéjà payé : ${formatCurrency(totalPaye)}\nReste à verser : ${formatCurrency(reste)}\n\nMerci.`)}`}
              className="flex-1 text-center text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Contacter par email
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, je souhaite finaliser ma réservation ${shortId(res.id)} pour ${trajetLabel}.\nPrix bloqué : ${formatCurrency(res.prix_bloque)}\nReste à verser : ${formatCurrency(reste)}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-xs bg-[#25D366]/10 text-[#25D366] px-3 py-2 rounded-lg hover:bg-[#25D366]/20 transition-colors font-medium"
            >
              Contacter par WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Réservation finalisée */}
      {estFinalisee && res.statut === 'finalisee' && (
        <div className="mt-4 bg-success/5 border border-success/20 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-success font-[family-name:var(--font-sora)] font-bold">
              Billet finalisé
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Votre épargne est complète. Le marchand procède à l&apos;émission de votre billet.
          </p>
        </div>
      )}

      {/* Historique des paiements */}
      {allPaiements.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-blue-primary font-medium hover:text-blue-dark transition-colors cursor-pointer"
          >
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {paiementsConfirmes.length} versement{paiementsConfirmes.length > 1 ? 's' : ''} effectué{paiementsConfirmes.length > 1 ? 's' : ''}
          </button>

          {showHistory && (
            <div className="mt-2 bg-gray-50 rounded-xl p-3">
              {allPaiements
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(p => (
                  <PaiementHistoryItem key={p.id} paiement={p} />
                ))
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingReservation, setPayingReservation] = useState<Reservation | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const validateToken = useCallback(async (emailAddr: string, tkn: string) => {
    try {
      const res = await fetch('/api/auth/consumer-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddr }),
      });
      const data = await res.json();
      return data.token === tkn;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (email && token) {
      validateToken(email, token).then(valid => {
        setAuthenticated(valid);
        if (!valid) setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [email, token, validateToken]);

  const fetchReservations = useCallback(() => {
    if (!email || !authenticated) {
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
  }, [email, authenticated]);

  useEffect(() => {
    if (authenticated) {
      fetchReservations();
    }
  }, [authenticated, fetchReservations]);

  const handlePaymentComplete = () => {
    setPayingReservation(null);
    setLoading(true);
    fetchReservations();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/consumer-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      if (data.token) {
        window.location.href = `/dashboard?email=${encodeURIComponent(emailInput)}&token=${data.token}`;
      }
    } catch {
      setAuthLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
          <h2 className="text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-2 text-center">
            Acceder a mes reservations
          </h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Entrez votre email pour consulter vos reservations.
          </p>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all"
              placeholder="votre@email.com"
              required
            />
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-dark transition-colors disabled:opacity-50"
            >
              {authLoading ? 'Chargement...' : 'Voir mes reservations'}
            </button>
          </form>
        </div>
        <Link href="/" className="text-blue-primary hover:underline text-sm">
          Retour a l&apos;accueil
        </Link>
      </div>
    );
  }

  if (!authenticated && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Token invalide ou expire</p>
        <Link href="/dashboard" className="text-blue-primary hover:underline">Reessayer</Link>
      </div>
    );
  }

  // KPIs rapides
  const actives = reservations.filter(r => r.statut === 'active');
  const finalisees = reservations.filter(r => r.statut === 'finalisee');
  const totalPaye = reservations.reduce((sum, r) => sum + (r.total_paye || 0), 0);
  const totalBloque = reservations.reduce((sum, r) => sum + r.prix_bloque, 0);

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
        {/* Account creation banner */}
        <div className="bg-blue-light border border-blue-primary/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-dark">
            <strong>Nouveau !</strong> Creez votre compte Moetly Pay pour retrouver
            toutes vos reservations en un seul endroit, quel que soit le marchand.{' '}
            <a href="/compte" className="font-semibold text-blue-primary hover:underline">
              Creer mon compte &rarr;
            </a>
          </p>
        </div>

        <h1 className="text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-2">
          Mes réservations
        </h1>
        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-blue-primary" />
          Vos fonds sont sécurisés chez Moetly Pay. Vous pouvez retirer vos versements à tout moment (hors prime).
        </p>

        {/* Mini KPIs */}
        {!loading && reservations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-2xl font-bold text-blue-primary">{reservations.length}</p>
              <p className="text-xs text-gray-500">Réservation{reservations.length > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-accent">{actives.length}</p>
              <p className="text-xs text-gray-500">Active{actives.length > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-2xl font-bold text-success">{finalisees.length}</p>
              <p className="text-xs text-gray-500">Finalisée{finalisees.length > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPaye)}</p>
              <p className="text-xs text-gray-500">épargné sur {formatCurrency(totalBloque)}</p>
            </div>
          </div>
        )}

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
              <ReservationCard
                key={res.id}
                res={res}
                onPay={setPayingReservation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de paiement */}
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
