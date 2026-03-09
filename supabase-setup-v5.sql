-- ================================================
-- Moetly Pay — Migration V5 : Ouverture multi-secteurs
-- ================================================
-- Ajoute la colonne 'secteur' à liens_paiement
-- Valeurs : 'transport', 'evenement', 'hebergement', 'autre'
-- Default : 'transport' (backward compatible avec les liens existants)

-- 1. Ajout de la colonne secteur
ALTER TABLE liens_paiement
ADD COLUMN IF NOT EXISTS secteur VARCHAR(20) DEFAULT 'transport';

-- 2. Mise à jour des liens existants (tous sont transport par défaut)
UPDATE liens_paiement SET secteur = 'transport' WHERE secteur IS NULL;

-- 3. Ajout du secteur aux templates aussi
ALTER TABLE templates_routes
ADD COLUMN IF NOT EXISTS secteur VARCHAR(20) DEFAULT 'transport';

UPDATE templates_routes SET secteur = 'transport' WHERE secteur IS NULL;
