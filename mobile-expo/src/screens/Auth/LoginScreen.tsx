import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text, TextInput, Button, Checkbox, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authAPI } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../hooks/useAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList>;

interface Slide {
  key: string;
  title: string;
  desc: string;
  icon: string;
}

const slides: Slide[] = [
  {
    key: 'group',
    title: 'Chat nhóm tiện lợi',
    desc: 'Cùng trao đổi, giữ liên lạc với gia đình, bạn bè và đồng nghiệp mọi lúc mọi nơi',
    icon: 'account-group',
  },
  {
    key: 'photo',
    title: 'Gửi ảnh nhanh chóng',
    desc: 'Chia sẻ hình ảnh chất lượng cao với bạn bè và người thân nhanh chóng và dễ dàng',
    icon: 'image',
  },
  {
    key: 'diary',
    title: 'Nhật ký bạn bè',
    desc: 'Nơi cập nhật hoạt động mới nhất của những người bạn quan tâm',
    icon: 'heart',
  },
  {
    key: 'video',
    title: 'Gọi video ổn định',
    desc: 'Trò chuyện thật đã với hình ảnh sắc nét, tiếng chất, âm chuẩn dưới mọi điều kiện mạng',
    icon: 'video',
  },
];

const LoginScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  const { showAlert, AlertComponent } = useAlert();

  // Custom theme for checkboxes to ensure border is visible
  const checkboxTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: '#0a66ff',
      onSurface: '#666',
    },
  };
  const [step, setStep] = useState(1); // 1: intro, 2: email, 3: password
  const [slideIndex, setSlideIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load saved email when entering step 2
  useEffect(() => {
    if (step === 2) {
      AsyncStorage.getItem('savedEmail').then((savedEmail) => {
        if (savedEmail) {
          setEmail(savedEmail);
        }
      });
      AsyncStorage.getItem('savedPassword').then((savedPassword) => {
        if (savedPassword) {
          setRememberPassword(true);
        }
      });
    }
  }, [step]);

  // Load saved password when entering step 3
  useEffect(() => {
    if (step === 3) {
      AsyncStorage.getItem('savedPassword').then((savedPassword) => {
        AsyncStorage.getItem('savedEmail').then((savedEmail) => {
          if (savedPassword && savedEmail === email) {
            setPassword(savedPassword);
            setRememberPassword(true);
          }
        });
      });
    }
  }, [step, email]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setSlideIndex(index);
  };


  const handleContinue = () => {
    // Validate email
    if (!email || email.trim() === '') {
      showAlert('Vui lòng nhập email', 'Email không được để trống.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Email không hợp lệ', 'Vui lòng kiểm tra lại địa chỉ email.');
      return;
    }
    // Validate terms
    if (!agree1 || !agree2) {
      showAlert('Điều khoản', 'Vui lòng đồng ý các điều khoản để tiếp tục.');
      setShowTermsError(true);
      setTermsTouched(true);
      return;
    }
    setShowTermsError(false);
    setTermsTouched(false);
    setStep(3);
  };

  const handleSubmit = async () => {
    // Validate password
    if (!password || password.trim() === '') {
      showAlert('Vui lòng nhập mật khẩu', 'Mật khẩu không được để trống.');
      return;
    }

    setLoading(true);
    try {
      // Update API call to use email instead of username
      const response = await authAPI.login(email, password);
      
      // Save credentials if remember password is checked
      if (rememberPassword) {
        await AsyncStorage.setItem('savedEmail', email);
        await AsyncStorage.setItem('savedPassword', password);
      } else {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
      }

      if (response.data?.user && response.data?.token) {
        await login(response.data.user, response.data.token);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '';
      
      if (errorMessage.includes('password') || errorMessage.includes('mật khẩu')) {
        showAlert('Mật khẩu không đúng', 'Mật khẩu bạn nhập không đúng. Vui lòng thử lại.');
      } else if (errorMessage.includes('email') || errorMessage.includes('Email') || errorMessage.includes('user')) {
        showAlert('Email không tồn tại', 'Email này chưa được đăng ký. Vui lòng kiểm tra lại.');
      } else if (errorMessage) {
        showAlert('Đăng nhập thất bại', errorMessage);
      } else {
        showAlert('Đăng nhập thất bại', 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Logo component
  const LogoIcon = () => (
    <View style={styles.logoContainer}>
      <View style={styles.logoShape}>
        <Text style={styles.logoText}>Z</Text>
      </View>
    </View>
  );

  // Illustration component for each slide
  const SlideIllustration = ({ icon }: { icon: string }) => (
    <View style={styles.illustrationContainer}>
      <View style={styles.dashedCircle} />
      <View style={styles.smallCircleLeft} />
      <View style={styles.smallCircleRight} />
      <View style={styles.centralIcon}>
        <MaterialCommunityIcons name={icon as any} size={48} color="#2196F3" />
      </View>
    </View>
  );

  // Step 1: Intro slides
  if (step === 1) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#F7F8FA' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />
        
        {/* Language button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.languageText}>Tiếng Việt</Text>
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <LogoIcon />
          <Text style={styles.appName}>Zyea+</Text>

          {/* Slides */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.slideViewport}
            contentContainerStyle={styles.slidesRow}
          >
            {slides.map((slide) => (
              <View key={slide.key} style={styles.slide}>
                <SlideIllustration icon={slide.icon} />
                <Text style={styles.headline}>{slide.title}</Text>
                <Text style={styles.description}>{slide.desc}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Pagination dots */}
          <View style={styles.paginationDots}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === slideIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Bottom buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => setStep(2)}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.loginButtonText}
          >
            Đăng nhập
          </Button>

          <View style={styles.buttonSpacer} />

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Register')}
            style={styles.registerButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.registerButtonText}
          >
            Tạo tài khoản mới
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Step 2: Email + Terms
  if (step === 2) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
            </TouchableOpacity>
            <Text style={styles.stepHeaderText}>Nhập email</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              label="Nhập email của bạn"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkboxBorder,
                  agree1 && styles.checkboxBorderChecked
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setAgree1(!agree1);
                  setTermsTouched(true);
                }}
              >
                {agree1 && (
                  <MaterialCommunityIcons name="check" size={14} color="#ffffff" />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                Tôi đồng ý với các{' '}
                <Text
                  style={styles.termsLink}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('Terms' as never);
                  }}
                >
                  điều khoản sử dụng Zyea+
                </Text>
              </Text>
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkboxBorder,
                  agree2 && styles.checkboxBorderChecked
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setAgree2(!agree2);
                  setTermsTouched(true);
                }}
              >
                {agree2 && (
                  <MaterialCommunityIcons name="check" size={14} color="#ffffff" />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                Tôi đồng ý với{' '}
                <Text
                  style={styles.termsLink}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('SocialTerms' as never);
                  }}
                >
                  điều khoản Mạng xã hội của Zyea+
                </Text>
              </Text>
            </View>

            {(showTermsError || (termsTouched && (!agree1 || !agree2))) && (
              <Text style={styles.errorText}>
                Bạn cần đồng ý đầy đủ các điều khoản để tiếp tục
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleContinue}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
              disabled={loading}
            >
              Tiếp tục
            </Button>

            <Text style={styles.footerNote}>
              Chưa có tài khoản?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('Register')}
              >
                Tạo tài khoản
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
        <AlertComponent />
      </SafeAreaView>
    );
  }

  // Step 3: Password
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => setStep(2)} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
          </TouchableOpacity>
          <Text style={styles.stepHeaderText}>Nhập mật khẩu</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.emailDisplay}>{email || 'Email'}</Text>

          <TextInput
            label="Nhập mật khẩu"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkboxBorder,
                rememberPassword && styles.checkboxBorderChecked
              ]}
              activeOpacity={0.7}
              onPress={() => setRememberPassword(!rememberPassword)}
            >
              {rememberPassword && (
                <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
              )}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Lưu mật khẩu</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.continueButton}
            contentStyle={styles.buttonContent}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Tiếp tục'}
          </Button>

          <Text style={styles.footerNote}>
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              Quên mật khẩu?
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <AlertComponent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  languageButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoShape: {
    width: 64,
    height: 64,
    backgroundColor: '#000000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0a66ff',
    marginTop: 6,
    marginBottom: 24,
  },
  slideViewport: {
    width: SCREEN_WIDTH - 64,
    marginBottom: 10,
  },
  slidesRow: {
    flexDirection: 'row',
  },
  slide: {
    width: SCREEN_WIDTH - 64,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  dashedCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#dfe6ef',
    borderStyle: 'dashed',
    position: 'absolute',
  },
  centralIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#eaf3ff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  smallCircleLeft: {
    position: 'absolute',
    left: -8,
    top: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#d7e6ff',
    backgroundColor: '#eaf3ff',
  },
  smallCircleRight: {
    position: 'absolute',
    right: -8,
    top: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#d7e6ff',
    backgroundColor: '#eaf3ff',
  },
  headline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#586174',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d6dbe3',
    marginHorizontal: 3,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0a66ff',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
  },
  buttonSpacer: {
    height: 6,
  },
  loginButton: {
    backgroundColor: '#0a66ff',
    borderRadius: 6,
    minHeight: 36,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  registerButton: {
    backgroundColor: '#f2f4f7',
    borderColor: '#e6e6e6',
    borderWidth: 1,
    borderRadius: 6,
    minHeight: 36,
  },
  registerButtonText: {
    color: '#222',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  buttonContent: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: {
    padding: 6,
  },
  stepHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2b2b2b',
    marginLeft: 8,
  },
  formContent: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  checkboxBorder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    backgroundColor: '#fff',
  },
  checkboxBorderChecked: {
    borderColor: '#0a66ff',
    backgroundColor: '#0a66ff',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#444',
    flex: 1,
    marginLeft: 0,
    lineHeight: 20,
  },
  termsLink: {
    color: '#0a66ff',
  },
  errorText: {
    color: '#e53935',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  continueButton: {
    backgroundColor: '#0a66ff',
    borderRadius: 12,
    marginTop: 8,
  },
  footerNote: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    marginTop: 16,
  },
  footerLink: {
    color: '#0a66ff',
  },
  emailDisplay: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});

export default LoginScreen;
