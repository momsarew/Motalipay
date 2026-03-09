'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Plane, Shield, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function CompteLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setError(authError.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : authError.message
      );
      setLoading(false);
      return;
    }

    router.push('/compte/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Sign up with Supabase Auth
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/compte/dashboard`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Create consumer profile via API
    if (signUpData.user) {
      try {
        const res = await fetch('/api/consommateurs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            prenom: prenom || undefined,
            nom: nom || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          console.error('Consumer profile creation error:', data.error);
        }
      } catch (err) {
        console.error('Consumer profile creation error:', err);
      }
    }

    // If email confirmation is required
    if (signUpData.user && !signUpData.session) {
      setSuccess('Compte cree ! Verifiez votre email pour confirmer votre inscription.');
      setLoading(false);
      return;
    }

    router.push('/compte/dashboard');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Entrez votre email pour recevoir un lien de reinitialisation.');
      return;
    }
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/compte`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess('Un email de reinitialisation vous a ete envoye.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-primary rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
              Moetly<span className="text-yellow-accent">Pay</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Shield className="w-4 h-4 text-success" />
            Espace client
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900">
              Espace client
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Suivez toutes vos reservations en un seul endroit
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                className={`flex-1 py-4 text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'text-blue-primary border-b-2 border-blue-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Se connecter
              </button>
              <button
                onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
                className={`flex-1 py-4 text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'text-blue-primary border-b-2 border-blue-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Creer un compte
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {/* Success message */}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-emerald-700">{success}</p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              {/* Login form */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all"
                        placeholder="Votre mot de passe"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-blue-primary hover:underline cursor-pointer"
                    >
                      Mot de passe oublie ?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={loading}
                  >
                    Se connecter
                  </Button>
                </form>
              )}

              {/* Register form */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Prenom</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={prenom}
                          onChange={e => setPrenom(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all"
                          placeholder="Prenom"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nom <span className="text-gray-400 font-normal">(optionnel)</span>
                      </label>
                      <input
                        type="text"
                        value={nom}
                        onChange={e => setNom(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all"
                        placeholder="Nom"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 outline-none transition-all"
                        placeholder="Min. 6 caracteres"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    className="w-full"
                    loading={loading}
                  >
                    Creer mon compte
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Merchant link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Vous etes marchand ?{' '}
              <Link href="/marchand/login" className="text-blue-primary font-semibold hover:underline">
                Connectez-vous ici
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
