// Entry point for Expo Go compatibility
// This JavaScript file ensures better compatibility with Expo Go
// The TypeScript file will be compiled by Metro bundler

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

