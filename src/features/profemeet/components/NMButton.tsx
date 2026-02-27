import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'inset';
  fullWidth?: boolean;
}

export function NMButton({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}: Props) {
  const baseClass = variant === 'inset' ? 'nm-inset' : 'nm-button';
  const variantClass = variant === 'primary' ? 'nm-button-primary' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseClass} ${variantClass} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
