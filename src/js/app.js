// Configuration
const CONFIG = {
    // Try direct API calls first (will work if you're on school WiFi and CORS allows it)
    loginUrl: "https://app.tarc.edu.my/MobileService/login.jsp",
    attendanceUrl: "https://app.tarc.edu.my/MobileService/services/AJAXAttendance.jsp",
    deviceId: getDeviceId(),
    deviceModel: getDeviceModel(),
    appVersion: "2.0.18"
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
    console.log(ua);
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
    const loginData = new URLSearchParams({
        username: username,
        password: password,
        deviceid: CONFIG.deviceId,
        devicemodel: CONFIG.deviceModel,
        appversion: CONFIG.appVersion
    });

    const fetchOptions = {
        method: "POST",
        mode: 'cors',
        credentials: 'omit',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: loginData.toString()
    };

    try {
        const response = await fetch(CONFIG.loginUrl, fetchOptions);
        console.log("Full response object:", response);
        console.log("Response ok:", response.ok);
        console.log("Response status:", response.status);
        console.log("Response type:", response.type);
        console.log("Response bodyUsed:", response.bodyUsed);
        
        const raw = await response.text();
        console.log("Raw response type:", typeof raw);
        console.log("Raw response length:", raw.length);
        console.log("Raw response (first 500 chars):", raw.substring(0, 500));
        console.log("Raw response (last 500 chars):", raw.substring(raw.length - 500));
        
        // Try to extract JSON - the original Node.js script used lastIndexOf
        const jsonStart = raw.lastIndexOf('{');
        console.log("JSON start position:", jsonStart);
        
        if (jsonStart === -1) {
            console.error("No JSON found. Full response:", raw);
            throw new Error("Server did not return JSON. Check Network tab Response.");
        }
        
        const jsonPart = raw.slice(jsonStart);
        console.log("Extracted JSON:", jsonPart);
        
        const data = JSON.parse(jsonPart);
        console.log("Parsed data:", data);

        if (data.msg === "success" && data.token) {
            return data.token;
        } else {
            throw new Error(data.msgdesc || data.msg || "Login failed");
        }
    } catch (error) {
        console.error("Login error:", error);
        if (error instanceof SyntaxError) {
            throw new Error("Failed to parse JSON from server");
        }
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error("Network error. Please check your connection.");
        }
        throw error;
    }
}

async function recordAttendance(token, attendanceCode) {
    const attendanceData = new URLSearchParams({
        act: "insert",
        fsigncd: attendanceCode,
        deviceid: CONFIG.deviceId,
        devicemodel: CONFIG.deviceModel
    });

    const fetchOptions = {
        method: "POST",
        headers: {
            'X-Auth': token,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: attendanceData.toString()
    };

    try {
        const response = await fetch(CONFIG.attendanceUrl, fetchOptions);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        
        if (data.msg === "success") {
            return { Message: data.msgdesc || "Attendance recorded successfully!" };
        } else {
            throw new Error(data.msgdesc || "Failed to record attendance");
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
