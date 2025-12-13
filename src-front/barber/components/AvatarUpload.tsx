import React, { useState, useRef, useCallback } from 'react';
import { User, Clock, Plus } from 'lucide-react';
import { api } from '../utils/api';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onUploadSuccess: (avatarUrl: string) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  mode?: 'create' | 'edit'; // Determines POST vs PUT
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
  disabled = false,
  size = 'lg',
  mode = 'edit' // Default to edit mode (PUT)
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20', 
    lg: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'فقط فایل‌های JPG، PNG و WebP پشتیبانی می‌شوند';
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'حجم فایل نباید بیشتر از ۵ مگابایت باشد';
    }

    return null;
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('profileImage', file);

      // Upload to backend using appropriate method based on mode
      // POST for creating new profile, PUT for editing existing profile
      const uploadMethod = mode === 'create' ? api.upload : api.uploadPut;
      const result = await uploadMethod<{ success: boolean; message?: string; data?: { avatarUrl: string } }>(
        '/barber/profile',
        formData
      );

      if (result.success && result.data?.avatarUrl) {
        onUploadSuccess(result.data.avatarUrl);
        setPreviewUrl(null);
      } else {
        throw new Error(result.message || 'خطا در آپلود تصویر');
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      setPreviewUrl(null);
      onUploadError(error.message || 'خطا در آپلود تصویر. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadSuccess, onUploadError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [disabled, isUploading, handleFileUpload]);

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative ${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 touch-manipulation ${
          dragActive ? 'ring-4 ring-blue-200 ring-opacity-50' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:ring-2 hover:ring-blue-300'}`}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Avatar Image */}
        {displayUrl ? (
          <img 
            src={displayUrl} 
            alt="avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={`${iconSizes[size]} text-gray-500`} />
        )}

        {/* Upload Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center text-white transition-opacity ${
          isUploading ? 'opacity-100' : 'opacity-0 hover:opacity-100'
        }`}>
          {isUploading ? (
            <div className="animate-spin">
              <Clock className="w-6 h-6" />
            </div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>

        {/* Drag & Drop Indicator */}
        {dragActive && (
          <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-blue-600" />
          </div>
        )}
      </div>

      {/* Upload Instructions */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500">
          {isUploading ? 'در حال آپلود...' : 'برای تغییر تصویر روی عکس کلیک کنید'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPG، PNG، WebP - حداکثر ۵MB
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
};

