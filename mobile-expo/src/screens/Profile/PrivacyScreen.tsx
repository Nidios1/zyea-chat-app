import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PrivacyScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Privacy'>;

interface PrivacySetting {
  id: string;
  title: string;
  value: string;
  description?: string;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

const PrivacyScreen = () => {
  const navigation = useNavigation<PrivacyScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [showPrivacyBanner, setShowPrivacyBanner] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [cameraEffects, setCameraEffects] = useState(false);
  const [lastSeen, setLastSeen] = useState('Danh bạ của tôi,...');
  const [profilePicture, setProfilePicture] = useState('Mọi người');
  const [about, setAbout] = useState('Danh bạ của tôi');
  const [links, setLinks] = useState('Danh bạ của tôi');
  const [groups, setGroups] = useState('Mọi người');
  const [avatarStickers, setAvatarStickers] = useState('Danh bạ của tôi');
  const [status, setStatus] = useState('Danh bạ của tôi');
  const [defaultTimer, setDefaultTimer] = useState('Tắt');
  const [currentLocation, setCurrentLocation] = useState('Không');

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const banner = await AsyncStorage.getItem('privacyBannerDismissed');
      const receipts = await AsyncStorage.getItem('readReceipts');
      const effects = await AsyncStorage.getItem('cameraEffects');
      
      if (banner === 'true') setShowPrivacyBanner(false);
      if (receipts !== null) setReadReceipts(receipts === 'true');
      if (effects !== null) setCameraEffects(effects === 'true');
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const handleToggleReadReceipts = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('readReceipts', value.toString());
      setReadReceipts(value);
    } catch (error) {
      console.error('Error saving read receipts:', error);
    }
  };

  const handleToggleCameraEffects = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('cameraEffects', value.toString());
      setCameraEffects(value);
    } catch (error) {
      console.error('Error saving camera effects:', error);
    }
  };

  const handleDismissBanner = async () => {
    try {
      await AsyncStorage.setItem('privacyBannerDismissed', 'true');
      setShowPrivacyBanner(false);
    } catch (error) {
      console.error('Error dismissing banner:', error);
    }
  };

  const privacySettings: PrivacySetting[] = [
    {
      id: 'last-seen',
      title: 'Lần cuối thấy và Trực tuyến',
      value: lastSeen,
      onPress: () => {},
    },
    {
      id: 'profile-picture',
      title: 'Ảnh đại diện',
      value: profilePicture,
      onPress: () => {},
    },
    {
      id: 'about',
      title: 'Giới thiệu',
      value: about,
      onPress: () => {},
    },
    {
      id: 'links',
      title: 'Liên kết',
      value: links,
      onPress: () => {},
    },
    {
      id: 'groups',
      title: 'Các Nhóm',
      value: groups,
      onPress: () => {},
    },
    {
      id: 'avatar-stickers',
      title: 'Nhãn dán avatar',
      value: avatarStickers,
      onPress: () => {},
    },
    {
      id: 'status',
      title: 'Trạng thái',
      value: status,
      onPress: () => {},
    },
  ];

  const dynamicStyles = createStyles(colors, isDarkMode);

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>
          Quyền riêng tư
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={dynamicStyles.scrollView}
        contentContainerStyle={[
          dynamicStyles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 }
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* Privacy Check Banner */}
        {showPrivacyBanner && (
          <View style={[
            dynamicStyles.privacyBanner,
            { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface }
          ]}>
            <TouchableOpacity
              style={dynamicStyles.bannerClose}
              onPress={handleDismissBanner}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={dynamicStyles.bannerContent}>
              <MaterialCommunityIcons name="lock" size={24} color="#4CAF50" />
              <View style={dynamicStyles.bannerText}>
                <Text style={[dynamicStyles.bannerTitle, { color: colors.text }]}>
                  Kiểm tra quyền riêng tư
                </Text>
                <Text style={[dynamicStyles.bannerDescription, { color: colors.textSecondary }]}>
                  Kiểm soát quyền riêng tư của bạn và chọn các cài đặt phù hợp với bạn.
                </Text>
                <TouchableOpacity onPress={() => {}}>
                  <Text style={[dynamicStyles.bannerLink, { color: '#4CAF50' }]}>
                    Bắt đầu kiểm tra
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Privacy Settings List */}
        <View style={[
          dynamicStyles.settingsGroup,
          { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface }
        ]}>
          {privacySettings.map((setting, index) => (
            <React.Fragment key={setting.id}>
              <TouchableOpacity
                style={dynamicStyles.settingItem}
                onPress={setting.onPress}
                activeOpacity={0.7}
              >
                <Text style={[dynamicStyles.settingTitle, { color: colors.text }]}>
                  {setting.title}
                </Text>
                <View style={dynamicStyles.settingRight}>
                  <Text style={[dynamicStyles.settingValue, { color: colors.textSecondary }]}>
                    {setting.value}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
              {index < privacySettings.length - 1 && (
                <View style={[dynamicStyles.divider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Current Location */}
        <View style={[
          dynamicStyles.settingsGroup,
          { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface, marginTop: 12 }
        ]}>
          <TouchableOpacity
            style={dynamicStyles.settingItem}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <View style={dynamicStyles.settingLeft}>
              <Text style={[dynamicStyles.settingTitle, { color: colors.text }]}>
                Vị trí hiện thời
              </Text>
              <Text style={[dynamicStyles.settingDescription, { color: colors.textSecondary }]}>
                Danh sách các đoạn chat mà bạn đang chia sẻ vị trí hiện thời.
              </Text>
            </View>
            <View style={dynamicStyles.settingRight}>
              <Text style={[dynamicStyles.settingValue, { color: colors.textSecondary }]}>
                {currentLocation}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Default Message Timer */}
        <View style={[
          dynamicStyles.settingsGroup,
          { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface, marginTop: 12 }
        ]}>
          <TouchableOpacity
            style={dynamicStyles.settingItem}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <View style={dynamicStyles.settingLeft}>
              <Text style={[dynamicStyles.settingTitle, { color: colors.text }]}>
                Thời gian hẹn mặc định cho tin nhắn
              </Text>
              <Text style={[dynamicStyles.settingDescription, { color: colors.textSecondary }]}>
                Hãy tạo các đoạn chat mới được đặt chế độ tin nhắn tự hủy sau thời gian hẹn.
              </Text>
            </View>
            <View style={dynamicStyles.settingRight}>
              <Text style={[dynamicStyles.settingValue, { color: colors.textSecondary }]}>
                {defaultTimer}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Read Receipts */}
        <View style={[
          dynamicStyles.settingsGroup,
          { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface, marginTop: 12 }
        ]}>
          <View style={dynamicStyles.settingItem}>
            <View style={dynamicStyles.settingLeft}>
              <Text style={[dynamicStyles.settingTitle, { color: colors.text }]}>
                Thông báo đã đọc
              </Text>
              <Text style={[dynamicStyles.settingDescription, { color: colors.textSecondary }]}>
                Nếu tắt thông báo đã đọc, bạn sẽ không thấy thông báo đã đọc từ người khác. Nhóm chat luôn có thông báo đã đọc.
              </Text>
            </View>
            <Switch
              value={readReceipts}
              onValueChange={handleToggleReadReceipts}
              trackColor={{ false: colors.border, true: '#4CAF50' }}
              thumbColor={isDarkMode ? colors.surface : '#fff'}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        {/* App Lock */}
        <View style={[
          dynamicStyles.settingsGroup,
          { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface, marginTop: 12 }
        ]}>
          <TouchableOpacity
            style={dynamicStyles.settingItem}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <View style={dynamicStyles.settingLeft}>
              <Text style={[dynamicStyles.settingTitle, { color: colors.text }]}>
                Khóa ứng dụng
              </Text>
              <Text style={[dynamicStyles.settingDescription, { color: colors.textSecondary }]}>
                Cần có Face ID để mở khóa WhatsApp.
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Chat Lock */}
        <View style={[
          dynamicStyles.settingsGroup,
          { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface, marginTop: 12 }
        ]}>
          <TouchableOpacity
            style={dynamicStyles.settingItem}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <Text style={[dynamicStyles.settingTitle, { color: colors.text }]}>
              Khóa đoạn chat
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Camera Effects */}
        <View style={[
          dynamicStyles.settingsGroup,
          { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface, marginTop: 12 }
        ]}>
          <View style={dynamicStyles.settingItem}>
            <View style={dynamicStyles.settingLeft}>
              <Text style={[dynamicStyles.settingTitle, { color: colors.text }]}>
                Cho phép hiệu ứng camera
              </Text>
              <Text style={[dynamicStyles.settingDescription, { color: colors.textSecondary }]}>
                Sử dụng hiệu ứng trong camera và cuộc gọi video.{' '}
                <Text style={{ color: '#4CAF50' }}>Tìm hiểu thêm</Text>
              </Text>
            </View>
            <Switch
              value={cameraEffects}
              onValueChange={handleToggleCameraEffects}
              trackColor={{ false: colors.border, true: '#4CAF50' }}
              thumbColor={isDarkMode ? colors.surface : '#fff'}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        {/* Advanced */}
        <View style={[
          dynamicStyles.settingsGroup,
          { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface, marginTop: 12 }
        ]}>
          <TouchableOpacity
            style={dynamicStyles.settingItem}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <Text style={[dynamicStyles.settingTitle, { color: colors.text }]}>
              Nâng cao
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Privacy Check */}
        <View style={[
          dynamicStyles.settingsGroup,
          { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface, marginTop: 12 }
        ]}>
          <TouchableOpacity
            style={dynamicStyles.settingItem}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <Text style={[dynamicStyles.settingTitle, { color: colors.text }]}>
              Kiểm tra quyền riêng tư
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  privacyBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  bannerClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  bannerLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsGroup: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  settingLeft: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '400',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
});

export default PrivacyScreen;

