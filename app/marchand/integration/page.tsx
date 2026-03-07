'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Copy, Check, Code, Key, Webhook } from 'lucide-react';

export default function IntegrationPage() {
  const [marchandId, setMarchandId] = useState('');
  const [copiedWidget, setCopiedWidget] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showWebhookTest, setShowWebhookTest] = useState(false);

  useEffect(() => {
    const getMarchand = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: marchand } = await supabase
        .from('marchands')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (marchand) setMarchandId(marchand.id);
    };
    getMarchand();
  }, []);

  const widgetCode = `<script src="https://cdn.moetly.com/widget.js"></script>
<moetly-button
  vol-id="VOL_ID"
  prix="680"
  marchand-id="${marchandId || 'VOTRE_MARCHAND_ID'}"
></moetly-button>`;

  const webhookPayload = JSON.stringify({
    event: 'reservation.created',
    data: {
      id: 'res_abc123',
      vol: { origine: 'CDG', destination: 'DSS' },
      prix_bloque: 680,
      montant_prime: 34,
      consommateur_email: 'client@example.com',
      statut: 'active',
      date_expiration: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
  }, null, 2);

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-2">
        Intégration
      </h1>
      <p className="text-gray-500 mb-8">
        Intégrez Moetly Pay à votre site en quelques lignes de code.
      </p>

      <div className="space-y-6">
        {/* Widget */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-light rounded-xl flex items-center justify-center">
              <Code className="w-5 h-5 text-blue-primary" />
            </div>
            <div>
              <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
                Widget Moetly Pay
              </h2>
              <p className="text-sm text-gray-500">Ajoutez le bouton Moetly Pay à votre site en 2 lignes</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
            <pre className="text-sm text-green-400 font-mono whitespace-pre">{widgetCode}</pre>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => copyToClipboard(widgetCode, setCopiedWidget)}
          >
            <span className="flex items-center gap-2">
              {copiedWidget ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedWidget ? 'Copié !' : 'Copier le code'}
            </span>
          </Button>
        </Card>

        {/* Marchand ID */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-light rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-yellow-dark" />
            </div>
            <div>
              <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
                Votre Marchand ID
              </h2>
              <p className="text-sm text-gray-500">Utilisez cet identifiant dans vos intégrations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <code className="flex-1 bg-gray-100 px-4 py-3 rounded-xl text-sm font-mono text-gray-700 border border-gray-200">
              {marchandId || 'Chargement...'}
            </code>
            <button
              onClick={() => copyToClipboard(marchandId, setCopiedId)}
              className="p-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {copiedId ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
        </Card>

        {/* Webhook */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Webhook className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-[family-name:var(--font-sora)] font-bold text-gray-900">
                Webhook
              </h2>
              <p className="text-sm text-gray-500">Recevez des notifications en temps réel</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700">URL Webhook</label>
              <input
                type="text"
                value="https://votre-site.com/api/moetly/webhook"
                readOnly
                className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Événements</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {['reservation.created', 'reservation.completed', 'reservation.expired'].map(evt => (
                  <span key={evt} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-600">
                    {evt}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWebhookTest(!showWebhookTest)}
          >
            {showWebhookTest ? 'Masquer' : 'Tester le webhook'}
          </Button>

          {showWebhookTest && (
            <div className="mt-4 bg-gray-900 rounded-xl p-4 overflow-x-auto">
              <p className="text-xs text-gray-400 mb-2">Exemple de payload :</p>
              <pre className="text-sm text-green-400 font-mono whitespace-pre">{webhookPayload}</pre>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
