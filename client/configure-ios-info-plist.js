/**
 * Configure iOS Info.plist for HTTP connections and permissions
 * Run this after: npx cap add ios
 */

const fs = require('fs');
const path = require('path');

const INFO_PLIST_PATH = path.join(__dirname, 'ios', 'App', 'App', 'Info.plist');

console.log('🔧 Configuring iOS Info.plist...');

// Check if Info.plist exists
if (!fs.existsSync(INFO_PLIST_PATH)) {
  console.log('⚠️  Info.plist not found. Run "npx cap add ios" first.');
  process.exit(0);
}

// Read current Info.plist
let infoPlist = fs.readFileSync(INFO_PLIST_PATH, 'utf8');

// Add NSAppTransportSecurity to allow HTTP (if not already present)
if (!infoPlist.includes('NSAppTransportSecurity')) {
  console.log('📝 Adding NSAppTransportSecurity (allow HTTP connections)...');
  
  const appTransportSecurity = `
	<key>NSAppTransportSecurity</key>
	<dict>
		<key>NSAllowsArbitraryLoads</key>
		<true/>
		<key>NSAllowsLocalNetworking</key>
		<true/>
	</dict>`;
  
  // Insert before closing </dict>
  infoPlist = infoPlist.replace('</dict>\n</plist>', `${appTransportSecurity}\n</dict>\n</plist>`);
}

// Add Camera permission (if not already present)
if (!infoPlist.includes('NSCameraUsageDescription')) {
  console.log('📝 Adding Camera permission...');
  
  const cameraPermission = `
	<key>NSCameraUsageDescription</key>
	<string>Zyea+ cần truy cập camera để chụp ảnh và quay video cho tin nhắn, bài viết</string>`;
  
  infoPlist = infoPlist.replace('</dict>\n</plist>', `${cameraPermission}\n</dict>\n</plist>`);
}

// Add Photo Library permission (if not already present)
if (!infoPlist.includes('NSPhotoLibraryUsageDescription')) {
  console.log('📝 Adding Photo Library permission...');
  
  const photoPermission = `
	<key>NSPhotoLibraryUsageDescription</key>
	<string>Zyea+ cần truy cập thư viện ảnh để chọn ảnh và video cho tin nhắn, bài viết</string>
	<key>NSPhotoLibraryAddUsageDescription</key>
	<string>Zyea+ cần quyền lưu ảnh vào thư viện của bạn</string>`;
  
  infoPlist = infoPlist.replace('</dict>\n</plist>', `${photoPermission}\n</dict>\n</plist>`);
}

// Add Microphone permission (if not already present)
if (!infoPlist.includes('NSMicrophoneUsageDescription')) {
  console.log('📝 Adding Microphone permission...');
  
  const micPermission = `
	<key>NSMicrophoneUsageDescription</key>
	<string>Zyea+ cần truy cập micro để ghi âm tin nhắn thoại</string>`;
  
  infoPlist = infoPlist.replace('</dict>\n</plist>', `${micPermission}\n</dict>\n</plist>`);
}

// Add Location permission (if not already present)
if (!infoPlist.includes('NSLocationWhenInUseUsageDescription')) {
  console.log('📝 Adding Location permission...');
  
  const locationPermission = `
	<key>NSLocationWhenInUseUsageDescription</key>
	<string>Zyea+ cần truy cập vị trí để chia sẻ vị trí của bạn với bạn bè</string>`;
  
  infoPlist = infoPlist.replace('</dict>\n</plist>', `${locationPermission}\n</dict>\n</plist>`);
}

// Write updated Info.plist
fs.writeFileSync(INFO_PLIST_PATH, infoPlist);

console.log('✅ Info.plist configured successfully!');
console.log('');
console.log('📱 Permissions added:');
console.log('  ✓ NSAppTransportSecurity (HTTP connections)');
console.log('  ✓ Camera access');
console.log('  ✓ Photo Library access');
console.log('  ✓ Microphone access');
console.log('  ✓ Location access');
console.log('');
console.log('Next steps:');
console.log('  1. npx cap sync ios');
console.log('  2. npx cap open ios');
console.log('  3. Build from Xcode');

