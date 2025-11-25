import React from 'react';
import { Scissors } from 'lucide-react';

const Logo: React.FC<{ className?: string, iconClassName?: string }> = ({ className, iconClassName }) => {
  return (
    <div className={`relative flex items-center justify-center font-light ${className}`}>
        <span>K</span>
        <Scissors className={`mx-1 ${iconClassName}`}/>
        <span>T</span>
        <span className="ml-1">CHI</span>
    </div>
  );
};

export default Logo;
