const axios = require('axios');

/**
 * Test script for message deletion functionality
 * This verifies that:
 * 1. User A can delete messages (both sent and received)
 * 2. User B still sees the messages after User A deletes them
 * 3. Message deletion only affects the user who deleted them
 * 
 * Prerequisites:
 * - Server must be running
 * - Two test users must exist
 * - A conversation between them must exist with some messages
 */

const API_URL = 'http://localhost:3001/api';

// Test users - Update these with your test credentials
const USER_A = {
  username: 'user1',
  password: 'password123'
};

const USER_B = {
  username: 'user2',
  password: 'password123'
};

let tokenA, tokenB;
let conversationId;

async function login(username, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error(`❌ Login failed for ${username}:`, error.response?.data || error.message);
    throw error;
  }
}

async function getConversations(token) {
  try {
    const response = await axios.get(`${API_URL}/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get conversations:', error.response?.data || error.message);
    throw error;
  }
}

async function getMessages(token, conversationId) {
  try {
    const response = await axios.get(`${API_URL}/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get messages:', error.response?.data || error.message);
    throw error;
  }
}

async function deleteConversationHistory(token, conversationId) {
  try {
    const response = await axios.delete(`${API_URL}/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to delete conversation history:', error.response?.data || error.message);
    throw error;
  }
}

async function test() {
  console.log('🧪 Testing message deletion functionality...\n');

  try {
    // Step 1: Login both users
    console.log('📝 Step 1: Logging in users...');
    tokenA = await login(USER_A.username, USER_A.password);
    tokenB = await login(USER_B.username, USER_B.password);
    console.log('✅ Both users logged in successfully\n');

    // Step 2: Get conversations for User A
    console.log('📝 Step 2: Getting conversations for User A...');
    const conversationsA = await getConversations(tokenA);
    if (conversationsA.length === 0) {
      console.error('❌ User A has no conversations. Please create a conversation first.');
      process.exit(1);
    }
    conversationId = conversationsA[0].id;
    console.log(`✅ Found conversation ID: ${conversationId}\n`);

    // Step 3: Get initial messages for both users
    console.log('📝 Step 3: Getting initial messages for both users...');
    const initialMessagesA = await getMessages(tokenA, conversationId);
    const initialMessagesB = await getMessages(tokenB, conversationId);
    
    console.log(`   User A sees ${initialMessagesA.length} messages`);
    console.log(`   User B sees ${initialMessagesB.length} messages`);
    
    if (initialMessagesA.length === 0) {
      console.error('❌ No messages found. Please send some messages first.');
      process.exit(1);
    }
    console.log('✅ Initial state verified\n');

    // Step 4: User A deletes conversation history
    console.log('📝 Step 4: User A deletes conversation history...');
    await deleteConversationHistory(tokenA, conversationId);
    console.log('✅ Delete request sent\n');

    // Step 5: Verify User A sees no messages
    console.log('📝 Step 5: Verifying User A sees no messages...');
    const messagesAfterDeleteA = await getMessages(tokenA, conversationId);
    console.log(`   User A now sees ${messagesAfterDeleteA.length} messages`);
    
    if (messagesAfterDeleteA.length === 0) {
      console.log('✅ User A correctly sees no messages\n');
    } else {
      console.error('❌ FAIL: User A still sees messages after deletion!');
      process.exit(1);
    }

    // Step 6: Verify User B still sees all messages
    console.log('📝 Step 6: Verifying User B still sees all messages...');
    const messagesAfterDeleteB = await getMessages(tokenB, conversationId);
    console.log(`   User B still sees ${messagesAfterDeleteB.length} messages`);
    
    if (messagesAfterDeleteB.length === initialMessagesB.length) {
      console.log('✅ User B correctly still sees all messages\n');
    } else {
      console.error('❌ FAIL: User B message count changed!');
      console.error(`   Expected: ${initialMessagesB.length}, Got: ${messagesAfterDeleteB.length}`);
      process.exit(1);
    }

    // Final result
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('✓ User A successfully deleted messages for themselves');
    console.log('✓ User B still sees all messages (unaffected)');
    console.log('✓ Delete for me functionality works correctly!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Run the test
test();

