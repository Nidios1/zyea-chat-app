import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { authAPI } from '../../utils/api';
import Toast from 'react-native-toast-message';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList>;

const ForgotPasswordScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

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
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="displaySmall" style={styles.title}>
            Quên mật khẩu
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Nhập email của bạn để nhận link reset mật khẩu
          </Text>

          {success ? (
            <View style={styles.successContainer}>
              <Text style={[styles.successText, { color: theme.colors.primary }]}>
                Đã gửi email thành công! Vui lòng kiểm tra hộp thư của bạn.
              </Text>
            </View>
          ) : (
            <>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {error ? (
                <Text style={[styles.error, { color: theme.colors.error }]}>
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
                Gửi email
              </Button>
            </>
          )}

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
          >
            Quay lại đăng nhập
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
    color: '#0068ff',
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
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    marginBottom: 20,
  },
  successText: {
    textAlign: 'center',
    fontSize: 15,
  },
});

export default ForgotPasswordScreen;
