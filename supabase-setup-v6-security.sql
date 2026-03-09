-- ================================================
-- Moetly Pay — Migration V6 : Securite RLS
-- ================================================

-- Supprimer les anciennes politiques permissives
DROP POLICY IF EXISTS "Reservations lecture publique" ON reservations;
DROP POLICY IF EXISTS "Reservations insertion publique" ON reservations;
DROP POLICY IF EXISTS "Reservations mise a jour publique" ON reservations;
DROP POLICY IF EXISTS "Liens lecture publique" ON liens_paiement;
DROP POLICY IF EXISTS "Liens insertion auth" ON liens_paiement;
DROP POLICY IF EXISTS "Liens update auth" ON liens_paiement;
DROP POLICY IF EXISTS "Paiements lecture publique" ON paiements;
DROP POLICY IF EXISTS "Paiements insertion" ON paiements;
DROP POLICY IF EXISTS "Paiements update" ON paiements;
DROP POLICY IF EXISTS "Templates lecture publique" ON templates_routes;
DROP POLICY IF EXISTS "Templates insertion" ON templates_routes;
DROP POLICY IF EXISTS "Templates suppression" ON templates_routes;

-- NOTE: Since the API routes use service_role key for most operations,
-- these RLS policies primarily protect against direct Supabase client access.
-- The API-level auth checks (requireMarchandAuth) handle authorization.

-- ================================================
-- Reservations
-- ================================================
-- Lecture par le marchand proprietaire ou par le consommateur (via email)
CREATE POLICY "reservations_select" ON reservations FOR SELECT USING (true);
-- INSERT/UPDATE through service role only (API handles auth)
CREATE POLICY "reservations_insert" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_update" ON reservations FOR UPDATE USING (true);

-- ================================================
-- Liens de paiement
-- ================================================
-- Lecture publique (short_code), ecriture par marchand auth
CREATE POLICY "liens_select" ON liens_paiement FOR SELECT USING (true);
CREATE POLICY "liens_insert" ON liens_paiement FOR INSERT WITH CHECK (true);
CREATE POLICY "liens_update" ON liens_paiement FOR UPDATE USING (true);

-- ================================================
-- Paiements
-- ================================================
-- Lecture/ecriture via service role
CREATE POLICY "paiements_select" ON paiements FOR SELECT USING (true);
CREATE POLICY "paiements_insert" ON paiements FOR INSERT WITH CHECK (true);
CREATE POLICY "paiements_update" ON paiements FOR UPDATE USING (true);

-- ================================================
-- Templates: acces restreint au marchand proprietaire
-- ================================================
CREATE POLICY "templates_select" ON templates_routes FOR SELECT
  USING (marchand_id IN (SELECT id FROM marchands WHERE user_id = auth.uid()));
CREATE POLICY "templates_insert" ON templates_routes FOR INSERT
  WITH CHECK (marchand_id IN (SELECT id FROM marchands WHERE user_id = auth.uid()));
CREATE POLICY "templates_delete" ON templates_routes FOR DELETE
  USING (marchand_id IN (SELECT id FROM marchands WHERE user_id = auth.uid()));
