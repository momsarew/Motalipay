export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function formatDateShort(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function shortId(uuid: string): string {
  return 'MO-' + uuid.substring(0, 4).toUpperCase();
}

export function daysRemaining(expirationDate: string): number {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function calculatePrime(prix: number, rate: number = 0.05): {
  montant_prime: number;
  part_moetly: number;
  part_marchand: number;
  reste_a_payer: number;
} {
  const montant_prime = Math.round(prix * rate * 100) / 100;
  const part_moetly = Math.round(montant_prime * 0.30 * 100) / 100;
  const part_marchand = Math.round(montant_prime * 0.70 * 100) / 100;
  const reste_a_payer = Math.round((prix - montant_prime) * 100) / 100;
  return { montant_prime, part_moetly, part_marchand, reste_a_payer };
}
