import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { authAPI } from '../../utils/api';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

type AddPhoneScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'AddPhone'>;

const AddPhoneScreen = () => {
  const theme = useTheme();
  const { colors, isDarkMode } = useCustomTheme();
  const navigation = useNavigation<AddPhoneScreenNavigationProp>();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại của bạn.');
      return;
    }

    // Validate phone format
    const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
    const cleanPhone = phone.replace(/\s/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam.');
      return;
    }

    setLoading(true);
    try {
      // Format phone: convert 0xxx to +84xxx
      let formattedPhone = cleanPhone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+84' + formattedPhone.substring(1);
      }

      // Send verification code
      await authAPI.sendVerification({ phone: formattedPhone });
      
      // Navigate to verify screen
      navigation.navigate('VerifyPhone', { phone: formattedPhone });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không thể gửi mã xác minh. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen when sending code
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Đang gửi mã...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPhoneValid = () => {
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
    return phoneRegex.test(cleanPhone);
  };

  const dynamicStyles = createStyles(colors, isDarkMode);

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
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Thêm số điện thoại của bạn
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Phone Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="phone"
              size={80}
              color="#4CAF50"
            />
          </View>

          {/* Description Text */}
          <Text style={[styles.description, { color: colors.text }]}>
            Số điện thoại giúp chúng tôi xác minh tài khoản hoặc liên hệ với bạn khi có vấn đề về bảo mật hoặc hỗ trợ. Chúng tôi sẽ không hiển thị số điện thoại của bạn với người khác.
          </Text>

          {/* Learn More Link */}
          <TouchableOpacity style={styles.learnMoreContainer}>
            <Text style={styles.learnMoreText}>Tìm hiểu thêm</Text>
          </TouchableOpacity>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              placeholder="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={[
                styles.input,
                { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' },
              ]}
              contentStyle={[
                styles.inputContent,
                { color: colors.text },
              ]}
              outlineStyle={[
                styles.inputOutline,
                { borderColor: isDarkMode ? '#333' : '#e0e0e0' },
              ]}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
          </View>
        </View>

        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              {
                backgroundColor: isPhoneValid() ? '#4CAF50' : (isDarkMode ? '#2a2a2a' : '#e0e0e0'),
                opacity: isPhoneValid() ? 1 : 0.6,
              },
            ]}
            onPress={handleNext}
            disabled={!isPhoneValid() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.nextButtonText,
                  {
                    color: isPhoneValid() ? '#FFFFFF' : (isDarkMode ? '#666' : '#999'),
                  },
                ]}
              >
                Tiếp theo
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    // Styles sẽ được thêm vào nếu cần
  });

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
  backButton: {
    padding: 4,
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  learnMoreContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  learnMoreText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '500',
  },
  inputContainer: {
    marginTop: 8,
  },
  input: {
    height: 56,
  },
  inputContent: {
    fontSize: 16,
  },
  inputOutline: {
    borderRadius: 12,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  nextButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default AddPhoneScreen;

