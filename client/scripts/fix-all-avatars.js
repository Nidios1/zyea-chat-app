/**
 * Script tự động fix TẤT CẢ avatar URLs trong toàn bộ app
 */

const fs = require('fs');
const path = require('path');

// Danh sách tất cả files cần fix
const filesToFix = [
  'src/components/Chat/ChatArea.js',
  'src/components/Chat/Sidebar.js',
  'src/components/Chat/Message.js',
  'src/components/Chat/Chat.js',
  'src/components/Chat/ChatOptionsMenu.js',
  'src/components/Chat/UserSearch.js',
  'src/components/Chat/FriendsList.js',
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

let totalFixed = 0;
let filesModified = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  let fixCount = 0;

  // 1. Add import if not exists
  if (!content.includes("from '../../utils/imageUtils'") && 
      !content.includes("from '../utils/imageUtils'")) {
    
    const importLines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ') && !importLines[i].includes('styled')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex !== -1) {
      importLines.splice(lastImportIndex + 1, 0, "import { getAvatarURL, getUploadedImageURL } from '../../utils/imageUtils';");
      content = importLines.join('\n');
      modified = true;
    }
  }

  const originalContent = content;

  // 2. Fix img src with avatar_url (chưa có getAvatarURL)
  content = content.replace(
    /src=\{([^}]*\.avatar_url)\}/g,
    (match, capture) => {
      if (!match.includes('getAvatarURL')) {
        fixCount++;
        return `src={getAvatarURL(${capture})}`;
      }
      return match;
    }
  );

  // 3. Fix img src with avatarUrl
  content = content.replace(
    /src=\{([^}]*\.avatarUrl)\}/g,
    (match, capture) => {
      if (!match.includes('getAvatarURL')) {
        fixCount++;
        return `src={getAvatarURL(${capture})}`;
      }
      return match;
    }
  );

  // 4. Fix backgroundImage with avatar_url
  content = content.replace(
    /backgroundImage:\s*`url\(\$\{([^}]*\.avatar_url)\}\)`/g,
    (match, capture) => {
      if (!match.includes('getAvatarURL')) {
        fixCount++;
        return `backgroundImage: \`url(\${getAvatarURL(${capture})})\``;
      }
      return match;
    }
  );

  // 5. Fix src=`${...avatar_url}` patterns
  content = content.replace(
    /src=\{`\$\{([^}]*\.avatar_url)\}`\}/g,
    (match, capture) => {
      if (!match.includes('getAvatarURL')) {
        fixCount++;
        return `src={\`\${getAvatarURL(${capture})}\`}`;
      }
      return match;
    }
  );

  // 6. Fix post images
  content = content.replace(
    /src=\{([^}]*\.image_url)\}/g,
    (match, capture) => {
      if (!match.includes('getUploadedImageURL')) {
        fixCount++;
        return `src={getUploadedImageURL(${capture})}`;
      }
      return match;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    filesModified++;
    totalFixed += fixCount;
    console.log(`✅ Fixed ${filePath} - ${fixCount} avatar URLs updated`);
    modified = true;
  } else if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    filesModified++;
    console.log(`✅ Added import to ${filePath}`);
  } else {
    console.log(`ℹ️  ${filePath} - already fixed`);
  }
});

console.log('\n' + '='.repeat(50));
console.log(`🎉 Done!`);
console.log(`📝 Files modified: ${filesModified}`);
console.log(`🔧 Total avatar URLs fixed: ${totalFixed}`);
console.log('\n📋 Next steps:');
console.log('1. Review changes: git diff');
console.log('2. Test in browser');
console.log('3. Build: npm run build');
console.log('4. Commit: git add . && git commit -m "Fix all avatar URLs"');
console.log('5. Push: git push origin master');

