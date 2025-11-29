# v1.4.0 Release Notes

## 🎉 TARUMT Attendance v1.4.0

### 🔓 Logout Endpoint (Fixes #1)
- Added **proper logout functionality** that removes device sessions from server
- Prevents accumulation of multiple device sessions that could limit login
- Calls `AJAXUpdateUserSession.jsp` with `act: 'remove'` on logout
- Thanks to [@samleong123](https://github.com/samleong123) for reporting this issue!

### 🔐 Security Improvements
- All API requests now include `appversion` and `fplatform` parameters
- Consistent signature calculation across all endpoints
- Proper `X-Signature` and `X-Timestamp` headers on all requests

---

### 📥 Downloads

| Platform | Architecture | File | Recommended For |
|----------|-------------|------|-----------------|
| **macOS** | Apple Silicon (M1/M2/M3/M4) | `TARUMT Attendance-1.4.0-arm64.dmg` | MacBook Air/Pro (2020+), Mac Mini M1+ |
| **macOS** | Intel | `TARUMT Attendance-1.4.0.dmg` | Older MacBooks (pre-2020) |
| **Windows** | x64 / ARM64 | `TARUMT Attendance Setup 1.4.0.exe` | All Windows PCs |

#### 💡 How to Choose:
- **Mac users**: Check  → About This Mac → Chip
  - If it says "Apple M1/M2/M3/M4" → Download **arm64.dmg**
  - If it says "Intel" → Download **.dmg** (without arm64)
- **Windows users**: Download **Setup 1.4.0.exe** (works on both Intel and ARM)

---

### ⚠️ Windows SmartScreen Warning
Since the app is not signed with a certificate, Windows may show a warning. Click **"More info"** → **"Run anyway"** to proceed.

---

### 🔄 Upgrading from v1.3.0
Just download and install the new version. Your saved accounts will be preserved.

---

### 📋 Full Changelog
- Added `logout()` function in `api/attendance.js`
- Added IPC handler for logout in `main.js`
- Updated `handleLogout()` in renderer to call server logout
- Added `appversion` and `fplatform` to `recordAttendance()` and `getTodayList()` params
