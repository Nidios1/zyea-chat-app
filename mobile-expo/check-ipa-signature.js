#!/usr/bin/env node

/**
 * Script để kiểm tra IPA file đã được ký hay chưa
 * Sử dụng: node check-ipa-signature.js <path-to-ipa>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IPA_PATH = process.argv[2] || 'app.ipa';

if (!fs.existsSync(IPA_PATH)) {
  console.error(`❌ Không tìm thấy file IPA: ${IPA_PATH}`);
  process.exit(1);
}

console.log(`🔍 Đang kiểm tra IPA: ${IPA_PATH}\n`);

try {
  // Tạo thư mục temp để extract IPA
  const tempDir = path.join(__dirname, 'temp_ipa_check');
  if (fs.existsSync(tempDir)) {
    execSync(`rm -rf "${tempDir}"`, { stdio: 'inherit' });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  console.log('📦 Đang giải nén IPA...');
  execSync(`unzip -q "${IPA_PATH}" -d "${tempDir}"`, { stdio: 'inherit' });

  // Tìm .app bundle
  const payloadDir = path.join(tempDir, 'Payload');
  if (!fs.existsSync(payloadDir)) {
    console.error('❌ Không tìm thấy thư mục Payload trong IPA!');
    process.exit(1);
  }

  const appBundles = fs.readdirSync(payloadDir).filter(item => 
    item.endsWith('.app')
  );

  if (appBundles.length === 0) {
    console.error('❌ Không tìm thấy .app bundle trong Payload!');
    process.exit(1);
  }

  const appBundle = path.join(payloadDir, appBundles[0]);
  console.log(`✅ Tìm thấy app bundle: ${appBundles[0]}\n`);

  // Kiểm tra code signature
  console.log('🔐 Đang kiểm tra code signature...\n');

  try {
    // Kiểm tra bằng codesign
    const codesignOutput = execSync(
      `codesign -dv --verbose=4 "${appBundle}" 2>&1 || echo "NO_SIGNATURE"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    if (codesignOutput.includes('NO_SIGNATURE') || codesignOutput.includes('no signature')) {
      console.log('❌ IPA CHƯA ĐƯỢC KÝ!');
      console.log('\n📋 Thông tin:');
      console.log('   - File: Không có code signature');
      console.log('   - Trạng thái: Unsigned');
      console.log('\n💡 Giải pháp:');
      console.log('   1. Sử dụng eSign, AltStore, hoặc công cụ ký khác');
      console.log('   2. Xem file HUONG_DAN_SIGNING_IPA.md để biết cách ký');
      console.log('   3. Hoặc cấu hình GitHub Secrets để ký tự động');
    } else {
      console.log('✅ IPA ĐÃ ĐƯỢC KÝ!\n');
      console.log('📋 Thông tin signature:');
      console.log(codesignOutput);
      
      // Kiểm tra chi tiết hơn
      try {
        const verifyOutput = execSync(
          `codesign --verify --verbose "${appBundle}" 2>&1 || echo "VERIFY_FAILED"`,
          { encoding: 'utf-8' }
        );
        
        if (verifyOutput.includes('VERIFY_FAILED')) {
          console.log('\n⚠️  WARNING: Signature không hợp lệ!');
        } else {
          console.log('\n✅ Signature hợp lệ!');
        }
      } catch (e) {
        console.log('\n⚠️  Không thể verify signature');
      }
    }
  } catch (error) {
    // Nếu không có codesign (trên Windows), kiểm tra file _CodeSignature
    const codeSignatureDir = path.join(appBundle, '_CodeSignature');
    if (fs.existsSync(codeSignatureDir)) {
      console.log('✅ Tìm thấy thư mục _CodeSignature');
      console.log('   IPA có vẻ đã được ký');
      
      const codeResources = path.join(codeSignatureDir, 'CodeResources');
      if (fs.existsSync(codeResources)) {
        console.log('   ✅ Tìm thấy CodeResources');
      }
    } else {
      console.log('❌ IPA CHƯA ĐƯỢC KÝ!');
      console.log('   - Không tìm thấy thư mục _CodeSignature');
      console.log('\n💡 Giải pháp:');
      console.log('   1. Sử dụng eSign, AltStore, hoặc công cụ ký khác');
      console.log('   2. Xem file HUONG_DAN_SIGNING_IPA.md để biết cách ký');
    }
  }

  // Kiểm tra Info.plist
  const infoPlist = path.join(appBundle, 'Info.plist');
  if (fs.existsSync(infoPlist)) {
    console.log('\n📱 Thông tin app:');
    try {
      const plistContent = fs.readFileSync(infoPlist, 'utf-8');
      const bundleIdMatch = plistContent.match(/<key>CFBundleIdentifier<\/key>\s*<string>(.*?)<\/string>/);
      const versionMatch = plistContent.match(/<key>CFBundleVersion<\/key>\s*<string>(.*?)<\/string>/);
      
      if (bundleIdMatch) {
        console.log(`   Bundle ID: ${bundleIdMatch[1]}`);
      }
      if (versionMatch) {
        console.log(`   Version: ${versionMatch[1]}`);
      }
    } catch (e) {
      console.log('   Không thể đọc Info.plist');
    }
  }

  // Cleanup
  execSync(`rm -rf "${tempDir}"`, { stdio: 'inherit' });
  
  console.log('\n✅ Kiểm tra hoàn tất!');

} catch (error) {
  console.error('❌ Lỗi khi kiểm tra IPA:');
  console.error(error.message);
  process.exit(1);
}






