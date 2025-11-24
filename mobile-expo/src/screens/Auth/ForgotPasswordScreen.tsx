import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, Button, useTheme as usePaperTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { authAPI } from '../../utils/api';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList>;

const ForgotPasswordScreen = () => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, colors } = useTheme();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authAPI.forgotPassword(email);
      
      setSuccess(true);
      Toast.show({
        type: 'success',
        text1: 'Email đã được gửi!',
        text2: 'Vui lòng kiểm tra hộp thư của bạn',
      });

      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Có lỗi xảy ra';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="displaySmall" style={[styles.title, { color: colors.primary }]}>
            {t('auth.forgotPassword')}
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('auth.emailSentDesc')}
          </Text>

          {success ? (
            <View style={[styles.successContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.successText, { color: colors.primary }]}>
                {t('auth.emailSent')} {t('auth.emailSentDesc')}
              </Text>
            </View>
          ) : (
            <>
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

              {error ? (
                <Text style={[styles.error, { color: colors.error }]}>
                  {error}
                </Text>
              ) : null}

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={Boolean(loading)}
                disabled={Boolean(loading)}
                style={styles.button}
              >
                {t('auth.sendEmail')}
              </Button>
            </>
          )}

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
          >
            {t('auth.backToLogin')}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 16,
  },
  error: {
    textAlign: 'center',
    marginBottom: 8,
  },
  successContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  successText: {
    textAlign: 'center',
    fontSize: 15,
  },
});

export default ForgotPasswordScreen;
