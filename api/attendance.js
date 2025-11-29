const fetch = require('node-fetch');
const crypto = require('crypto');
require('dotenv').config();

const CONFIG = {
    loginUrl: "https://app.tarc.edu.my/MobileService/studentLogin.jsp",
    attendanceUrl: "https://app.tarc.edu.my/MobileService/services/AJAXAttendance.jsp",
    appVersion: "2.0.19",
    userAgent: "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.39 Mobile Safari/537.36",
    appSecret: process.env.APP_SECRET || "3f8a7c12d9e54b88b6a2f4d915c3e7a1"
};

/**
 * Create HMAC-SHA-256 signature
 * @param {string} data - The data to sign (params + timestamp)
 * @param {string} secret - The secret key
 * @returns {string} Base64 encoded signature
 */
function createSignature(data, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    return hmac.digest('base64');
}

async function login(username, password, deviceId, deviceModel) {
    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create params object
    const params = {
        username: username,
        password: password,
        deviceid: deviceId,
        devicemodel: deviceModel,
        appversion: CONFIG.appVersion,
        fplatform: "ios"
    };
    
    // Create signature data: key=value&key=value|timestamp (not URL encoded)
    const paramsString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    const signatureData = paramsString + '|' + timestamp;
    const signature = createSignature(signatureData, CONFIG.appSecret);
    
    // Create URLSearchParams for the actual request body
    const loginData = new URLSearchParams(params);

    const fetchOptions = {
        method: "POST",
        headers: {
            'User-Agent': CONFIG.userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'ionic://localhost',
            'Referer': 'https://localhost/',
            'X-Signature': signature,
            'X-Timestamp': timestamp.toString()
        },
        body: loginData.toString()
    };

    try {
        const response = await fetch(CONFIG.loginUrl, fetchOptions);
        const raw = await response.text();

        // Parse JSON from response (server may return HTML before JSON)
        const jsonStart = raw.lastIndexOf('{');
        if (jsonStart === -1) {
            throw new Error("Login response does not contain JSON");
        }
        
        const jsonPart = raw.slice(jsonStart);
        const data = JSON.parse(jsonPart);

        if (data.msg === "success" && data.token) {
            return {
                token: data.token,
                email: data.email || '',
                fullname: data.fullname || '',
                userid: data.userid || username
            };
        } else {
            throw new Error(data.msgdesc || "Login failed");
        }
    } catch (error) {
        console.error("Login error:", error);
        throw new Error(error.message || "Failed to connect to server");
    }
}

async function recordAttendance(token, attendanceCode, deviceId, deviceModel) {
    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create params object
    const params = {
        act: "insert",
        fsigncd: attendanceCode,
        deviceid: deviceId,
        devicemodel: deviceModel
    };
    
    // Create signature data: key=value&key=value|timestamp
    const paramsString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    const signatureData = paramsString + '|' + timestamp;
    const signature = createSignature(signatureData, CONFIG.appSecret);
    
    const attendanceData = new URLSearchParams(params);

    const fetchOptions = {
        method: "POST",
        headers: {
            'X-Auth': token,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Signature': signature,
            'X-Timestamp': timestamp.toString()
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
            return {
                message: data.msgdesc || "Attendance recorded successfully!",
                classDetails: data.class || null,
                fullResponse: data
            };
        } else {
            throw new Error(data.msgdesc || "Failed to record attendance");
        }
    } catch (error) {
        console.error("Attendance error:", error);
        throw new Error(error.message || "Failed to record attendance");
    }
}

async function getTodayList(token) {
    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    
    // For GET request, the params are in the query string
    const params = {
        act: "get-today-list"
    };
    
    // Create signature data
    const paramsString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    const signatureData = paramsString + '|' + timestamp;
    const signature = createSignature(signatureData, CONFIG.appSecret);
    
    const url = 'https://app.tarc.edu.my/MobileService/services/AJAXAttendance.jsp?act=get-today-list';

    const fetchOptions = {
        method: "GET",
        headers: {
            'X-Auth': token,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Signature': signature,
            'X-Timestamp': timestamp.toString()
        }
    };

    try {
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        
        const data = await response.json();

        if (data.list) {
            return {
                classes: data.list,
                message: data.msgdesc || ''
            };
        } else {
            return {
                classes: [],
                message: data.msgdesc || 'No classes today'
            };
        }
    } catch (error) {
        console.error("Get today list error:", error);
        throw new Error(error.message || "Failed to get today's classes");
    }
}

module.exports = {
    login,
    recordAttendance,
    getTodayList
};
