import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../../assets/icon.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  logo: {
    width: 100,
    height: 100,
    tintColor: '#ffffff',
  },
});

export default SplashScreen;
