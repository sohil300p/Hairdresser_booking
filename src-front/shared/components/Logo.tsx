import React from 'react';
import logoImage from '../../src/assets/images/Logo-normalized.svg';

interface LogoProps {
  className?: string;
  height?: number | string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', height = 64 }) => {
  return (
    <img 
      src={logoImage} 
      alt="KitChi Logo" 
      className={className}
      style={{ height }}
    />
  );
};

