export interface Vol {
  id: string;
  origine: string;
  destination: string;
  ville_origine: string;
  ville_destination: string;
  prix_actuel: number;
  date_vol: string;
  compagnie: string;
  image_url?: string;
  disponible: boolean;
}

export interface Reservation {
  id: string;
  vol_id: string;
  vol?: Vol;
  consommateur_email: string;
  consommateur_prenom: string;
  prix_bloque: number;
  taux_prime: number;
  montant_prime: number;
  part_moetly: number;
  part_marchand: number;
  duree_jours: number;
  date_expiration: string;
  statut: 'active' | 'finalisee' | 'expiree' | 'annulee';
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  prime_payee: boolean;
  marchand_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Marchand {
  id: string;
  user_id: string;
  nom_entreprise: string;
  email: string;
  plan: 'professionnel' | 'entreprise';
}

export interface DashboardKPIs {
  reservations_actives: number;
  volume_garanti_total: number;
  primes_collectees_mois: number;
  taux_finalisation: number;
  jours_visibilite_moyenne: number;
}
