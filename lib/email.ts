import { Resend } from 'resend';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { LienPaiement, Reservation, Vol } from '@/types';

type SendPrimePaidEmailParams = {
  to: string;
  prenom: string;
  reservation: ReservationPrimePaidEmail;
  paymentIntentId: string;
};

type SendExpirationReminderEmailParams = {
  to: string;
  prenom: string;
  reservation: ReservationExpirationReminderEmail;
  remainingAmount: number;
  finalizationUrl: string;
  expirationDayKey: string; // YYYY-MM-DD, used for idempotency.
};

type SendFinalizationEmailParams = {
  to: string;
  prenom: string;
  reservation: ReservationFinalizationEmail;
  totalPaid: number;
};

type ReservationPrimePaidEmail = {
  montant_prime: number;
  prix_bloque: number;
  duree_jours: number;
  date_expiration: string;
  vol?: Vol | Vol[] | null;
  lien_paiement?: LienPaiement | LienPaiement[] | null;
};

type ReservationExpirationReminderEmail = {
  id: string;
  date_expiration: string;
};

type ReservationFinalizationEmail = {
  id: string;
  vol?: Vol | Vol[] | null;
  lien_paiement?: LienPaiement | LienPaiement[] | null;
};

function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'contact@moetly.com';
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }
  return new Resend(apiKey);
}

function normalizeOne<T>(maybe: T | T[] | null | undefined): T | null {
  if (!maybe) return null;
  if (Array.isArray(maybe)) return maybe[0] ?? null;
  return maybe;
}

