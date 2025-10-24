import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zyea.hieudev',
  appName: 'Zyea+',
  webDir: 'build',
  server: {
    // QUAN TRỌNG: Config cho IP wifi
    // Để native app connect được tới API server
    androidScheme: 'https',
    // allowNavigation cho phép app gọi API tới IP wifi
    allowNavigation: [
      'http://192.168.0.102:5000',
      'http://192.168.0.102:3000',
      'https://192.168.0.102:5000',
      'https://192.168.0.102:3000',
      'http://localhost:5000',
      'http://localhost:3000'
    ],
    // Clear text traffic cho development
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      showSpinner: false,
      backgroundColor: "#0084ff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#0084ff',
      overlaysWebView: false
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Camera: {
      saveToGallery: true,
      quality: 90
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#0084ff",
      sound: "message_tone.wav",
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    }
  },
  // iOS specific config
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    // Enable edge-to-edge content (extends behind notch/status bar)
    scrollEnabled: false,
    allowsLinkPreview: false,
    // CRITICAL: Enable fullscreen with notch support
    limitsNavigationsToAppBoundDomains: false
  },
  // Android specific config
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    },
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true // Enable cho development
  }
};

export default config;

