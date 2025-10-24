/**
 * Script test Live Update
 */

const http = require('http');

// Test API version
function testVersionAPI() {
  const options = {
    hostname: '192.168.0.102',
    port: 5000,
    path: '/api/app/version',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('✅ API Response Status:', res.statusCode);
      console.log('📦 Response Data:');
      try {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));
        
        console.log('\n🎯 Live Update Info:');
        console.log(`   Version: ${json.version}`);
        console.log(`   Update URL: ${json.updateUrl}`);
        console.log(`   Mandatory: ${json.mandatory ? 'Yes' : 'No'}`);
        console.log(`\n📝 Changelog:`);
        console.log(json.changeLog);
      } catch (error) {
        console.log('❌ Not JSON:', data.substring(0, 200));
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ API Error:', error.message);
    console.log('\n💡 Hãy chắc chắn server đang chạy:');
    console.log('   cd server && npm start');
  });

  req.end();
}

console.log('🧪 Testing Live Update API...\n');
testVersionAPI();

