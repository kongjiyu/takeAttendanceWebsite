# v1.3.0 Release Notes

## 🎉 TARUMT Attendance v1.3.0

### 🔐 Security Updates
- Added **HMAC-SHA-256 signature** for all API requests
- New headers: `X-Signature` and `X-Timestamp` for secure communication
- Updated login endpoint to `studentLogin.jsp`
- API version updated to 2.0.19
- Secret key stored securely in `.env` file

### 🐛 Bug Fixes
- **Fixed attendance history** matching for multiple class sessions
- Now correctly matches by **course code + start time** instead of just attendance code
- Supports same attendance code used for different class sessions (e.g., 4 sessions of BMSE2073 with same code)

---

### 📥 Downloads

| Platform | Architecture | File | Recommended For |
|----------|-------------|------|-----------------|
| **macOS** | Apple Silicon (M1/M2/M3/M4) | `TARUMT Attendance-1.3.0-arm64.dmg` | MacBook Air/Pro (2020+), Mac Mini M1+ |
| **macOS** | Intel | `TARUMT Attendance-1.3.0.dmg` | Older MacBooks (pre-2020) |
| **Windows** | x64 / ARM64 | `TARUMT Attendance Setup 1.3.0.exe` | All Windows PCs |

---

### ⚠️ Important
- This update is **required** - TARUMT has added new security measures
- Older versions (1.2.0 and below) will no longer work

### ⚠️ Windows SmartScreen Warning
Since the app is not signed with a certificate, Windows may show a warning. Click **"More info"** → **"Run anyway"** to proceed.

---

### 🔄 Upgrading from v1.2.0
Just download and install the new version. Your saved accounts will be preserved.
