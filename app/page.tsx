'use client';

import { useEffect, useState } from 'react';
import { Vol } from '@/types';
import FlightCard from '@/components/consumer/FlightCard';
import { Plane, Shield, Clock, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [vols, setVols] = useState<Vol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vols')
      .then(res => res.json())
      .then(data => {
        setVols(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-primary rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
              Moetly<span className="text-yellow-accent">Pay</span>
            </span>
          </div>
          <Link
            href="/marchand/login"
            className="text-sm text-gray-500 hover:text-blue-primary transition-colors"
          >
            Espace Marchand
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-dark via-blue-primary to-blue-dark" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-[family-name:var(--font-sora)] font-extrabold text-white leading-tight">
            Réservez le prix.
            <br />
            <span className="text-yellow-accent">Pas le siège.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
            Bloquez le prix de votre billet aujourd&apos;hui, payez plus tard. Zéro crédit.
          </p>

          {/* Value props */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            {[
              { icon: Shield, text: 'Prix garanti' },
              { icon: CreditCard, text: 'Sans crédit' },
              { icon: Clock, text: 'Payez progressivement' },
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

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-sora)] font-bold text-center text-gray-900 mb-10">
          Comment ça marche ?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Choisissez votre vol', desc: 'Parcourez les vols disponibles et sélectionnez celui qui vous intéresse.' },
            { step: '2', title: 'Payez 5% du prix', desc: 'Versez une prime de réservation pour bloquer le prix actuel.' },
            { step: '3', title: 'Finalisez plus tard', desc: 'Payez le reste avant la date d\'expiration. Le prix est garanti.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-14 h-14 bg-blue-primary text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-[family-name:var(--font-sora)] font-bold">
                {step}
              </div>
              <h3 className="mt-4 text-lg font-[family-name:var(--font-sora)] font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Flights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-8">
          Vols disponibles
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-52 animate-pulse border border-gray-200" />
            ))}
          </div>
        ) : vols.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Plane className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Aucun vol disponible pour le moment.</p>
            <p className="text-sm mt-2">Configurez votre base de données Supabase pour voir les vols.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vols.map(vol => (
              <FlightCard key={vol.id} vol={vol} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 bg-blue-primary rounded flex items-center justify-center">
              <Plane className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-[family-name:var(--font-sora)] font-bold text-white">
              Moetly<span className="text-yellow-accent">Pay</span>
            </span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} Moetly Fintech. Tous droits réservés.</p>
          <p className="text-xs mt-1">Mode test — Aucune transaction réelle</p>
        </div>
      </footer>
    </div>
  );
}
