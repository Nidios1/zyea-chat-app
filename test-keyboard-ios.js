/**
 * Test script để verify keyboard fix
 * Chạy: node test-keyboard-ios.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing iOS Keyboard Fix...\n');

let hasErrors = false;

// Test 1: Check capacitor.config.ts
console.log('✓ Test 1: Checking capacitor.config.ts...');
const capacitorConfigPath = path.join(__dirname, 'client/capacitor.config.ts');
const capacitorConfig = fs.readFileSync(capacitorConfigPath, 'utf8');

if (capacitorConfig.includes("resize: 'native'")) {
  console.log('  ✅ Keyboard resize mode: native (CORRECT)');
} else if (capacitorConfig.includes("resize: 'body'")) {
  console.log('  ❌ Keyboard resize mode: body (WRONG - should be native)');
  hasErrors = true;
} else {
  console.log('  ⚠️  Keyboard resize mode: not found');
  hasErrors = true;
}

if (capacitorConfig.includes('resizeOnFullScreen: false')) {
  console.log('  ✅ resizeOnFullScreen: false (CORRECT)');
} else if (capacitorConfig.includes('resizeOnFullScreen: true')) {
  console.log('  ❌ resizeOnFullScreen: true (WRONG - should be false)');
  hasErrors = true;
}

console.log('');

// Test 2: Check MobileChatArea.js
console.log('✓ Test 2: Checking MobileChatArea.js...');
const mobileChatAreaPath = path.join(__dirname, 'client/src/components/Mobile/MobileChatArea.js');

if (!fs.existsSync(mobileChatAreaPath)) {
  console.log('  ⚠️  MobileChatArea.js not found');
} else {
  const mobileChatArea = fs.readFileSync(mobileChatAreaPath, 'utf8');
  
  if (mobileChatArea.includes("import useKeyboard from '../../hooks/useKeyboard'")) {
    console.log('  ✅ useKeyboard hook imported');
  } else {
    console.log('  ❌ useKeyboard hook NOT imported');
    hasErrors = true;
  }
  
  if (mobileChatArea.includes('const { isKeyboardVisible, keyboardHeight } = useKeyboard()')) {
    console.log('  ✅ useKeyboard hook used');
  } else {
    console.log('  ❌ useKeyboard hook NOT used');
    hasErrors = true;
  }
  
  if (mobileChatArea.includes('keyboardHeight={keyboardHeight}')) {
    console.log('  ✅ keyboardHeight prop passed to components');
  } else {
    console.log('  ❌ keyboardHeight prop NOT passed');
    hasErrors = true;
  }
  
  if (mobileChatArea.includes('bottom: ${props => props.keyboardHeight || 0}px')) {
    console.log('  ✅ MessageInputContainer uses keyboardHeight');
  } else {
    console.log('  ❌ MessageInputContainer does NOT use keyboardHeight');
    hasErrors = true;
  }
}

console.log('');

// Test 3: Check useKeyboard hook exists
console.log('✓ Test 3: Checking useKeyboard hook...');
const useKeyboardPath = path.join(__dirname, 'client/src/hooks/useKeyboard.js');

if (fs.existsSync(useKeyboardPath)) {
  console.log('  ✅ useKeyboard.js exists');
  
  const useKeyboardContent = fs.readFileSync(useKeyboardPath, 'utf8');
  
  if (useKeyboardContent.includes('keyboardWillShow')) {
    console.log('  ✅ iOS keyboard events implemented');
  } else {
    console.log('  ⚠️  iOS keyboard events may not be implemented');
  }
  
  if (useKeyboardContent.includes('visualViewport')) {
    console.log('  ✅ PWA keyboard detection implemented');
  } else {
    console.log('  ⚠️  PWA keyboard detection may not be implemented');
  }
} else {
  console.log('  ❌ useKeyboard.js NOT found');
  hasErrors = true;
}

console.log('');

// Test 4: Check build directory
console.log('✓ Test 4: Checking build...');
const buildPath = path.join(__dirname, 'client/build');

if (fs.existsSync(buildPath)) {
  const stats = fs.statSync(buildPath);
  const now = new Date();
  const buildAge = (now - stats.mtime) / (1000 * 60); // minutes
  
  if (buildAge < 60) {
    console.log(`  ✅ Build is recent (${Math.round(buildAge)} minutes ago)`);
  } else {
    console.log(`  ⚠️  Build is old (${Math.round(buildAge)} minutes ago) - Consider rebuilding`);
  }
} else {
  console.log('  ⚠️  Build directory not found - Need to run: npm run build');
}

console.log('');

// Test 5: Check iOS app exists
console.log('✓ Test 5: Checking iOS app...');
const iosAppPath = path.join(__dirname, 'client/ios/App');

if (fs.existsSync(iosAppPath)) {
  console.log('  ✅ iOS app folder exists');
  
  const infoPlistPath = path.join(iosAppPath, 'App/Info.plist');
  if (fs.existsSync(infoPlistPath)) {
    console.log('  ✅ Info.plist exists');
  } else {
    console.log('  ⚠️  Info.plist not found');
  }
} else {
  console.log('  ⚠️  iOS app not initialized - Run: npx cap add ios');
}

console.log('');
console.log('═'.repeat(60));

if (hasErrors) {
  console.log('❌ TESTS FAILED - Fix issues above before building\n');
  console.log('📝 To fix:');
  console.log('  1. Make sure capacitor.config.ts has: resize: "native"');
  console.log('  2. Make sure MobileChatArea.js uses useKeyboard hook');
  console.log('  3. Run: npm run build && npx cap sync ios');
  console.log('');
  process.exit(1);
} else {
  console.log('✅ ALL TESTS PASSED - Ready to build iOS app!\n');
  console.log('📝 Next steps:');
  console.log('  1. npm run build');
  console.log('  2. npx cap sync ios');
  console.log('  3. npx cap open ios');
  console.log('  4. Run in Xcode and test keyboard');
  console.log('');
  process.exit(0);
}

