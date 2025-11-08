import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SecurityScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Security'>;

const SecurityScreen = () => {
  const navigation = useNavigation<SecurityScreenNavigationProp>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [appLock, setAppLock] = useState(false);

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const twoFactor = await AsyncStorage.getItem('twoFactorEnabled');
      const alerts = await AsyncStorage.getItem('loginAlerts');
      const lock = await AsyncStorage.getItem('appLock');
      
      if (twoFactor !== null) setTwoFactorEnabled(twoFactor === 'true');
      if (alerts !== null) setLoginAlerts(alerts === 'true');
      if (lock !== null) setAppLock(lock === 'true');
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const handleToggleTwoFactor = async (value: boolean) => {
    if (value) {
      Alert.alert(
        'Xác thực 2 yếu tố',
        'Tính năng này sẽ được phát triển trong tương lai. Bạn có muốn bật không?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Bật',
            onPress: async () => {
              try {
                await AsyncStorage.setItem('twoFactorEnabled', 'true');
                setTwoFactorEnabled(true);
                Alert.alert('Thành công', 'Đã bật xác thực 2 yếu tố');
              } catch (error) {
                console.error('Error saving two factor:', error);
              }
            },
          },
        ]
      );
    } else {
      try {
        await AsyncStorage.setItem('twoFactorEnabled', 'false');
        setTwoFactorEnabled(false);
      } catch (error) {
        console.error('Error saving two factor:', error);
      }
    }
  };

  const handleToggleLoginAlerts = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('loginAlerts', value.toString());
      setLoginAlerts(value);
    } catch (error) {
      console.error('Error saving login alerts:', error);
    }
  };

  const handleToggleAppLock = async (value: boolean) => {
    if (value) {
      Alert.alert(
        'Khóa ứng dụng',
        'Tính năng này sẽ được phát triển trong tương lai. Bạn có muốn bật không?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Bật',
            onPress: async () => {
              try {
                await AsyncStorage.setItem('appLock', 'true');
                setAppLock(true);
                Alert.alert('Thành công', 'Đã bật khóa ứng dụng');
              } catch (error) {
                console.error('Error saving app lock:', error);
              }
            },
          },
        ]
      );
    } else {
      try {
        await AsyncStorage.setItem('appLock', 'false');
        setAppLock(false);
      } catch (error) {
        console.error('Error saving app lock:', error);
      }
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Đổi mật khẩu', 'Tính năng này sẽ được phát triển trong tương lai');
  };

  const handleActiveSessions = () => {
    navigation.navigate('DeviceManagement');
  };

  const dynamicStyles = createStyles(colors);

  return (
    <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>
          Bảo mật & An toàn
        </Text>
        <View style={dynamicStyles.headerRight} />
      </View>

      <ScrollView
        style={dynamicStyles.content}
        contentContainerStyle={[
          dynamicStyles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 }
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* Account Security */}
        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
            Bảo mật tài khoản
          </Text>

          <TouchableOpacity
            style={dynamicStyles.menuItem}
            onPress={handleChangePassword}
          >
            <View style={dynamicStyles.menuItemLeft}>
              <MaterialCommunityIcons name="lock-outline" size={24} color={colors.text} />
              <View style={dynamicStyles.menuItemText}>
                <Text style={[dynamicStyles.menuItemTitle, { color: colors.text }]}>
                  Đổi mật khẩu
                </Text>
                <Text style={[dynamicStyles.menuItemDescription, { color: colors.textSecondary }]}>
                  Cập nhật mật khẩu để bảo vệ tài khoản
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={dynamicStyles.divider} />

          <View style={dynamicStyles.toggleRow}>
            <View style={dynamicStyles.toggleLeft}>
              <View style={dynamicStyles.toggleHeader}>
                <MaterialCommunityIcons name="two-factor-authentication" size={24} color={colors.text} />
                <View style={dynamicStyles.toggleText}>
                  <Text style={[dynamicStyles.toggleLabel, { color: colors.text }]}>
                    Xác thực 2 yếu tố
                  </Text>
                  <Text style={[dynamicStyles.toggleDescription, { color: colors.textSecondary }]}>
                    Thêm lớp bảo mật cho tài khoản
                  </Text>
                </View>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggleTwoFactor}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={twoFactorEnabled ? '#fff' : colors.textSecondary}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        {/* Privacy & Safety */}
        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
            Quyền riêng tư & An toàn
          </Text>

          <View style={dynamicStyles.toggleRow}>
            <View style={dynamicStyles.toggleLeft}>
              <View style={dynamicStyles.toggleHeader}>
                <MaterialCommunityIcons name="bell-alert-outline" size={24} color={colors.text} />
                <View style={dynamicStyles.toggleText}>
                  <Text style={[dynamicStyles.toggleLabel, { color: colors.text }]}>
                    Cảnh báo đăng nhập
                  </Text>
                  <Text style={[dynamicStyles.toggleDescription, { color: colors.textSecondary }]}>
                    Nhận thông báo khi có đăng nhập mới
                  </Text>
                </View>
              </View>
            </View>
            <Switch
              value={loginAlerts}
              onValueChange={handleToggleLoginAlerts}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={loginAlerts ? '#fff' : colors.textSecondary}
              ios_backgroundColor={colors.border}
            />
          </View>

          <View style={dynamicStyles.divider} />

          <View style={dynamicStyles.toggleRow}>
            <View style={dynamicStyles.toggleLeft}>
              <View style={dynamicStyles.toggleHeader}>
                <MaterialCommunityIcons name="lock-pattern" size={24} color={colors.text} />
                <View style={dynamicStyles.toggleText}>
                  <Text style={[dynamicStyles.toggleLabel, { color: colors.text }]}>
                    Khóa ứng dụng
                  </Text>
                  <Text style={[dynamicStyles.toggleDescription, { color: colors.textSecondary }]}>
                    Yêu cầu mật khẩu khi mở ứng dụng
                  </Text>
                </View>
              </View>
            </View>
            <Switch
              value={appLock}
              onValueChange={handleToggleAppLock}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={appLock ? '#fff' : colors.textSecondary}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        {/* Active Sessions */}
        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
            Phiên đăng nhập
          </Text>

          <TouchableOpacity
            style={dynamicStyles.menuItem}
            onPress={handleActiveSessions}
          >
            <View style={dynamicStyles.menuItemLeft}>
              <MaterialCommunityIcons name="devices" size={24} color={colors.text} />
              <View style={dynamicStyles.menuItemText}>
                <Text style={[dynamicStyles.menuItemTitle, { color: colors.text }]}>
                  Quản lý thiết bị
                </Text>
                <Text style={[dynamicStyles.menuItemDescription, { color: colors.textSecondary }]}>
                  Xem và quản lý các thiết bị đã đăng nhập
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Security Tips */}
        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
            Mẹo bảo mật
          </Text>
          <Text style={[dynamicStyles.sectionDescription, { color: colors.textSecondary }]}>
            • Sử dụng mật khẩu mạnh và độc nhất{'\n'}
            • Không chia sẻ thông tin đăng nhập với người khác{'\n'}
            • Đăng xuất khỏi thiết bị công cộng{'\n'}
            • Kiểm tra các phiên đăng nhập thường xuyên{'\n'}
            • Bật xác thực 2 yếu tố để tăng cường bảo mật
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLeft: {
    flex: 1,
    marginRight: 16,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    marginLeft: 12,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default SecurityScreen;

