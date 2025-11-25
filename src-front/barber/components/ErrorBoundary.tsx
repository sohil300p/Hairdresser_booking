import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// FIX: Changed to extend from `React.Component` directly to ensure properties like `props` are correctly inherited.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: The constructor was causing issues with TypeScript's type inference for 'this.state' and 'this.props'.
  // Switched to using a class property for state initialization, which is a more modern and robust approach that resolves these errors.
  
  // FIX: Reverted to using a constructor for state initialization to ensure `this.props` is correctly recognized.
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  // FIX: Removed the unused 'handleReset' method. It was causing a 'setState does not exist' error
  // and was not being called by the component. The button now uses a full page reload.

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface-1 p-4 text-center">
            <div className="bg-error-100 p-4 rounded-full mb-4">
              <AlertTriangle className="w-12 h-12 text-error-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">متاسفانه خطایی رخ داده است</h1>
            <p className="text-gray-600 mb-6 max-w-md">
                مشکلی در بارگذاری این بخش پیش آمده است. می‌توانید با تلاش مجدد این مشکل را برطرف کنید یا با پشتیبانی تماس بگیرید.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-primary hover:bg-primary-700 transition"
            >
                <RefreshCw size={18} />
                تلاش مجدد
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
