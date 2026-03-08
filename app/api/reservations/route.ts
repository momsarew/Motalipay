import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const marchand_id = searchParams.get('marchand_id');
  const statut = searchParams.get('statut');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const supabase = createServiceClient();

  let query = supabase
    .from('reservations')
    .select('*, vol:vols(*), lien_paiement:liens_paiement(*), paiements(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (email) query = query.eq('consommateur_email', email);
  if (marchand_id) query = query.eq('marchand_id', marchand_id);
  if (statut && statut !== 'all') query = query.eq('statut', statut);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, page, limit });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await req.json();

  const { data, error } = await (await supabase)
    .from('reservations')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
