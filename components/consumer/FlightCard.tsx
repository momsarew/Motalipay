'use client';

import { Vol } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plane, Calendar } from 'lucide-react';
import Link from 'next/link';

interface FlightCardProps {
  vol: Vol;
}

export default function FlightCard({ vol }: FlightCardProps) {
  const prime = Math.round(vol.prix_actuel * 0.05 * 100) / 100;

  return (
    <Link href={`/vol/${vol.id}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-blue-dark to-blue-primary px-6 py-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <span className="text-lg font-[family-name:var(--font-sora)] font-bold">{vol.origine}</span>
              <div className="flex items-center gap-1">
                <div className="w-8 h-[2px] bg-white/50" />
                <Plane className="w-4 h-4 text-yellow-accent" />
                <div className="w-8 h-[2px] bg-white/50" />
              </div>
              <span className="text-lg font-[family-name:var(--font-sora)] font-bold">{vol.destination}</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{vol.compagnie}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-white/80 text-sm">
            <span>{vol.ville_origine}</span>
            <span>{vol.ville_destination}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(vol.date_vol)}
              </p>
              <p className="text-3xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mt-1">
                {formatCurrency(vol.prix_actuel)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Réservez pour</p>
              <p className="text-lg font-[family-name:var(--font-sora)] font-bold text-blue-primary">
                {formatCurrency(prime)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs bg-yellow-light text-yellow-dark px-3 py-1 rounded-full font-medium">
              Prime 5%
            </span>
            <span className="text-sm text-blue-primary font-semibold group-hover:underline">
              Réserver le prix &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
