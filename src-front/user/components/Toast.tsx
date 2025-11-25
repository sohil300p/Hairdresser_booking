import React, { useEffect } from 'react';
import type { ToastType } from '../types';

interface ToastProps {
  message: string;
  onClose: () => void;
  type: ToastType;
}

const icons = {
    success: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    error: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, type }) => {
  useEffect(() => {
    const duration = type === 'error' ? 4000 : 2500;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, type]);

  if (!message) return null;

  const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 text-white py-2 px-6 rounded-full shadow-lg z-50 animate-fade-in-down flex items-center gap-2";
  const typeClasses = {
      success: 'bg-[var(--md-sys-color-tertiary)]',
      error: 'bg-[var(--md-sys-color-error)]',
  }

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
};