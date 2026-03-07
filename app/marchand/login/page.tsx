'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { Plane, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MarchandLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
      return;
    }

    router.push('/marchand');
  };

  const fillDemo = () => {
    setEmail('demo@moetly.com');
    setPassword('Demo2024!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-dark to-blue-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Plane className="w-6 h-6 text-blue-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-[family-name:var(--font-sora)] font-bold text-white">
            Moetly<span className="text-yellow-accent">Pay</span>
          </h1>
          <p className="text-blue-100 mt-1">Espace Marchand</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all"
                placeholder="votre@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all pr-12"
                  placeholder="Votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-error text-sm">{error}</p>}

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Se connecter
            </Button>
          </form>

          {/* Demo account */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Compte de démonstration :</p>
            <div className="text-sm space-y-1">
              <p className="text-gray-700">Email : <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">demo@moetly.com</code></p>
              <p className="text-gray-700">Mot de passe : <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">Demo2024!</code></p>
            </div>
            <button
              onClick={fillDemo}
              className="mt-3 text-sm text-blue-primary hover:underline cursor-pointer"
            >
              Remplir automatiquement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
