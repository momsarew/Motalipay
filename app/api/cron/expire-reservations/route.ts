import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

function parseBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+?)$/i);
  return match?.[1]?.trim() || null;
}

function isAuthorized(req: NextRequest, cronSecret: string): boolean {
  const providedToken = parseBearerToken(req.headers.get('authorization'));
  if (!providedToken) return false;

  // Avoid timing leaks while keeping logic simple.
  if (providedToken.length !== cronSecret.length) return false;
  const a = Buffer.from(providedToken, 'utf8');
  const b = Buffer.from(cronSecret, 'utf8');
  return timingSafeEqual(a, b);
}

async function expireReservations() {
  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  // Count how many reservations will be expired (avoid returning row payloads).
  const { count, error: countError } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'active')
    .lt('date_expiration', nowIso);

  if (countError) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('reservations')
    .update({
      statut: 'expiree',
      updated_at: nowIso,
    })
    .eq('statut', 'active')
    .lt('date_expiration', nowIso);

  if (updateError) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ updated: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
  }

  if (!isAuthorized(req, cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return expireReservations();
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
  return expireReservations();
}

