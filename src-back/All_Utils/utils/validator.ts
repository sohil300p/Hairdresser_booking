/**
 * Validate Iranian phone number
 * Format: 09xxxxxxxxx (11 digits, starting with 09)
 * Examples: 09123456789, 09987654321
 */
export function validateIranianPhoneNumber(phone: string): {
  isValid: boolean;
  message?: string;
} {
  // Remove any spaces, dashes, or other characters
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Check if it's exactly 11 digits
  if (cleanedPhone.length !== 11) {
    return {
      isValid: false,
      message: 'شماره تلفن باید 11 رقم باشد',
    };
  }

  // Check if it's all digits
  if (!/^\d+$/.test(cleanedPhone)) {
    return {
      isValid: false,
      message: 'شماره تلفن باید فقط شامل اعداد باشد',
    };
  }

  // Check if it starts with 09
  if (!cleanedPhone.startsWith('09')) {
    return {
      isValid: false,
      message: 'شماره تلفن باید با 09 شروع شود',
    };
  }

  // Regex pattern for Iranian mobile numbers
  // Format: 09xxxxxxxxx (09 followed by 9 digits)
  const iranianPhoneRegex = /^09\d{9}$/;

  if (!iranianPhoneRegex.test(cleanedPhone)) {
    return {
      isValid: false,
      message: 'فرمت شماره تلفن معتبر نیست',
    };
  }

  // Additional check: The third digit should be 0, 1, 2, 3, 5, or 9
  // Valid operators: 090, 091, 092, 093, 095, 099
  const thirdDigit = cleanedPhone[2];
  const validThirdDigits = ['0', '1', '2', '3', '5', '9'];

  if (!validThirdDigits.includes(thirdDigit)) {
    return {
      isValid: false,
      message: 'شماره تلفن متعلق به اپراتور معتبر نیست',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Normalize phone number (remove spaces, dashes, etc.)
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '');
}

