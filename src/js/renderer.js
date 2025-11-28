// Configuration
let CONFIG = {
    deviceId: null,
    deviceModel: null,
    deviceInfo: null,
    autoDeviceId: null,
    autoDeviceModel: null
};

// Initialize device info from Electron
async function initDeviceInfo() {
    try {
        const deviceInfo = await window.electronAPI.getDeviceInfo();
        CONFIG.autoDeviceId = deviceInfo.deviceId;
        CONFIG.autoDeviceModel = deviceInfo.deviceModel;
        CONFIG.deviceInfo = deviceInfo;
        
        // Check for custom device settings
        loadDeviceSettings();
        
        console.log('Device Info:', deviceInfo);
    } catch (error) {
        console.error('Failed to get device info:', error);
        // Fallback to localStorage if available
        CONFIG.deviceId = localStorage.getItem('device_id') || generateFallbackId();
        CONFIG.deviceModel = 'Desktop App';
    }
}

// Load custom device settings or use auto-detected
function loadDeviceSettings() {
    const customDeviceId = localStorage.getItem('custom_device_id');
    const customDeviceModel = localStorage.getItem('custom_device_model');
    
    CONFIG.deviceId = customDeviceId || CONFIG.autoDeviceId;
    CONFIG.deviceModel = customDeviceModel || CONFIG.autoDeviceModel;
}

function generateFallbackId() {
    const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }).toUpperCase();
    localStorage.setItem('device_id', id);
    return id;
}

