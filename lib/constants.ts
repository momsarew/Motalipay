export const MOETLY_CONFIG = {
  PRIME_RATE: 0.05,
  MOETLY_SHARE: 0.30,
  MARCHAND_SHARE: 0.70,

  DURATIONS: [
    { days: 30, label: '30 jours', discount: 0 },
    { days: 60, label: '60 jours', discount: 0, recommended: true },
    { days: 90, label: '90 jours', surcharge: 0.005 },
  ],

  CURRENCY: 'EUR',
  STRIPE_MIN_AMOUNT_CENTS: 50,
} as const;
