# 📁 Project Structure - After Cleanup

## 🌳 Directory Tree

```
zalo-clone/
│
├── 📱 client/                          # React Native App
│   ├── ios/                           # iOS Native Project
│   │   ├── App/                       # Xcode project
│   │   │   ├── App.xcodeproj/        # ⭐ Xcode project file
│   │   │   └── App/                  # iOS app files
│   │   └── Podfile                   # CocoaPods dependencies
│   │
│   ├── public/                        # Public Assets
│   │   ├── index.html                # HTML template
│   │   ├── manifest.json             # PWA manifest
│   │   ├── sw.js                     # Service worker
│   │   └── *.png                     # Icons
│   │
│   ├── src/                          # Source Code
│   │   ├── components/               # React components
│   │   │   ├── Auth/                # Auth components
│   │   │   ├── Chat/                # Chat components
│   │   │   ├── Mobile/              # Mobile-specific
│   │   │   ├── NewsFeed/            # Feed components
│   │   │   ├── Friends/             # Friends components
│   │   │   └── Profile/             # Profile components
│   │   │
│   │   ├── hooks/                    # Custom Hooks
│   │   │   ├── useMobileLayout.js   # ⭐ MAIN HOOK
│   │   │   ├── useResponsive.js     # Responsive utils
│   │   │   ├── useSocket.js         # Socket.io
│   │   │   └── ...                  # Other hooks
│   │   │
│   │   ├── utils/                    # Utilities
│   │   │   ├── initMobileLayout.js  # ⭐ INIT SCRIPT
│   │   │   ├── api.js               # API calls
│   │   │   ├── responsive.js        # Responsive utils
│   │   │   └── ...                  # Other utils
│   │   │
│   │   ├── styles/                   # CSS Styles
│   │   │   ├── mobile-responsive-master.css  # ⭐ MAIN CSS
│   │   │   ├── index.css            # Base styles
│   │   │   ├── tailwind.css         # Tailwind
│   │   │   ├── pwa.css              # PWA styles
│   │   │   ├── platform-sync.css    # Platform sync
│   │   │   ├── safe-area.css        # Legacy (optional)
│   │   │   ├── responsive-enhanced.css  # Legacy (optional)
│   │   │   └── iphone-optimization.css  # Legacy (optional)
│   │   │
│   │   ├── contexts/                 # React Contexts
│   │   │   ├── AuthContext.js       # Authentication
│   │   │   └── ThemeContext.js      # Theme
│   │   │
│   │   ├── index.js                  # ⭐ Entry Point
│   │   └── App.js                    # ⭐ Main Component
│   │
│   ├── capacitor.config.ts           # ⭐ Capacitor Config
│   ├── package.json                  # ⭐ Dependencies
│   ├── tailwind.config.js            # Tailwind config
│   └── postcss.config.js             # PostCSS config
│
├── 🌐 server/                         # Backend Server
│   ├── routes/                       # API Routes
│   │   ├── auth.js                  # Auth routes
│   │   ├── chat.js                  # Chat routes
│   │   ├── friends.js               # Friends routes
│   │   ├── newsfeed.js              # Feed routes
│   │   └── ...                      # Other routes
│   │
│   ├── middleware/                   # Middleware
│   │   └── auth.js                  # Auth middleware
│   │
│   ├── config/                       # Server Config
│   │   └── database.js              # Database config
│   │
│   ├── uploads/                      # Upload Folder
│   │   ├── avatars/                 # User avatars
│   │   └── posts/                   # Post images
│   │
│   ├── index.js                      # ⭐ Server Entry
│   ├── package.json                  # ⭐ Server Dependencies
│   └── config.env                    # Environment vars
│
├── 📚 Documentation/                  # Docs (Essential Only)
│   ├── START-HERE-MOBILE-RESPONSIVE.md       # ⭐ START HERE
│   ├── MOBILE-RESPONSIVE-SIMPLE-GUIDE.md     # Detailed guide
│   ├── MOBILE-RESPONSIVE-README.md           # Quick reference
│   ├── ESSENTIAL-FILES.md                    # File list
│   ├── PROJECT-CLEANUP-GUIDE.md              # Cleanup guide
│   ├── README-PROJECT-STRUCTURE.md           # This file
│   └── FIX-*.md                              # Fix guides
│
└── 🔧 Scripts/                        # Build Scripts
    ├── BUILD-TEST-MOBILE.bat         # ⭐ MAIN BUILD SCRIPT
    ├── CLEANUP-PROJECT.bat           # Cleanup script
    ├── VERIFY-PROJECT.bat            # Verify script
    ├── sync-ip.js                    # IP sync
    └── update-ip.js                  # Update IP
```

