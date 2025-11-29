const { app, BrowserWindow, ipcMain, shell, safeStorage } = require('electron');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const fetch = require('node-fetch');
require('dotenv').config();
const { login, recordAttendance, getTodayList } = require('./api/attendance');

// Encryption key derived from machine-specific info
const ENCRYPTION_KEY = crypto.scryptSync(
    os.hostname() + os.userInfo().username,
    'tarumt-attendance-salt',
    32
);
const IV_LENGTH = 16;

// Encrypt password
function encryptPassword(password) {
    try {
        // Try to use Electron's safeStorage first (uses OS keychain)
        if (safeStorage.isEncryptionAvailable()) {
            const encrypted = safeStorage.encryptString(password);
            return 'safe:' + encrypted.toString('base64');
        }
    } catch (e) {
        console.log('safeStorage not available, using fallback encryption');
    }
    
    // Fallback to custom encryption
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return 'aes:' + iv.toString('hex') + ':' + encrypted;
}

// Decrypt password
function decryptPassword(encryptedPassword) {
    try {
        if (encryptedPassword.startsWith('safe:')) {
            // Decrypt using Electron's safeStorage
            const encrypted = Buffer.from(encryptedPassword.slice(5), 'base64');
            return safeStorage.decryptString(encrypted);
        } else if (encryptedPassword.startsWith('aes:')) {
            // Decrypt using custom AES encryption
            const parts = encryptedPassword.slice(4).split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
    } catch (e) {
        console.error('Decryption failed:', e);
    }
    return null;
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        minWidth: 800,
        minHeight: 650,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        title: 'TARUMT Attendance',
        resizable: true,
        minimizable: true,
        maximizable: true,
        autoHideMenuBar: true  // Auto-hide menu bar (press Alt to show)
    });

    mainWindow.loadFile('src/index.html');

    // Open DevTools in development
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Compare semantic versions: returns true if v1 > v2
function isNewerVersion(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        
        if (num1 > num2) return true;
        if (num1 < num2) return false;
    }
    
    return false; // versions are equal
}

// Check for updates
async function checkForUpdates() {
    try {
        const response = await fetch('https://api.github.com/repos/kongjiyu/TarumtAttendanceApp/releases/latest');
        const data = await response.json();
        
        const latestVersion = data.tag_name.replace('v', '');
        const currentVersion = app.getVersion();
        
        // Only show update if latest version is newer than current version
        if (isNewerVersion(latestVersion, currentVersion)) {
            return {
                hasUpdate: true,
                version: latestVersion,
                url: data.html_url,
                releaseNotes: data.body
            };
        }
        
        return { hasUpdate: false };
    } catch (error) {
        console.error('Error checking for updates:', error);
        return { hasUpdate: false, error: true };
    }
}

// App lifecycle
app.whenReady().then(() => {
    createWindow();
    
    // Check for updates after window is created
    setTimeout(async () => {
        const updateInfo = await checkForUpdates();
        if (updateInfo.hasUpdate && mainWindow) {
            mainWindow.webContents.send('update-available', updateInfo);
        }
    }, 3000); // Check 3 seconds after launch

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Quit the app when all windows are closed on all platforms
    app.quit();
});

// IPC Handlers
ipcMain.handle('login', async (event, username, password, deviceId, deviceModel) => {
    try {
        const result = await login(username, password, deviceId, deviceModel);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('record-attendance', async (event, token, code, deviceId, deviceModel) => {
    try {
        const result = await recordAttendance(token, code, deviceId, deviceModel);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-today-list', async (event, token) => {
    try {
        const result = await getTodayList(token);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get device information
ipcMain.handle('get-device-info', async () => {
    try {
        // Get computer name
        const hostname = os.hostname();
        
        // Get OS info
        const platform = os.platform();
        const release = os.release();
        
        // Generate device model name
        let deviceModel;
        if (platform === 'darwin') {
            // macOS
            const arch = process.arch;
            if (arch === 'arm64') {
                deviceModel = 'Mac (Apple Silicon)';
            } else {
                deviceModel = 'Mac (Intel)';
            }
        } else if (platform === 'win32') {
            deviceModel = 'Windows PC';
        } else if (platform === 'linux') {
            deviceModel = 'Linux';
        } else {
            deviceModel = 'Desktop';
        }
        
        // Generate a unique device ID based on hardware
        // Using MAC address of network interfaces as a base
        const networkInterfaces = os.networkInterfaces();
        let macAddress = '';
        
        // Find the first non-internal network interface with a MAC address
        for (const interfaceName in networkInterfaces) {
            const interfaces = networkInterfaces[interfaceName];
            for (const iface of interfaces) {
                if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                    macAddress = iface.mac;
                    break;
                }
            }
            if (macAddress) break;
        }
        
        // Create a deterministic UUID based on MAC address and hostname
        let deviceId;
        if (macAddress) {
            const hash = crypto.createHash('sha256').update(macAddress + hostname).digest('hex');
            // Format as UUID-like string
            deviceId = [
                hash.substr(0, 8),
                hash.substr(8, 4),
                hash.substr(12, 4),
                hash.substr(16, 4),
                hash.substr(20, 12)
            ].join('-').toUpperCase();
        } else {
            // Fallback to a hash of hostname
            const hash = crypto.createHash('sha256').update(hostname + Date.now().toString()).digest('hex');
            deviceId = [
                hash.substr(0, 8),
                hash.substr(8, 4),
                hash.substr(12, 4),
                hash.substr(16, 4),
                hash.substr(20, 12)
            ].join('-').toUpperCase();
        }
        
        return {
            deviceId,
            deviceModel,
            hostname,
            platform,
            arch: process.arch
        };
    } catch (error) {
        console.error('Error getting device info:', error);
        // Return fallback values
        return {
            deviceId: crypto.randomUUID().toUpperCase(),
            deviceModel: 'Desktop App',
            hostname: 'Unknown',
            platform: os.platform(),
            arch: process.arch
        };
    }
});

// Check for updates manually
ipcMain.handle('check-for-updates', async () => {
    return await checkForUpdates();
});

// Open update URL in browser
ipcMain.handle('open-update-url', async (event, url) => {
    shell.openExternal(url);
});

// Encrypt password for secure storage
ipcMain.handle('encrypt-password', async (event, password) => {
    return encryptPassword(password);
});

// Decrypt password for auto re-login
ipcMain.handle('decrypt-password', async (event, encryptedPassword) => {
    return decryptPassword(encryptedPassword);
});
