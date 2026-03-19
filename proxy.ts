import { NextRequest, NextResponse } from 'next/server';

type HitBucket = {
  resetAtMs: number;
  count: number;
};

const WINDOW_MS = 60_000;
const LIMIT = 10;

declare global {
  var __moetlyRateLimitStripeCheckout: Map<string, HitBucket> | undefined;
}

const buckets: Map<string, HitBucket> =
  globalThis.__moetlyRateLimitStripeCheckout ?? new Map<string, HitBucket>();
globalThis.__moetlyRateLimitStripeCheckout = buckets;

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (!forwardedFor) return 'unknown';

  // x-forwarded-for can be: "client, proxy1, proxy2"
  return forwardedFor.split(',')[0]?.trim() || 'unknown';
}

export function proxy(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();

  const existing = buckets.get(ip);
  if (!existing || now >= existing.resetAtMs) {
    buckets.set(ip, { resetAtMs: now + WINDOW_MS, count: 1 });
    return NextResponse.next();
  }

  if (existing.count >= LIMIT) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000));
    return NextResponse.json(
      {
        error: 'rate_limited',
        message: 'Too many requests. Please retry later.',
      },
      {
        status: 429,
        headers: {
          'retry-after': String(retryAfterSeconds),
        },
      },
    );
  }

  existing.count += 1;
  buckets.set(ip, existing);

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/stripe/checkout'],
};

