import Link from 'next/link';
import { ArrowLeft, Plane } from 'lucide-react';

export default function CGUPage() {
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
          Conditions Generales d&apos;Utilisation
        </h1>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
          <p className="text-gray-500 italic">Derniere mise a jour : mars 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Objet du service</h2>
            <p>
              Moetly Pay est un service de blocage de tarif et d&apos;epargne progressive.
              Il permet aux consommateurs de bloquer le prix d&apos;un produit ou service
              en versant une prime, puis d&apos;epargner le montant restant a leur rythme
              avant la date d&apos;expiration choisie.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Fonctionnement de la prime</h2>
            <p>
              La prime de reservation represente 5% du prix du produit ou service.
              Elle est versee au moment du blocage du tarif et n&apos;est <strong>pas remboursable</strong>.
              La prime est repartie entre le marchand (70%) et Moetly (30%).
            </p>
            <p>
              Pour les durees de blocage de 90 jours, un supplement de 0,5% s&apos;applique,
              portant la prime totale a 5,5%.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Fonctionnement de l&apos;epargne</h2>
            <p>
              Apres le versement de la prime, le consommateur peut effectuer des versements
              complementaires a son rythme pour atteindre le prix total du produit ou service.
              Les versements d&apos;epargne sont <strong>retirables a tout moment</strong> depuis
              l&apos;espace personnel du consommateur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Modele escrow</h2>
            <p>
              Les fonds verses par le consommateur sont conserves de maniere securisee
              par Moetly Pay. Le marchand recoit sa part de prime au moment du blocage.
              Le prix total du produit est verse au marchand une fois que le consommateur
              a finalise l&apos;integralite du paiement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Obligations du marchand</h2>
            <p>Le marchand s&apos;engage a :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Honorer le prix bloque pendant toute la duree de la reservation</li>
              <li>Delivrer le produit ou service une fois le paiement complet effectue</li>
              <li>Fournir des informations exactes sur les produits et services proposes</li>
              <li>Respecter la reglementation applicable a son activite</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Droits du consommateur</h2>
            <p>Le consommateur beneficie des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Garantie du prix bloque pendant la duree choisie (30, 60 ou 90 jours)</li>
              <li>Retrait des versements d&apos;epargne a tout moment (hors prime initiale)</li>
              <li>Acces a un espace personnel pour suivre ses reservations et versements</li>
              <li>Droit d&apos;acces, de rectification et de suppression de ses donnees personnelles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Expiration de la reservation</h2>
            <p>
              Si le consommateur n&apos;a pas finalise le paiement total avant la date
              d&apos;expiration, la reservation expire. La prime reste acquise au marchand
              et a Moetly. Les versements d&apos;epargne sont retournables au consommateur
              sur demande.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Resolution des litiges</h2>
            <p>
              En cas de litige, les parties s&apos;engagent a rechercher une solution amiable.
              A defaut, les tribunaux competents seront ceux du siege social de Moetly Fintech.
              Le consommateur peut egalement recourir a un mediateur de la consommation
              conformement aux articles L.611-1 et suivants du Code de la consommation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Contact</h2>
            <p>
              Pour toute question concernant ces conditions, contactez-nous a : contact@moetly.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
