import Link from 'next/link';
import { ArrowLeft, Plane } from 'lucide-react';

export default function ConfidentialitePage() {
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
          Politique de confidentialite
        </h1>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
          <p className="text-gray-500 italic">Derniere mise a jour : mars 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Donnees collectees</h2>
            <p>
              Dans le cadre de l&apos;utilisation de Moetly Pay, nous collectons les donnees suivantes :
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Consommateurs :</strong> adresse email, prenom, historique des reservations et versements</li>
              <li><strong>Marchands :</strong> adresse email, nom commercial, informations de compte</li>
              <li><strong>Donnees de paiement :</strong> traitees exclusivement par Stripe. Moetly Pay ne stocke aucune donnee de carte bancaire</li>
              <li><strong>Donnees techniques :</strong> adresse IP, type de navigateur, pages consultees (a des fins de securite et d&apos;amelioration du service)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Finalite du traitement</h2>
            <p>Vos donnees sont utilisees exclusivement pour :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>La fourniture et le fonctionnement du service Moetly Pay</li>
              <li>La gestion des reservations et des paiements</li>
              <li>L&apos;envoi de notifications liees a vos reservations (confirmation, rappels)</li>
              <li>La prevention de la fraude et la securite du service</li>
              <li>Le respect de nos obligations legales et reglementaires</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Duree de conservation</h2>
            <p>
              Vos donnees personnelles sont conservees pendant la duree necessaire a la fourniture
              du service, puis archivees conformement aux obligations legales :
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Donnees de compte : duree de la relation commerciale + 3 ans</li>
              <li>Donnees de transaction : 5 ans (obligations comptables)</li>
              <li>Donnees techniques (logs) : 12 mois</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Vos droits (RGPD)</h2>
            <p>
              Conformement au Reglement General sur la Protection des Donnees, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Droit d&apos;acces :</strong> obtenir une copie de vos donnees personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger des donnees inexactes ou incompletes</li>
              <li><strong>Droit de suppression :</strong> demander l&apos;effacement de vos donnees</li>
              <li><strong>Droit a la portabilite :</strong> recevoir vos donnees dans un format structure</li>
              <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos donnees</li>
              <li><strong>Droit de limitation :</strong> limiter le traitement de vos donnees</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, envoyez un email a : <strong>contact@moetly.com</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Sous-traitants</h2>
            <p>Nous faisons appel aux sous-traitants suivants :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Stripe :</strong> traitement des paiements (certifie PCI-DSS)</li>
              <li><strong>Supabase :</strong> hebergement de la base de donnees</li>
              <li><strong>Vercel :</strong> hebergement de l&apos;application web</li>
            </ul>
            <p className="mt-2">
              Chacun de ces prestataires s&apos;engage a respecter la reglementation en matiere
              de protection des donnees personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Securite</h2>
            <p>
              Nous mettons en oeuvre des mesures techniques et organisationnelles appropriees
              pour proteger vos donnees personnelles contre l&apos;acces non autorise, la modification,
              la divulgation ou la destruction. Les communications sont chiffrees via HTTPS/TLS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Cookies</h2>
            <p>
              Moetly Pay utilise des cookies strictement necessaires au fonctionnement du service
              (authentification, session). Nous n&apos;utilisons pas de cookies publicitaires ou de suivi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contact</h2>
            <p>
              Pour toute question relative a la protection de vos donnees personnelles,
              contactez-nous a : <strong>contact@moetly.com</strong>
            </p>
            <p>
              Vous pouvez egalement adresser une reclamation a la CNIL (Commission Nationale
              de l&apos;Informatique et des Libertes) : www.cnil.fr
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
