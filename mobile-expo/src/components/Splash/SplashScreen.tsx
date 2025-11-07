import React from 'react';
import { View, StyleSheet, Image, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      {/* Background with geometric gradient shapes */}
      {/* Top-left white triangular area */}
      <View style={styles.whiteTriangle} />
      
      {/* Bottom-left blue gradient */}
      <LinearGradient
        colors={['#4A90E2', '#1E3A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.blueGradient}
      />
      
      {/* Right side pink/purple/blue gradient */}
      <LinearGradient
        colors={['#FF6B9D', '#9B59B6', '#1E3A8A']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.rightGradient}
      />
      
      {/* Content */}
      <View style={styles.content}>
        <Image 
          source={require('../../../assets/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>have party with like minded people.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  whiteTriangle: {
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.1,
    width: width * 0.7,
    height: height * 0.8,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-25deg' }],
  },
  blueGradient: {
    position: 'absolute',
    bottom: -height * 0.1,
    left: -width * 0.15,
    width: width * 0.6,
    height: height * 0.6,
    transform: [{ rotate: '15deg' }],
  },
  rightGradient: {
    position: 'absolute',
    top: 0,
    right: -width * 0.1,
    width: width * 0.65,
    height: height,
    borderBottomLeftRadius: width * 0.4,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: height * 0.35,
    zIndex: 1,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});

export default SplashScreen;
