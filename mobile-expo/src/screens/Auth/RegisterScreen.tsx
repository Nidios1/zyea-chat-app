import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Text, TextInput, Button, RadioButton, Checkbox, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList>;

const RegisterScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { login } = useAuth();

  const [step, setStep] = useState(1); // 1: intro, 2: name, 3: birthdate, 4: gender, 5: phone, 6: email, 7: password, 8: otp
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(20);
  const [registerMethod, setRegisterMethod] = useState<'phone' | 'email'>('phone');
  const [alertData, setAlertData] = useState({ show: false, title: '', message: '', onConfirm: null as (() => void) | null });

  // Countdown effect for resend OTP
  useEffect(() => {
    if (otpStep && resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpStep, resendCountdown]);

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertData({ show: true, title, message, onConfirm: onConfirm || null });
  };

  const closeAlert = () => {
    setAlertData({ show: false, title: '', message: '', onConfirm: null });
  };

  const handleNext = async () => {
    if (step === 2) {
      if (!firstName.trim()) {
        showAlert('Vui lòng nhập họ', 'Họ không được để trống.');
        return;
      }
      if (!lastName.trim()) {
        showAlert('Vui lòng nhập tên', 'Tên không được để trống.');
        return;
      }
      if (firstName.trim().length < 2) {
        showAlert('Họ quá ngắn', 'Họ phải có ít nhất 2 ký tự.');
        return;
      }
      if (lastName.trim().length < 2) {
        showAlert('Tên quá ngắn', 'Tên phải có ít nhất 2 ký tự.');
        return;
      }
      const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
      if (!nameRegex.test(firstName)) {
        showAlert('Họ không hợp lệ', 'Họ chỉ được chứa chữ cái tiếng Việt. Vui lòng nhập tên thật.');
        return;
      }
      if (!nameRegex.test(lastName)) {
        showAlert('Tên không hợp lệ', 'Tên chỉ được chứa chữ cái tiếng Việt. Vui lòng nhập tên thật.');
        return;
      }
      const combinedName = (firstName + lastName).toLowerCase();
      if (/([a-z])\1{3,}/.test(combinedName)) {
        showAlert('Tên không hợp lệ', 'Vui lòng nhập họ và tên thật, không phải username.');
        return;
      }
      if (firstName.trim().length < 3 && lastName.trim().length < 3) {
        showAlert('Tên quá ngắn', 'Vui lòng nhập đầy đủ họ và tên thật của bạn.');
        return;
      }
    }
    if (step === 3) {
      if (!birthDate) {
        showAlert('Chưa chọn ngày sinh', 'Vui lòng chọn ngày sinh của bạn.');
        return;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (birthDate > today) {
        showAlert('Ngày sinh không hợp lệ', 'Ngày sinh không được là ngày trong tương lai.');
        return;
      }
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      let actualAge = age;
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        actualAge = age - 1;
      }
      if (actualAge < 13) {
        showAlert('Tuổi không đủ', 'Bạn phải ít nhất 13 tuổi để đăng ký tài khoản.');
        return;
      }
      if (actualAge > 120) {
        showAlert('Ngày sinh không hợp lệ', 'Vui lòng kiểm tra lại ngày sinh của bạn.');
        return;
      }
    }
    if (step === 4) {
      if (!gender) {
        showAlert('Chưa chọn giới tính', 'Vui lòng chọn giới tính của bạn.');
        return;
      }
    }
    if (step === 5) {
      if (registerMethod === 'phone') {
        if (!phone.trim()) {
          showAlert('Chưa nhập số điện thoại', 'Vui lòng nhập số điện thoại của bạn.');
          return;
        }
        if (!phone.startsWith('+84') && !phone.startsWith('0')) {
          showAlert('Số điện thoại không hợp lệ', 'Số điện thoại phải bắt đầu bằng 0 hoặc +84.');
          return;
        }
        if (phone.replace(/\D/g, '').length < 10) {
          showAlert('Số điện thoại không hợp lệ', 'Số điện thoại phải có ít nhất 10 số. Vui lòng kiểm tra lại.');
          return;
        }
      } else {
        setStep(6);
        return;
      }
    }
    if (step === 6) {
      if (registerMethod === 'email') {
        if (!email.trim()) {
          showAlert('Chưa nhập email', 'Vui lòng nhập email của bạn.');
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showAlert('Email không hợp lệ', 'Email không đúng định dạng. Vui lòng kiểm tra lại.');
          return;
        }
      } else {
        // Phone method - validate password
        if (!password.trim()) {
          showAlert('Chưa nhập mật khẩu', 'Vui lòng nhập mật khẩu của bạn.');
          return;
        }
        if (password.length < 6) {
          showAlert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.');
          return;
        }
        if (password.length > 50) {
          showAlert('Mật khẩu quá dài', 'Mật khẩu không được vượt quá 50 ký tự.');
          return;
        }
        if (!confirmPassword.trim()) {
          showAlert('Chưa xác nhận mật khẩu', 'Vui lòng xác nhận mật khẩu của bạn.');
          return;
        }
        if (password !== confirmPassword) {
          showAlert('Mật khẩu không khớp', 'Hai mật khẩu không giống nhau. Vui lòng nhập lại.');
          return;
        }
        await handleRegister();
      return;
      }
    }
    if (step === 7) {
      if (!password.trim()) {
        showAlert('Chưa nhập mật khẩu', 'Vui lòng nhập mật khẩu của bạn.');
        return;
      }
      if (password.length < 6) {
        showAlert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }
      if (password.length > 50) {
        showAlert('Mật khẩu quá dài', 'Mật khẩu không được vượt quá 50 ký tự.');
        return;
      }
      if (!confirmPassword.trim()) {
        showAlert('Chưa xác nhận mật khẩu', 'Vui lòng xác nhận mật khẩu của bạn.');
        return;
      }
      if (password !== confirmPassword) {
        showAlert('Mật khẩu không khớp', 'Hai mật khẩu không giống nhau. Vui lòng nhập lại.');
        return;
      }
      await handleRegister();
      return;
    }
    setStep(step + 1);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Send verification code
      if (registerMethod === 'email' && email) {
        await authAPI.sendVerification({ email });
        setResendCountdown(20);
        setOtpStep(true);
        setLoading(false);
      } else if (registerMethod === 'phone' && phone) {
        await authAPI.sendVerification({ phone });
        setResendCountdown(20);
        setOtpStep(true);
        setLoading(false);
      } else {
        showAlert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin.');
        setLoading(false);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '';
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        showAlert('Email đã tồn tại', 'Email này đã được sử dụng. Vui lòng dùng email khác.');
      } else if (errorMessage.includes('phone') || errorMessage.includes('số điện thoại')) {
        showAlert('Số điện thoại đã tồn tại', 'Số điện thoại này đã được sử dụng. Vui lòng dùng số khác.');
      } else if (errorMessage) {
        showAlert('Đăng ký thất bại', errorMessage);
      } else {
        showAlert('Đăng ký thất bại', 'Gửi mã xác thực thất bại. Vui lòng thử lại.');
      }
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      showAlert('Mã xác thực không hợp lệ', 'Mã xác thực phải có đúng 6 số.');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP
      await authAPI.verifyCode(
        registerMethod === 'email' 
          ? { email, code: otp }
          : { phone, code: otp }
      );
      
      // Register after verification
      const response = await authAPI.register({
        fullName: `${firstName} ${lastName}`,
        email: registerMethod === 'email' ? email : '',
        phone: registerMethod === 'phone' ? phone : '',
        password,
        birthDate: birthDate?.toISOString().split('T')[0] || '',
        gender,
      });

      if (response.data?.token && response.data?.user) {
        await login(response.data.user, response.data.token);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '';
      if (errorMessage.includes('code') || errorMessage.includes('mã')) {
        showAlert('Mã không đúng', 'Mã xác thực không đúng. Vui lòng nhập lại.');
      } else if (errorMessage.includes('expired') || errorMessage.includes('hết hạn')) {
        showAlert('Mã đã hết hạn', 'Mã xác thực đã hết hạn. Vui lòng gửi lại mã.');
      } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        showAlert('Email đã tồn tại', 'Email này đã được sử dụng. Vui lòng dùng email khác hoặc đăng nhập.');
      } else if (errorMessage.includes('phone') || errorMessage.includes('số điện thoại')) {
        showAlert('Số điện thoại đã tồn tại', 'Số điện thoại này đã được sử dụng. Vui lòng dùng số khác.');
      } else if (errorMessage) {
        showAlert('Đăng ký thất bại', errorMessage);
      } else {
        showAlert('Đăng ký thất bại', 'Xác thực thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Alert Modal Component
  const AlertModal = () => (
    alertData.show ? (
      <Modal
        visible={alertData.show}
        transparent
        animationType="fade"
        onRequestClose={closeAlert}
      >
        <Pressable style={styles.modalOverlay} onPress={closeAlert}>
          <Pressable style={styles.alertDialog} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.alertTitle}>{alertData.title}</Text>
            <Text style={styles.alertMessage}>{alertData.message}</Text>
            <View style={styles.alertButtonContainer}>
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
    ) : null
  );

  // Step 1: Welcome
  if (step === 1) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AlertModal />
        
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.welcomeContent}>
          <View style={styles.illustration}>
            <View style={styles.photoFrame}>
              <View style={styles.portraitIcon}>
                <MaterialCommunityIcons name="account-group" size={50} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.heartIcon}>❤️</Text>
            <Text style={styles.cakeIcon}>🎂</Text>
            <Text style={styles.thumbsUpIcon}>👍</Text>
            <Text style={styles.landscapeFrame}>🌅</Text>
          </View>

          <Text style={styles.welcomeTitle}>Tham gia Zyea+</Text>
          <Text style={styles.welcomeDescription}>
            Hãy tạo tài khoản để kết nối với bạn bè, người thân và cộng đồng có chung sở thích.
          </Text>

          <Button
            mode="contained"
            onPress={() => setStep(2)}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            Tạo tài khoản mới
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Login')}
            style={styles.secondaryButton}
            contentStyle={styles.buttonContent}
          >
            Tìm tài khoản của tôi
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2: Name
  if (step === 2) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AlertModal />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
            </TouchableOpacity>
            <Text style={styles.stepHeaderText}>Bạn tên gì?</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.description}>Nhập tên bạn sử dụng trong đời thực.</Text>
            
            <View style={styles.inputGroup}>
              <View style={{ flex: 1, marginRight: 4 }}>
                <TextInput
                  label="Họ"
                  value={firstName}
                  onChangeText={setFirstName}
                  mode="outlined"
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <TextInput
                  label="Tên"
                  value={lastName}
                  onChangeText={setLastName}
                  mode="outlined"
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
              disabled={loading}
            >
              Tiếp
            </Button>

            <Text style={styles.footerNote}>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                Tìm tài khoản của tôi
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 3: Birthdate
  if (step === 3) {
  return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AlertModal />
        
    <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(2)} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
            </TouchableOpacity>
            <Text style={styles.stepHeaderText}>Ngày sinh của bạn là khi nào?</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.description}>
              Chọn ngày sinh của bạn. Bạn luôn có thể đặt thông tin này ở chế độ riêng tư vào lúc khác.{' '}
              <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>
                Tại sao tôi cần cung cấp ngày sinh của mình?
          </Text>
          </Text>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.dateInput}
            >
              <Text style={styles.dateInputText}>
                {birthDate ? birthDate.toLocaleDateString('vi-VN') : 'Chọn ngày sinh'}
              </Text>
              <MaterialCommunityIcons name="calendar" size={24} color="#666" />
            </TouchableOpacity>

            {showDatePicker && Platform.OS !== 'web' && (
              <>
                {Platform.OS === 'ios' ? (
                  <Modal visible={showDatePicker} transparent animationType="slide">
                    <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
                      <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.datePickerHeader}>
                          <Button onPress={() => setShowDatePicker(false)}>Hủy</Button>
                          <Text style={styles.datePickerTitle}>Chọn ngày sinh</Text>
                          <Button onPress={() => setShowDatePicker(false)}>Xong</Button>
                        </View>
                        {require('react-native').UIManager.hasViewManagerConfig?.('RNDateTimePicker') && (
                          <View style={{ height: 200 }}>
                            <Text style={{ padding: 20 }}>DatePicker component</Text>
                          </View>
                        )}
                      </Pressable>
                    </Pressable>
                  </Modal>
                ) : (
                  <Text style={styles.datePickerNote}>
                    Vui lòng sử dụng date picker native của thiết bị
                  </Text>
                )}
              </>
            )}
            
            {Platform.OS === 'web' && (
          <TextInput
                label="Ngày sinh"
                value={birthDate ? birthDate.toISOString().split('T')[0] : ''}
                onChangeText={(text) => {
                  if (text) {
                    setBirthDate(new Date(text));
                  }
                }}
            mode="outlined"
            style={styles.input}
                placeholder="YYYY-MM-DD"
              />
            )}

            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
              disabled={loading}
            >
              Tiếp
            </Button>

            <Text style={styles.footerNote}>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                Tìm tài khoản của tôi
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 4: Gender
  if (step === 4) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AlertModal />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(3)} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
            </TouchableOpacity>
            <Text style={styles.stepHeaderText}>Giới tính của bạn là gì?</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.description}>
              Bạn có thể thay đổi người nhìn thấy giới tính của mình trên trang cá nhân vào lúc khác.
            </Text>

            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioOption, gender === 'female' && styles.radioOptionSelected]}
                onPress={() => setGender('female')}
              >
                <RadioButton
                  value="female"
                  status={gender === 'female' ? 'checked' : 'unchecked'}
                  onPress={() => setGender('female')}
                  color="#0a66ff"
                />
                <Text style={styles.radioLabel}>Nữ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioOption, gender === 'male' && styles.radioOptionSelected]}
                onPress={() => setGender('male')}
              >
                <RadioButton
                  value="male"
                  status={gender === 'male' ? 'checked' : 'unchecked'}
                  onPress={() => setGender('male')}
                  color="#0a66ff"
                />
                <Text style={styles.radioLabel}>Nam</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioOption, gender === 'other' && styles.radioOptionSelected]}
                onPress={() => setGender('other')}
              >
                <RadioButton
                  value="other"
                  status={gender === 'other' ? 'checked' : 'unchecked'}
                  onPress={() => setGender('other')}
                  color="#0a66ff"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.radioLabel}>Lựa chọn khác</Text>
                  <Text style={styles.radioSubtext}>
                    Chọn Lựa chọn khác nếu bạn thuộc giới tính khác hoặc không muốn tiết lộ.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
              disabled={loading}
            >
              Tiếp
            </Button>

            <Text style={styles.footerNote}>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                Tìm tài khoản của tôi
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 5: Phone
  if (step === 5 && registerMethod === 'phone') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AlertModal />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(4)} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
            </TouchableOpacity>
            <Text style={styles.stepHeaderText}>Số di động của bạn là gì?</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.description}>
              Nhập số di động có thể dùng để liên hệ với bạn. Sẽ không ai nhìn thấy thông tin này trên trang cá nhân của bạn.
            </Text>

          <TextInput
              label="Số di động"
              value={phone}
              onChangeText={setPhone}
            mode="outlined"
            style={styles.input}
              keyboardType="phone-pad"
              placeholder="0xxxxxxxxx hoặc +84xxxxxxxxx"
            />

            <Text style={[styles.description, { fontSize: 13, marginTop: 4 }]}>
              Chúng tôi có thể gửi thông báo cho bạn qua WhatsApp và SMS.{' '}
              <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>
                Tìm hiểu thêm
              </Text>
            </Text>

            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
              disabled={loading}
            >
              Tiếp
            </Button>

            <Button
              mode="outlined"
              onPress={() => {
                setRegisterMethod('email');
                setStep(6);
              }}
              style={styles.secondaryButton}
              contentStyle={styles.buttonContent}
            >
              Đăng ký bằng email
            </Button>

            <Text style={styles.footerNote}>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                Tìm tài khoản của tôi
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 6: Email (if registerMethod === 'email')
  if (step === 6 && registerMethod === 'email') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AlertModal />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(4)} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
            </TouchableOpacity>
            <Text style={styles.stepHeaderText}>Nhập email của bạn</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.description}>
              Nhập email để chúng tôi có thể liên hệ với bạn và xác thực tài khoản.
            </Text>

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

            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
              disabled={loading}
            >
              Tiếp
            </Button>

            <Text style={styles.footerNote}>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                Tìm tài khoản của tôi
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 6: Password (if registerMethod === 'phone' && !otpStep)
  if (step === 6 && registerMethod === 'phone' && !otpStep) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AlertModal />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(5)} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
            </TouchableOpacity>
            <Text style={styles.stepHeaderText}>Tạo mật khẩu</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.description}>
              Mật khẩu phải có ít nhất 6 ký tự. Nên chọn mật khẩu khó đoán để bảo mật tài khoản của bạn.
            </Text>

          <TextInput
            label="Mật khẩu"
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

          <TextInput
              label="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            mode="outlined"
              style={styles.input}
            secureTextEntry={!showConfirmPassword}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
          />

            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
              disabled={loading}
            >
              Tiếp
            </Button>

            <Text style={styles.footerNote}>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                Tìm tài khoản của tôi
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 7: Password (if from email step)
  if (step === 7 && !otpStep) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AlertModal />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(6)} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
            </TouchableOpacity>
            <Text style={styles.stepHeaderText}>Tạo mật khẩu</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.description}>
              Mật khẩu phải có ít nhất 6 ký tự. Nên chọn mật khẩu khó đoán để bảo mật tài khoản của bạn.
            </Text>

            <TextInput
              label="Mật khẩu"
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

            <TextInput
              label="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showConfirmPassword}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

          <Button
            mode="contained"
              onPress={handleNext}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
              disabled={loading}
            >
              Tiếp
          </Button>

            <Text style={styles.footerNote}>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                Tìm tài khoản của tôi
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // OTP Step
  if (otpStep) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AlertModal />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setOtpStep(false)} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
            </TouchableOpacity>
            <Text style={styles.stepHeaderText}>Xác thực mã</Text>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.description}>
              Nhập mã xác thực đã gửi tới {registerMethod === 'email' ? `email: ${email}` : `số điện thoại: ${phone}`}
            </Text>

            <TextInput
              label="Nhập mã 6 số"
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
              mode="outlined"
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
            />

            {otp.length > 0 && otp.length < 6 && (
              <Text style={styles.errorText}>Mã xác thực phải có đúng 6 số</Text>
            )}

            <Button
              mode="contained"
              onPress={handleVerify}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
              loading={loading}
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Đang xác thực...' : 'Xác thực'}
            </Button>

            <Text style={styles.footerNote}>
              <Text
                style={[styles.footerLink, resendCountdown > 0 && styles.footerLinkDisabled]}
                onPress={async () => {
                  if (resendCountdown > 0) return;
                  try {
                    await authAPI.sendVerification(
                      registerMethod === 'email' ? { email } : { phone }
                    );
                    setResendCountdown(20);
                    Toast.show({ type: 'info', text1: 'Đã gửi lại mã' });
                  } catch (_) {}
                }}
              >
                {resendCountdown > 0 ? `Gửi lại mã (${resendCountdown}s)` : 'Gửi lại mã'}
              </Text>
            </Text>

            <Text style={styles.footerNote}>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                Tìm tài khoản của tôi
              </Text>
            </Text>
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
    backgroundColor: '#FFFFFF',
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
  description: {
    fontSize: 14,
    color: '#65676b',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 0,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  inputHalf: {
    flex: 1,
  },
  inputGroup: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dateInputText: {
    fontSize: 16,
    color: '#000',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#444',
    flex: 1,
    marginLeft: 8,
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
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#e6e6e6',
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
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
  footerLinkDisabled: {
    color: '#999',
  },
  // Welcome screen styles
  welcomeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: '70%',
  },
  illustration: {
    width: '100%',
    maxWidth: 280,
    height: 280,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
    overflow: 'visible',
  },
  photoFrame: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 3,
  },
  portraitIcon: {
    width: 90,
    height: 90,
    borderRadius: 6,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    position: 'absolute',
    left: 20,
    top: 30,
    fontSize: 28,
    zIndex: 2,
  },
  cakeIcon: {
    position: 'absolute',
    top: 20,
    right: 40,
    fontSize: 36,
    zIndex: 2,
  },
  thumbsUpIcon: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    fontSize: 64,
    color: '#1877f2',
    zIndex: 2,
  },
  landscapeFrame: {
    position: 'absolute',
    left: 20,
    bottom: 30,
    fontSize: 40,
    zIndex: 2,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1e21',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 14,
    color: '#65676b',
    marginBottom: 24,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: '#0a66ff',
    borderRadius: 12,
    width: '100%',
  },
  // Radio group styles
  radioGroup: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
  },
  radioOptionSelected: {
    backgroundColor: '#e9ecef',
  },
  radioLabel: {
    fontSize: 15,
    color: '#1c1e21',
    flex: 1,
    marginLeft: 10,
  },
  radioSubtext: {
    fontSize: 12,
    color: '#65676b',
    marginTop: 2,
    lineHeight: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    width: '90%',
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#c7c7cc',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  datePickerNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  // Alert styles
  alertDialog: {
    backgroundColor: '#fff',
    borderRadius: 14,
    width: 280,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    padding: 22,
    paddingBottom: 8,
    color: '#000',
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    padding: 4,
    paddingHorizontal: 22,
    color: '#6b6b6b',
    lineHeight: 20,
  },
  alertButtonContainer: {
    borderTopWidth: 0.5,
    borderTopColor: '#c7c7cc',
    flexDirection: 'column',
  },
  alertButton: {
    fontSize: 17,
    padding: 13,
  },
});

export default RegisterScreen;