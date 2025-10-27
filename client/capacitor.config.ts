import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zyea.hieudev',
  appName: 'Zyea+',
  webDir: 'build',
  server: {
    // DISABLED FOR PRODUCTION BUILD
    // Uncomment for development with local server
    // androidScheme: 'https',
    // allowNavigation: [
    //   'http://192.168.0.102:5000',
    //   'http://192.168.0.102:3000',
    //   'https://192.168.0.102:5000',
    //   'https://192.168.0.102:3000',
    //   'http://localhost:5000',
    //   'http://localhost:3000'
    // ],
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000, // Show for 2 seconds minimum
      launchAutoHide: true,
      showSpinner: false,
      backgroundColor: "#0084ff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
      // CRITICAL: Smooth fade out
      launchFadeOutDuration: 300,
      launchAutoHide: true,
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
      resize: 'native',  // CRITICAL: native mode - keyboard không đẩy body
      style: 'dark',
      resizeOnFullScreen: false,  // CRITICAL: Không resize trong fullscreen
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
    limitsNavigationsToAppBoundDomains: false,
    // CRITICAL: Enable WebRTC in WKWebView
    allowsInlineMediaPlayback: true,
    mediaTypesRequiringUserActionForPlayback: 'none',
    // Enable camera and microphone
    webViewMediaCaptureEnabled: true,
    // iOS appearance config
    backgroundColor: '#0084ff',
    overrideUserInterfaceStyle: 'Light',
    // Disable long press context menu
    suppressesIncrementalRendering: false,
    // Animation config for smooth iOS-like experience
    allowsBackForwardNavigationGestures: true,
    // Deep Linking: Allow other apps to open this app
    scheme: 'zyeamessenger'
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

