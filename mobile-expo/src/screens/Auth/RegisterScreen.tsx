import React, { useState, useEffect, useReducer } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput, Button, RadioButton, useTheme as usePaperTheme, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { authAPI, uploadAPI, friendsAPI, usersAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { storeToken } from '../../utils/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { spacing, typography, borderRadius } from '../../config/designTokens';
import { launchImageLibrary, launchCamera } from '../../utils/imagePicker';
import { getInitials, getAvatarURL } from '../../utils/imageUtils';

// Email validation function
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList>;

enum SignupStep {
  INFO = 0,
  HANDLE = 1,
  OTP = 2,
  AVATAR = 3,
  SUGGESTED_USERS = 4,
}

type SignupState = {
  activeStep: SignupStep;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  handle: string;
  error: string;
  errorField?: 'email' | 'password' | 'fullName' | 'handle' | 'date-of-birth' | 'gender';
  isLoading: boolean;
  otp: string;
  otpStep: boolean;
  resendCountdown: number;
  avatarUri: string | null;
  isRegistered: boolean;
  token: string | null;
  userData: any | null; // Store user data from registration
  suggestedUsers: any[];
  followedUserIds: string[];
  otpError: string;
};

type SignupAction =
  | { type: 'setEmail'; value: string }
  | { type: 'setPassword'; value: string }
  | { type: 'setConfirmPassword'; value: string }
  | { type: 'setFullName'; value: string }
  | { type: 'setDateOfBirth'; value: Date }
  | { type: 'setGender'; value: string }
  | { type: 'setHandle'; value: string }
  | { type: 'setError'; value: string; field?: SignupState['errorField'] }
  | { type: 'clearError' }
  | { type: 'setIsLoading'; value: boolean }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'setOtp'; value: string }
  | { type: 'setOtpStep'; value: boolean }
  | { type: 'setResendCountdown'; value: number }
  | { type: 'setAvatarUri'; value: string | null }
  | { type: 'setIsRegistered'; value: boolean; token: string | null; userData?: any }
  | { type: 'setSuggestedUsers'; value: any[] }
  | { type: 'addFollowedUser'; userId: string }
  | { type: 'removeFollowedUser'; userId: string }
  | { type: 'setOtpError'; value: string }
  | { type: 'clearOtpError' };

const initialState: SignupState = {
  activeStep: SignupStep.INFO,
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  dateOfBirth: new Date(Date.now() - 60e3 * 60 * 24 * 365 * 20), // 20 years ago
  gender: '',
  handle: '',
  error: '',
  errorField: undefined,
  isLoading: false,
  otp: '',
  otpStep: false,
  resendCountdown: 0,
  avatarUri: null,
  isRegistered: false,
  token: null,
  userData: null,
  suggestedUsers: [],
  followedUserIds: [],
  otpError: '',
};

function reducer(state: SignupState, action: SignupAction): SignupState {
  switch (action.type) {
    case 'setEmail':
      return { ...state, email: action.value };
    case 'setPassword':
      return { ...state, password: action.value };
    case 'setConfirmPassword':
      return { ...state, confirmPassword: action.value };
    case 'setFullName':
      return { ...state, fullName: action.value };
    case 'setDateOfBirth':
      return { ...state, dateOfBirth: action.value };
    case 'setGender':
      return { ...state, gender: action.value };
    case 'setHandle':
      return { ...state, handle: action.value };
    case 'setError':
      return { ...state, error: action.value, errorField: action.field };
    case 'clearError':
      return { ...state, error: '', errorField: undefined };
    case 'setIsLoading':
      return { ...state, isLoading: action.value };
    case 'next':
      if (state.activeStep < SignupStep.SUGGESTED_USERS) {
        return { ...state, activeStep: state.activeStep + 1, error: '' };
      }
      return state;
    case 'prev':
      if (state.activeStep > SignupStep.INFO) {
        return { ...state, activeStep: state.activeStep - 1, error: '' };
      }
      return state;
    case 'setOtp':
      return { ...state, otp: action.value };
    case 'setOtpStep':
      return { ...state, otpStep: action.value };
    case 'setResendCountdown':
      return { ...state, resendCountdown: action.value };
    case 'setAvatarUri':
      return { ...state, avatarUri: action.value };
    case 'setIsRegistered':
      return { 
        ...state, 
        isRegistered: action.value, 
        token: action.token,
        userData: action.userData || state.userData,
      };
    case 'setSuggestedUsers':
      return { ...state, suggestedUsers: action.value };
    case 'addFollowedUser':
      return {
        ...state,
        followedUserIds: [...state.followedUserIds, action.userId],
      };
    case 'removeFollowedUser':
      return {
        ...state,
        followedUserIds: state.followedUserIds.filter((id) => id !== action.userId),
      };
    case 'setOtpError':
      return { ...state, otpError: action.value };
    case 'clearOtpError':
      return { ...state, otpError: '' };
    default:
      return state;
  }
}