---

## ⭐ Key Files

### Must Have (Core System)
```
client/src/styles/mobile-responsive-master.css
client/src/hooks/useMobileLayout.js
client/src/utils/initMobileLayout.js
client/src/index.js
client/src/App.js
client/package.json
client/capacitor.config.ts
client/ios/ (entire folder)
server/index.js
server/package.json
```

### Important (Configuration)
```
client/tailwind.config.js
client/postcss.config.js
server/config.env
```

### Assets
```
client/public/index.html
client/public/manifest.json
client/public/sw.js
client/public/*.png
```

---

## 📦 Dependencies

### Client (React)
```json
{
  "@capacitor/core": "^5.x",
  "@capacitor/ios": "^5.x",
  "@capacitor/keyboard": "^5.x",
  "react": "^18.x",
  "react-dom": "^18.x",
  "styled-components": "^6.x",
  "socket.io-client": "^4.x",
  "tailwindcss": "^3.x"
}
```

### Server (Node.js)
```json
{
  "express": "^4.x",
  "socket.io": "^4.x",
  "mysql2": "^3.x",
  "multer": "^1.x",
  "jsonwebtoken": "^9.x"
}
```

---

## 🔄 Workflow

### Development
```bash
# 1. Start server
cd server
npm start

# 2. Start client (web)
cd client
npm start

# 3. Build & test iOS
npm run build
npx cap sync ios
npx cap open ios
```

### Production Build
```bash
# 1. Build React app
cd client
npm run build

# 2. Sync with iOS
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# 4. Archive & Export IPA
# Use Xcode: Product → Archive → Export
```

---

## 📏 Code Organization

### Component Pattern
```javascript
// Standard component structure
import useMobileLayout from '../../hooks/useMobileLayout';

const MyComponent = () => {
  const { keyboardHeight, safeAreaTop, safeAreaBottom } = useMobileLayout();
  
  return (
    <Container>
      <Header style={{ paddingTop: safeAreaTop + 12 }} />
      <Content className="mobile-content" />
      <Input style={{ bottom: keyboardHeight }} />
    </Container>
  );
};
```

### CSS Pattern
```css
/* Use CSS variables from mobile-responsive-master.css */
.my-element {
  padding-top: var(--safe-top);
  padding-bottom: var(--safe-bottom);
  font-size: var(--font-base);
  min-height: var(--touch-min);
}
```

---

## 🎨 Styling System

### Priority Order
```
1. mobile-responsive-master.css    # ⭐ Main responsive
2. platform-sync.css              # Platform sync
3. tailwind.css                   # Utility classes
4. index.css                      # Base styles
5. Component styles               # Styled-components
```

### CSS Variables Available
```css
--vh                    /* Dynamic viewport height */
--keyboard-height       /* Keyboard height */
--safe-top             /* Safe area top */
--safe-bottom          /* Safe area bottom */
--touch-min            /* Touch target min (44px) */
--font-base            /* Base font size (16px) */
--space-md             /* Standard spacing */
```

---

## 🚀 Getting Started

### First Time Setup
```bash
# 1. Install dependencies
cd client && npm install
cd ../server && npm install

# 2. Configure
# Edit server/config.env
# Edit client/capacitor.config.ts (IP address)

# 3. Test
cd client
npm start  # Web version

# 4. iOS
npm run build
npx cap sync ios
npx cap open ios
```

### Daily Development
```bash
# Terminal 1: Server
cd server && npm start

# Terminal 2: Client
cd client && npm start
```

---

## 📊 File Sizes (After Cleanup)

```
Source Code:           ~80MB
├── client/src/        60MB
├── server/            15MB
└── docs/             5MB

iOS Project:           ~50MB
├── App.xcodeproj/    10MB
├── Pods/             30MB
└── Resources/        10MB

Assets:                ~10MB
├── Icons             5MB
└── Images            5MB

Total (without node_modules): ~150MB
```

---

## ✅ Health Check

After setup, verify:

```bash
# 1. Verify structure
VERIFY-PROJECT.bat

# 2. Test build
BUILD-TEST-MOBILE.bat

# 3. Manual checks
cd client
npm run build          # Should succeed
npx cap sync ios       # Should succeed
npx cap open ios       # Should open Xcode
```

---

## 🔗 Quick Links

- **Start Here:** START-HERE-MOBILE-RESPONSIVE.md
- **Simple Guide:** MOBILE-RESPONSIVE-SIMPLE-GUIDE.md
- **Essential Files:** ESSENTIAL-FILES.md
- **Cleanup:** PROJECT-CLEANUP-GUIDE.md

---

**Last Updated:** 2025-01-26  
**Status:** ✅ Clean & Organized

