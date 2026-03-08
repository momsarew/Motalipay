import Link from 'next/link';
import {
  Plane, Shield, Clock, CreditCard, Link2, BarChart3,
  Zap, Send, Code, ArrowRight, CheckCircle,
  Lock, TrendingUp,
} from 'lucide-react';
import { MOETLY_CONFIG } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

// Calcul de l'exemple de tarification
const EXEMPLE_PRIX = 680;
const prime = Math.round(EXEMPLE_PRIX * MOETLY_CONFIG.PRIME_RATE * 100) / 100;
const partMarchand = Math.round(prime * MOETLY_CONFIG.MARCHAND_SHARE * 100) / 100;
const partMoetly = Math.round(prime * MOETLY_CONFIG.MOETLY_SHARE * 100) / 100;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-primary rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
              Moetly<span className="text-yellow-accent">Pay</span>
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-8">
            <a href="#comment-ca-marche" className="text-sm text-gray-500 hover:text-blue-primary transition-colors">
              Comment ça marche
            </a>
            <a href="#avantages" className="text-sm text-gray-500 hover:text-blue-primary transition-colors">
              Avantages
            </a>
            <a href="#tarifs" className="text-sm text-gray-500 hover:text-blue-primary transition-colors">
              Tarifs
            </a>
            <Link
              href="/marchand/login"
              className="text-sm font-semibold text-blue-primary border border-blue-primary px-4 py-2 rounded-xl hover:bg-blue-light transition-all"
            >
              Espace Marchand
            </Link>
          </nav>
          {/* Mobile: lien simplifié */}
          <Link
            href="/marchand/login"
            className="sm:hidden text-sm text-blue-primary font-semibold"
          >
            Connexion
          </Link>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-dark via-blue-primary to-blue-dark" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-[family-name:var(--font-sora)] font-extrabold text-white leading-tight">
            Augmentez vos ventes avec
            <br />
            <span className="text-yellow-accent">le paiement différé.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
            Vos clients hésitent à cause du prix ? Proposez-leur de bloquer le tarif
            et de payer à leur rythme. Vous, vous êtes payé immédiatement.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marchand/login"
              className="bg-yellow-accent text-gray-900 px-8 py-4 rounded-xl text-lg font-[family-name:var(--font-sora)] font-semibold hover:bg-yellow-dark transition-all shadow-lg flex items-center gap-2"
            >
              Créer mon compte marchand
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/marchand/login"
              className="text-white border border-white/30 px-8 py-4 rounded-xl text-lg font-[family-name:var(--font-sora)] font-semibold hover:bg-white/10 transition-all"
            >
              Voir la démo
            </Link>
          </div>

          {/* Value props */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            {[
              { icon: Zap, text: 'Prêt en 30 secondes' },
              { icon: CreditCard, text: 'Commission simple 5%' },
              { icon: Shield, text: 'Paiements via Stripe' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-white/90">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-yellow-accent" />
                </div>
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BANDEAU CONFIANCE ===== */}
      <section className="bg-white border-b border-gray-200 py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-primary" />
            <span>Paiements sécurisés par <strong className="text-gray-700">Stripe</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-primary" />
            <span>Données chiffrées SSL/TLS</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Mode test disponible</span>
          </div>
        </div>
      </section>

      {/* ===== COMMENT ÇA MARCHE ===== */}
      <section id="comment-ca-marche" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-sora)] font-bold text-center text-gray-900 mb-4">
          Comment ça marche ?
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
          En 3 étapes simples, proposez le paiement différé à vos clients
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              icon: Link2,
              title: 'Créez un lien de paiement',
              desc: 'Renseignez le trajet et le prix du billet. En 30 secondes, votre lien est prêt à envoyer.',
            },
            {
              step: '2',
              icon: Send,
              title: 'Envoyez-le au client',
              desc: 'Partagez le lien par WhatsApp, email ou SMS. Le client voit le prix et peut payer sa prime.',
            },
            {
              step: '3',
              icon: CreditCard,
              title: 'Recevez les paiements',
              desc: 'Le client paie la prime immédiatement, puis le reste à son rythme. Suivez tout depuis votre dashboard.',
            },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-16 h-16 bg-blue-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-2xl font-[family-name:var(--font-sora)] font-bold">{step}</span>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-accent rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-gray-900" />
                </div>
              </div>
              <h3 className="text-lg font-[family-name:var(--font-sora)] font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== AVANTAGES ===== */}
      <section id="avantages" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-sora)] font-bold text-center text-gray-900 mb-4">
            Pourquoi les marchands choisissent Moetly Pay
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Tout ce qu&apos;il faut pour convertir plus de clients et suivre vos ventes
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                color: 'text-blue-primary',
                bg: 'bg-blue-light',
                title: 'Prêt en 30 secondes',
                desc: 'Créez des liens de paiement sans une ligne de code. Envoyez-les par WhatsApp ou email à vos clients.',
              },
              {
                icon: BarChart3,
                color: 'text-blue-primary',
                bg: 'bg-blue-light',
                title: 'Dashboard temps réel',
                desc: 'Suivez vos réservations actives, le volume garanti, les paiements reçus et le taux de finalisation.',
              },
              {
                icon: Shield,
                color: 'text-success',
                bg: 'bg-emerald-50',
                title: 'Paiements via Stripe',
                desc: 'Chaque transaction est traitée par Stripe. PCI-DSS compliant, sans effort de votre part.',
              },
              {
                icon: Clock,
                color: 'text-yellow-dark',
                bg: 'bg-yellow-light',
                title: 'Multi-paiement flexible',
                desc: 'Vos clients paient la prime maintenant et le reste à leur rythme, en autant de versements qu\u2019ils veulent.',
              },
              {
                icon: Code,
                color: 'text-blue-primary',
                bg: 'bg-blue-light',
                title: 'API pour automatiser',
                desc: 'Marchands techniques : intégrez Moetly Pay à votre site avec notre widget et nos webhooks.',
              },
              {
                icon: TrendingUp,
                color: 'text-success',
                bg: 'bg-emerald-50',
                title: 'Convertissez les hésitants',
                desc: 'Les clients qui hésitent à cause du prix deviennent des acheteurs. Augmentez votre taux de conversion.',
              },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-base font-[family-name:var(--font-sora)] font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DEUX MODÈLES D'INTÉGRATION ===== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-sora)] font-bold text-center text-gray-900 mb-4">
          Deux façons de commencer
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
          Choisissez le modèle qui correspond à votre activité
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Liens de paiement */}
          <div className="bg-white rounded-2xl border-2 border-blue-primary p-8 relative">
            <span className="absolute -top-3 left-6 bg-blue-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
              Recommandé
            </span>
            <div className="w-14 h-14 bg-blue-light rounded-2xl flex items-center justify-center mb-5">
              <Link2 className="w-7 h-7 text-blue-primary" />
            </div>
            <h3 className="text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-3">
              Liens de paiement
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              La solution la plus simple. Aucune compétence technique requise.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                'Créez un lien en 30 secondes',
                'Partagez par WhatsApp, email, SMS',
                'Suivi des vues et paiements',
                'Aucune compétence technique',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/marchand/login"
              className="block text-center bg-yellow-accent text-gray-900 px-6 py-3 rounded-xl font-[family-name:var(--font-sora)] font-semibold hover:bg-yellow-dark transition-all"
            >
              Commencer maintenant
            </Link>
          </div>

          {/* API Integration */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 relative">
            <span className="absolute -top-3 left-6 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
              Technique
            </span>
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
              <Code className="w-7 h-7 text-gray-700" />
            </div>
            <h3 className="text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-3">
              Intégration API
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              Pour les marchands qui veulent automatiser et intégrer à leur site.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                'Widget embeddable en 2 lignes',
                'Webhooks temps réel',
                'Marchand ID unique',
                'Documentation complète',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-blue-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/marchand/integration"
              className="block text-center bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-[family-name:var(--font-sora)] font-semibold hover:bg-gray-200 transition-all"
            >
              Voir la documentation
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TARIFS ===== */}
      <section id="tarifs" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-sora)] font-bold text-center text-gray-900 mb-4">
            Tarification simple et transparente
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Pas de frais cachés, pas d&apos;abonnement. Vous ne payez que quand vous vendez.
          </p>

          <div className="max-w-lg mx-auto bg-white rounded-2xl border-2 border-blue-primary shadow-lg overflow-hidden">
            {/* Pricing header */}
            <div className="bg-gradient-to-br from-blue-primary to-blue-dark p-8 text-center text-white">
              <span className="inline-block bg-white/20 text-sm font-medium px-4 py-1 rounded-full mb-4">
                Pour tous les marchands
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-[family-name:var(--font-sora)] font-extrabold">5%</span>
              </div>
              <p className="mt-2 text-blue-100">de commission sur la prime de réservation</p>
            </div>

            {/* Pricing example */}
            <div className="p-8">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Exemple concret
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Billet vendu</span>
                  <span className="font-medium text-gray-900">{formatCurrency(EXEMPLE_PRIX)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Prime client (5%)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(prime)}</span>
                </div>
                <div className="border-t border-gray-200 my-3" />
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Votre part (70%)</span>
                  <span className="font-bold text-success">{formatCurrency(partMarchand)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Part Moetly (30%)</span>
                  <span className="font-medium text-gray-400">{formatCurrency(partMoetly)}</span>
                </div>
              </div>

              {/* Inclusions */}
              <ul className="space-y-3 mb-6">
                {[
                  'Aucun frais d\u2019inscription',
                  'Aucun abonnement mensuel',
                  'Dashboard inclus',
                  'Support inclus',
                  'API incluse',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/marchand/login"
                className="block text-center bg-yellow-accent text-gray-900 px-6 py-4 rounded-xl font-[family-name:var(--font-sora)] font-bold text-lg hover:bg-yellow-dark transition-all"
              >
                Commencer gratuitement
              </Link>
              <p className="text-xs text-gray-400 text-center mt-3">
                Aucune carte bancaire requise
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-dark to-blue-primary" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-sora)] font-extrabold text-white mb-4">
            Prêt à augmenter vos ventes ?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
            Rejoignez les marchands qui utilisent Moetly Pay pour convertir plus de clients.
          </p>
          <Link
            href="/marchand/login"
            className="inline-flex items-center gap-2 bg-yellow-accent text-gray-900 px-8 py-4 rounded-xl text-lg font-[family-name:var(--font-sora)] font-bold hover:bg-yellow-dark transition-all shadow-lg"
          >
            Créer mon compte marchand
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-blue-200 mt-4">
            Gratuit pour commencer. Aucune carte requise.
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">
            {/* Logo */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-blue-primary rounded flex items-center justify-center">
                  <Plane className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-[family-name:var(--font-sora)] font-bold text-white">
                  Moetly<span className="text-yellow-accent">Pay</span>
                </span>
              </div>
              <p className="text-sm">
                Paiement différé pour marchands de billets d&apos;avion
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-2">
              <a href="#comment-ca-marche" className="text-sm hover:text-white transition-colors">
                Comment ça marche
              </a>
              <a href="#avantages" className="text-sm hover:text-white transition-colors">
                Avantages
              </a>
              <a href="#tarifs" className="text-sm hover:text-white transition-colors">
                Tarifs
              </a>
              <Link href="/marchand/login" className="text-sm hover:text-white transition-colors">
                Espace marchand
              </Link>
            </div>

            {/* Info */}
            <div className="text-right sm:text-right">
              <p className="text-sm">&copy; {new Date().getFullYear()} Moetly Fintech</p>
              <p className="text-sm">Tous droits réservés</p>
              <p className="text-xs mt-2 text-gray-500">Mode test — Aucune transaction réelle</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
