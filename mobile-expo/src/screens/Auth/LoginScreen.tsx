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
  Image,
} from 'react-native';
import { Text, TextInput, Button, Checkbox, useTheme as usePaperTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authAPI } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../hooks/useAlert';
import { spacing, typography, borderRadius } from '../../config/designTokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList>;

interface Slide {
  key: string;
  title: string;
  desc: string;
  icon: string;
}

// Slides data
const getSlides = (t: (key: any) => string) => [
  {
    key: 'group',
    title: t('slides.group.title'),
    desc: t('slides.group.desc'),
    icon: 'account-group',
  },
  {
    key: 'photo',
    title: t('slides.photo.title'),
    desc: t('slides.photo.desc'),
    icon: 'image',
  },
  {
    key: 'diary',
    title: t('slides.diary.title'),
    desc: t('slides.diary.desc'),
    icon: 'heart',
  },
  {
    key: 'video',
    title: t('slides.video.title'),
    desc: t('slides.video.desc'),
    icon: 'video',
  },
];

// Logo component - defined outside to prevent re-creation on re-render
const LogoIcon = React.memo(() => (
  <View style={{ marginBottom: 32 }}>
    <Image 
      source={require('../../../assets/Zyea.png')} 
      style={{ width: 64, height: 64 }}
      resizeMode="contain"
    />
  </View>
));

