// Configuration
const CONFIG = {
    loginUrl: "/api/login",
    attendanceUrl: "/api/attendance",
    deviceId: getDeviceId(),
    deviceModel: getDeviceModel()
};

function getDeviceId() {
    let id = localStorage.getItem('device_id');
    if (!id) {
        // Generate a random UUID-like string
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
        localStorage.setItem('device_id', id);
    }
    return id;
}

function getDeviceModel() {
    const ua = navigator.userAgent;
    if (ua.includes("iPhone")) return "iPhone";
    if (ua.includes("iPad")) return "iPad";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("Macintosh")) return "Mac";
    if (ua.includes("Windows")) return "Windows PC";
    return "Web Browser";
}

// DOM Elements
const loginSection = document.getElementById('login-section');
const attendanceSection = document.getElementById('attendance-section');
const loginForm = document.getElementById('login-form');
const attendanceForm = document.getElementById('attendance-form');
const messageContainer = document.getElementById('message-container');
const displayUsername = document.getElementById('display-username');
const logoutBtn = document.getElementById('logout-btn');
const loginBtn = document.getElementById('login-btn');
const submitAttendanceBtn = document.getElementById('submit-attendance-btn');

// State
let authToken = sessionStorage.getItem('authToken');
let currentUsername = sessionStorage.getItem('username');

// Initialization
function init() {
    if (authToken && currentUsername) {
        showAttendanceSection();
    } else {
        showLoginSection();
    }

    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    attendanceForm.addEventListener('submit', handleAttendance);
    logoutBtn.addEventListener('click', handleLogout);
}

// UI Functions
function showMessage(message, type = 'info') {
    messageContainer.textContent = message;
    messageContainer.className = type; // 'success', 'error', or 'info'
    messageContainer.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageContainer.classList.add('hidden');
    }, 5000);
}

function showLoginSection() {
    loginSection.classList.remove('hidden');
    attendanceSection.classList.add('hidden');
    messageContainer.classList.add('hidden');
}

function showAttendanceSection() {
    loginSection.classList.add('hidden');
    attendanceSection.classList.remove('hidden');
    displayUsername.textContent = currentUsername;
    messageContainer.classList.add('hidden');
}

function setLoading(isLoading, buttonElement, originalText) {
    if (isLoading) {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Loading...';
    } else {
        buttonElement.disabled = false;
        buttonElement.textContent = originalText;
    }
}

// API Functions
async function login(username, password) {
    const loginData = {
        username: username,
        password: password,
        deviceid: CONFIG.deviceId,
        devicemodel: CONFIG.deviceModel
    };

    const fetchOptions = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    };

    try {
        const response = await fetch(CONFIG.loginUrl, fetchOptions);
        const data = await response.json();

        if (data.Status === "Success") {
            return data.Data.Auth_Token;
        } else {
            throw new Error(data.Data.Message || "Login failed");
        }
    } catch (error) {
        console.error("Login error:", error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error("Network error. Please check your connection.");
        }
        throw error;
    }
}

async function recordAttendance(token, attendanceCode) {
    const attendanceData = {
        fsigncd: attendanceCode,
        deviceid: CONFIG.deviceId,
        devicemodel: CONFIG.deviceModel
    };

    const fetchOptions = {
        method: "POST",
        headers: {
            'X-Auth': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(attendanceData)
    };

    try {
        const response = await fetch(CONFIG.attendanceUrl, fetchOptions);
        const data = await response.json();
        
        if (data.Status === "Success") {
            return data.Data;
        } else {
            throw new Error(data.Data.Message || "Failed to record attendance");
        }
    } catch (error) {
        console.error("Attendance error:", error);
        throw error;
    }
}

// Event Handlers
async function handleLogin(e) {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    setLoading(true, loginBtn, 'Login');

    try {
        const token = await login(username, password);
        
        // Success
        authToken = token;
        currentUsername = username;
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('username', username);
        
        loginForm.reset();
        showAttendanceSection();
        showMessage('Login successful!', 'success');
    } catch (error) {
        showMessage(error.message || 'Login failed. Please check your connection and credentials.', 'error');
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
        const result = await recordAttendance(authToken, code);
        console.log("Attendance result:", result);
        
        showMessage(result.Message || 'Attendance recorded successfully!', 'success');
        attendanceForm.reset();
    } catch (error) {
        showMessage(error.message || 'Failed to record attendance. Please try again.', 'error');
    } finally {
        setLoading(false, submitAttendanceBtn, 'Submit Attendance');
    }
}

function handleLogout() {
    authToken = null;
    currentUsername = null;
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
    showLoginSection();
    showMessage('Logged out successfully.', 'info');
}

// Start the app
init();
