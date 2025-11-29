import React, { ReactNode, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'تایید',
  cancelText = 'لغو',
  isDestructive = false,
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const confirmButtonClass = isDestructive
    ? 'bg-error-600 hover:bg-error-700 text-white'
    : 'bg-primary-600 hover:bg-primary-700 text-white';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="alertdialog"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isDestructive ? 'bg-error-100' : 'bg-primary-100'} mb-4`}>
                <AlertTriangle className={`h-6 w-6 ${isDestructive ? 'text-error-600' : 'text-primary-600'}`} aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-gray-900" id="modal-title">
                {title}
            </h3>
            <div className="mt-2 text-sm text-gray-700">
                {children}
            </div>
        </div>
        <div className="bg-gray-50 px-2 py-2 flex flex-row-reverse justify-center gap-3 rounded-b-lg">
          <button
            type="button"
            className={`w-full flex-grow justify-center rounded-md border border-transparent shadow-sm px-2 py-2 text-base font-medium sm:w-auto sm:text-sm transition ${confirmButtonClass}`}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="w-full justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm transition"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
