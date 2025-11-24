import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'center' | 'bottom';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, position = 'center' }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isBottom = position === 'bottom';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex"
      style={{ 
        justifyContent: isBottom ? 'center' : 'center',
        alignItems: isBottom ? 'flex-end' : 'center'
      }}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`bg-white shadow-xl m-4 w-full max-w-md ${isBottom ? 'rounded-t-2xl p-6 animate-slide-in-up' : 'rounded-lg p-6 text-center relative animate-fade-in-down'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isBottom ? (
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
        ) : (
            <button onClick={onClose} className="absolute top-2 left-2 text-gray-400 hover:text-gray-600 p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        )}
        {children}
      </div>
    </div>
  );
};