const LoginScreen = () => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, colors } = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  const { showAlert, AlertComponent } = useAlert();
  const { language, setLanguage, t } = useLanguage();

  // Custom theme for checkboxes to ensure border is visible
  const checkboxTheme = {
    ...paperTheme,
    colors: {
      ...paperTheme.colors,
      primary: colors.primary,
      onSurface: colors.textSecondary,
    },
  };
  const [step, setStep] = useState(1); // 1: intro, 2: email, 3: password
  const [slideIndex, setSlideIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const slides = getSlides(t);

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


  const toggleLanguage = () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
  };

  const handleContinue = () => {
    // Validate email
    if (!email || email.trim() === '') {
      showAlert(t('auth.emailRequired'), t('auth.emailEmpty'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(t('auth.emailInvalid'), t('auth.emailInvalidDesc'));
      return;
    }
    // Validate terms
    if (!agree1 || !agree2) {
      showAlert(t('auth.terms'), t('auth.mustAgreeTermsDesc'));
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
      showAlert(t('auth.passwordRequired'), t('auth.passwordEmpty'));
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
        showAlert(t('auth.passwordIncorrect'), t('auth.passwordIncorrectDesc'));
      } else if (errorMessage.includes('email') || errorMessage.includes('Email') || errorMessage.includes('user')) {
        showAlert(t('auth.emailNotExist'), t('auth.emailNotExistDesc'));
      } else if (errorMessage) {
        showAlert(t('auth.loginFailed'), errorMessage);
      } else {
        showAlert(t('auth.loginFailed'), t('auth.loginError'));
      }
    } finally {
      setLoading(false);
    }
  };


  // Illustration component for each slide
  const SlideIllustration = ({ icon }: { icon: string }) => (
    <View style={styles.illustrationContainer}>
      <View style={[styles.dashedCircle, { borderColor: colors.border }]} />
      <View style={[styles.smallCircleLeft, { borderColor: colors.border, backgroundColor: colors.surface }]} />
      <View style={[styles.smallCircleRight, { borderColor: colors.border, backgroundColor: colors.surface }]} />
      <View style={[styles.centralIcon, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name={icon as any} size={48} color={colors.primary} />
      </View>
    </View>
  );

  // Step 1: Intro slides
  if (step === 1) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        
        {/* Language button */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.languageButton, { backgroundColor: colors.surface }]} onPress={toggleLanguage}>
            <Text style={[styles.languageText, { color: colors.text }]}>{language === 'vi' ? 'Tiếng Việt' : 'English'}</Text>
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <LogoIcon />

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
                <Text style={[styles.headline, { color: colors.text }]}>{slide.title}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>{slide.desc}</Text>
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
                  { backgroundColor: colors.border },
                  i === slideIndex && styles.dotActive,
                  i === slideIndex && { backgroundColor: colors.primary },
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
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.loginButtonText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}
          >
            {t('auth.login')}
          </Button>

          <View style={styles.buttonSpacer} />

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Register')}
            style={[styles.registerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.registerButtonText, { color: colors.text }]}
          >
            {t('auth.createAccount')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Step 2: Email + Terms
  if (step === 2) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.stepHeaderText, { color: colors.text }]}>{t('auth.enterEmail')}</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              label={t('auth.enterYourEmail')}
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
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  agree1 && styles.checkboxBorderChecked,
                  agree1 && { borderColor: colors.primary, backgroundColor: colors.primary }
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
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                {t('auth.agreeTerms1')}{' '}
                <Text
                  style={[styles.termsLink, { color: colors.primary }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('Terms' as never);
                  }}
                >
                  {t('auth.agreeTerms2')}
                </Text>
              </Text>
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkboxBorder,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  agree2 && styles.checkboxBorderChecked,
                  agree2 && { borderColor: colors.primary, backgroundColor: colors.primary }
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
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                {t('auth.agreeTerms3')}{' '}
                <Text
                  style={[styles.termsLink, { color: colors.primary }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('SocialTerms' as never);
                  }}
                >
                  {t('auth.agreeTerms4')}
                </Text>
              </Text>
            </View>

            {(showTermsError || (termsTouched && (!agree1 || !agree2))) && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {t('auth.mustAgreeTerms')}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleContinue}
              style={[styles.continueButton, { backgroundColor: colors.primary }]}
              contentStyle={styles.buttonContent}
              labelStyle={{ color: isDarkMode ? '#000000' : '#FFFFFF' }}
              disabled={loading}
            >
              {t('auth.continue')}
            </Button>

            <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
              {t('auth.noAccount')}{' '}
              <Text
                style={[styles.footerLink, { color: colors.primary }]}
                onPress={() => navigation.navigate('Register')}
              >
                {t('auth.createAccountLink')}
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => setStep(2)} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.stepHeaderText, { color: colors.text }]}>{t('auth.enterPassword')}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.emailDisplay, { color: colors.textSecondary }]}>{email || 'Email'}</Text>

          <TextInput
            label={t('auth.enterPassword')}
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
                { borderColor: colors.border, backgroundColor: colors.surface },
                rememberPassword && styles.checkboxBorderChecked,
                rememberPassword && { borderColor: colors.primary, backgroundColor: colors.primary }
              ]}
              activeOpacity={0.7}
              onPress={() => setRememberPassword(!rememberPassword)}
            >
              {rememberPassword && (
                <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
              )}
            </TouchableOpacity>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>{t('auth.rememberPassword')}</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: isDarkMode ? '#000000' : '#FFFFFF' }}
            loading={loading}
            disabled={loading}
          >
            {loading ? t('auth.loggingIn') : t('auth.continue')}
          </Button>

          <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
            <Text
              style={[styles.footerLink, { color: colors.primary }]}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              {t('auth.forgotPassword')}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base + 2,
    alignItems: 'flex-end',
  },
  languageButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  languageText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  slideViewport: {
    width: SCREEN_WIDTH - 64,
    marginBottom: spacing.base + 2,
  },
  slidesRow: {
    flexDirection: 'row',
  },
  slide: {
    width: SCREEN_WIDTH - 64,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  illustrationContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    position: 'relative',
  },
  dashedCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderStyle: 'dashed',
    position: 'absolute',
  },
  centralIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.base,
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
    borderRadius: borderRadius.full / 2,
    borderWidth: 2,
  },
  smallCircleRight: {
    position: 'absolute',
    right: -8,
    top: 18,
    width: 44,
    height: 44,
    borderRadius: borderRadius.full / 2,
    borderWidth: 2,
  },
  headline: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs + 2,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.sm + 1,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.xs,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  buttonSpacer: {
    height: spacing.xs + 2,
  },
  loginButton: {
    borderRadius: borderRadius.xs + 2,
    minHeight: 36,
  },
  loginButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    paddingVertical: 0,
  },
  registerButton: {
    borderWidth: 1,
    borderRadius: borderRadius.xs + 2,
    minHeight: 36,
  },
  registerButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    paddingVertical: 0,
  },
  buttonContent: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.base,
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
    marginLeft: 8,
  },
  formContent: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  checkboxBorderChecked: {
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
    marginLeft: 0,
    lineHeight: 20,
  },
  termsLink: {
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  continueButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 16,
  },
  footerLink: {
  },
  emailDisplay: {
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});

export default LoginScreen;
