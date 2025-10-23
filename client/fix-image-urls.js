/**
 * Script để tự động fix image URLs trong tất cả components
 */

const fs = require('fs');
const path = require('path');

const files = [
  'src/components/Chat/ChatArea.js',
  'src/components/Chat/Sidebar.js',
  'src/components/Chat/UserSearch.js',
  'src/components/Chat/FriendsList.js',
  'src/components/Chat/ChatOptionsMenu.js',
  'src/components/Profile/PersonalProfilePage.js',
  'src/components/Profile/ProfilePage.js',
  'src/components/Mobile/MobileSidebar.js',
  'src/components/Mobile/MobileContacts.js',
  'src/components/Mobile/NewMessageModal.js',
  'src/components/Friends/Friends.js',
  'src/components/NewsFeed/NewsFeed.js',
  'src/components/NewsFeed/Post.js',
  'src/components/NewsFeed/PostCreator.js',
  'src/components/Notifications/NotificationBell.js'
];

const importStatement = "import { getAvatarURL, getUploadedImageURL } from '../../utils/imageUtils';";

function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Check if import already exists
  if (!content.includes("from '../../utils/imageUtils'") && 
      !content.includes("from '../utils/imageUtils'")) {
    
    // Find the last import statement
    const importLines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex !== -1) {
      // Adjust import path based on file location
      let adjustedImport = importStatement;
      if (filePath.includes('Profile') || filePath.includes('Mobile') || 
          filePath.includes('Friends') || filePath.includes('NewsFeed') || 
          filePath.includes('Notifications')) {
        adjustedImport = importStatement; // ../utils works from subdirs
      }
      
      importLines.splice(lastImportIndex + 1, 0, adjustedImport);
      content = importLines.join('\n');
      modified = true;
      console.log(`✅ Added import to: ${filePath}`);
    }
  }

  // Replace avatar URLs
  const avatarPatterns = [
    // img src with avatar_url
    {
      pattern: /src=\{([^}]+\.avatar_url)\}/g,
      replacement: 'src={getAvatarURL($1)}'
    },
    // img src with avatarUrl
    {
      pattern: /src=\{([^}]+\.avatarUrl)\}/g,
      replacement: 'src={getAvatarURL($1)}'
    },
    // backgroundImage with avatar_url
    {
      pattern: /backgroundImage:\s*`url\(\$\{([^}]+\.avatar_url)\}\)`/g,
      replacement: 'backgroundImage: `url(${getAvatarURL($1)})`'
    },
    // src={conversation.avatar_url} (already fixed in some files)
    {
      pattern: /src=\{getAvatarURL\(([^)]+)\)\}/g,
      replacement: 'src={getAvatarURL($1)}' // No change, just count
    }
  ];

  let replacements = 0;
  
  avatarPatterns.forEach(({pattern, replacement}) => {
    const matches = content.match(pattern);
    if (matches && !matches[0].includes('getAvatarURL')) {
      content = content.replace(pattern, replacement);
      replacements += matches.length;
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath} - ${replacements} avatar URLs updated`);
  } else {
    console.log(`ℹ️  ${filePath} - already fixed or no avatars found`);
  }
}

console.log('🔧 Starting to fix image URLs...\n');

files.forEach(fixFile);

console.log('\n🎉 Done! Please check the files and test.');
console.log('\n📝 Next steps:');
console.log('1. Review changes');
console.log('2. Run: npm run build');
console.log('3. Test in browser');
console.log('4. Commit and push to GitHub');

