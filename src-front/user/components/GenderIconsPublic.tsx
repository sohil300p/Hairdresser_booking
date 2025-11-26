import React from 'react';

interface GenderIconProps {
  className?: string;
}

// Alternative implementation using public directory
export const MaleIconPublic: React.FC<GenderIconProps> = ({ className = 'w-6 h-6' }) => (
  <div className={className}>
    <img 
      src="/images/man.svg" 
      alt="male" 
      className="w-full h-full object-contain"
    />
  </div>
);

export const FemaleIconPublic: React.FC<GenderIconProps> = ({ className = 'w-6 h-6' }) => (
  <div className={className}>
    <img 
      src="/images/woman.svg" 
      alt="female" 
      className="w-full h-full object-contain"
    />
  </div>
);

// You can switch to these if the import method doesn't work:
// Just replace the imports in Icon.tsx:
// import { MaleIconPublic as MaleIcon, FemaleIconPublic as FemaleIcon } from './GenderIconsPublic';
