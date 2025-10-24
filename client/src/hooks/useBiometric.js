import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Biometric Authentication Hook
 * Supports Face ID (iOS), Touch ID (iOS), Fingerprint (Android)
 */
export const useBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // Check if biometric is available on device
  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    // Only available on native platforms
    if (!Capacitor.isNativePlatform()) {
      setIsAvailable(false);
      return;
    }

    try {
      // Dynamically import to avoid errors on web
      const { NativeBiometric } = await import('@capacitor-community/biometric-auth');
      
      const result = await NativeBiometric.isAvailable();
      
      setIsAvailable(result.isAvailable);
      setBiometricType(result.biometryType || null);
      
      console.log('✅ Biometric available:', result);
    } catch (error) {
      console.log('ℹ️ Biometric not available:', error);
      setIsAvailable(false);
    }
  };

  // Authenticate with biometric
  const authenticate = useCallback(async (options = {}) => {
    if (!isAvailable) {
      return {
        success: false,
        error: 'Biometric not available'
      };
    }

    setIsChecking(true);

    try {
      const { NativeBiometric } = await import('@capacitor-community/biometric-auth');
      
      const result = await NativeBiometric.verifyIdentity({
        reason: options.reason || 'Xác thực để tiếp tục',
        title: options.title || 'Xác thực sinh học',
        subtitle: options.subtitle,
        description: options.description,
        negativeButtonText: options.negativeButtonText || 'Hủy',
        maxAttempts: options.maxAttempts || 3
      });

      setIsChecking(false);

      if (result.verified) {
        console.log('✅ Biometric authentication successful');
        return {
          success: true,
          verified: true
        };
      } else {
        console.log('❌ Biometric authentication failed');
        return {
          success: false,
          error: 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('❌ Biometric error:', error);
      setIsChecking(false);
      
      return {
        success: false,
        error: error.message || 'Authentication error'
      };
    }
  }, [isAvailable]);

  // Get biometric type name
  const getBiometricName = useCallback(() => {
    if (!biometricType) return 'Sinh học';
    
    const types = {
      'FACE_ID': 'Face ID',
      'TOUCH_ID': 'Touch ID',
      'FINGERPRINT': 'Vân tay',
      'FACE_AUTHENTICATION': 'Nhận diện khuôn mặt',
      'IRIS_AUTHENTICATION': 'Mống mắt'
    };
    
    return types[biometricType] || 'Sinh học';
  }, [biometricType]);

  return {
    isAvailable,
    biometricType,
    biometricName: getBiometricName(),
    isChecking,
    authenticate,
    checkAvailability
  };
};

export default useBiometric;

