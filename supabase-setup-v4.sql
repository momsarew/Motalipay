-- =============================================
-- MOETLY PAY v4 — Templates de routes fréquentes
-- =============================================
-- Exécutez ce script dans le SQL Editor de Supabase
-- APRÈS avoir exécuté supabase-setup-v3.sql
-- =============================================

CREATE TABLE IF NOT EXISTS templates_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  marchand_id UUID NOT NULL REFERENCES marchands(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  ville_origine VARCHAR(100) NOT NULL,
  ville_destination VARCHAR(100) NOT NULL,
  origine VARCHAR(10),
  destination VARCHAR(10),
  compagnie VARCHAR(100),
  prix_defaut DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_marchand ON templates_routes(marchand_id);

ALTER TABLE templates_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates lecture publique" ON templates_routes
  FOR SELECT USING (true);

CREATE POLICY "Templates insertion" ON templates_routes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Templates suppression" ON templates_routes
  FOR DELETE USING (true);
