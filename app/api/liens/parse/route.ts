import { NextRequest, NextResponse } from 'next/server';
import { parseBookingText } from '@/lib/booking-parser';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texte requis' }, { status: 400 });
    }

    if (text.length > 10000) {
      return NextResponse.json({ error: 'Texte trop long (max 10 000 caractères)' }, { status: 400 });
    }

    const parsed = parseBookingText(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Erreur de parsing' }, { status: 500 });
  }
}
