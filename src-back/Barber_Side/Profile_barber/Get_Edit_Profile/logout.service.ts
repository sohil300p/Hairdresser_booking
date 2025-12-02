import { LogoutResponse } from './logout.type';

/**
 * Logout service for barber
 * Similar to customer logout - just returns success
 */
export async function logoutBarberService(refreshToken?: string): Promise<LogoutResponse> {
  // Logout is handled client-side by removing tokens
  // This endpoint is for consistency and future server-side session management
  return {
    success: true,
    message: 'خروج با موفقیت انجام شد',
  };
}



