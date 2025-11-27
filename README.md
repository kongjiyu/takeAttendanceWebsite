# 🎓 TARUMT Attendance App

A simple and beautiful desktop application for TARUMT students to record attendance quickly and manage multiple accounts.

> 📖 **[中文版本 (Chinese Version)](README_CN.md)**

---

## 📥 Installation

### Download & Install

1. **Download the app** for your platform:
   - **macOS**: Download `TARUMT Attendance.dmg` or `.zip` file
   - **Windows**: Download the `.exe` installer

2. **Install the app:**
   - **macOS**: Open the DMG file and drag the app to Applications folder
   - **Windows**: Run the installer and follow the setup wizard

3. **Launch the app** from your Applications folder (macOS) or Start Menu (Windows)

4. **First-time macOS users**: If you see a security warning:
   - Right-click the app → Select "Open"
   - Click "Open" in the dialog
   - You only need to do this once

---

## 📖 User Guide

### 🔐 First-Time Login

1. **Open the app** - You'll see the login screen
2. **Enter your credentials:**
   - Student ID (e.g., `2500001`)
   - Password
3. **Click "Log In"**
4. **Done!** Your account is automatically saved

> 💡 **Tip:** Next time you open the app, you can just click your name to login instantly!

---

### 👥 Multi-Account Management

The app supports multiple student accounts - perfect if you share a device or manage multiple accounts.

#### **Switching Between Accounts:**

1. **After logging out**, you'll see the account selection screen
2. **Click any saved account** to login instantly (no password needed!)
3. All your accounts are displayed with names and student IDs

#### **Adding More Accounts:**

1. On the account selection screen, click **"Add New Account"**
2. Enter the new student ID and password
3. Click "Log In" - the new account is added to your list

#### **Removing Accounts:**

1. On the account selection screen, find the account you want to remove
2. Click the **trash icon** 🗑️ next to the account
3. The account is removed from your saved list

#### **During Login:**

If you want to switch accounts while on the login page:
- Click **"Choose Account"** button to go back to the account selection screen

---

### ✅ Recording Attendance

This is the main feature - super simple!

1. **After logging in**, you'll see the attendance screen
2. **Your lecturer displays an attendance code** on the projector/screen
3. **Type the code** in the input field (usually 4-6 digits)
4. **Click "Submit Attendance"**
5. **Success!** You'll see a confirmation message

> ⚠️ **Important:** You must be connected to TARUMT school WiFi for this to work!

---

### 📋 Attendance History

The app automatically keeps track of all attendance you've recorded today.

#### **What You'll See:**

After submitting attendance, a card appears in the "Today's Attendance" section showing:
- ⏰ **Time** - When you recorded it (e.g., "10:30 AM")
- 🔢 **Code** - The attendance code you used
- 📚 **Course Code** - e.g., "BMIT2203"
- 📖 **Course Name** - e.g., "HUMAN COMPUTER INTERACTION"
- 🏫 **Class Details** - Time and room (e.g., "10:00 AM - 12:00 PM, DK 4")
- 👨‍🏫 **Lecturer** - Who teaches the class

#### **Features:**

- ✅ Automatically updates when you submit new attendance
- ✅ Shows all attendance for today only
- ✅ Persists even if you logout and login again (same day)
- ✅ Resets automatically at midnight each day

---

## 🛡️ Advanced Tips: Avoiding Detection

> ⚠️ **Note:** These tips are for users concerned about system detection. Most users don't need this.

### 📱 Using Custom Device Information

By default, the app uses your computer's unique device ID. If you want to use different device information (like your phone's):

1. **Click the settings icon** ⚙️ (next to the logout button)
2. **View your auto-detected device info:**
   - Device ID
   - Device Model
   - Hostname
3. **Enter custom values:**
   - You can input your **phone's device ID** and **device model**
   - This makes it look like you're submitting from your phone instead of a computer
4. **Click "Save Settings"** to apply
5. **To revert:** Click "Reset to Auto-Detect"

#### **Why Use This?**
- If you want attendance submissions to appear as if they came from your mobile device
- Helps avoid patterns that might flag multiple accounts from the same computer

#### **Where to Get Phone Device ID:**

**Android:**
- Settings → About Phone → Build Number (tap 7 times to enable Developer Mode)
- Settings → Developer Options → Device ID

**iPhone:**
- Settings → General → About → Model Number
- For Device ID, use your phone's serial number or IMEI

---

### 🌐 Different IP Addresses for Multiple Accounts

If you're managing multiple accounts from the same device, the school's system might detect the same IP address being used by different student accounts.

#### **Solution: Reconnect to WiFi Between Accounts**

1. **Submit attendance for Account 1**
2. **Logout from the app**
3. **Disconnect from TARUMT WiFi:**
   - macOS: Click WiFi icon → Turn WiFi Off
   - Windows: Click WiFi icon → Disconnect
4. **Wait 5-10 seconds**
5. **Reconnect to TARUMT WiFi**
6. **Login with Account 2**
7. **Submit attendance** - You now have a different IP address!

#### **Why This Works:**
- When you reconnect to WiFi, the router assigns you a new IP address
- This makes it appear as if the two accounts are logging in from different devices/locations
- Reduces the chance of the system flagging multiple accounts from the same device

#### **Important Notes:**
- ⏰ This takes an extra 10-20 seconds per account
- 🔄 Only needed if you're worried about IP-based detection
- 💡 Most effective when combined with custom device IDs

---

## ⚠️ Requirements

### School WiFi Only
**You MUST be connected to TARUMT's school WiFi network.** The attendance system will reject submissions from:
- ❌ Home WiFi
- ❌ Mobile data or hotspot
- ❌ Public WiFi
- ❌ VPN connections

### Supported Platforms
- ✅ macOS (Intel and Apple Silicon)
- ✅ Windows 10/11

---

## 🔒 Privacy & Security

- ✅ All data stored **locally on your device only**
- ✅ No third-party servers or tracking
- ✅ Passwords only sent to TARUMT's official authentication server
- ✅ Each user profile on your computer has separate saved accounts
- ✅ App does not collect or share any personal information

---

## 🐛 Troubleshooting

### "Invalid user id or password"
- ✅ Double-check your credentials
- ✅ Verify password by logging into TARUMT portal first
- ✅ Make sure you're on school WiFi

### "Invalid code" or "Not allowed to register this class"
- ✅ Verify the code with your lecturer
- ✅ Check you're registered for the class
- ✅ Make sure you're on school WiFi
- ✅ Code might have expired - get a fresh one

### Saved accounts disappeared
- Accounts are per user profile on your device
- Check if you're using a different user account
- Just login again - your account will be saved

### App won't open (macOS)
- Right-click → "Open" (first time only)
- Or: System Settings → Privacy & Security → "Open Anyway"

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Contact the repository owner

---

**Made with ❤️ for TARUMT students**

> 💡 **Pro Tip:** Keep this app running during class hours for quick attendance recording!