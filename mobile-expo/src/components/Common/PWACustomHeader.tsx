import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface PWACustomHeaderProps {
  title?: string;
  isDarkMode?: boolean;
  rightComponent?: React.ReactNode;
}

const PWACustomHeader: React.FC<PWACustomHeaderProps> = ({ 
  title = 'Zyea+', 
  isDarkMode = false,
  rightComponent 
}) => {
  const insets = useSafeAreaInsets();
  // Ensure isDarkMode is always boolean, not string
  const darkMode = typeof isDarkMode === 'boolean' ? isDarkMode : isDarkMode === 'true' || isDarkMode === '1';
  const colors = darkMode ? ['#1a1a2e', '#16213e'] : ['#0084ff', '#00a651'];

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {rightComponent && <View>{rightComponent}</View>}
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default PWACustomHeader;
