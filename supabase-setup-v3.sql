-- =============================================
-- MOETLY PAY v3 — Système Multi-Paiements
-- =============================================
-- Exécutez ce script dans le SQL Editor de Supabase
-- APRÈS avoir exécuté supabase-setup.sql et supabase-setup-v2.sql
-- =============================================

-- 1. TABLE PAIEMENTS (registre de tous les versements)
CREATE TABLE IF NOT EXISTS paiements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id),
  montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
  type VARCHAR(20) NOT NULL CHECK (type IN ('prime', 'partiel', 'solde')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirme', 'echoue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paiements_reservation ON paiements(reservation_id);
CREATE INDEX IF NOT EXISTS idx_paiements_stripe_pi ON paiements(stripe_payment_intent_id);

-- 2. RLS pour paiements
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paiements lecture publique" ON paiements
  FOR SELECT USING (true);

CREATE POLICY "Paiements insertion" ON paiements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Paiements update" ON paiements
  FOR UPDATE USING (true);

-- 3. Ajouter total_paye aux réservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS total_paye DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 4. Backfill : créer des enregistrements paiements pour les primes déjà payées
INSERT INTO paiements (reservation_id, montant, type, stripe_payment_intent_id, stripe_charge_id, statut)
SELECT id, montant_prime, 'prime', stripe_payment_intent_id, stripe_charge_id, 'confirme'
FROM reservations
WHERE prime_payee = true
AND NOT EXISTS (
  SELECT 1 FROM paiements p WHERE p.reservation_id = reservations.id AND p.type = 'prime'
);

-- 5. Mettre à jour total_paye pour les réservations existantes
UPDATE reservations SET total_paye = montant_prime WHERE prime_payee = true AND total_paye = 0;
