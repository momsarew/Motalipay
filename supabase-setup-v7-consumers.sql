-- ================================================
-- Moetly Pay — Migration V7 : Comptes consommateurs
-- ================================================

-- Table consommateurs
CREATE TABLE IF NOT EXISTS consommateurs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  prenom VARCHAR(100),
  nom VARCHAR(100),
  telephone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email),
  UNIQUE(user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_consommateurs_email ON consommateurs(email);
CREATE INDEX IF NOT EXISTS idx_consommateurs_user_id ON consommateurs(user_id);

-- RLS
ALTER TABLE consommateurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consommateurs_select_own" ON consommateurs FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "consommateurs_insert" ON consommateurs FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "consommateurs_update_own" ON consommateurs FOR UPDATE
  USING (user_id = auth.uid());

-- Ajouter quota_blocage aux marchands
ALTER TABLE marchands ADD COLUMN IF NOT EXISTS quota_blocage INTEGER DEFAULT NULL;
-- NULL = pas de limite, sinon = nombre max de blocages actifs simultanes

-- Ajouter consommateur_id aux reservations (optionnel, lien vers compte)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS consommateur_id UUID REFERENCES consommateurs(id);
CREATE INDEX IF NOT EXISTS idx_reservations_consommateur_id ON reservations(consommateur_id);
