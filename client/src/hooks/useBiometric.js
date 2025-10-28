import { useState } from 'react';

/**
 * Biometric Authentication Hook
 * For web apps - always returns false as biometric is not available
 */
export const useBiometric = () => {
  const [isAvailable] = useState(false);

  // Authenticate with biometric
  const authenticate = async (options = {}) => {
    return {
      success: false,
      error: 'Biometric not available on web'
    };
  };

  return {
    isAvailable: false,
    biometricType: null,
    biometricName: 'Sinh học',
    isChecking: false,
    authenticate,
    checkAvailability: () => {}
  };
};

export default useBiometric;
