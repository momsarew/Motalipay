import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function requireMarchandAuth() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, marchand_id: null, error: NextResponse.json({ error: 'Non autorise' }, { status: 401 }) };
  }

  // Get marchand record
  const { data: marchand } = await supabase
    .from('marchands')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!marchand) {
    return { user, marchand_id: null, error: NextResponse.json({ error: 'Marchand non trouve' }, { status: 403 }) };
  }

  return { user, marchand_id: marchand.id, error: null };
}
