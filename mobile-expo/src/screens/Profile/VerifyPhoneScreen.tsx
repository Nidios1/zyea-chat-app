import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput as RNTextInput,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { authAPI, usersAPI } from '../../utils/api';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getStoredToken } from '../../utils/auth';

type VerifyPhoneScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'VerifyPhone'>;
type VerifyPhoneScreenRouteProp = RouteProp<ProfileStackParamList, 'VerifyPhone'>;

const VerifyPhoneScreen = () => {
  const theme = useTheme();
  const { colors, isDarkMode } = useCustomTheme();
  const { user, login } = useAuth();
  const navigation = useNavigation<VerifyPhoneScreenNavigationProp>();
  const route = useRoute<VerifyPhoneScreenRouteProp>();
  const phone = route.params?.phone || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  // Countdown for resend code
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const verificationCode = code || otp.join('');
    
    if (verificationCode.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ 6 chữ số.');
      return;
    }

    setLoading(true);
    try {
      // Verify code
      await authAPI.verifyCode({ phone, code: verificationCode });

      // Update user profile with phone
      await usersAPI.updateProfile({ phone });

      // Reload user profile to get updated data
      const updatedProfile = await usersAPI.getProfile();
      if (updatedProfile.data && user) {
        // Get current token to update user context
        const token = await getStoredToken();
        if (token) {
          await login(updatedProfile.data, token);
        }
      }

      Alert.alert(
        'Thành công',
        'Số điện thoại đã được thêm vào tài khoản của bạn.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Mã xác minh không đúng. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) {
      return;
    }

    setSendingCode(true);
    try {
      await authAPI.sendVerification({ phone });
      setResendCountdown(60);
      Alert.alert('Thành công', 'Mã xác minh mới đã được gửi.');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không thể gửi mã xác minh. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setSendingCode(false);
    }
  };

  const formatPhone = (phoneNumber: string) => {
    // Format phone for display: +84123456789 -> +84 123 456 789
    if (phoneNumber.startsWith('+84')) {
      const number = phoneNumber.substring(3);
      return `+84 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
    return phoneNumber;
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>Hủy</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Xác minh số điện thoại của bạn
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Instructions */}
          <Text style={[styles.instructions, { color: colors.text }]}>
            Nhập mã gồm 6 chữ số mà chúng tôi gửi đến {formatPhone(phone)}.
          </Text>

          {/* OTP Input Fields */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View key={index} style={styles.otpInputWrapper}>
                <RNTextInput
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                      borderColor: digit ? '#4CAF50' : (isDarkMode ? '#333' : '#e0e0e0'),
                      color: colors.text,
                    },
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  textAlign="center"
                  autoFocus={index === 0}
                />
                {index === 2 && <View style={styles.otpSeparator} />}
              </View>
            ))}
          </View>

          {/* Resend Code */}
          <TouchableOpacity
            style={styles.resendContainer}
            onPress={handleResendCode}
            disabled={resendCountdown > 0 || sendingCode}
          >
            {sendingCode ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Text
                style={[
                  styles.resendText,
                  {
                    color: resendCountdown > 0 ? colors.textSecondary : '#4CAF50',
                  },
                ]}
              >
                {resendCountdown > 0 ? `Gửi mã mới (${resendCountdown}s)` : 'Gửi mã mới'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Verify Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              {
                backgroundColor: isOtpComplete ? '#4CAF50' : (isDarkMode ? '#2a2a2a' : '#e0e0e0'),
                opacity: isOtpComplete ? 1 : 0.6,
              },
            ]}
            onPress={() => handleVerify()}
            disabled={!isOtpComplete || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.verifyButtonText,
                  {
                    color: isOtpComplete ? '#FFFFFF' : (isDarkMode ? '#666' : '#999'),
                  },
                ]}
              >
                Xác minh
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelButton: {
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  instructions: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  otpInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '600',
  },
  otpSeparator: {
    width: 8,
    height: 2,
    backgroundColor: '#999',
    marginHorizontal: 4,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  verifyButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VerifyPhoneScreen;