function getTrajetLabel(reservation: { vol?: Vol | Vol[] | null; lien_paiement?: LienPaiement | LienPaiement[] | null }): string {
  const vol = normalizeOne(reservation.vol);
  if (vol) {
    return `${vol.ville_origine} → ${vol.ville_destination}`;
  }
  const lien = normalizeOne(reservation.lien_paiement);
  if (lien) {
    return `${lien.ville_origine} → ${lien.ville_destination}`;
  }
  return 'Réservation';
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function sendPrimePaidEmail(params: SendPrimePaidEmailParams) {
  const { to, prenom, reservation, paymentIntentId } = params;
  const trajetLabel = getTrajetLabel(reservation);

  const subject = `Confirmation de votre prime Moetly Pay`;

  const html = `
  <div style="font-family: Inter, Arial, sans-serif; background:#f8fafc; padding:24px;">
    <div style="max-width:600px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
      <div style="background:#1A6FC4; color:#fff; padding:18px 22px;">
        <div style="font-size:18px; font-weight:700;">Moetly Pay</div>
      </div>
      <div style="padding:22px;">
        <p style="margin:0 0 16px; color:#0f172a;">Bonjour ${escapeHtml(prenom)},</p>
        <p style="margin:0 0 16px; color:#0f172a;">Votre prime a bien été payée. Voici le récapitulatif :</p>

        <div style="background:#F5C842; color:#0C4A8F; padding:14px 16px; border-radius:12px; margin:16px 0;">
          <div style="font-weight:700; margin-bottom:6px;">Montant de la prime</div>
          <div style="font-size:22px; font-weight:800;">${escapeHtml(formatCurrency(reservation.montant_prime))}</div>
        </div>

        <div style="color:#111827; line-height:1.7;">
          <div><strong>Trajet :</strong> ${escapeHtml(trajetLabel)}</div>
          <div><strong>Prix bloqué :</strong> ${escapeHtml(formatCurrency(reservation.prix_bloque))}</div>
          <div><strong>Durée :</strong> ${escapeHtml(String(reservation.duree_jours))} jours</div>
          <div><strong>Date d’expiration :</strong> ${escapeHtml(formatDate(reservation.date_expiration))}</div>
        </div>

        <p style="margin:18px 0 0; color:#6b7280; font-size:12px;">
          Si vous n’êtes pas à l’origine de cette action, contactez-nous.
        </p>
      </div>
    </div>
  </div>
  `;

  const text = `Bonjour ${prenom}, votre prime Moetly Pay a bien été payée.\nTrajet: ${trajetLabel}\nPrix bloqué: ${formatCurrency(
    reservation.prix_bloque
  )}\nDurée: ${reservation.duree_jours} jours\nExpiration: ${formatDate(reservation.date_expiration)}`;

  await getResendClient().emails.send({
    from: getResendFromEmail(),
    to,
    subject,
    html,
    text,
  }, { idempotencyKey: `moetly:prime-paid:${paymentIntentId}` });
}

export async function sendExpirationReminderEmail(params: SendExpirationReminderEmailParams) {
  const { to, prenom, reservation, remainingAmount, finalizationUrl, expirationDayKey } = params;
  const subject = `Rappel: finalisez votre réservation avant le ${formatDate(reservation.date_expiration)}`;

  const html = `
  <div style="font-family: Inter, Arial, sans-serif; background:#f8fafc; padding:24px;">
    <div style="max-width:600px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
      <div style="background:#1A6FC4; color:#fff; padding:18px 22px;">
        <div style="font-size:18px; font-weight:700;">Moetly Pay</div>
      </div>
      <div style="padding:22px;">
        <p style="margin:0 0 16px; color:#0f172a;">Bonjour ${escapeHtml(prenom)},</p>

        <p style="margin:0 0 16px; color:#0f172a;">
          Il ne vous reste plus que 7 jours pour finaliser votre réservation.
        </p>

        <div style="background:#F5C842; color:#0C4A8F; padding:14px 16px; border-radius:12px; margin:16px 0;">
          <div style="font-weight:700; margin-bottom:6px;">Montant restant à payer</div>
          <div style="font-size:22px; font-weight:800;">${escapeHtml(formatCurrency(remainingAmount))}</div>
        </div>

        <p style="margin:0 0 14px; color:#111827;">
          <strong>Date limite :</strong> ${escapeHtml(formatDate(reservation.date_expiration))}
        </p>

        <div style="margin:18px 0;">
          <a href="${escapeHtml(finalizationUrl)}"
             style="display:inline-block; background:#1A6FC4; color:#fff; text-decoration:none; padding:12px 18px; border-radius:12px; font-weight:700;">
            Finaliser ma réservation
          </a>
        </div>

        <p style="margin:18px 0 0; color:#6b7280; font-size:12px;">
          Ce rappel est automatique.
        </p>
      </div>
    </div>
  </div>
  `;

  const text = `Bonjour ${prenom},\n\nIl ne vous reste plus que 7 jours pour finaliser votre réservation.\nMontant restant à payer: ${formatCurrency(
    remainingAmount
  )}\nDate limite: ${formatDate(reservation.date_expiration)}\n\nFinaliser: ${finalizationUrl}`;

  await getResendClient().emails.send({
    from: getResendFromEmail(),
    to,
    subject,
    html,
    text,
  }, { idempotencyKey: `moetly:remind-expiration:${expirationDayKey}:${reservation.id}` });
}

export async function sendFinalizationEmail(params: SendFinalizationEmailParams) {
  const { to, prenom, reservation, totalPaid } = params;
  const trajetLabel = getTrajetLabel(reservation);
  const subject = `Votre réservation est finalisée — félicitations !`;

  const html = `
  <div style="font-family: Inter, Arial, sans-serif; background:#f8fafc; padding:24px;">
    <div style="max-width:600px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
      <div style="background:#1A6FC4; color:#fff; padding:18px 22px;">
        <div style="font-size:18px; font-weight:700;">Moetly Pay</div>
      </div>
      <div style="padding:22px;">
        <p style="margin:0 0 16px; color:#0f172a;">Bonjour ${escapeHtml(prenom)},</p>
        <p style="margin:0 0 16px; color:#0f172a; font-weight:700;">Félicitations ! Votre réservation est finalisée.</p>

        <div style="background:#F5C842; color:#0C4A8F; padding:14px 16px; border-radius:12px; margin:16px 0;">
          <div style="font-weight:700; margin-bottom:6px;">Montant total payé</div>
          <div style="font-size:22px; font-weight:800;">${escapeHtml(formatCurrency(totalPaid))}</div>
        </div>

        <div style="color:#111827; line-height:1.7;">
          <div><strong>Trajet :</strong> ${escapeHtml(trajetLabel)}</div>
        </div>

        <p style="margin:18px 0 0; color:#6b7280; font-size:12px;">
          Merci d’avoir utilisé Moetly Pay.
        </p>
      </div>
    </div>
  </div>
  `;

  const text = `Bonjour ${prenom},\n\nFélicitations ! Votre réservation est finalisée.\nTrajet: ${trajetLabel}\nMontant total payé: ${formatCurrency(
    totalPaid
  )}`;

  await getResendClient().emails.send({
    from: getResendFromEmail(),
    to,
    subject,
    html,
    text,
  }, { idempotencyKey: `moetly:finalisee:${reservation.id}` });
}

