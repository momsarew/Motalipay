-- =============================================
-- MOETLY PAY — Configuration Supabase
-- =============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- (Dashboard > SQL Editor > New query)
-- =============================================

-- 1. TABLE VOLS (catalogue de billets)
CREATE TABLE IF NOT EXISTS vols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  origine VARCHAR(3) NOT NULL,
  destination VARCHAR(3) NOT NULL,
  ville_origine VARCHAR(100) NOT NULL,
  ville_destination VARCHAR(100) NOT NULL,
  prix_actuel DECIMAL(10,2) NOT NULL,
  date_vol DATE NOT NULL,
  compagnie VARCHAR(100) NOT NULL,
  image_url TEXT,
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLE MARCHANDS
CREATE TABLE IF NOT EXISTS marchands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  nom_entreprise VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'professionnel',
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE RESERVATIONS
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vol_id UUID REFERENCES vols(id),
  consommateur_email VARCHAR(200) NOT NULL,
  consommateur_prenom VARCHAR(100),
  prix_bloque DECIMAL(10,2) NOT NULL,
  taux_prime DECIMAL(5,4) DEFAULT 0.05,
  montant_prime DECIMAL(10,2) NOT NULL,
  part_moetly DECIMAL(10,2) NOT NULL,
  part_marchand DECIMAL(10,2) NOT NULL,
  duree_jours INTEGER NOT NULL DEFAULT 60,
  date_expiration TIMESTAMPTZ NOT NULL,
  statut VARCHAR(50) DEFAULT 'active',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  prime_payee BOOLEAN DEFAULT false,
  marchand_id UUID REFERENCES marchands(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_reservations_marchand ON reservations(marchand_id);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON reservations(statut);
CREATE INDEX IF NOT EXISTS idx_reservations_expiration ON reservations(date_expiration);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(consommateur_email);

-- 4. SEED DATA — 6 vols
INSERT INTO vols (origine, destination, ville_origine, ville_destination, prix_actuel, date_vol, compagnie) VALUES
('CDG', 'DSS', 'Paris', 'Dakar', 680.00, NOW() + INTERVAL '45 days', 'Air Sénégal'),
('CDG', 'ABJ', 'Paris', 'Abidjan', 750.00, NOW() + INTERVAL '30 days', 'Air Côte d''Ivoire'),
('CDG', 'CMN', 'Paris', 'Casablanca', 320.00, NOW() + INTERVAL '60 days', 'Royal Air Maroc'),
('LYS', 'YUL', 'Lyon', 'Montréal', 890.00, NOW() + INTERVAL '90 days', 'Air Transat'),
('CDG', 'JFK', 'Paris', 'New York', 620.00, NOW() + INTERVAL '55 days', 'Air France'),
('MRS', 'TUN', 'Marseille', 'Tunis', 280.00, NOW() + INTERVAL '20 days', 'Tunisair');

-- 5. RLS (Row Level Security)
-- Désactivé pour la démo, mais structure prête pour la prod
ALTER TABLE vols ENABLE ROW LEVEL SECURITY;
ALTER TABLE marchands ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Politique : lecture publique des vols
CREATE POLICY "Vols lisibles par tous" ON vols
  FOR SELECT USING (true);

-- Politique : marchands peuvent lire leurs données
CREATE POLICY "Marchands lisent leurs données" ON marchands
  FOR SELECT USING (auth.uid() = user_id);

-- Politique : réservations accessibles selon contexte
CREATE POLICY "Reservations lecture publique" ON reservations
  FOR SELECT USING (true);

CREATE POLICY "Reservations insertion publique" ON reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Reservations mise à jour publique" ON reservations
  FOR UPDATE USING (true);


-- =============================================
-- ÉTAPE MANUELLE REQUISE APRÈS CE SCRIPT :
-- =============================================
-- 1. Allez dans Authentication > Users
-- 2. Créez un utilisateur :
--    Email: demo@moetly.com
--    Password: Demo2024!
-- 3. Copiez le UUID de cet utilisateur
-- 4. Exécutez le script ci-dessous en remplaçant USER_UUID :
-- =============================================

-- DÉCOMMENTEZ et exécutez après création de l'utilisateur :

-- INSERT INTO marchands (user_id, nom_entreprise, email)
-- VALUES ('REMPLACER_PAR_USER_UUID', 'SkyBooker Travel', 'demo@moetly.com');

-- Puis insérez les réservations mock :
-- (exécutez après avoir le marchand_id)

-- INSERT INTO reservations (vol_id, consommateur_email, consommateur_prenom, prix_bloque,
--                           montant_prime, part_moetly, part_marchand, duree_jours,
--                           date_expiration, statut, prime_payee, marchand_id)
-- SELECT
--   v.id,
--   e.email,
--   e.prenom,
--   v.prix_actuel,
--   ROUND(v.prix_actuel * 0.05, 2),
--   ROUND(v.prix_actuel * 0.05 * 0.30, 2),
--   ROUND(v.prix_actuel * 0.05 * 0.70, 2),
--   e.jours,
--   NOW() + (e.jours * INTERVAL '1 day') - INTERVAL '3 days',
--   e.statut,
--   true,
--   (SELECT id FROM marchands WHERE email = 'demo@moetly.com')
-- FROM (
--   VALUES
--     ('camille.bernard@email.com', 'Camille', 60, 'active'),
--     ('sophie.martin@gmail.com', 'Sophie', 30, 'active'),
--     ('thomas.dupont@outlook.com', 'Thomas', 90, 'finalisee'),
--     ('amira.diallo@yahoo.fr', 'Amira', 60, 'active'),
--     ('pierre.rousseau@gmail.com', 'Pierre', 30, 'expiree')
-- ) AS e(email, prenom, jours, statut)
-- CROSS JOIN LATERAL (
--   SELECT * FROM vols ORDER BY RANDOM() LIMIT 1
-- ) v;
