import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface MessagesTabBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  unreadCount?: number;
}

const MessagesTabBar = ({ activeTab, onTabChange, unreadCount = 0 }: MessagesTabBarProps) => {
  const tabs: Tab[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'groups', label: 'Nhóm' },
    { id: 'personal', label: 'Cá nhân' },
    { id: 'unread', label: 'Chưa đọc', badge: unreadCount },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.tabActive,
            ]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.badge !== undefined && tab.badge > 0 && (
              <View
                style={[
                  styles.badge,
                  activeTab === tab.id && styles.badgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    activeTab === tab.id && styles.badgeTextActive,
                  ]}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 4,
  },
  tabActive: {
    backgroundColor: '#2c2c2c',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#65676b',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
});

export default MessagesTabBar;

