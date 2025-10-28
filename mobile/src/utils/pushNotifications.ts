import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } else {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }
};

export const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    await AsyncStorage.setItem('fcm_token', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const setupPushNotifications = async () => {
  try {
    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return;
    }

    // Get FCM token
    const token = await getFCMToken();
    if (token) {
      console.log('FCM Token:', token);
      // Send token to your backend
      // await api.updateFCMToken(token);
    }

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);
      // Show local notification or update UI
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
    });

    // Handle notification tap when app is in background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      // Navigate to relevant screen
    });

  } catch (error) {
    console.error('Error setting up push notifications:', error);
  }
};

