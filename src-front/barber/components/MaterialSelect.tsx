import React from 'react';
import { ChevronDown } from 'lucide-react';

interface MaterialSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  children: React.ReactNode;
}

const MaterialSelect: React.FC<MaterialSelectProps> = ({ label, id, children, value, ...props }) => {
  const hasValue = value != null && String(value) !== '';

  return (
    <div className="relative z-0 w-full">
      <select
        id={id}
        value={value}
        className={`
          block w-full px-3 pt-6 pb-2 bg-surface-2 text-gray-900 rounded-t-md 
          border-b-2 border-gray-400 appearance-none peer
          focus:outline-none focus:ring-0 focus:border-primary-600 
          transition-colors duration-300
        `}
        {...props}
      >
        {children}
      </select>
      <label
        htmlFor={id}
        className={`
          absolute text-gray-700 duration-300 transform 
          top-5 z-10 origin-[0] right-3
          peer-focus:text-primary-600
          ${hasValue ? 'scale-75 -translate-y-4' : 'scale-100 translate-y-0'}
          peer-focus:scale-75 
          peer-focus:-translate-y-4
        `}
      >
        {label}
      </label>
      <div className="absolute top-0 left-0 h-full flex items-center px-3 pointer-events-none">
        <ChevronDown className="w-5 h-5 text-gray-600" />
      </div>
    </div>
  );
};

export default MaterialSelect;