import React, { useState, useEffect, useRef } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../../utils/api';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  isOwnProfile?: boolean;
}

type TabType = 'work' | 'files' | 'media' | 'links' | 'audio';

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
  userId,
  userName = 'Người dùng',
  userAvatar,
  isOwnProfile = false,
}) => {
  const { isDarkMode, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('work');
  const isMountedRef = useRef(true);

  // Fetch user profile information
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await usersAPI.getProfile(userId);
      return response.data;
    },
    enabled: !!userId && visible,
  });

  const userEmail = userProfile?.email || '';
  const userOrganization = userProfile?.location || userProfile?.username || '';

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset activeTab when modal opens
  useEffect(() => {
    if (visible && isMountedRef.current) {
      setActiveTab('work');
    }
  }, [visible]);

  const tabs = [
    { id: 'work' as TabType, label: 'Công việc', icon: 'briefcase' },
    { id: 'files' as TabType, label: 'Tệp', icon: 'file-document' },
    { id: 'media' as TabType, label: 'Ảnh & Video', icon: 'image' },
    { id: 'links' as TabType, label: 'Liên kết', icon: 'link' },
    { id: 'audio' as TabType, label: 'Âm thanh', icon: 'music' },
  ];

  const renderEmptyState = (icon: string, title: string, description: string) => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <MaterialCommunityIcons name={icon as any} size={80} color={colors.textSecondary} />
      </View>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyStateDescription, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'work':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {renderEmptyState(
              'clipboard-text',
              'Chưa có công việc',
              'Danh sách công việc của bạn sẽ được hiển thị tại đây.'
            )}
          </ScrollView>
        );
      case 'files':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {renderEmptyState(
              'file-document',
              'Chưa có tệp',
              'Danh sách tệp sẽ được hiển thị tại đây.'
            )}
          </ScrollView>
        );
      case 'media':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {renderEmptyState(
              'image',
              'Chưa có ảnh & video',
              'Danh sách ảnh và video sẽ được hiển thị tại đây.'
            )}
          </ScrollView>
        );
      case 'links':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {renderEmptyState(
              'link',
              'Chưa có liên kết',
              'Danh sách liên kết sẽ được hiển thị tại đây.'
            )}
          </ScrollView>
        );
      case 'audio':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {renderEmptyState(
              'music',
              'Chưa có âm thanh',
              'Danh sách âm thanh sẽ được hiển thị tại đây.'
            )}
          </ScrollView>
        );
      default:
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {renderEmptyState(
              'clipboard-text',
              'Chưa có công việc',
              'Danh sách công việc của bạn sẽ được hiển thị tại đây.'
            )}
          </ScrollView>
        );
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (isMountedRef.current) {
          onClose();
        }
      }}
      statusBarTranslucent={false}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            onPress={() => {
              if (isMountedRef.current) {
                onClose();
              }
            }} 
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          
          {/* Avatar and Username - Centered */}
          <View style={styles.headerCenter}>
            {userAvatar ? (
              <Avatar.Image
                size={100}
                source={{ uri: getAvatarURL(userAvatar) }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={100}
                label={userName.substring(0, 2).toUpperCase()}
                style={[styles.avatar, { backgroundColor: colors.primary }]}
              />
            )}
            <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
              {userName}
            </Text>
            {userOrganization && (
              <Text style={[styles.organization, { color: colors.textSecondary }]} numberOfLines={1}>
                {userOrganization}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionButtonsContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionButtonIcon, { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }]}>
              <MaterialCommunityIcons name="magnify" size={24} color={colors.text} />
            </View>
            <Text style={[styles.actionButtonLabel, { color: colors.text }]}>Tìm kiếm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionButtonIcon, { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }]}>
              <MaterialCommunityIcons name="bell" size={24} color={colors.text} />
            </View>
            <Text style={[styles.actionButtonLabel, { color: colors.text }]}>Bật</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionButtonIcon, { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }]}>
              <MaterialCommunityIcons name="pin" size={24} color={colors.text} />
            </View>
            <Text style={[styles.actionButtonLabel, { color: colors.text }]}>Ghim</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionButtonIcon, { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }]}>
              <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.text} />
            </View>
            <Text style={[styles.actionButtonLabel, { color: colors.text }]}>Xem thêm</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        {(userEmail || userOrganization) && (
          <View style={[styles.contactInfoContainer, { backgroundColor: isDarkMode ? '#2a2a2b' : '#f5f5f5' }]}>
            {userEmail && (
              <View style={[styles.contactInfoRow, userOrganization && styles.contactInfoRowWithMargin]}>
                <Text style={[styles.contactInfoLabel, { color: colors.textSecondary }]}>Email</Text>
                <View style={styles.contactInfoValue}>
                  <MaterialCommunityIcons name="paperclip" size={16} color={colors.textSecondary} />
                  <Text style={[styles.contactInfoText, { color: colors.text }]} numberOfLines={1}>
                    {userEmail}
                  </Text>
                </View>
              </View>
            )}
            {userOrganization && (
              <View style={styles.contactInfoRow}>
                <Text style={[styles.contactInfoLabel, { color: colors.textSecondary }]}>Đơn vị</Text>
                <Text style={[styles.contactInfoText, { color: colors.text }]} numberOfLines={1}>
                  {userOrganization}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Navigation Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && [styles.activeTab, { borderBottomColor: colors.text }],
              ]}
              onPress={() => {
                if (isMountedRef.current) {
                  setActiveTab(tab.id);
                }
              }}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === tab.id ? colors.text : colors.textSecondary,
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 16,
    top: 12,
    zIndex: 1,
  },
  headerCenter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  organization: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionButtonLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  contactInfoContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  contactInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfoRowWithMargin: {
    marginBottom: 12,
  },
  contactInfoLabel: {
    fontSize: 14,
  },
  contactInfoValue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 16,
  },
  contactInfoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    textAlign: 'right',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
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
  tabLabel: {
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateIconContainer: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default UserProfileModal;