function getAge(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

function is13(date: Date): boolean {
  return getAge(date) >= 13;
}

const RegisterScreen = () => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, colors } = useTheme();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [state, dispatch] = useReducer(reducer, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [tempBirthDate, setTempBirthDate] = useState(state.dateOfBirth);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [alertData, setAlertData] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null as (() => void) | null,
  });

  // Countdown effect for resend OTP
  useEffect(() => {
    if (state.otpStep && state.resendCountdown > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'setResendCountdown', value: state.resendCountdown - 1 });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.otpStep, state.resendCountdown]);

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertData({ show: true, title, message, onConfirm: onConfirm || null });
  };

  const closeAlert = () => {
    setAlertData({ show: false, title: '', message: '', onConfirm: null });
  };

  const validateStepInfo = (): boolean => {
    if (!state.email.trim()) {
      dispatch({
        type: 'setError',
        value: 'Vui lòng nhập email của bạn.',
        field: 'email',
      });
      return false;
    }
    if (!validateEmail(state.email)) {
      dispatch({
        type: 'setError',
        value: 'Email không hợp lệ. Vui lòng kiểm tra lại.',
        field: 'email',
      });
      return false;
    }
    if (!state.password.trim()) {
      dispatch({
        type: 'setError',
        value: 'Vui lòng nhập mật khẩu của bạn.',
        field: 'password',
      });
      return false;
    }
    if (state.password.length < 8) {
      dispatch({
        type: 'setError',
        value: 'Mật khẩu phải có ít nhất 8 ký tự.',
        field: 'password',
      });
      return false;
    }
    if (!state.fullName.trim()) {
      dispatch({
        type: 'setError',
        value: 'Vui lòng nhập họ tên của bạn.',
        field: 'fullName',
      });
      return false;
    }
    if (state.fullName.trim().length < 2) {
      dispatch({
        type: 'setError',
        value: 'Họ tên phải có ít nhất 2 ký tự.',
        field: 'fullName',
      });
      return false;
    }
    if (!is13(state.dateOfBirth)) {
      dispatch({
        type: 'setError',
        value: 'Bạn phải ít nhất 13 tuổi để đăng ký tài khoản.',
        field: 'date-of-birth',
      });
      return false;
    }
    return true;
  };

  const validateStepHandle = (): boolean => {
    if (!state.handle.trim()) {
      dispatch({
        type: 'setError',
        value: 'Vui lòng chọn tên người dùng của bạn.',
        field: 'handle',
      });
      return false;
    }
    if (state.handle.length < 3) {
      dispatch({
        type: 'setError',
        value: 'Tên người dùng phải có ít nhất 3 ký tự.',
        field: 'handle',
      });
      return false;
    }
    if (state.handle.length > 20) {
      dispatch({
        type: 'setError',
        value: 'Tên người dùng không được vượt quá 20 ký tự.',
        field: 'handle',
      });
      return false;
    }
    if (!/^[a-z0-9_-]+$/.test(state.handle.toLowerCase())) {
      dispatch({
        type: 'setError',
        value: 'Tên người dùng chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang.',
        field: 'handle',
      });
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    dispatch({ type: 'clearError' });

    if (state.activeStep === SignupStep.INFO) {
      if (!validateStepInfo()) {
        return;
      }
      // Send verification code
      try {
        dispatch({ type: 'setIsLoading', value: true });
        await authAPI.sendVerification({ email: state.email });
        dispatch({ type: 'setResendCountdown', value: 60 });
        dispatch({ type: 'setOtpStep', value: true });
        dispatch({ type: 'next' });
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || '';
        if (errorMessage.includes('email') || errorMessage.includes('Email')) {
          dispatch({
            type: 'setError',
            value: 'Email này đã được sử dụng. Vui lòng dùng email khác.',
            field: 'email',
          });
        } else {
          dispatch({
            type: 'setError',
            value: errorMessage || 'Gửi mã xác thực thất bại. Vui lòng thử lại.',
          });
        }
      } finally {
        dispatch({ type: 'setIsLoading', value: false });
      }
    } else if (state.activeStep === SignupStep.HANDLE) {
      if (!validateStepHandle()) {
        return;
      }
      // Move to OTP step
      dispatch({ type: 'next' });
    }
  };

  const handleVerify = async () => {
    if (!state.otp || state.otp.length !== 6) {
      dispatch({ type: 'setOtpError', value: 'Mã xác thực phải có đúng 6 số.' });
      showAlert('Mã xác thực không hợp lệ', 'Mã xác thực phải có đúng 6 số.');
      return;
    }

    // Clear previous errors
    dispatch({ type: 'clearOtpError' });
    console.log('🔐 Starting OTP verification for:', state.email);
    dispatch({ type: 'setIsLoading', value: true });
    try {
      // Verify OTP
      console.log('📧 Verifying OTP code...');
      await authAPI.verifyCode({ email: state.email, code: state.otp });
      console.log('✅ OTP verified successfully');

      // Register after verification
      console.log('📝 Registering user with data:', {
        email: state.email,
        handle: state.handle,
        birthDate: state.dateOfBirth.toISOString().split('T')[0],
        gender: state.gender,
      });
      
      // Register with fullName (required by server)
      const response = await authAPI.register({
        email: state.email,
        password: state.password,
        fullName: state.fullName,
        handle: state.handle,
        birthDate: state.dateOfBirth.toISOString().split('T')[0],
        gender: state.gender,
      });

      console.log('📦 Full registration response:', JSON.stringify(response, null, 2));
      console.log('📦 Response status:', response.status);
      console.log('📦 Response data:', response.data);
      console.log('📦 Response data type:', typeof response.data);
      console.log('📦 Has token?', !!response.data?.token);
      console.log('📦 Has user?', !!response.data?.user);
      console.log('📦 Token value:', response.data?.token);
      console.log('📦 User value:', response.data?.user);

      // Check different possible response structures
      const token = response.data?.token || response.data?.accessToken || response.data?.access_token;
      const user = response.data?.user || response.data?.data?.user || response.data?.data;
      
      if (token && user) {
        console.log('✅ Registration successful, moving to avatar step');
        // Save token and user data, but DON'T login yet (don't set isAuthenticated = true)
        // We need to stay in AuthNavigator to show avatar and suggested users steps
        // Only login after completing all onboarding steps
        // However, we need to store token in storage so API calls (like upload avatar) can work
        await storeToken(token);
        
        dispatch({
          type: 'setIsRegistered',
          value: true,
          token: token,
          userData: user, // Store user data for later use
        });
        // Store user data temporarily in state (we'll use it later)
        // Don't call login() here - it will cause navigation to switch to MainNavigator
        // Move to avatar step
        dispatch({ type: 'next' });
      } else {
        console.error('❌ Registration failed: No token or user data');
        console.error('Response structure:', {
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          token: token,
          user: user,
        });
        
        const errorMsg = `Không nhận được dữ liệu từ server. 
        
Response status: ${response.status}
Has data: ${!!response.data}
Token: ${token ? 'Có' : 'Không'}
User: ${user ? 'Có' : 'Không'}

Vui lòng kiểm tra console log để xem chi tiết.`;
        
        Toast.show({
          type: 'error',
          text1: 'Đăng ký thất bại',
          text2: 'Không nhận được dữ liệu từ server. Vui lòng thử lại.',
          visibilityTime: 5000,
        });
        showAlert('Đăng ký thất bại', 'Không nhận được dữ liệu từ server. Vui lòng thử lại.\n\nKiểm tra console log để xem chi tiết lỗi.');
      }
    } catch (err: any) {
      console.error('❌ Verification/Registration error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code,
      });
      
      let errorMessage = '';
      let errorTitle = 'Đăng ký thất bại';
      
      // Try to extract error message from different sources
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'NETWORK_ERROR' || err.code === 'ECONNABORTED') {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.';
        errorTitle = 'Lỗi kết nối';
      } else if (err.response?.status === 401) {
        errorMessage = 'Mã xác thực không đúng hoặc đã hết hạn. Vui lòng nhập lại mã hoặc gửi lại mã mới.';
        errorTitle = 'Xác thực thất bại';
      } else if (err.response?.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        errorTitle = 'Dữ liệu không hợp lệ';
      } else if (err.response?.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        errorTitle = 'Lỗi server';
      } else {
        errorMessage = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
      }
      
      // Show both Toast and Alert for better visibility
      Toast.show({
        type: 'error',
        text1: errorTitle,
        text2: errorMessage,
        visibilityTime: 4000,
      });
      
      // Set error in state to display on screen
      dispatch({ type: 'setOtpError', value: errorMessage });
      
      // Also show alert modal
      if (errorMessage.toLowerCase().includes('code') || errorMessage.toLowerCase().includes('mã')) {
        showAlert('Mã không đúng', 'Mã xác thực không đúng. Vui lòng nhập lại mã hoặc gửi lại mã mới.');
      } else if (errorMessage.toLowerCase().includes('expired') || errorMessage.toLowerCase().includes('hết hạn')) {
        showAlert('Mã đã hết hạn', 'Mã xác thực đã hết hạn. Vui lòng nhấn "Gửi lại mã" để nhận mã mới.');
      } else if (errorMessage.toLowerCase().includes('handle') || errorMessage.toLowerCase().includes('username')) {
        dispatch({
          type: 'setError',
          value: 'Tên người dùng này đã được sử dụng. Vui lòng chọn tên khác.',
          field: 'handle',
        });
        dispatch({ type: 'prev' });
      } else {
        showAlert(errorTitle, errorMessage);
      }
    } finally {
      dispatch({ type: 'setIsLoading', value: false });
      setIsAutoVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (state.resendCountdown > 0) return;
    try {
      await authAPI.sendVerification({ email: state.email });
      dispatch({ type: 'setResendCountdown', value: 60 });
      Toast.show({ type: 'info', text1: 'Đã gửi lại mã' });
    } catch (_) {
      // Ignore error
    }
  };

  // Avatar step handlers
  const handlePickAvatar = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      });
      if (response.assets?.[0]) {
        dispatch({ type: 'setAvatarUri', value: response.assets[0].uri || null });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleTakeAvatarPhoto = async () => {
    try {
      const response = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });
      if (response.assets?.[0]) {
        dispatch({ type: 'setAvatarUri', value: response.assets[0].uri || null });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handleUploadAvatar = async () => {
    if (!state.avatarUri) {
      Toast.show({ type: 'error', text1: 'Vui lòng chọn ảnh đại diện' });
      return;
    }

    dispatch({ type: 'setIsLoading', value: true });
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: state.avatarUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      await uploadAPI.uploadAvatar(formData);
      Toast.show({ type: 'success', text1: 'Đã cập nhật ảnh đại diện' });
      dispatch({ type: 'next' });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Upload thất bại',
      });
    } finally {
      dispatch({ type: 'setIsLoading', value: false });
    }
  };

  const handleSkipAvatar = () => {
    dispatch({ type: 'next' });
  };

  // Suggested users step handlers
  useEffect(() => {
    if (state.activeStep === SignupStep.SUGGESTED_USERS && state.suggestedUsers.length === 0) {
      loadSuggestedUsers();
    }
  }, [state.activeStep]);

  const loadSuggestedUsers = async () => {
    try {
      // Try to get suggested users - if API doesn't exist, use search with empty query or popular users
      // For now, we'll use search with empty query to get some users
      const response = await usersAPI.searchUsers('');
      if (response.data && Array.isArray(response.data)) {
        // Take first 10 users as suggested
        dispatch({ type: 'setSuggestedUsers', value: response.data.slice(0, 10) });
      }
    } catch (error) {
      console.error('Error loading suggested users:', error);
      // If error, just continue with empty list
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await friendsAPI.follow(userId);
      dispatch({ type: 'addFollowedUser', userId });
      Toast.show({ type: 'success', text1: 'Đã theo dõi' });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Theo dõi thất bại',
      });
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    try {
      await friendsAPI.unfollow(userId);
      dispatch({ type: 'removeFollowedUser', userId });
      Toast.show({ type: 'success', text1: 'Đã bỏ theo dõi' });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Bỏ theo dõi thất bại',
      });
    }
  };

  const handleFinishOnboarding = async () => {
    // Now login and navigate to main app after completing onboarding
    if (state.token && state.isRegistered && state.userData) {
      try {
        console.log('🎉 Finishing onboarding, logging in user...');
        // Use stored user data from registration
        await login(state.userData, state.token);
        
        console.log('✅ User logged in, app will automatically show MainNavigator');
        // Don't need to navigate manually - App.tsx will automatically switch to MainNavigator
        // when isAuthenticated becomes true
      } catch (error) {
        console.error('❌ Error finishing onboarding:', error);
        Toast.show({
          type: 'error',
          text1: 'Lỗi khi hoàn tất đăng ký',
          text2: 'Vui lòng thử lại',
        });
      }
    } else {
      console.error('❌ Missing token or user data for onboarding completion');
      // If no token, just navigate to login
      navigation.navigate('Login');
    }
  };

  // Alert Modal Component
  const AlertModal = () =>
    alertData.show ? (
      <Modal
        visible={alertData.show}
        transparent
        animationType="fade"
        onRequestClose={closeAlert}
      >
        <Pressable style={styles.modalOverlay} onPress={closeAlert}>
          <Pressable
            style={[styles.alertDialog, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.alertTitle, { color: colors.text }]}>{alertData.title}</Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              {alertData.message}
            </Text>
            <View style={[styles.alertButtonContainer, { borderTopColor: colors.border }]}>
              <Button
                mode="text"
                onPress={() => {
                  if (alertData.onConfirm) alertData.onConfirm();
                  closeAlert();
                }}
                style={styles.alertButton}
              >
                OK
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    ) : null;

  // Step 1: Info (Email, Password, Date of Birth)
  if (state.activeStep === SignupStep.INFO) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.surface}
        />
        <AlertModal />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.stepHeaderText, { color: colors.text }]}>Tài khoản của bạn</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Bước 1/3
            </Text>

            {state.error && state.errorField !== 'handle' && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{state.error}</Text>
              </View>
            )}

            <View>
                <TextInput
                label="Email"
                value={state.email}
                onChangeText={(value) => {
                  dispatch({ type: 'setEmail', value });
                  if (state.errorField === 'email') {
                    dispatch({ type: 'clearError' });
                  }
                }}
                  mode="outlined"
                  style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={state.errorField === 'email'}
                placeholder="Nhập địa chỉ email của bạn"
                left={<TextInput.Icon icon="email" />}
                />
              </View>

            <View>
                <TextInput
                label="Họ tên"
                value={state.fullName}
                onChangeText={(value) => {
                  dispatch({ type: 'setFullName', value });
                  if (state.errorField === 'fullName') {
                    dispatch({ type: 'clearError' });
                  }
                }}
                  mode="outlined"
                  style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
                error={state.errorField === 'fullName'}
                placeholder="Nhập họ tên của bạn"
                left={<TextInput.Icon icon="account" />}
                />
              </View>

            <View>
                <TextInput
                label="Mật khẩu"
                value={state.password}
                onChangeText={(value) => {
                  dispatch({ type: 'setPassword', value });
                  if (state.errorField === 'password') {
                    dispatch({ type: 'clearError' });
                  }
                }}
                  mode="outlined"
                  style={styles.input}
                secureTextEntry={!showPassword}
                placeholder="Chọn mật khẩu của bạn"
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                error={state.errorField === 'password'}
              />
          </View>

            <View>
              <Text style={[styles.label, { color: colors.text }]}>Ngày sinh của bạn</Text>
            <TouchableOpacity
              onPress={() => {
                  setTempBirthDate(state.dateOfBirth);
                setShowDatePicker(true);
              }}
              style={[styles.dateInput, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
                <MaterialCommunityIcons name="calendar" size={24} color={colors.textSecondary} />
              <Text style={[styles.dateInputText, { color: colors.text }]}>
                  {state.dateOfBirth.toLocaleDateString('vi-VN')}
              </Text>
            </TouchableOpacity>
            </View>

            {showDatePicker && Platform.OS !== 'web' && (
              <>
                {Platform.OS === 'ios' ? (
                  <Modal visible={showDatePicker} transparent animationType="slide">
                    <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
                      <Pressable
                        style={[styles.modalContent, { backgroundColor: colors.surface }]}
                        onPress={(e) => e.stopPropagation()}
                      >
                        <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                          <Button onPress={() => setShowDatePicker(false)}>Hủy</Button>
                          <Text style={[styles.datePickerTitle, { color: colors.text }]}>
                            Chọn ngày sinh
                          </Text>
                          <Button
                            onPress={() => {
                              dispatch({ type: 'setDateOfBirth', value: tempBirthDate });
                            setShowDatePicker(false);
                            }}
                          >
                            Xong
                          </Button>
                        </View>
                        <View style={styles.datePickerContainer}>
                          <DateTimePicker
                          value={tempBirthDate}
                          mode="date"
                          display="spinner"
                          onChange={(event, selectedDate) => {
                            if (selectedDate) {
                              setTempBirthDate(selectedDate);
                            }
                          }}
                          maximumDate={new Date()}
                          minimumDate={new Date(1900, 0, 1)}
                          locale="vi-VN"
                        />
                        </View>
                      </Pressable>
                    </Pressable>
                  </Modal>
                ) : (
                  <>
                    {showDatePicker && (
                      <DateTimePicker
                        value={state.dateOfBirth}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) {
                            dispatch({ type: 'setDateOfBirth', value: selectedDate });
                          }
                        }}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                      />
                    )}
                  </>
                )}
              </>
            )}
            
            {/* Terms and Privacy Policy Disclaimer */}
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              Bằng việc tạo tài khoản, bạn đồng ý với{' '}
              <Text
                style={[styles.termsLink, { color: colors.primary }]}
                onPress={() => navigation.navigate('Terms' as never)}
              >
                Điều khoản dịch vụ
              </Text>
              {' '}và{' '}
              <Text
                style={[styles.termsLink, { color: colors.primary }]}
                onPress={() => navigation.navigate('Privacy' as never)}
              >
                Chính sách Bảo mật
            </Text>
              .
                  </Text>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
            <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={[styles.backActionButton, { borderColor: colors.border }]}
              contentStyle={styles.buttonContent}
                labelStyle={{ color: colors.text }}
            >
                Trở lại
            </Button>
            <Button
              mode="contained"
              onPress={handleNext}
                style={[styles.nextActionButton, { backgroundColor: colors.primary }]}
              contentStyle={styles.buttonContent}
              labelStyle={{ color: isDarkMode ? '#000000' : '#FFFFFF' }}
                loading={state.isLoading}
                disabled={state.isLoading}
            >
                Tiếp theo
            </Button>
            </View>

            {/* Language Selector and Support */}
            <View style={styles.footerContainer}>
              <TouchableOpacity
                style={[styles.languageSelector, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => {
                  setLanguage(language === 'vi' ? 'en' : 'vi');
                }}
              >
                <Text style={[styles.languageText, { color: colors.text }]}>
                  {language === 'vi' ? 'Tiếng Việt - Vietnamese' : 'English - Tiếng Anh'}
              </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <Text style={[styles.supportText, { color: colors.textSecondary }]}>
                Gặp trục trặc?{' '}
                <Text
                  style={[styles.supportLink, { color: colors.primary }]}
                  onPress={() => {
                    // Navigate to support
                  }}
                >
                  Liên hệ hỗ trợ
            </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 2: Handle
  if (state.activeStep === SignupStep.HANDLE) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.surface}
        />
        <AlertModal />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => dispatch({ type: 'prev' })} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.stepHeaderText, { color: colors.text }]}>Chọn tên người dùng</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Bước 2 của 3: Chọn tên người dùng của bạn
            </Text>

            {state.error && state.errorField === 'handle' && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{state.error}</Text>
              </View>
            )}

            <View>
          <TextInput
                label="Tên người dùng"
                value={state.handle}
                onChangeText={(value) => {
                  dispatch({ type: 'setHandle', value: value.toLowerCase() });
                  if (state.errorField === 'handle') {
                    dispatch({ type: 'clearError' });
                  }
                }}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
              autoCorrect={false}
                error={state.errorField === 'handle'}
                left={<TextInput.Icon icon="at" />}
            />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Tên người dùng chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang (3-20 ký tự)
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={handleNext}
              style={[styles.continueButton, { backgroundColor: colors.primary }]}
              contentStyle={styles.buttonContent}
              labelStyle={{ color: isDarkMode ? '#000000' : '#FFFFFF' }}
              disabled={state.isLoading}
            >
              Tiếp theo
            </Button>

            <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
              <Text
                style={[styles.footerLink, { color: colors.primary }]}
                onPress={() => navigation.navigate('Login')}
              >
                Đã có tài khoản? Đăng nhập
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 3: OTP Verification
  if (state.activeStep === SignupStep.OTP) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.surface}
        />
        <AlertModal />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => dispatch({ type: 'prev' })} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.stepHeaderText, { color: colors.text }]}>Xác thực mã</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Bước 3/5: Nhập mã xác thực
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary, marginTop: spacing.xs, fontSize: typography.fontSize.sm }]}>
              Mã đã được gửi tới: {state.email}
            </Text>

            <View>
          <TextInput
                label="Nhập mã 6 số"
                value={state.otp}
                onChangeText={(text) => {
                  const newOtp = text.replace(/\D/g, '').slice(0, 6);
                  dispatch({ type: 'setOtp', value: newOtp });
                  // Clear error when user starts typing
                  if (state.otpError) {
                    dispatch({ type: 'clearOtpError' });
                  }
                  
                  // Auto-verify when 6 digits are entered (optional - can be disabled)
                  // Uncomment below to enable auto-verify
                  /*
                  if (newOtp.length === 6 && !state.isLoading && !isAutoVerifying) {
                    setIsAutoVerifying(true);
                    // Small delay to show the complete input
                    setTimeout(async () => {
                      try {
                        await handleVerify();
                      } catch (error) {
                        console.error('Auto-verify error:', error);
                      } finally {
                        setIsAutoVerifying(false);
                      }
                    }, 500);
                  }
                  */
                }}
            mode="outlined"
              style={styles.input}
                keyboardType="number-pad"
                maxLength={6}
            right={
                  state.otp.length === 6 ? (
              <TextInput.Icon
                      icon="check-circle"
                      color={colors.primary}
                    />
                  ) : undefined
                }
                error={state.otp.length > 0 && state.otp.length < 6}
              />
            </View>

            {state.otp.length > 0 && state.otp.length < 6 && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                Mã xác thực phải có đúng 6 số
              </Text>
            )}

            {state.otpError && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '20', flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: borderRadius.base, marginTop: spacing.sm }]}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error, marginLeft: spacing.xs, flex: 1 }]}>
                  {state.otpError}
                </Text>
              </View>
            )}

            {state.otp.length === 6 && state.isLoading && (
              <View style={[styles.successContainer, { backgroundColor: colors.primary + '15' }]}>
                <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.xs }} />
                <Text style={[styles.successText, { color: colors.primary }]}>
                  Đang xác thực mã...
                </Text>
              </View>
            )}
            
            {state.otp.length === 6 && !state.isLoading && (
              <View style={[styles.successContainer, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                <Text style={[styles.successText, { color: colors.primary }]}>
                  Đã nhập đủ 6 số. Nhấn nút "Xác thực" bên dưới để tiếp tục
                </Text>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleVerify}
              style={[
                styles.continueButton,
                {
                  backgroundColor: state.otp.length === 6 ? colors.primary : colors.border,
                  opacity: state.otp.length === 6 ? 1 : 0.5,
                },
              ]}
              contentStyle={styles.buttonContent}
              labelStyle={{ color: isDarkMode ? '#000000' : '#FFFFFF' }}
              loading={state.isLoading}
              disabled={state.isLoading || state.otp.length !== 6}
            >
              {state.isLoading ? 'Đang xác thực...' : state.otp.length === 6 ? 'Xác thực' : `Nhập mã (${state.otp.length}/6)`}
            </Button>

            <Text style={styles.footerNote}>
              <Text
                style={[
                  styles.footerLink,
                  {
                    color: state.resendCountdown > 0 ? colors.textSecondary : colors.primary,
                  },
                ]}
                onPress={handleResendOtp}
              >
                {state.resendCountdown > 0
                  ? `Gửi lại mã (${state.resendCountdown}s)`
                  : 'Gửi lại mã'}
              </Text>
            </Text>

            <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
              <Text
                style={[styles.footerLink, { color: colors.primary }]}
                onPress={() => navigation.navigate('Login')}
              >
                Đã có tài khoản? Đăng nhập
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 3: Avatar
  if (state.activeStep === SignupStep.AVATAR) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.surface}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => dispatch({ type: 'prev' })} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.stepHeaderText, { color: colors.text }]}>Ảnh đại diện</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Bước 3/5: Thêm ảnh đại diện
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Thêm ảnh đại diện để bạn bè dễ dàng nhận ra bạn
            </Text>

            <View style={styles.avatarContainer}>
              {state.avatarUri ? (
                <Image source={{ uri: state.avatarUri }} style={styles.avatarPreview} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                  <MaterialCommunityIcons name="account" size={80} color={colors.textSecondary} />
                </View>
              )}
            </View>

            <View style={styles.avatarButtons}>
              <Button
              mode="outlined"
                icon="image"
                onPress={handlePickAvatar}
                style={[styles.avatarButton, { borderColor: colors.border }]}
                labelStyle={{ color: colors.text }}
              >
                Chọn từ thư viện
              </Button>

              <Button
              mode="outlined"
                icon="camera"
                onPress={handleTakeAvatarPhoto}
                style={[styles.avatarButton, { borderColor: colors.border }]}
                labelStyle={{ color: colors.text }}
              >
                Chụp ảnh
              </Button>
            </View>

            <View style={styles.actionButtonsContainer}>
              <Button
                mode="outlined"
                onPress={handleSkipAvatar}
                style={[styles.backActionButton, { borderColor: colors.border }]}
                contentStyle={styles.buttonContent}
                labelStyle={{ color: colors.text }}
              >
                Bỏ qua
              </Button>
          <Button
            mode="contained"
                onPress={handleUploadAvatar}
                style={[styles.nextActionButton, { backgroundColor: colors.primary }]}
              contentStyle={styles.buttonContent}
              labelStyle={{ color: isDarkMode ? '#000000' : '#FFFFFF' }}
                loading={state.isLoading}
                disabled={state.isLoading || !state.avatarUri}
            >
                Tiếp theo
          </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 4: Suggested Users
  if (state.activeStep === SignupStep.SUGGESTED_USERS) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.surface}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => dispatch({ type: 'prev' })} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.stepHeaderText, { color: colors.text }]}>Người đề xuất</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Bước 4/5: Theo dõi người bạn quan tâm
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Theo dõi những người bạn quan tâm để xem nội dung của họ
            </Text>

            {state.suggestedUsers.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Đang tải người đề xuất...
                </Text>
              </View>
            ) : (
              <View style={styles.suggestedUsersList}>
                {state.suggestedUsers.map((user: any) => {
                  const userId = user.id || user.user_id || user._id;
                  const userName = user.name || user.username || user.handle || 'Người dùng';
                  const userAvatar = user.avatar || user.profile_picture;
                  const isFollowing = state.followedUserIds.includes(userId?.toString());

                  return (
                    <View
                      key={userId}
                      style={[styles.suggestedUserItem, { borderBottomColor: colors.border }]}
                    >
                      <View style={styles.suggestedUserInfo}>
                        {userAvatar ? (
                          <Avatar.Image
                            size={50}
                            source={{ uri: getAvatarURL(userAvatar) }}
                          />
                        ) : (
                          <Avatar.Text
                            size={50}
                            label={getInitials(userName)}
                            style={{ backgroundColor: colors.primary }}
                          />
                        )}
                        <View style={styles.suggestedUserDetails}>
                          <Text style={[styles.suggestedUserName, { color: colors.text }]}>
                            {userName}
                          </Text>
                          {user.bio && (
                            <Text
                              style={[styles.suggestedUserBio, { color: colors.textSecondary }]}
                              numberOfLines={1}
                            >
                              {user.bio}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Button
                        mode={isFollowing ? 'outlined' : 'contained'}
                        onPress={() =>
                          isFollowing ? handleUnfollowUser(userId) : handleFollowUser(userId)
                        }
                        style={[
                          styles.followButton,
                          isFollowing
                            ? { borderColor: colors.border }
                            : { backgroundColor: colors.primary },
                        ]}
                        labelStyle={{
                          color: isFollowing ? colors.text : isDarkMode ? '#000000' : '#FFFFFF',
                        }}
                      >
                        {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
                      </Button>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.actionButtonsContainer}>
              <Button
                mode="outlined"
                onPress={handleFinishOnboarding}
                style={[styles.backActionButton, { borderColor: colors.border }]}
                contentStyle={styles.buttonContent}
                labelStyle={{ color: colors.text }}
              >
                Bỏ qua
              </Button>
            <Button
              mode="contained"
                onPress={handleFinishOnboarding}
                style={[styles.nextActionButton, { backgroundColor: colors.primary }]}
              contentStyle={styles.buttonContent}
              labelStyle={{ color: isDarkMode ? '#000000' : '#FFFFFF' }}
            >
                Hoàn tất
            </Button>
            </View>
      </ScrollView>
    </KeyboardAvoidingView>
      </SafeAreaView>
  );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs + 2,
  },
  stepHeaderText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  formContent: {
    padding: spacing.base,
  },
  description: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xl,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    paddingHorizontal: 0,
  },
  input: {
    marginBottom: spacing.sm,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: borderRadius.base,
    padding: spacing.base - 2,
    marginBottom: spacing.xs,
  },
  dateInputText: {
    fontSize: typography.fontSize.md,
  },
  dateLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  genderInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: borderRadius.base,
    padding: spacing.base - 2,
    marginBottom: spacing.xs,
  },
  genderInputText: {
    fontSize: typography.fontSize.md,
  },
  genderModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '70%',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  genderOptionsList: {
    padding: spacing.sm,
  },
  genderModalOption: {
    borderRadius: borderRadius.base,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  genderModalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  genderModalOptionText: {
    fontSize: typography.fontSize.base,
  },
  genderModalOptionSubtext: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs / 2,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  errorContainer: {
    padding: spacing.sm,
    borderRadius: borderRadius.base,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.base,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  successText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  continueButton: {
    borderRadius: borderRadius.base,
    marginTop: spacing.sm,
  },
  buttonContent: {
    paddingVertical: spacing.sm + 2,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 16,
  },
  footerLink: {},
  termsText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.base,
    marginBottom: spacing.base,
    lineHeight: typography.fontSize.sm * 1.5,
    paddingHorizontal: spacing.sm,
  },
  termsLink: {
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
    marginBottom: spacing.xl,
  },
  backActionButton: {
    flex: 1,
    borderRadius: borderRadius.base,
    borderWidth: 1,
  },
  nextActionButton: {
    flex: 1,
    borderRadius: borderRadius.base,
  },
  footerContainer: {
    marginTop: spacing.xl,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  languageText: {
    fontSize: typography.fontSize.sm,
  },
  supportText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  supportLink: {
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  datePickerContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  // Alert styles
  alertDialog: {
    borderRadius: 12,
    width: 280,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 16,
    paddingBottom: 6,
  },
  alertMessage: {
    fontSize: 13,
    textAlign: 'center',
    padding: 2,
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 18,
  },
  alertButtonContainer: {
    borderTopWidth: 0.5,
    flexDirection: 'column',
  },
  alertButton: {
    fontSize: 15,
    padding: 10,
  },
  // Avatar step styles
  avatarContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  avatarPreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtons: {
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  avatarButton: {
    marginBottom: spacing.sm,
  },
  // Suggested users step styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.sm,
  },
  suggestedUsersList: {
    marginTop: spacing.base,
  },
  suggestedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
  },
  suggestedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  suggestedUserDetails: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  suggestedUserName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs / 2,
  },
  suggestedUserBio: {
    fontSize: typography.fontSize.sm,
  },
  followButton: {
    borderRadius: borderRadius.base,
    minWidth: 100,
  },
});

export default RegisterScreen;
