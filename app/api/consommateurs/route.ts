import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('consommateurs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Consumer profile not found, return empty
      if (error.code === 'PGRST116') {
        return NextResponse.json({ data: null });
      }
      console.error('Consumer GET error:', error.message);
      return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await req.json();
    const { email, prenom, nom, telephone } = body;

    const serviceClient = createServiceClient();

    // Check if consumer already exists
    const { data: existing } = await serviceClient
      .from('consommateurs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ data: existing, message: 'Profil existant' });
    }

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      email: email || user.email,
    };
    if (prenom) insertData.prenom = prenom;
    if (nom) insertData.nom = nom;
    if (telephone) insertData.telephone = telephone;

    const { data, error } = await serviceClient
      .from('consommateurs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Consumer POST error:', error.message);
      return NextResponse.json({ error: 'Erreur lors de la creation du profil' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.prenom !== undefined) updateData.prenom = body.prenom;
    if (body.nom !== undefined) updateData.nom = body.nom;
    if (body.telephone !== undefined) updateData.telephone = body.telephone;

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('consommateurs')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Consumer PATCH error:', error.message);
      return NextResponse.json({ error: 'Erreur lors de la mise a jour' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
