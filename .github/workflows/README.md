# GitHub Actions Workflows

## 🚀 Available Workflows

### 1. Build iOS IPA (`ios-build.yml`)

Tự động build file IPA cho iOS app.

**Triggers:**
- Push to `main` or `develop` branch
- Pull requests to `main`
- Manual dispatch (với options cho build type)

**Required Secrets:**
```
BUILD_CERTIFICATE_BASE64         # Base64 encoded .p12 certificate
P12_PASSWORD                     # Password for .p12 file
BUILD_PROVISION_PROFILE_BASE64   # Base64 encoded .mobileprovision
KEYCHAIN_PASSWORD                # Temporary keychain password
TEAM_ID                          # Apple Team ID
PROVISIONING_PROFILE_NAME        # Name of provisioning profile
```

**Optional Secrets (for TestFlight):**
```
APP_STORE_CONNECT_API_KEY        # App Store Connect API Key (.p8)
APP_STORE_CONNECT_ISSUER_ID      # Issuer ID
APP_STORE_CONNECT_KEY_ID         # Key ID
```

**Outputs:**
- IPA file
- dSYM file (for crash symbolication)

---

## 🔧 Setup Instructions

### 1. Convert Certificate to Base64

**macOS/Linux:**
```bash
base64 -i YourCertificate.p12 | pbcopy
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("YourCertificate.p12")) | Set-Clipboard
```

### 2. Add Secrets to GitHub

1. Go to repository **Settings**
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add all required secrets

### 3. Trigger Build

**Automatic:**
- Push code to `main` or `develop` branch

**Manual:**
1. Go to **Actions** tab
2. Select **Build iOS IPA** workflow
3. Click **Run workflow**
4. Choose build type: `development`, `adhoc`, or `appstore`

---

## 📥 Download IPA

After successful build:
1. Go to **Actions** tab
2. Click on the completed workflow run
3. Scroll down to **Artifacts**
4. Download `zyea-chat-ios-<build-number>.zip`
5. Extract the ZIP file to get the IPA

---

## 🔍 Troubleshooting

### Build fails with "Certificate not found"
- Check that `BUILD_CERTIFICATE_BASE64` is correctly encoded
- Verify `P12_PASSWORD` is correct

### Build fails with "Provisioning profile not found"
- Check that `BUILD_PROVISION_PROFILE_BASE64` is correctly encoded
- Verify Bundle ID matches provisioning profile

### Build takes too long
- Workflow has 120 minute timeout
- Check if dependencies are cached properly

---

## 📚 More Information

See [BUILD-IPA-GUIDE.md](../../BUILD-IPA-GUIDE.md) for detailed instructions.

