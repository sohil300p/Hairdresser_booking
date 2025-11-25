
import React from 'react';
import { Scissors } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div 
          className="relative flex items-center justify-center font-light text-7xl text-gray-400/90 animate-fade-in-scale tracking-[0.2em]"
        >
          <span>CU</span>
          <Scissors className="w-14 h-14 mx-[-0.2em] transform -rotate-12"/>
          <span>CHEE</span>
        </div>
        <p className="text-white/60 mt-4 animate-fade-in tracking-widest" style={{animationDelay: '0.3s'}}>پنل آرایشگر</p>
      </div>
    </div>
  );
};

export default SplashScreen;
