interface ProgressBarProps {
  current: number;
  total: number;
  showLabels?: boolean;
  className?: string;
}

export default function ProgressBar({ current, total, showLabels = true, className = '' }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className={className}>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, var(--blue-primary), var(--yellow-accent))',
          }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(current)} payés</span>
          <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(total)} total</span>
        </div>
      )}
    </div>
  );
}
