import { NextRequest, NextResponse } from 'next/server';
import { generateDashboardToken } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }
    const token = generateDashboardToken(email);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
