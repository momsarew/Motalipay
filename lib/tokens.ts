import { createHash } from 'crypto';

export function generateAccessToken(email: string, reservationId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
  return createHash('sha256')
    .update(`${email}:${reservationId}:${secret}`)
    .digest('hex')
    .substring(0, 32);
}

export function generateDashboardToken(email: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
  return createHash('sha256')
    .update(`dashboard:${email}:${secret}`)
    .digest('hex')
    .substring(0, 32);
}
