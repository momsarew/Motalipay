'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { Plane, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // The /compte page is the login page itself — skip auth check
  const isLoginPage = pathname === '/compte';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/compte');
      } else {
        setUserEmail(data.user.email || '');
      }
      setLoading(false);
    });
  }, [isLoginPage, router]);

  // Login page renders directly without the layout shell
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

  if (!userEmail) return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/compte');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/compte/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-primary rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
              Moetly<span className="text-yellow-accent">Pay</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Deconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-5 h-5 bg-blue-primary rounded flex items-center justify-center">
                <Plane className="w-3 h-3 text-white" />
              </div>
              <span className="font-[family-name:var(--font-sora)] font-semibold">
                Moetly<span className="text-yellow-accent">Pay</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="/cgu" className="hover:text-gray-600 transition-colors">
                CGU
              </Link>
              <Link href="/confidentialite" className="hover:text-gray-600 transition-colors">
                Confidentialite
              </Link>
              <span>&copy; {new Date().getFullYear()} Moetly Fintech</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
