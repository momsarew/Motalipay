'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { Plane, BarChart3, ClipboardList, Link2, LogOut, User, ExternalLink, Menu, X } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/marchand', icon: BarChart3, label: 'Vue d\'ensemble' },
  { href: '/marchand/liens', icon: ExternalLink, label: 'Liens de paiement' },
  { href: '/marchand/reservations', icon: ClipboardList, label: 'Réservations' },
  { href: '/marchand/integration', icon: Link2, label: 'Intégration' },
];

export default function MarchandLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Skip auth check on login page
  const isLoginPage = pathname === '/marchand/login';

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/marchand/login');
      } else {
        setUser({ email: data.user.email || '' });
      }
      setLoading(false);
    });
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/marchand/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-blue-dark to-[#0a3666] text-white flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <Plane className="w-4 h-4 text-blue-primary" />
          </div>
          <span className="text-base font-[family-name:var(--font-sora)] font-bold">
            Moetly<span className="text-yellow-accent">Pay</span>
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all cursor-pointer"
          aria-label="Menu"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile, shown on lg+ */}
      <aside className={`
        w-64 bg-gradient-to-b from-blue-dark to-[#0a3666] text-white flex flex-col fixed h-full z-40
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-blue-primary" />
            </div>
            <span className="text-lg font-[family-name:var(--font-sora)] font-bold">
              Moetly<span className="text-yellow-accent">Pay</span>
            </span>
          </div>
          <p className="text-xs text-blue-200 mt-1">Espace Marchand</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User & logout */}
        <div className="px-3 pb-6 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 text-blue-200 text-sm">
            <User className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-200 hover:text-white hover:bg-white/10 transition-all w-full cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main content — offset for sidebar on lg+, offset for mobile header on mobile */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
