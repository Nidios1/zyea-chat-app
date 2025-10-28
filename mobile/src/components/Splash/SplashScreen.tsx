import React from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/logo.png')} // Sẽ tạo asset này
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.appName}>Zyea+</Text>
      <Text style={styles.subtitle}>Ứng dụng nhắn tin</Text>
      <ActivityIndicator
        size="large"
        color="#0068ff"
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0068ff',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;

