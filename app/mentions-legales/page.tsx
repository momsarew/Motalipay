import Link from 'next/link';
import { ArrowLeft, Plane } from 'lucide-react';

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
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
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-[family-name:var(--font-sora)] font-bold text-gray-900 mb-8">
          Mentions legales
        </h1>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Editeur du site</h2>
            <p>
              <strong>Moetly Fintech</strong> (structure juridique en cours de constitution)<br />
              Responsable de la publication : [A completer]<br />
              Contact : contact@moetly.com
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Hebergement</h2>
            <p>
              Le site est heberge par <strong>Vercel Inc.</strong><br />
              440 N Barranca Ave #4133, Covina, CA 91723, USA<br />
              Site web : https://vercel.com
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Traitement des donnees personnelles</h2>
            <p>
              Conformement au Reglement General sur la Protection des Donnees (RGPD) et a la loi Informatique
              et Libertes du 6 janvier 1978 modifiee, vous disposez d&apos;un droit d&apos;acces, de rectification,
              de suppression et de portabilite de vos donnees personnelles.
            </p>
            <p>
              Pour exercer ces droits ou pour toute question relative au traitement de vos donnees,
              vous pouvez nous contacter a l&apos;adresse : contact@moetly.com
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Paiements</h2>
            <p>
              Les paiements sont traites par <strong>Stripe</strong>, prestataire de paiement certifie PCI-DSS.
              Moetly Fintech ne stocke aucune donnee bancaire. Les informations de carte bancaire sont
              transmises directement a Stripe via une connexion securisee.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Propriete intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu du site (textes, graphiques, logos, images) est la propriete
              exclusive de Moetly Fintech. Toute reproduction ou representation, totale ou partielle,
              est interdite sans autorisation prealable.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
