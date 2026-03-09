import { createServiceClient } from '@/lib/supabase/server';
import { requireMarchandAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireMarchandAuth();
  if (auth.error) return auth.error;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('templates_routes')
    .select('*')
    .eq('marchand_id', auth.marchand_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Templates GET error:', error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireMarchandAuth();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { nom, ville_origine, ville_destination, origine, destination, compagnie, prix_defaut } = body;

    if (!nom || !ville_origine || !ville_destination) {
      return NextResponse.json({ error: 'Champs requis : nom, ville_origine, ville_destination' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verifier le max de templates
    const { count } = await supabase
      .from('templates_routes')
      .select('*', { count: 'exact', head: true })
      .eq('marchand_id', auth.marchand_id);

    if (count !== null && count >= 20) {
      return NextResponse.json({ error: 'Maximum 20 templates atteint. Supprimez un template existant.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('templates_routes')
      .insert({
        marchand_id: auth.marchand_id,
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
      console.error('Templates POST error:', error.message);
      return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireMarchandAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify the template belongs to the authenticated merchant
  const { data: template } = await supabase
    .from('templates_routes')
    .select('marchand_id')
    .eq('id', id)
    .single();

  if (!template || template.marchand_id !== auth.marchand_id) {
    return NextResponse.json({ error: 'Template non trouve ou non autorise' }, { status: 404 });
  }

  const { error } = await supabase
    .from('templates_routes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Templates DELETE error:', error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
