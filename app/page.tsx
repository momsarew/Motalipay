'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  Link2,
  Lock,
  Menu,
  Shield,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { MOETLY_CONFIG } from '@/lib/constants';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  viewport: { once: true, margin: '-60px' },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  viewport: { once: true, margin: '-40px' },
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 antialiased">
      {/* Nav fixe */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0A0A0A]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0A0A0A]/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
              <span className="font-[family-name:var(--font-sora)] text-lg font-bold tracking-tight text-yellow-accent">
                M
              </span>
            </span>
            <span className="font-[family-name:var(--font-sora)] text-lg font-bold tracking-tight text-white">
              Mottali
            </span>
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            <a
              href="#comment-ca-marche"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Comment ça marche
            </a>
            <a href="#avantages" className="text-sm text-zinc-400 transition-colors hover:text-white">
              Avantages
            </a>
            <a href="#chiffres" className="text-sm text-zinc-400 transition-colors hover:text-white">
              Chiffres
            </a>
            <Link href="/compte" className="text-sm text-zinc-400 transition-colors hover:text-white">
              Espace client
            </Link>
            <Link
              href="/marchand/login"
              className="rounded-xl bg-yellow-accent px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-[#e8c23a]"
            >
              Espace Marchand
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-300 transition-colors hover:bg-white/5 md:hidden"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/[0.06] bg-[#0F0F0F] px-4 py-5 md:hidden">
            <div className="flex flex-col gap-1">
              <a
                href="#comment-ca-marche"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-zinc-300 hover:bg-white/5"
              >
                Comment ça marche
              </a>
              <a
                href="#avantages"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-zinc-300 hover:bg-white/5"
              >
                Avantages
              </a>
              <a
                href="#chiffres"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-zinc-300 hover:bg-white/5"
              >
                Chiffres
              </a>
              <Link
                href="/compte"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-zinc-300 hover:bg-white/5"
              >
                Espace client
              </Link>
              <Link
                href="/marchand/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 rounded-xl bg-yellow-accent py-3 text-center text-sm font-semibold text-zinc-900"
              >
                Espace Marchand
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-blue-primary/[0.07] blur-3xl" />
            <div className="absolute -right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-yellow-accent/[0.04] blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
              className="text-center"
            >
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-zinc-400">
                <Sparkles className="h-3.5 w-3.5 text-yellow-accent" />
                Fintech · Blocage de tarif
              </p>

              <h1 className="font-[family-name:var(--font-sora)] text-[2.5rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[4.5rem] xl:text-[5rem]">
                Bloquez le prix.
                <br />
                <span className="text-zinc-400">Sécurisez la vente.</span>
              </h1>

              <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                Vos clients réservent avec une prime, épargnent à leur rythme, et vous gardez le contrôle — sans friction.
              </p>

              <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/marchand/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-accent px-8 py-4 text-base font-semibold text-zinc-900 transition-colors hover:bg-[#e8c23a]"
                >
                  Commencer
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#comment-ca-marche"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-transparent px-8 py-4 text-base font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/[0.04]"
                >
                  Comment ça marche
                </a>
              </div>

              <div className="mx-auto mt-16 flex max-w-2xl flex-col gap-4 sm:flex-row sm:justify-center sm:gap-8">
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 sm:flex-1 sm:py-3">
                  <CreditCard className="h-5 w-5 shrink-0 text-blue-primary" />
                  <span className="text-left text-sm text-zinc-400">
                    Paiements via <span className="font-medium text-zinc-200">Stripe</span>
                  </span>
                </div>
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 sm:flex-1 sm:py-3">
                  <Lock className="h-5 w-5 shrink-0 text-yellow-accent" />
                  <span className="text-left text-sm text-zinc-400">
                    Fonds <span className="font-medium text-zinc-200">sécurisés</span>
                  </span>
                </div>
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 sm:flex-1 sm:py-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-success" />
                  <span className="text-left text-sm text-zinc-400">
                    <span className="font-medium text-zinc-200">Sans engagement</span> caché
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section id="comment-ca-marche" className="border-t border-white/[0.06] bg-[#0F0F0F] py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <h2 className="font-[family-name:var(--font-sora)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Comment ça marche
              </h2>
              <p className="mt-4 text-zinc-400">
                Trois étapes. Aucune complexité inutile.
              </p>
            </motion.div>

            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: '01',
                  icon: Link2,
                  title: 'Créez un lien',
                  desc: 'Définissez prix et durée. Votre lien est prêt à partager.',
                },
                {
                  step: '02',
                  icon: Zap,
                  title: 'Le client bloque',
                  desc: 'Il paie la prime et épargne le reste à son rythme.',
                },
                {
                  step: '03',
                  icon: Shield,
                  title: 'Vous suivez tout',
                  desc: 'Dashboard clair : versements, progression, finalisation.',
                },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  {...stagger}
                  className="group relative rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-8 transition-colors hover:border-white/[0.1]"
                >
                  <span className="font-[family-name:var(--font-sora)] text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    {item.step}
                  </span>
                  <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-blue-primary transition-colors group-hover:border-blue-primary/30">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-[family-name:var(--font-sora)] text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Avantages marchands */}
        <section id="avantages" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <h2 className="font-[family-name:var(--font-sora)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Conçu pour les marchands
              </h2>
              <p className="mt-4 text-zinc-400">
                Minimal. Précis. Efficace.
              </p>
            </motion.div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: TrendingUp,
                  title: 'Conversion',
                  desc: 'Réduisez les abandons liés au prix avec un blocage clair.',
                },
                {
                  icon: CreditCard,
                  title: 'Cash-flow',
                  desc: 'Prime encaissée au blocage, suivi des versements en temps réel.',
                },
                {
                  icon: Shield,
                  title: 'Confiance',
                  desc: 'Stripe pour les paiements, transparence pour vos clients.',
                },
                {
                  icon: Sparkles,
                  title: 'Simplicité',
                  desc: 'Liens en quelques secondes — sans intégration lourde pour démarrer.',
                },
              ].map((card) => (
                <motion.div
                  key={card.title}
                  {...stagger}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.1]"
                >
                  <card.icon className="h-5 w-5 text-yellow-accent" />
                  <h3 className="mt-5 font-[family-name:var(--font-sora)] text-lg font-semibold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Chiffres clés */}
        <section id="chiffres" className="border-t border-white/[0.06] bg-[#0F0F0F] py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <h2 className="font-[family-name:var(--font-sora)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Les chiffres qui comptent
              </h2>
              <p className="mt-4 text-zinc-400">
                Un modèle lisible, sans surprise.
              </p>
            </motion.div>

            <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Prime standard', value: `${MOETLY_CONFIG.PRIME_RATE * 100}%`, hint: 'sur le prix bloqué' },
                { label: 'Durées', value: '30 · 60 · 90j', hint: 'blocage flexible' },
                { label: 'Part marchand (prime)', value: `${MOETLY_CONFIG.MARCHAND_SHARE * 100}%`, hint: 'de la prime' },
                { label: 'Risque inventaire', value: 'Maîtrisé', hint: 'abandon = prime conservée' },
              ].map((metric) => (
                <motion.div
                  key={metric.label}
                  {...stagger}
                  className="bg-[#0A0A0A] p-8 sm:p-10"
                >
                  <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">{metric.label}</p>
                  <p className="mt-4 font-[family-name:var(--font-sora)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">{metric.hint}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#050505] py-24 sm:py-32">
          <div className="pointer-events-none absolute inset-0 bg-blue-primary/[0.03]" />
          <motion.div
            {...fadeUp}
            className="relative mx-auto max-w-3xl px-4 text-center sm:px-6"
          >
            <h2 className="font-[family-name:var(--font-sora)] text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Prêt à transformer vos offres ?
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg text-zinc-400">
              Rejoignez Mottali et proposez le blocage de tarif comme les meilleures fintechs — avec élégance.
            </p>
            <Link
              href="/marchand/login"
              className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-accent px-10 py-4 text-base font-semibold text-zinc-900 transition-colors hover:bg-[#e8c23a]"
            >
              Ouvrir mon espace marchand
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Footer minimal */}
      <footer className="border-t border-white/[0.06] bg-[#0A0A0A] py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-sora)] text-base font-bold text-white">Mottali</span>
            <span className="text-zinc-600">·</span>
            <span className="text-sm text-zinc-500">Blocage de tarif</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
            <a href="#comment-ca-marche" className="transition-colors hover:text-white">
              Produit
            </a>
            <Link href="/marchand/login" className="transition-colors hover:text-white">
              Marchands
            </Link>
            <Link href="/compte" className="transition-colors hover:text-white">
              Clients
            </Link>
            <Link href="/mentions-legales" className="transition-colors hover:text-white">
              Mentions légales
            </Link>
            <Link href="/cgu" className="transition-colors hover:text-white">
              CGU
            </Link>
            <Link href="/confidentialite" className="transition-colors hover:text-white">
              Confidentialité
            </Link>
          </div>
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} Mottali
          </p>
        </div>
      </footer>
    </div>
  );
}
