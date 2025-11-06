import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Tab {
  id: string;
  label: string;
}

interface FeedTabBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const FeedTabBar = ({ activeTab, onTabChange }: FeedTabBarProps) => {
  const { colors } = useTheme();
  
  const tabs: Tab[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'following', label: 'Đang theo dõi' },
  ];

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.tabActive,
            activeTab !== tab.id && { backgroundColor: colors.surfaceSecondary || '#f0f2f5' },
          ]}
          onPress={() => onTabChange(tab.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === tab.id ? '#FFFFFF' : colors.textSecondary },
              activeTab === tab.id && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#2c2c2c', // Dark background for active tab (works in both light and dark mode)
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '600',
  },
});

export default FeedTabBar;

