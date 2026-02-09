import React from 'react';
import manOptimizedIcon from '../assets/images/man-optimized.svg';
import womanOptimizedIcon from '../assets/images/woman-optimized.svg';

interface GenderIconProps {
  className?: string;
  selected?: boolean;
  color?: string;
}

export const MaleIconOptimized: React.FC<GenderIconProps> = ({ 
  className = 'w-6 h-6', 
  selected = false,
  color 
}) => (
  <div className={`${className} transition-all duration-300 ${selected ? 'scale-110' : 'scale-100'}`}>
    <img 
      src={manOptimizedIcon} 
      alt="male" 
      className="w-full h-full object-contain filter transition-all duration-300"
      style={{
        filter: selected 
          ? 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3)) brightness(1.1)' 
          : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
      }}
      loading="lazy"
    />
  </div>
);

export const FemaleIconOptimized: React.FC<GenderIconProps> = ({ 
  className = 'w-6 h-6', 
  selected = false,
  color 
}) => (
  <div className={`${className} transition-all duration-300 ${selected ? 'scale-110' : 'scale-100'}`}>
    <img 
      src={womanOptimizedIcon} 
      alt="female" 
      className="w-full h-full object-contain filter transition-all duration-300"
      style={{
        filter: selected 
          ? 'drop-shadow(0 4px 8px rgba(236, 72, 153, 0.3)) brightness(1.1)' 
          : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
      }}
      loading="lazy"
    />
  </div>
);

// Instructions to use optimized versions:
// Replace imports in Icon.tsx:
// import { MaleIconOptimized as MaleIcon, FemaleIconOptimized as FemaleIcon } from './GenderIconsOptimized';
