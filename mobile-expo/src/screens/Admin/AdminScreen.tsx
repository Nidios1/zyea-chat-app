import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { useTabBar } from '../../contexts/TabBarContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminDashboardScreen from './AdminDashboardScreen';
import AdminUsersScreen from './AdminUsersScreen';
import AdminPostsScreen from './AdminPostsScreen';
import AdminServerScreen from './AdminServerScreen';
import AdminFeedbackScreen from './AdminFeedbackScreen';
import AdminVerificationScreen from './AdminVerificationScreen';
import { spacing, typography, borderRadius } from '../../config/designTokens';

type TabType = 'dashboard' | 'users' | 'posts' | 'feedback' | 'verification' | 'server';

const AdminScreen = () => {
  const { colors } = useAppTheme();
  const { setIsVisible } = useTabBar();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Ẩn bottom tab bar khi vào Admin screen
  useFocusEffect(
    React.useCallback(() => {
      setIsVisible(false);
      return () => {
        setIsVisible(true);
      };
    }, [setIsVisible])
  );

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Tổng quan', icon: 'view-dashboard' },
    { id: 'users' as TabType, label: 'Người dùng', icon: 'account-group' },
    { id: 'posts' as TabType, label: 'Bài viết', icon: 'post' },
    { id: 'feedback' as TabType, label: 'Phản hồi', icon: 'message-text' },
    { id: 'verification' as TabType, label: 'Xác minh', icon: 'check-circle' },
    { id: 'server' as TabType, label: 'Server', icon: 'server' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardScreen />;
      case 'users':
        return <AdminUsersScreen />;
      case 'posts':
        return <AdminPostsScreen />;
      case 'feedback':
        return <AdminFeedbackScreen />;
      case 'verification':
        return <AdminVerificationScreen />;
      case 'server':
        return <AdminServerScreen />;
      default:
        return <AdminDashboardScreen />;
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['top', 'bottom']}
    >
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Quản Lý Server
        </Text>
      </View>
      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
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
                    fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.base,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabIcon: {
    marginRight: spacing.xs,
  },
  tabLabel: {
    fontSize: typography.fontSize.base,
  },
  content: {
    flex: 1,
  },
});

export default AdminScreen;

