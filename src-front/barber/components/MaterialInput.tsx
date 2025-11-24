import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface MaterialInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  id: string;
  multiline?: boolean;
  error?: string;
  success?: boolean;
}

const MaterialInput: React.FC<MaterialInputProps> = ({ label, id, multiline = false, className, error, success, ...props }) => {
  const hasValue = props.value != null && String(props.value) !== '';
  const isError = !!error;

  const borderColor = isError 
    ? 'border-error-500' 
    : success
    ? 'border-success-500'
    : 'border-gray-400 peer-focus:border-primary-600';

  const labelColor = isError 
    ? 'text-error-600 peer-focus:text-error-600' 
    : success 
    ? 'text-success-700 peer-focus:text-success-700'
    : 'text-gray-700 peer-focus:text-primary-600';
  
  const commonClasses = `
    block w-full px-3 pt-6 pb-2 bg-surface-2 text-gray-900 rounded-t-md 
    border-b-2 appearance-none 
    focus:outline-none focus:ring-0 peer
    transition-colors duration-300
    ${borderColor}
  `;
  
  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={`relative z-0 w-full ${isError ? 'animate-input-shake' : ''}`}>
        <div className="relative">
            <InputComponent
                id={id}
                placeholder={props.placeholder}
                className={`${commonClasses} ${className || ''}`}
                {...(multiline ? { rows: 4 } : {})}
                {...props}
                aria-invalid={isError}
                aria-describedby={isError ? `${id}-error` : undefined}
            />
            <label
                htmlFor={id}
                className={`
                absolute duration-300 transform 
                top-5 z-10 origin-[0] right-3 
                peer-focus:scale-75 
                peer-focus:-translate-y-4
                ${hasValue || props.placeholder ? 'scale-75 -translate-y-4' : 'scale-100 translate-y-0'}
                ${labelColor}
                `}
            >
                {label}
            </label>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                {isError && <AlertCircle className="w-5 h-5 text-error-500" />}
                {success && !isError && <CheckCircle className="w-5 h-5 text-success-500" />}
            </div>
        </div>
        {isError && (
            <p id={`${id}-error`} className="mt-1 px-1 text-xs text-error-600 animate-fade-in">{error}</p>
        )}
    </div>
  );
};

export default MaterialInput;

