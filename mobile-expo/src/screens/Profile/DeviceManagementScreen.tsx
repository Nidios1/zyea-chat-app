import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
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
import { Platform } from 'react-native';

type DeviceManagementScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'DeviceManagement'>;

interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  isCurrent: boolean;
  lastActive: string;
}

const DeviceManagementScreen = () => {
  const navigation = useNavigation<DeviceManagementScreenNavigationProp>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = () => {
    // Mock data - trong thực tế sẽ lấy từ API
    const currentDevice: DeviceInfo = {
      id: '1',
      name: `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} Device`,
      type: Platform.OS === 'ios' ? 'iOS' : 'Android',
      isCurrent: true,
      lastActive: 'Đang sử dụng',
    };

    // Thêm các thiết bị khác (mock)
    const otherDevices: DeviceInfo[] = [
      {
        id: '2',
        name: 'iPhone 13 Pro',
        type: 'iOS',
        isCurrent: false,
        lastActive: '2 giờ trước',
      },
      {
        id: '3',
        name: 'Samsung Galaxy S21',
        type: 'Android',
        isCurrent: false,
        lastActive: '1 ngày trước',
      },
    ];

    setDevices([currentDevice, ...otherDevices]);
  };

  const handleRemoveDevice = (deviceId: string, deviceName: string) => {
    if (devices.find(d => d.id === deviceId)?.isCurrent) {
      Alert.alert('Lỗi', 'Không thể xóa thiết bị hiện tại');
      return;
    }

    Alert.alert(
      'Xóa thiết bị',
      `Bạn có chắc chắn muốn xóa thiết bị "${deviceName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setDevices(devices.filter(d => d.id !== deviceId));
            Alert.alert('Thành công', 'Đã xóa thiết bị');
          },
        },
      ]
    );
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
          Quản lý thiết bị
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
        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
            Thiết bị đang đăng nhập
          </Text>
          <Text style={[dynamicStyles.sectionDescription, { color: colors.textSecondary }]}>
            Quản lý các thiết bị đã đăng nhập vào tài khoản của bạn
          </Text>
        </View>

        {devices.map((device) => (
          <View
            key={device.id}
            style={[dynamicStyles.deviceCard, { backgroundColor: colors.surface }]}
          >
            <View style={dynamicStyles.deviceInfo}>
              <View style={dynamicStyles.deviceIcon}>
                <MaterialCommunityIcons
                  name={device.type === 'iOS' ? 'cellphone-iphone' : 'cellphone'}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={dynamicStyles.deviceDetails}>
                <View style={dynamicStyles.deviceHeader}>
                  <Text style={[dynamicStyles.deviceName, { color: colors.text }]}>
                    {device.name}
                  </Text>
                  {device.isCurrent && (
                    <View style={[dynamicStyles.currentBadge, { backgroundColor: colors.primary }]}>
                      <Text style={dynamicStyles.currentBadgeText}>Hiện tại</Text>
                    </View>
                  )}
                </View>
                <Text style={[dynamicStyles.deviceType, { color: colors.textSecondary }]}>
                  {device.type}
                </Text>
                <Text style={[dynamicStyles.deviceLastActive, { color: colors.textSecondary }]}>
                  {device.lastActive}
                </Text>
              </View>
            </View>
            {!device.isCurrent && (
              <TouchableOpacity
                style={dynamicStyles.removeButton}
                onPress={() => handleRemoveDevice(device.id, device.name)}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.error || '#ff4444'} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <Text style={[dynamicStyles.sectionDescription, { color: colors.textSecondary }]}>
            Nếu bạn thấy thiết bị lạ, hãy xóa ngay và đổi mật khẩu để bảo vệ tài khoản.
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  deviceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 132, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  deviceType: {
    fontSize: 14,
    marginBottom: 2,
  },
  deviceLastActive: {
    fontSize: 13,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default DeviceManagementScreen;

