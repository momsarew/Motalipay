-- =============================================
-- MOETLY PAY v2 — Liens de paiement
-- =============================================
-- Exécutez ce script dans le SQL Editor de Supabase
-- APRÈS avoir exécuté supabase-setup.sql
-- =============================================

-- 1. TABLE LIENS DE PAIEMENT
CREATE TABLE IF NOT EXISTS liens_paiement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code VARCHAR(8) UNIQUE NOT NULL,
  marchand_id UUID REFERENCES marchands(id) NOT NULL,
  -- Détails du vol (saisis par le marchand)
  ville_origine VARCHAR(100) NOT NULL,
  ville_destination VARCHAR(100) NOT NULL,
  origine VARCHAR(3),
  destination VARCHAR(3),
  prix DECIMAL(10,2) NOT NULL,
  date_vol DATE,
  compagnie VARCHAR(100),
  reference_billet VARCHAR(100),
  note_marchand TEXT,
  -- Config
  actif BOOLEAN DEFAULT true,
  usage_unique BOOLEAN DEFAULT false,
  -- Stats
  nb_vues INTEGER DEFAULT 0,
  nb_paiements INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_liens_short_code ON liens_paiement(short_code);
CREATE INDEX IF NOT EXISTS idx_liens_marchand ON liens_paiement(marchand_id);

-- 2. RLS
ALTER TABLE liens_paiement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Liens lecture publique" ON liens_paiement
  FOR SELECT USING (true);

CREATE POLICY "Liens insertion auth" ON liens_paiement
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Liens update auth" ON liens_paiement
  FOR UPDATE USING (true);

-- 3. Ajouter colonne lien_paiement_id aux réservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS lien_paiement_id UUID REFERENCES liens_paiement(id);
