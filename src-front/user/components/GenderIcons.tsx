import React from 'react';
import manIcon from '../assets/images/man.svg';
import womanIcon from '../assets/images/woman.svg';

interface GenderIconProps {
  className?: string;
  selected?: boolean;
  color?: string;
}

export const MaleIcon: React.FC<GenderIconProps> = ({ 
  className = 'w-6 h-6', 
  selected = false,
  color 
}) => (
  <div className={`${className} transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
    <img 
      src={manIcon} 
      alt="male" 
      className="w-full h-full object-contain drop-shadow-sm"
      style={{
        filter: color ? `hue-rotate(${color === 'blue' ? '200deg' : '0deg'}) saturate(1.2)` : undefined,
        transform: selected ? 'scale(1.05)' : 'scale(1)'
      }}
      loading="lazy"
    />
  </div>
);

export const FemaleIcon: React.FC<GenderIconProps> = ({ 
  className = 'w-6 h-6', 
  selected = false,
  color 
}) => (
  <div className={`${className} transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
    <img 
      src={womanIcon} 
      alt="female" 
      className="w-full h-full object-contain drop-shadow-sm"
      style={{
        filter: color ? `hue-rotate(${color === 'pink' ? '320deg' : '0deg'}) saturate(1.2)` : undefined,
        transform: selected ? 'scale(1.05)' : 'scale(1)'
      }}
      loading="lazy"
    />
  </div>
);
