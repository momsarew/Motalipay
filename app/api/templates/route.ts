import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marchand_id = searchParams.get('marchand_id');

  if (!marchand_id) {
    return NextResponse.json({ error: 'marchand_id requis' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('templates_routes')
    .select('*')
    .eq('marchand_id', marchand_id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { marchand_id, nom, ville_origine, ville_destination, origine, destination, compagnie, prix_defaut } = body;

    if (!marchand_id || !nom || !ville_origine || !ville_destination) {
      return NextResponse.json({ error: 'Champs requis : marchand_id, nom, ville_origine, ville_destination' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Vérifier le max de templates
    const { count } = await supabase
      .from('templates_routes')
      .select('*', { count: 'exact', head: true })
      .eq('marchand_id', marchand_id);

    if (count !== null && count >= 20) {
      return NextResponse.json({ error: 'Maximum 20 templates atteint. Supprimez un template existant.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('templates_routes')
      .insert({
        marchand_id,
        nom,
        ville_origine,
        ville_destination,
        origine: origine || null,
        destination: destination || null,
        compagnie: compagnie || null,
        prix_defaut: prix_defaut ? parseFloat(prix_defaut) : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from('templates_routes')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
