import React from 'react';
import { GlassSettings } from '../types';
import { triggerHaptic } from '../lib/haptics';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  settings?: GlassSettings;
  icon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  settings,
  icon,
  className = '',
  onClick,
  ...props
}) => {
  const specular = settings ? settings.specularIntensity / 100 : 0.85;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'danger') {
      triggerHaptic('warning');
    } else if (variant === 'primary') {
      triggerHaptic('medium');
    } else {
      triggerHaptic('light');
    }
    onClick?.(e);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-full gap-1.5',
    md: 'px-4 py-2 text-sm rounded-full gap-2',
    lg: 'px-6 py-3 text-base rounded-full gap-2.5'
  };

  const variantClasses = {
    primary: 'bg-blue-500/25 hover:bg-blue-500/40 text-blue-100 border-blue-400/30 shadow-blue-900/30',
    secondary: 'bg-white/[0.08] hover:bg-white/[0.16] text-slate-100 border-white/20 shadow-black/40',
    danger: 'bg-rose-500/25 hover:bg-rose-500/40 text-rose-100 border-rose-400/30 shadow-rose-900/30',
    ghost: 'bg-transparent hover:bg-white/[0.08] text-slate-300 hover:text-white border-transparent'
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      style={{
        boxShadow: variant !== 'ghost' ? `
          0 8px 20px -6px rgba(0, 0, 0, 0.4),
          inset 0 1px 1px 0 rgba(255, 255, 255, ${0.45 * specular}),
          inset 0 -1px 1px 0 rgba(0, 0, 0, 0.3)
        ` : undefined
      }}
      className={`relative inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none backdrop-blur-md border ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};

