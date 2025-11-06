/**
 * Interactive test script để hướng dẫn test OTA Updates
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🧪 BẮT ĐẦU TEST OTA UPDATES\n');
console.log('═'.repeat(60));

const questions = [
  {
    question: '\n✅ Test 1: App có mở được không? (y/n)',
    check: 'App khởi động',
    next: 'Kiểm tra xem app có load được không có lỗi'
  },
  {
    question: '\n✅ Test 2: Có thấy màn hình login/register không? (y/n)',
    check: 'UI hiển thị',
    next: 'Kiểm tra UI cơ bản'
  },
  {
    question: '\n✅ Test 3: Có thể điều hướng giữa các màn hình không? (y/n)',
    check: 'Navigation',
    next: 'Test navigation'
  },
  {
    question: '\n✅ Test 4: Vào Settings (từ Profile menu) - có thấy section "Ứng dụng" không? (y/n)',
    check: 'Settings screen',
    next: 'Kiểm tra Settings screen'
  },
  {
    question: '\n✅ Test 5: Trong Settings > Ứng dụng - có thấy thông báo về OTA Updates không? (y/n)',
    check: 'OTA section',
    next: 'Kiểm tra OTA section'
  },
  {
    question: '\n✅ Test 6: Kiểm tra console trong terminal - có log "[OTA Updates] Disabled in development mode" không? (y/n)',
    check: 'Console log',
    next: 'Kiểm tra console logs'
  },
  {
    question: '\n✅ Test 7: App có crash hoặc error không? (nếu có error, gõ "error", nếu không có gõ "ok")',
    check: 'No errors',
    next: 'Kiểm tra lỗi'
  }
];

let currentIndex = 0;
const results = [];

function askQuestion() {
  if (currentIndex >= questions.length) {
    showResults();
    return;
  }

  const q = questions[currentIndex];
  rl.question(q.question, (answer) => {
    const isYes = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
    const isOk = answer.toLowerCase() === 'ok' || answer.toLowerCase() === 'no error';
    const isError = answer.toLowerCase() === 'error' || answer.toLowerCase() === 'e';
    
    results.push({
      test: q.check,
      passed: isYes || isOk,
      hasError: isError
    });

    if (isError) {
      console.log('⚠️  Có lỗi! Vui lòng kiểm tra:');
      console.log('   1. Console logs trong terminal');
      console.log('   2. Error messages trên màn hình');
      console.log('   3. Network connection');
      rl.question('\n📝 Mô tả lỗi (hoặc Enter để tiếp tục): ', () => {
        currentIndex++;
        askQuestion();
      });
    } else {
      if (isYes || isOk) {
        console.log('✅ Passed!');
      } else {
        console.log('❌ Failed hoặc chưa test');
      }
      console.log(`👉 Next: ${q.next}`);
      currentIndex++;
      askQuestion();
    }
  });
}

function showResults() {
  console.log('\n\n📊 KẾT QUẢ TEST:\n');
  console.log('═'.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${result.test}`);
    if (result.passed) passed++;
    else failed++;
  });
  
  console.log('\n═'.repeat(60));
  console.log(`\n📈 Tổng kết: ${passed}/${results.length} tests passed`);
  
  if (failed === 0) {
    console.log('\n🎉 Tất cả tests đều PASSED!');
    console.log('\n⚠️  Lưu ý: OTA Updates sẽ KHÔNG hoạt động trong Expo Go');
    console.log('   Đây là hành vi bình thường. Để test OTA thực tế:');
    console.log('   1. Build production: npm run eas:build:production');
    console.log('   2. Cài app lên thiết bị');
    console.log('   3. Publish update: npm run update:publish "Test"');
  } else {
    console.log('\n⚠️  Một số tests chưa pass. Vui lòng kiểm tra lại.');
  }
  
  console.log('\n📝 Console logs cần kiểm tra:');
  console.log('   - [OTA Updates] Disabled in development mode or not enabled');
  console.log('   - Navigation ready');
  console.log('   - Không có error về expo-updates');
  
  rl.close();
}

// Start
console.log('\n📱 Hướng dẫn:');
console.log('   • Trả lời "y" hoặc "yes" nếu test passed');
console.log('   • Trả lời "n" hoặc "no" nếu test failed');
console.log('   • Kiểm tra console logs trong terminal Expo');
console.log('\n👉 Bắt đầu test...\n');

askQuestion();