// DOM Elements
const accountSelectionSection = document.getElementById('account-selection-section');
const loginSection = document.getElementById('login-section');
const attendanceSection = document.getElementById('attendance-section');
const loginForm = document.getElementById('login-form');
const attendanceForm = document.getElementById('attendance-form');
const messageContainer = document.getElementById('message-container');
const displayUsername = document.getElementById('display-username');
const logoutBtn = document.getElementById('logout-btn');
const loginBtn = document.getElementById('login-btn');
const submitAttendanceBtn = document.getElementById('submit-attendance-btn');
const savedAccountsList = document.getElementById('saved-accounts-list');
const addNewAccountBtn = document.getElementById('add-new-account-btn');
const chooseAccountBtn = document.getElementById('choose-account-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveSettingsBtn = document.getElementById('save-device-settings-btn');
const resetSettingsBtn = document.getElementById('reset-device-settings-btn');
const attendanceHistoryList = document.getElementById('attendance-history-list');
const refreshClassesBtn = document.getElementById('refresh-classes-btn');
const attendanceCodeInput = document.getElementById('attendance-code');

// State
let authToken = sessionStorage.getItem('authToken');
let currentUsername = sessionStorage.getItem('username');
let currentFullname = sessionStorage.getItem('fullname');

// Initialization
async function init() {
    // Get device info first
    await initDeviceInfo();
    
    // Check for saved accounts
    const savedAccounts = getSavedAccounts();
    
    if (authToken && currentUsername) {
        showAttendanceSection();
    } else if (savedAccounts.length > 0) {
        showAccountSelection();
    } else {
        showLoginSection();
    }

    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    attendanceForm.addEventListener('submit', handleAttendance);
    logoutBtn.addEventListener('click', handleLogout);
    addNewAccountBtn.addEventListener('click', () => showLoginSection());
    chooseAccountBtn.addEventListener('click', () => {
        const savedAccounts = getSavedAccounts();
        if (savedAccounts.length > 0) {
            showAccountSelection();
        }
    });
    settingsBtn.addEventListener('click', openSettingsModal);
    closeSettingsBtn.addEventListener('click', closeSettingsModal);
    saveSettingsBtn.addEventListener('click', saveDeviceSettings);
    resetSettingsBtn.addEventListener('click', resetDeviceSettings);
    refreshClassesBtn.addEventListener('click', () => loadTodayClasses());
    
    // Hide error messages when user starts typing
    loginForm.addEventListener('input', () => {
        if (messageContainer.classList.contains('error')) {
            messageContainer.classList.add('hidden');
        }
    });
    attendanceForm.addEventListener('input', () => {
        if (messageContainer.classList.contains('error')) {
            messageContainer.classList.add('hidden');
        }
    });
    
    // Restrict attendance code input to numbers only
    attendanceCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    
    attendanceCodeInput.addEventListener('keypress', (e) => {
        if (e.key && !/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    });
}

// Account Management
function getSavedAccounts() {
    const accounts = localStorage.getItem('saved_accounts');
    return accounts ? JSON.parse(accounts) : [];
}

function saveAccount(username, fullname, token, encryptedPassword = null) {
    const accounts = getSavedAccounts();
    
    // Check if account already exists
    const existingIndex = accounts.findIndex(acc => acc.username === username);
    if (existingIndex !== -1) {
        // Update existing account, preserve password if not provided
        const existingPassword = accounts[existingIndex].encryptedPassword;
        accounts[existingIndex] = { 
            username, 
            fullname, 
            token, 
            encryptedPassword: encryptedPassword || existingPassword,
            lastUsed: Date.now() 
        };
    } else {
        // Add new account
        accounts.push({ 
            username, 
            fullname, 
            token, 
            encryptedPassword,
            lastUsed: Date.now() 
        });
    }
    
    localStorage.setItem('saved_accounts', JSON.stringify(accounts));
}

// Auto re-login when token expires
async function autoReLogin(username) {
    const accounts = getSavedAccounts();
    const account = accounts.find(acc => acc.username === username);
    
    if (!account || !account.encryptedPassword) {
        return { success: false, error: 'No saved credentials' };
    }
    
    try {
        // Decrypt the password
        const password = await window.electronAPI.decryptPassword(account.encryptedPassword);
        if (!password) {
            return { success: false, error: 'Failed to decrypt password' };
        }
        
        // Try to login again
        const result = await window.electronAPI.login(
            username,
            password,
            CONFIG.deviceId,
            CONFIG.deviceModel
        );
        
        if (result.success) {
            // Update token in storage
            authToken = result.data.token;
            sessionStorage.setItem('authToken', authToken);
            
            // Update account with new token
            saveAccount(username, result.data.fullname, authToken, account.encryptedPassword);
            
            return { success: true, token: authToken };
        } else {
            return { success: false, error: result.error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Check if error indicates token expiry
function isTokenExpiredError(error) {
    const expiredKeywords = [
        'token',
        'expired',
        'unauthorized',
        'invalid session',
        'session expired',
        'login required',
        'authentication'
    ];
    const errorLower = (error || '').toLowerCase();
    return expiredKeywords.some(keyword => errorLower.includes(keyword));
}

function deleteAccount(username) {
    const accounts = getSavedAccounts();
    const filtered = accounts.filter(acc => acc.username !== username);
    localStorage.setItem('saved_accounts', JSON.stringify(filtered));
    
    // Refresh the account list display
    displayAccountsList();
    
    // If no accounts left, show login
    if (filtered.length === 0) {
        showLoginSection();
    }
}

function selectAccount(username) {
    const accounts = getSavedAccounts();
    const account = accounts.find(acc => acc.username === username);
    
    if (account) {
        authToken = account.token;
        currentUsername = account.username;
        currentFullname = account.fullname;
        
        sessionStorage.setItem('authToken', authToken);
        sessionStorage.setItem('username', currentUsername);
        if (currentFullname) {
            sessionStorage.setItem('fullname', currentFullname);
        }
        
        // Update last used
        account.lastUsed = Date.now();
        const accountIndex = accounts.findIndex(acc => acc.username === username);
        accounts[accountIndex] = account;
        localStorage.setItem('saved_accounts', JSON.stringify(accounts));
        
        showAttendanceSection();
        showMessage(`Welcome back, ${currentFullname || username}!`, 'success');
    }
}

function displayAccountsList() {
    const accounts = getSavedAccounts();
    savedAccountsList.innerHTML = '';
    
    if (accounts.length === 0) {
        savedAccountsList.innerHTML = '<p style="text-align: center; color: var(--ios-text-secondary); padding: 40px 20px;">No saved accounts</p>';
        return;
    }
    
    // Sort by last used
    accounts.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
    
    accounts.forEach(account => {
        const card = document.createElement('div');
        card.className = 'account-card';
        
        const displayName = toTitleCase(account.fullname || account.username);
        
        card.innerHTML = `
            <div class="avatar">
                <i class="fa-solid fa-circle-user"></i>
            </div>
            <div class="account-info">
                <div class="account-name">${displayName}</div>
                <div class="account-id">${account.username}</div>
            </div>
            <button class="delete-account-btn" onclick="event.stopPropagation(); deleteAccount('${account.username}')">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        
        card.onclick = () => selectAccount(account.username);
        savedAccountsList.appendChild(card);
    });
}

function showAccountSelection() {
    accountSelectionSection.classList.remove('hidden');
    loginSection.classList.add('hidden');
    attendanceSection.classList.add('hidden');
    messageContainer.classList.add('hidden');
    displayAccountsList();
}

// Today's Classes Management
async function loadTodayClasses() {
    if (!authToken) return;
    
    attendanceHistoryList.innerHTML = '<p class="empty-history"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</p>';
    
    try {
        let result = await window.electronAPI.getTodayList(authToken);
        
        // Check if token expired and try auto re-login
        if (!result.success && isTokenExpiredError(result.error)) {
            const reLoginResult = await autoReLogin(currentUsername);
            if (reLoginResult.success) {
                // Retry with new token
                result = await window.electronAPI.getTodayList(reLoginResult.token);
            } else {
                // Auto re-login failed
                attendanceHistoryList.innerHTML = '<p class="empty-history">Session expired. Please login again.</p>';
                return;
            }
        }
        
        if (result.success && result.data.classes) {
            displayTodayClasses(result.data.classes);
        } else {
            throw new Error(result.error || 'Failed to load classes');
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        attendanceHistoryList.innerHTML = '<p class="empty-history">Failed to load today\'s classes</p>';
    }
}

function displayTodayClasses(classes) {
    if (classes.length === 0) {
        attendanceHistoryList.innerHTML = '<p class="empty-history">No attendance recorded today</p>';
        return;
    }
    
    // Get today's attendance history from local storage (for showing which code was used)
    const attendanceHistory = getTodayHistory();
    
    attendanceHistoryList.innerHTML = '';
    
    classes.forEach(classItem => {
        const card = document.createElement('div');
        card.className = 'history-card';
        
        const classType = {
            'L': 'Lecture',
            'T': 'Tutorial',
            'P': 'Practical'
        }[classItem.fclass_type] || classItem.fclass_type;
        
        // All classes from API are already attended (fupddt has value)
        // Try to find the attendance code from local storage
        const localAttendanceRecord = attendanceHistory.find(record => {
            if (!record.classDetails) return false;
            
            // Match by course code
            const recordCourse = record.classDetails.courseCode || 
                                record.classDetails.funits || 
                                record.classDetails.fcunits;
            
            return recordCourse === classItem.funits;
        });
        
        const attendanceCode = localAttendanceRecord ? localAttendanceRecord.code : null;
        const attendedTime = classItem.fupddt ? classItem.fupddt : null;
        
        card.innerHTML = `
            <div class="history-header">
                <div class="history-course">
                    <h3>
                        ${classItem.funits}
                        <span class="class-type-badge inline-badge">${classType}</span>
                    </h3>
                    <p>${classItem.fdesc}</p>
                </div>
                <div class="history-time">
                    <span style="font-size: 13px; color: var(--ios-text-secondary);">Attended at</span>
                    <span style="font-size: 15px; font-weight: 600; color: var(--ios-blue);">${attendedTime || classItem.fstartdt}</span>
                </div>
            </div>
            <div class="class-details">
                <i class="fa-solid fa-clock"></i>
                <span>${classItem.fstartdt} - ${classItem.fenddt}</span>
            </div>
            <div class="class-details">
                <i class="fa-solid fa-location-dot"></i>
                <span>${classItem.fvenue_label}</span>
            </div>
            <div class="lecture-by">
                <i class="fa-solid fa-chalkboard-user"></i>
                <span>${classItem.fstaffnm}</span>
            </div>
            <div class="attendance-status" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--ios-separator); display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-check-circle" style="color: var(--ios-green); font-size: 16px;"></i>
                <span style="color: var(--ios-green); font-weight: 600;">
                    ${attendanceCode ? `Attended via App (Code: ${attendanceCode})` : 'Attended'}
                </span>
            </div>
        `;
        
        attendanceHistoryList.appendChild(card);
    });
}

// Attendance History Management
function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function getTodayHistory() {
    const todayKey = getTodayKey();
    const history = localStorage.getItem(`attendance_history_${todayKey}`);
    return history ? JSON.parse(history) : [];
}

function saveAttendanceHistory(code, classDetails) {
    const todayKey = getTodayKey();
    const history = getTodayHistory();
    
    // Create a unique identifier for this specific class session
    // This helps match the exact class when there are multiple sessions of the same course
    const record = {
        code: code,
        timestamp: new Date().toISOString(),
        classDetails: classDetails,
        // Store a unique key combining code and timestamp to avoid duplicates
        uniqueKey: `${code}_${Date.now()}`
    };
    
    // Check if this exact code was already recorded today (prevent duplicates)
    const existingIndex = history.findIndex(h => h.code === code);
    if (existingIndex !== -1) {
        // Update existing record instead of adding duplicate
        history[existingIndex] = record;
    } else {
        history.push(record);
    }
    
    localStorage.setItem(`attendance_history_${todayKey}`, JSON.stringify(history));
    
    // Reload today's classes to update attendance status
    loadTodayClasses();
}

// UI Functions
function showMessage(message, type = 'info') {
    messageContainer.textContent = message;
    messageContainer.className = type; // 'success', 'error', or 'info'
    messageContainer.classList.remove('hidden');
    
    // Only auto-hide success and info messages, keep error messages visible
    if (type !== 'error') {
        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 5000);
    }
}

function showLoginSection() {
    accountSelectionSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    attendanceSection.classList.add('hidden');
    messageContainer.classList.add('hidden');
    
    // Show/hide "Choose Account" button based on saved accounts
    const savedAccounts = getSavedAccounts();
    if (savedAccounts.length > 0) {
        chooseAccountBtn.classList.remove('hidden');
    } else {
        chooseAccountBtn.classList.add('hidden');
    }
}

// Helper to title case names
function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(function(word) {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}

function showAttendanceSection() {
    accountSelectionSection.classList.add('hidden');
    loginSection.classList.add('hidden');
    attendanceSection.classList.remove('hidden');
    // Display Name and ID
    const rawName = currentFullname || currentUsername;
    const displayName = toTitleCase(rawName);
    const displayId = currentFullname ? currentUsername : '';
    
    displayUsername.innerHTML = `${displayName} <span style="display:block; font-size: 13px; color: var(--ios-text-secondary); font-weight: 400; margin-top: 2px;">${displayId}</span>`;
    messageContainer.classList.add('hidden');
    
    // Load today's classes (which now includes attendance status)
    loadTodayClasses();
}

// Device Settings Modal
function openSettingsModal() {
    document.getElementById('current-device-id').textContent = CONFIG.autoDeviceId || 'N/A';
    document.getElementById('current-device-model').textContent = CONFIG.autoDeviceModel || 'N/A';
    
    const customDeviceId = localStorage.getItem('custom_device_id');
    const customDeviceModel = localStorage.getItem('custom_device_model');
    
    document.getElementById('custom-device-id').value = customDeviceId || '';
    document.getElementById('custom-device-model').value = customDeviceModel || '';
    
    settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

function saveDeviceSettings() {
    const customDeviceId = document.getElementById('custom-device-id').value.trim();
    const customDeviceModel = document.getElementById('custom-device-model').value.trim();
    
    if (customDeviceId) {
        localStorage.setItem('custom_device_id', customDeviceId);
        CONFIG.deviceId = customDeviceId;
    } else {
        localStorage.removeItem('custom_device_id');
        CONFIG.deviceId = CONFIG.autoDeviceId;
    }
    
    if (customDeviceModel) {
        localStorage.setItem('custom_device_model', customDeviceModel);
        CONFIG.deviceModel = customDeviceModel;
    } else {
        localStorage.removeItem('custom_device_model');
        CONFIG.deviceModel = CONFIG.autoDeviceModel;
    }
    
    closeSettingsModal();
    showMessage('Device settings saved successfully!', 'success');
}

function resetDeviceSettings() {
    localStorage.removeItem('custom_device_id');
    localStorage.removeItem('custom_device_model');
    CONFIG.deviceId = CONFIG.autoDeviceId;
    CONFIG.deviceModel = CONFIG.autoDeviceModel;
    
    document.getElementById('custom-device-id').value = '';
    document.getElementById('custom-device-model').value = '';
    
    closeSettingsModal();
    showMessage('Device settings reset to auto-detected values!', 'info');
}

function setLoading(isLoading, buttonElement, originalContent) {
    if (isLoading) {
        buttonElement.disabled = true;
        // Store original content if not passed explicitly (first call)
        if (!buttonElement.dataset.originalContent) {
            buttonElement.dataset.originalContent = buttonElement.innerHTML;
        }
        buttonElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    } else {
        buttonElement.disabled = false;
        // Restore original content
        if (buttonElement.dataset.originalContent) {
            buttonElement.innerHTML = buttonElement.dataset.originalContent;
        } else {
            buttonElement.textContent = originalContent; // Fallback
        }
    }
}

// Event Handlers
async function handleLogin(e) {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    setLoading(true, loginBtn, 'Login');

    try {
        // Call Electron API via IPC
        const result = await window.electronAPI.login(
            username, 
            password, 
            CONFIG.deviceId, 
            CONFIG.deviceModel
        );

        if (result.success) {
            // Success
            authToken = result.data.token;
            currentUsername = username;
            currentFullname = result.data.fullname;
            
            sessionStorage.setItem('authToken', authToken);
            sessionStorage.setItem('username', currentUsername);
            if (currentFullname) {
                sessionStorage.setItem('fullname', currentFullname);
            }
            
            // Encrypt password for auto re-login
            const encryptedPassword = await window.electronAPI.encryptPassword(password);
            
            // Save account for multi-account support (with encrypted password)
            saveAccount(username, currentFullname, authToken, encryptedPassword);
            
            loginForm.reset();
            showAttendanceSection();
            showMessage(`Welcome, ${currentFullname || username}!`, 'success');
        } else {
            throw new Error(result.error || 'Login failed');
        }
    } catch (error) {
        showMessage(error.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
        setLoading(false, loginBtn, 'Login');
    }
}

async function handleAttendance(e) {
    e.preventDefault();
    const code = attendanceForm['attendance-code'].value;

    if (!authToken) {
        showMessage('Session expired. Please login again.', 'error');
        handleLogout();
        return;
    }

    setLoading(true, submitAttendanceBtn, 'Submit Attendance');

    try {
        // Call Electron API via IPC
        let result = await window.electronAPI.recordAttendance(
            authToken,
            code,
            CONFIG.deviceId, 
            CONFIG.deviceModel
        );

        // Check if token expired and try auto re-login
        if (!result.success && isTokenExpiredError(result.error)) {
            showMessage('Session expired. Re-authenticating...', 'info');
            
            const reLoginResult = await autoReLogin(currentUsername);
            if (reLoginResult.success) {
                // Retry attendance with new token
                result = await window.electronAPI.recordAttendance(
                    reLoginResult.token,
                    code,
                    CONFIG.deviceId, 
                    CONFIG.deviceModel
                );
            } else {
                // Auto re-login failed, need manual login
                showMessage('Session expired. Please login again.', 'error');
                handleLogout();
                return;
            }
        }

        if (result.success) {
            // Save to history
            saveAttendanceHistory(code, result.data.classDetails);
            
            showMessage(result.data.message || 'Attendance recorded successfully!', 'success');
            attendanceForm.reset();
        } else {
            throw new Error(result.error || 'Failed to record attendance');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to record attendance. Please try again.', 'error');
    } finally {
        setLoading(false, submitAttendanceBtn, 'Submit Attendance');
    }
}

function handleLogout() {
    authToken = null;
    currentUsername = null;
    currentFullname = null;
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('fullname');
    
    // Check if there are saved accounts
    const savedAccounts = getSavedAccounts();
    if (savedAccounts.length > 0) {
        showAccountSelection();
    } else {
        showLoginSection();
    }
    
    showMessage('Logged out successfully.', 'info');
}

// Update notification handling
let updateInfo = null;

function initUpdateChecker() {
    // Listen for update notifications from main process
    window.electronAPI.onUpdateAvailable((info) => {
        updateInfo = info;
        showUpdateBanner(info);
    });
}

function showUpdateBanner(info) {
    const updateModal = document.getElementById('update-modal');
    const updateVersion = document.getElementById('update-version');
    const downloadBtn = document.getElementById('download-update-btn');
    const dismissBtn = document.getElementById('dismiss-update-btn');
    
    updateVersion.textContent = `Version ${info.version} is ready to download`;
    updateModal.classList.remove('hidden');
    
    downloadBtn.onclick = () => {
        window.electronAPI.openUpdateUrl(info.url);
        updateModal.classList.add('hidden');
    };
    
    dismissBtn.onclick = () => {
        updateModal.classList.add('hidden');
    };
    
    // Close modal when clicking outside
    updateModal.onclick = (e) => {
        if (e.target === updateModal) {
            updateModal.classList.add('hidden');
        }
    };
}

// Make functions globally accessible for inline event handlers
window.deleteAccount = deleteAccount;

// Start the app
init();
initUpdateChecker();
