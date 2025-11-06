import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

interface TabItem {
  name: string;
  icon: string;
  label: string;
  onPress: () => void;
  isActive: boolean;
}

interface PWATabBarProps {
  tabs: TabItem[];
  isDarkMode?: boolean;
}

const PWATabBar: React.FC<PWATabBarProps> = ({ tabs, isDarkMode = false }) => {
  const insets = useSafeAreaInsets();
  // Ensure isDarkMode is always boolean, not string
  const darkMode = typeof isDarkMode === 'boolean' ? isDarkMode : isDarkMode === 'true' || isDarkMode === '1';
  const backgroundColor = darkMode ? '#000000' : '#ffffff'; // Pure black like Threads
  const activeColor = darkMode ? '#ffffff' : '#0084ff'; // White on dark mode
  const inactiveColor = darkMode ? '#a0a0a0' : '#666666'; // Light gray on dark mode

  return (
    <View style={[styles.container, { 
      backgroundColor, 
      paddingBottom: insets.bottom || 8 
    }]}>
      <View style={styles.shadow} />
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tab}
          onPress={tab.onPress}
          activeOpacity={0.7}
        >
          <Icon
            name={tab.icon}
            size={22}
            color={Boolean(tab.isActive) ? activeColor : inactiveColor}
          />
          <Text
            style={[
              styles.label,
              { color: Boolean(tab.isActive) ? activeColor : inactiveColor }
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
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a', // Dark border for dark mode
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shadow: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    minHeight: 50,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default PWATabBar;

