# Fix Boolean/String Type Mismatch Error

## Steps to fix:

1. **Clear all caches:**
```bash
cd zalo-clone/mobile-expo
rm -rf node_modules/.expo
rm -rf .expo
npx expo start --clear
```

2. **If using iOS Simulator:**
- Quit simulator completely
- Run: `npx expo run:ios`

3. **If using Android:**
- Run: `npx expo run:android`

4. **If error persists, try:**
```bash
watchman watch-del-all
rm -rf node_modules
npm install
npx expo start --clear
```

## Files Fixed:
- ✅ `src/utils/imagePicker.ts` - Fixed boolean/number type conversions
- ✅ `src/hooks/useVideoCall.ts` - Fixed `.enabled` boolean properties
- ✅ `src/screens/Chat/VideoCallScreen.tsx` - Fixed route params boolean conversion
- ✅ `src/App.tsx` - Added notification handler setup and theme wrapper

## Common causes of this error:
- String values passed to boolean props in native modules
- Route params passed as strings instead of booleans
- AsyncStorage values not properly converted
- Theme config issues with PaperProvider

