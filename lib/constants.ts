export const MOETLY_CONFIG = {
  PRIME_RATE: 0.05,
  MOETLY_SHARE: 0.30,
  MARCHAND_SHARE: 0.70,

  DURATIONS: [
    { days: 30, label: '30 jours', discount: 0 },
    { days: 60, label: '60 jours', discount: 0, recommended: true },
    { days: 90, label: '90 jours', surcharge: 0.005 },
  ],

  CURRENCY: 'EUR',
  STRIPE_MIN_AMOUNT_CENTS: 50,
} as const;

// ===== SECTEURS =====
// Chaque secteur réutilise les mêmes colonnes DB avec des labels différents
export type Secteur = 'transport' | 'evenement' | 'hebergement' | 'autre';

export interface SecteurField {
  label: string;
  placeholder: string;
  required: boolean;
  visible: boolean;
}

export interface SecteurConfig {
  label: string;
  emoji: string;
  description: string;
  // Mapping des champs DB → labels UI
  fields: {
    ville_origine: SecteurField;
    ville_destination: SecteurField;
    origine: SecteurField;       // IATA / code
    destination: SecteurField;   // IATA / code
    date_vol: SecteurField;
    compagnie: SecteurField;
  };
  // Affichage côté consommateur
  display: {
    headerLabel: string;         // ex: "Trajet", "Événement"
    priceLabel: string;          // ex: "Prix du billet", "Prix de la place"
    originLabel: string;         // ex: "Départ", "Lieu"
    destinationLabel: string;    // ex: "Arrivée", "Événement"
    showRoute: boolean;          // afficher flèche origine → destination
    icon: string;                // lucide icon name
  };
}

export const SECTEURS: Record<Secteur, SecteurConfig> = {
  transport: {
    label: 'Transport',
    emoji: '✈️',
    description: 'Billets d\'avion, train, bus',
    fields: {
      ville_origine: { label: 'Ville de départ', placeholder: 'Ex: Paris', required: true, visible: true },
      ville_destination: { label: 'Ville d\'arrivée', placeholder: 'Ex: Dakar', required: true, visible: true },
      origine: { label: 'Code IATA départ', placeholder: 'CDG', required: false, visible: true },
      destination: { label: 'Code IATA arrivée', placeholder: 'DSS', required: false, visible: true },
      date_vol: { label: 'Date de voyage', placeholder: '', required: false, visible: true },
      compagnie: { label: 'Compagnie', placeholder: 'Ex: Air France', required: false, visible: true },
    },
    display: {
      headerLabel: 'Trajet',
      priceLabel: 'Prix du billet',
      originLabel: 'Départ',
      destinationLabel: 'Arrivée',
      showRoute: true,
      icon: 'Plane',
    },
  },
  evenement: {
    label: 'Événement',
    emoji: '🎫',
    description: 'Concerts, spectacles, sport',
    fields: {
      ville_origine: { label: 'Lieu / Salle', placeholder: 'Ex: Accor Arena, Paris', required: true, visible: true },
      ville_destination: { label: 'Événement / Artiste', placeholder: 'Ex: Concert Youssou N\'Dour', required: true, visible: true },
      origine: { label: '', placeholder: '', required: false, visible: false },
      destination: { label: '', placeholder: '', required: false, visible: false },
      date_vol: { label: 'Date de l\'événement', placeholder: '', required: false, visible: true },
      compagnie: { label: 'Organisateur', placeholder: 'Ex: Live Nation', required: false, visible: true },
    },
    display: {
      headerLabel: 'Événement',
      priceLabel: 'Prix de la place',
      originLabel: 'Lieu',
      destinationLabel: 'Événement',
      showRoute: false,
      icon: 'Music',
    },
  },
  hebergement: {
    label: 'Hébergement',
    emoji: '🏨',
    description: 'Hôtels, locations, séjours',
    fields: {
      ville_origine: { label: 'Ville / Destination', placeholder: 'Ex: Marrakech', required: true, visible: true },
      ville_destination: { label: 'Établissement', placeholder: 'Ex: Riad Jemaa El Fna', required: true, visible: true },
      origine: { label: '', placeholder: '', required: false, visible: false },
      destination: { label: '', placeholder: '', required: false, visible: false },
      date_vol: { label: 'Date de séjour', placeholder: '', required: false, visible: true },
      compagnie: { label: 'Plateforme / Agence', placeholder: 'Ex: Booking.com', required: false, visible: true },
    },
    display: {
      headerLabel: 'Séjour',
      priceLabel: 'Prix du séjour',
      originLabel: 'Destination',
      destinationLabel: 'Établissement',
      showRoute: false,
      icon: 'Building',
    },
  },
  autre: {
    label: 'Autre',
    emoji: '📦',
    description: 'Formation, service, sur-mesure',
    fields: {
      ville_origine: { label: 'Titre / Description', placeholder: 'Ex: Formation marketing digital', required: true, visible: true },
      ville_destination: { label: 'Détails', placeholder: 'Ex: 3 jours, en ligne', required: false, visible: true },
      origine: { label: '', placeholder: '', required: false, visible: false },
      destination: { label: '', placeholder: '', required: false, visible: false },
      date_vol: { label: 'Date', placeholder: '', required: false, visible: true },
      compagnie: { label: 'Prestataire', placeholder: '', required: false, visible: true },
    },
    display: {
      headerLabel: 'Réservation',
      priceLabel: 'Prix',
      originLabel: 'Description',
      destinationLabel: 'Détails',
      showRoute: false,
      icon: 'Package',
    },
  },
};
