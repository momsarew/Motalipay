'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'accent' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-primary text-white hover:bg-blue-dark shadow-sm',
  accent: 'bg-yellow-accent text-gray-900 hover:bg-yellow-dark shadow-sm font-semibold',
  ghost: 'bg-transparent text-blue-primary hover:bg-blue-light border border-blue-primary',
  danger: 'bg-error text-white hover:opacity-90 shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          font-[family-name:var(--font-sora)] font-semibold
          transition-all duration-200 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Chargement...
          </span>
        ) : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
