import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
  footer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    left: 0,
    right: 0,
  },
  fromText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '400',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

const SplashScreen = () => {
  const { colors } = useAppTheme();
  const dynamicStyles = createStyles(colors);

  return (
    <View style={dynamicStyles.container}>
      {/* Logo app ở giữa */}
      <View style={dynamicStyles.content}>
        <Image 
          source={require('../../../assets/Zyea.png')} 
          style={dynamicStyles.logo}
          resizeMode="contain"
        />
      </View>
      
      {/* Text "from Zyea+" ở gần cuối màn hình */}
      <View style={dynamicStyles.footer}>
        <Text style={dynamicStyles.fromText}>from</Text>
        <View style={dynamicStyles.metaContainer}>
          <Text style={dynamicStyles.metaText}>Zyea+</Text>
        </View>
      </View>
    </View>
  );
};

export default SplashScreen;
