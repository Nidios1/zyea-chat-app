# 🔧 Hướng dẫn Setup Git và Push lên GitHub

## ⚠️ Vấn đề

Git command line **KHÔNG tự động** sử dụng đăng nhập từ Google Chrome. Cần cấu hình riêng.

---

## 🚀 Giải pháp nhanh nhất: GitHub CLI

GitHub CLI (`gh`) cho phép sử dụng đăng nhập từ browser.

### Bước 1: Cài đặt Git

**Tải và cài đặt Git:**
- Link: https://git-scm.com/download/win
- Chọn "Git for Windows" → Tải về → Chạy installer
- Giữ nguyên các tùy chọn mặc định

### Bước 2: Cài đặt GitHub CLI

**Cách 1: Dùng Winget (Windows Package Manager)**
```powershell
winget install --id GitHub.cli
```

**Cách 2: Tải trực tiếp**
- Link: https://cli.github.com/
- Tải và cài đặt

### Bước 3: Đăng nhập GitHub CLI

```bash
gh auth login
```

Chọn:
- **GitHub.com**
- **HTTPS**
- **Login with a web browser**
- Dán code vào browser và xác nhận

### Bước 4: Commit và Push

```bash
cd zalo-clone/mobile-expo
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Nidios1/zyea-chat-app.git
git push -u origin main
```

---

## 🔑 Giải pháp thay thế: Personal Access Token

Nếu không muốn cài GitHub CLI, dùng Personal Access Token.

### Bước 1: Tạo Personal Access Token

1. Vào GitHub: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Đặt tên: `zyea-chat-app`
4. Chọn quyền: ✅ **repo** (full control)
5. Click **"Generate token"**
6. **Copy token** (chỉ hiện 1 lần!)

### Bước 2: Cấu hình Git

```bash
# Cài Git trước (từ link trên)

# Cấu hình user
git config --global user.name "Nidios1"
git config --global user.email "your-email@example.com"

# Hoặc chỉ cho repo này
cd zalo-clone/mobile-expo
git config user.name "Nidios1"
git config user.email "your-email@example.com"
```

### Bước 3: Push với Token

```bash
cd zalo-clone/mobile-expo
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Nidios1/zyea-chat-app.git

# Khi được hỏi username: Nidios1
# Khi được hỏi password: DÁN PERSONAL ACCESS TOKEN
git push -u origin main
```

Hoặc dùng token trực tiếp trong URL:
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/Nidios1/zyea-chat-app.git
git push -u origin main
```

---

## 📝 Script tự động

Tôi đã tạo script `commit-and-push.bat` để tự động hóa:

```bash
npm run commit:push
```

Script sẽ:
- Tự động add file
- Commit với message
- Push lên GitHub (sẽ hỏi credentials nếu cần)

---

## ✅ Checklist

- [ ] Cài đặt Git: https://git-scm.com/download/win
- [ ] Cài đặt GitHub CLI: `winget install --id GitHub.cli`
- [ ] Đăng nhập: `gh auth login`
- [ ] Push code: `git push`

---

## 🔗 Links hữu ích

- **Git Download**: https://git-scm.com/download/win
- **GitHub CLI**: https://cli.github.com/
- **Personal Access Tokens**: https://github.com/settings/tokens
- **Repository**: https://github.com/Nidios1/zyea-chat-app

