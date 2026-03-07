type BadgeVariant = 'active' | 'expired' | 'pending' | 'completed' | 'info';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  info: 'bg-gray-100 text-gray-700 border-gray-200',
};

const labels: Record<string, string> = {
  active: 'Active',
  finalisee: 'Finalisée',
  expiree: 'Expirée',
  annulee: 'Annulée',
};

export function statutToVariant(statut: string): BadgeVariant {
  switch (statut) {
    case 'active': return 'active';
    case 'finalisee': return 'completed';
    case 'expiree': return 'expired';
    case 'annulee': return 'expired';
    default: return 'info';
  }
}

export function statutLabel(statut: string): string {
  return labels[statut] || statut;
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
