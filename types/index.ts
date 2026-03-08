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

export interface LienPaiement {
  id: string;
  short_code: string;
  marchand_id: string;
  ville_origine: string;
  ville_destination: string;
  origine?: string;
  destination?: string;
  prix: number;
  date_vol?: string;
  compagnie?: string;
  reference_billet?: string;
  note_marchand?: string;
  actif: boolean;
  usage_unique: boolean;
  nb_vues: number;
  nb_paiements: number;
  created_at: string;
}

export interface Paiement {
  id: string;
  reservation_id: string;
  montant: number;
  type: 'prime' | 'partiel' | 'solde';
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  statut: 'en_attente' | 'confirme' | 'echoue';
  created_at: string;
  updated_at?: string;
}

export interface Reservation {
  id: string;
  vol_id: string;
  vol?: Vol;
  lien_paiement_id?: string;
  lien_paiement?: LienPaiement;
  consommateur_email: string;
  consommateur_prenom: string;
  prix_bloque: number;
  taux_prime: number;
  montant_prime: number;
  total_paye: number;
  part_moetly: number;
  part_marchand: number;
  duree_jours: number;
  date_expiration: string;
  statut: 'active' | 'finalisee' | 'expiree' | 'annulee';
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  prime_payee: boolean;
  marchand_id: string;
  paiements?: Paiement[];
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

export interface TemplateRoute {
  id: string;
  marchand_id: string;
  nom: string;
  ville_origine: string;
  ville_destination: string;
  origine?: string;
  destination?: string;
  compagnie?: string;
  prix_defaut?: number;
  created_at: string;
}

export interface ParsedBooking {
  ville_origine?: string;
  ville_destination?: string;
  origine?: string;
  destination?: string;
  prix?: number;
  date_vol?: string;
  compagnie?: string;
  reference_billet?: string;
  confidence: Record<string, number>;
}

export interface BulkCreateResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
  liens: LienPaiement[];
}
