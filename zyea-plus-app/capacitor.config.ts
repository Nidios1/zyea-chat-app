import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zyea.app',
  appName: 'Zyea+',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'http://192.168.0.102:5000',
      'http://192.168.0.102:3000',
      'https://192.168.0.102:5000',
      'https://192.168.0.102:3000',
      'http://localhost:5000',
      'http://localhost:3000'
    ],
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
    Camera: {
      saveToGallery: true,
      quality: 90
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: false,
    },
    // App Launcher for Deep Linking to Messenger app
    AppLauncher: {
      // No config needed here
    }
  },
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scrollEnabled: false,
    allowsLinkPreview: false,
    limitsNavigationsToAppBoundDomains: false,
    allowsInlineMediaPlayback: true,
    mediaTypesRequiringUserActionForPlayback: 'none',
    webViewMediaCaptureEnabled: true,
    backgroundColor: '#0084ff',
    overrideUserInterfaceStyle: 'Light',
    suppressesIncrementalRendering: false,
    allowsBackForwardNavigationGestures: true,
    // URL Schemes to open Messenger app
    scheme: 'zyeaplus'
  },
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
    webContentsDebuggingEnabled: true,
    // Intent filters to open Messenger app
    intentFilters: [
      {
        action: 'VIEW',
        category: ['DEFAULT', 'BROWSABLE'],
        data: {
          scheme: 'zyeamessenger'
        }
      }
    ]
  }
};

export default config;

