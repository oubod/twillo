/**
 * Phone number utilities for WhatsApp messaging
 * Handles Algerian and Mauritanian phone number normalization
 */

export const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Algerian numbers
  if (cleaned.startsWith('00213') || cleaned.startsWith('213') || cleaned.startsWith('0')) {
    let algerianNumber = cleaned;
    
    if (algerianNumber.startsWith('00213')) {
      // Remove country code prefix 00213
      algerianNumber = algerianNumber.substring(5);
    } else if (algerianNumber.startsWith('213')) {
      // Remove country code prefix 213
      algerianNumber = algerianNumber.substring(3);
    } else if (algerianNumber.startsWith('0')) {
      // Remove leading 0
      algerianNumber = algerianNumber.substring(1);
    }
    
    // Validate it's a valid Algerian mobile number (starts with 5, 6, or 7 and has 8 digits)
    if (/^[567]\d{7}$/.test(algerianNumber)) {
      return `213${algerianNumber}`;
    }
  }
  
  // Handle Mauritanian numbers
  if (cleaned.startsWith('00222') || cleaned.startsWith('222')) {
    let mauritanianNumber = cleaned;
    
    if (mauritanianNumber.startsWith('00222')) {
      // Remove country code prefix 00222
      mauritanianNumber = mauritanianNumber.substring(5);
    } else if (mauritanianNumber.startsWith('222')) {
      // Remove country code prefix 222
      mauritanianNumber = mauritanianNumber.substring(3);
    }
    
    // Validate it's a valid Mauritanian mobile number (starts with 2, 3, or 4 and has 8 digits)
    if (/^[234]\d{7}$/.test(mauritanianNumber)) {
      return `222${mauritanianNumber}`;
    }
  }
  
  throw new Error('Numéro de téléphone algérien ou mauritanien invalide');
};

export const validatePhoneNumber = (phone: string): boolean => {
  try {
    normalizePhoneNumber(phone);
    return true;
  } catch {
    return false;
  }
};

export const formatPhoneForDisplay = (phone: string): string => {
  try {
    const normalized = normalizePhoneNumber(phone);
    
    // Algerian format: 0XX XXX XX XX
    if (normalized.startsWith('213')) {
      const digits = normalized.substring(3);
      return `0${digits.substring(0,2)} ${digits.substring(2,4)} ${digits.substring(4,6)} ${digits.substring(6,8)}`;
    }
    
    // Mauritanian format: XX XX XX XX
    if (normalized.startsWith('222')) {
      const digits = normalized.substring(3);
      return `${digits.substring(0,2)} ${digits.substring(2,4)} ${digits.substring(4,6)} ${digits.substring(6,8)}`;
    }
    
    return phone;
  } catch {
    return phone;
  }
};
