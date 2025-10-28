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
  const backgroundColor = isDarkMode ? '#2d2d2d' : '#ffffff';
  const activeColor = '#0084ff';
  const inactiveColor = '#666666';

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
            color={tab.isActive ? activeColor : inactiveColor}
          />
          <Text
            style={[
              styles.label,
              { color: tab.isActive ? activeColor : inactiveColor }
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
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
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

