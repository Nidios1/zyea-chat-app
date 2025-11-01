import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getAvatarURL } from '../../utils/imageUtils';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  isOwnProfile?: boolean;
}

type TabType = 'profile' | 'search' | 'all' | 'options';

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
  userId,
  userName = 'Người dùng',
  userAvatar,
  isOwnProfile = false,
}) => {
  const { isDarkMode, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs = [
    { id: 'profile' as TabType, label: 'Trang cá nhân', icon: 'account' },
    { id: 'search' as TabType, label: 'Tìm kiếm', icon: 'magnify' },
    { id: 'all' as TabType, label: 'Tất', icon: 'bell' },
    { id: 'options' as TabType, label: 'Lựa chọn', icon: 'dots-horizontal' },
  ];

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.optionItem}>
        <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? '#3a3a3b' : '#e0e0e0' }]}>
          <MaterialCommunityIcons name="theme-light-dark" size={24} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Chủ đề</Text>
          <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>Mặc định</Text>
        </View>
        <View style={[styles.optionBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.optionBadgeText}>Mới</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>

      <View style={styles.optionItem}>
        <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? '#3a3a3b' : '#e0e0e0' }]}>
          <MaterialCommunityIcons name="account-edit" size={24} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Biệt danh</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>

      <View style={styles.optionItem}>
        <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? '#3a3a3b' : '#e0e0e0' }]}>
          <MaterialCommunityIcons name="clock-time-eight" size={24} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Tin nhắn tự hủy</Text>
          <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>Tắt</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>

      <View style={styles.optionItem}>
        <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? '#3a3a3b' : '#e0e0e0' }]}>
          <MaterialCommunityIcons name="message-text-check" size={24} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Kiểm soát nội dung chat</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>

      <View style={styles.optionItem}>
        <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? '#3a3a3b' : '#e0e0e0' }]}>
          <MaterialCommunityIcons name="lock" size={24} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Quyền riêng tư và an toàn</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>

      <View style={styles.optionItem}>
        <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? '#3a3a3b' : '#e0e0e0' }]}>
          <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Tạo nhóm chat</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>

      <View style={styles.optionItem}>
        <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? '#3a3a3b' : '#e0e0e0' }]}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#ef4444" />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Đã xảy ra lỗi</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'search':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Tính năng đang phát triển
            </Text>
          </View>
        );
      case 'all':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Tính năng đang phát triển
            </Text>
          </View>
        );
      case 'options':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Tính năng đang phát triển
            </Text>
          </View>
        );
      default:
        return renderProfileTab();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          
          {/* Avatar and Username */}
          <View style={styles.headerCenter}>
            {userAvatar ? (
              <Avatar.Image
                size={80}
                source={{ uri: getAvatarURL(userAvatar) }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={80}
                label={userName.substring(0, 2).toUpperCase()}
                style={[styles.avatar, { backgroundColor: colors.primary }]}
              />
            )}
            <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
              {userName}
            </Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        {/* Navigation Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && [styles.activeTab, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.id ? colors.primary : colors.textSecondary}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === tab.id ? colors.primary : colors.textSecondary,
                    fontWeight: activeTab === tab.id ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 40,
  },
  avatar: {
    marginBottom: 8,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabIcon: {
    marginRight: 4,
  },
  tabLabel: {
    fontSize: 12,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2b',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
  },
  optionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  optionBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
  },
});

export default UserProfileModal;

