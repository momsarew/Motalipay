import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const origine = searchParams.get('origine');
  const destination = searchParams.get('destination');

  let query = supabase
    .from('vols')
    .select('*')
    .eq('disponible', true)
    .order('date_vol', { ascending: true });

  if (origine) query = query.eq('origine', origine);
  if (destination) query = query.eq('destination', destination);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
