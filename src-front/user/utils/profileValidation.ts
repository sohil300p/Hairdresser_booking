import type { User } from '../types';
import { api } from './api';

export interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: string[];
  hasBasicInfo: boolean;
  hasGender: boolean;
  canUseApp: boolean;
  completionPercentage: number;
}

export interface ProfileData {
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female';
  avatar?: string;
  phone: string;
}

/**
 * Check if user profile is complete based on local user data
 */
export function checkLocalProfileCompleteness(user: User | null): ProfileCompleteness {
  if (!user) {
    return {
      isComplete: false,
      missingFields: ['user_not_logged_in'],
      hasBasicInfo: false,
      hasGender: false,
      canUseApp: false,
      completionPercentage: 0,
    };
  }

  const missingFields: string[] = [];
  let completionScore = 0;
  const totalFields = 3; // name, gender, phone (phone is always present)

  // Check name (required for basic functionality)
  const hasValidName = user.name && 
    user.name.trim() !== '' && 
    user.name !== 'کاربر' && 
    user.name.trim().length >= 2;

  if (!hasValidName) {
    missingFields.push('name');
  } else {
    completionScore += 1;
  }

  // Check gender (required for full functionality)
  const hasGender = !!(user as any).gender && ['male', 'female'].includes((user as any).gender);
  if (!hasGender) {
    missingFields.push('gender');
  } else {
    completionScore += 1;
  }

  // Phone is always present (from login)
  completionScore += 1;

  const completionPercentage = Math.round((completionScore / totalFields) * 100);
  const hasBasicInfo = hasValidName;
  const isComplete = hasValidName && hasGender;
  const canUseApp = hasBasicInfo; // Can use app with just name, but gender needed for full features

  return {
    isComplete,
    missingFields,
    hasBasicInfo,
    hasGender,
    canUseApp,
    completionPercentage,
  };
}

/**
 * Fetch and validate profile from server
 */
export async function validateProfileFromServer(): Promise<{
  success: boolean;
  profileData?: ProfileData;
  completeness?: ProfileCompleteness;
  error?: string;
}> {
  try {
    const result = await api.get<{
      success: boolean;
      data: {
        fullName?: string | null;
        firstName?: string;
        lastName?: string;
        gender?: 'male' | 'female' | 'other' | null;
        avatar?: string;
        profileImage?: string;
        phone: string;
      };
    }>('/profile');

    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to fetch profile data',
      };
    }

    // Handle both fullName (new format) and firstName/lastName (old format)
    const fullName = result.data.fullName || 
                     [result.data.firstName, result.data.lastName]
                       .filter(Boolean)
                       .join(' ') || '';

    const profileData: ProfileData = {
      firstName: result.data.firstName || fullName.split(' ')[0] || '',
      lastName: result.data.lastName || fullName.split(' ').slice(1).join(' ') || '',
      gender: result.data.gender || undefined,
      avatar: result.data.avatar || result.data.profileImage,
      phone: result.data.phone,
    };

    const userForValidation: User & { gender?: 'male' | 'female' } = {
      name: fullName,
      phone: profileData.phone,
      avatarUrl: profileData.avatar,
      walletBalance: 0,
      bankCards: [],
      gender: profileData.gender,
    };

    const completeness = checkLocalProfileCompleteness(userForValidation);

    return {
      success: true,
      profileData,
      completeness,
    };
  } catch (error: any) {
    console.error('Profile validation error:', error);
    return {
      success: false,
      error: error.message || 'Network error during profile validation',
    };
  }
}

/**
 * Determine what action to take based on profile completeness
 */
export function getProfileAction(completeness: ProfileCompleteness): {
  action: 'allow' | 'warn' | 'redirect';
  message?: string;
  redirectTo?: string;
} {
  if (completeness.isComplete) {
    return { action: 'allow' };
  }

  // Force redirect if name is missing
  if (!completeness.hasBasicInfo) {
    return {
      action: 'redirect',
      message: 'برای نمایش نتایج مرتبط، لازم است نام و جنسیت خود را مشخص کنید.',
      redirectTo: 'edit-profile',
    };
  }

  // Force redirect if gender is missing
  if (!completeness.hasGender) {
    return {
      action: 'redirect',
      message: 'برای نمایش نتایج مرتبط، لازم است نام و جنسیت خود را مشخص کنید.',
      redirectTo: 'edit-profile',
    };
  }

  return { action: 'allow' };
}

/**
 * Check if a specific page requires complete profile
 */
export function pageRequiresCompleteProfile(page: string): boolean {
  const restrictedPages = [
    'booking',
    'barber-profile',
    'wallet',
    'wallet-withdraw',
  ];
  
  return restrictedPages.includes(page);
}

/**
 * Check if a specific page requires at least basic profile info
 */
export function pageRequiresBasicProfile(page: string): boolean {
  const basicRequiredPages = [
    'booking',
    'barber-profile',
    'wallet',
    'wallet-withdraw',
    'my-bookings',
  ];
  
  return basicRequiredPages.includes(page);
}
