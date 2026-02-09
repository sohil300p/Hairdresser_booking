
import React from 'react';

type ButtonProps = {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
  className?: string;
  disabled?: boolean;
  sticky?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  sticky = false,
}) => {
  const baseClasses = `w-full text-center py-3 px-4 rounded-lg font-bold transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${sticky ? 'mt-auto mb-6' : ''}`;

  const variantClasses = {
    primary: 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:bg-opacity-90',
    secondary: 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-gray-300',
    ghost: 'bg-transparent text-[var(--md-sys-color-primary)] hover:bg-blue-50',
    danger: 'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] hover:opacity-90',
    'danger-ghost': 'bg-red-100 text-[var(--md-sys-color-error)] hover:bg-red-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};