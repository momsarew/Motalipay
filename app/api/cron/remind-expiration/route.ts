import { createServiceClient } from '@/lib/supabase/server';
import { resteAPayer } from '@/lib/utils';
import { generateDashboardToken } from '@/lib/tokens';
import { sendExpirationReminderEmail } from '@/lib/email';
import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function parseBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+?)$/i);
  return match?.[1]?.trim() || null;
}

function isAuthorized(req: NextRequest, cronSecret: string): boolean {
  const providedToken = parseBearerToken(req.headers.get('authorization'));
  if (!providedToken) return false;

  if (providedToken.length !== cronSecret.length) return false;
  const a = Buffer.from(providedToken, 'utf8');
  const b = Buffer.from(cronSecret, 'utf8');
  return timingSafeEqual(a, b);
}

async function remindExpiration() {
  const supabase = createServiceClient();

  const now = new Date();
  const targetDayStart = new Date(now);
  targetDayStart.setUTCDate(targetDayStart.getUTCDate() + 7);
  targetDayStart.setUTCHours(0, 0, 0, 0);

  const targetDayEnd = new Date(targetDayStart);
  targetDayEnd.setUTCDate(targetDayEnd.getUTCDate() + 1);

  const expirationDayKey = targetDayStart.toISOString().slice(0, 10); // YYYY-MM-DD

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: 'Missing NEXT_PUBLIC_APP_URL' }, { status: 500 });
  }
  const normalizedAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('id, consommateur_email, consommateur_prenom, prix_bloque, total_paye, date_expiration, duree_jours, statut, vol:vols(*), lien_paiement:liens_paiement(*)')
    .eq('statut', 'active')
    .gte('date_expiration', targetDayStart.toISOString())
    .lt('date_expiration', targetDayEnd.toISOString());

  if (error) {
    console.error('Remind expiration query failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  let processed = 0;
  for (const reservation of reservations ?? []) {
    const to = reservation.consommateur_email;
    const prenom = reservation.consommateur_prenom;
    if (!to) continue;

    const remainingAmount = resteAPayer(reservation.prix_bloque, reservation.total_paye || 0);
    if (remainingAmount <= 0) continue;

    const token = generateDashboardToken(to);
    const finalizationUrl = `${normalizedAppUrl}/dashboard?email=${encodeURIComponent(to)}&token=${encodeURIComponent(
      token
    )}`;

    try {
      await sendExpirationReminderEmail({
        to,
        prenom,
        reservation,
        remainingAmount,
        finalizationUrl,
        expirationDayKey,
      });
      processed += 1;
    } catch {
      console.error('[Moetly] Failed to send expiration reminder email');
    }
  }

  return NextResponse.json({ processed, expirationDayKey });
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
  }

  if (!isAuthorized(req, cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return remindExpiration();
}

export async function GET(req: NextRequest) {
  // Allow manual testing via browser/curl.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
  }

  if (!isAuthorized(req, cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return remindExpiration();
}

