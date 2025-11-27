const fetch = require('node-fetch');

const CONFIG = {
    loginUrl: "https://app.tarc.edu.my/MobileService/login.jsp",
    attendanceUrl: "https://app.tarc.edu.my/MobileService/services/AJAXAttendance.jsp",
    appVersion: "2.0.18",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
};

async function login(username, password, deviceId, deviceModel) {
    const loginData = new URLSearchParams({
        username: username,
        password: password,
        deviceid: deviceId,
        devicemodel: deviceModel,
        appversion: CONFIG.appVersion
    });

    const fetchOptions = {
        method: "POST",
        headers: {
            'User-Agent': CONFIG.userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'ionic://localhost'
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
    const attendanceData = new URLSearchParams({
        act: "insert",
        fsigncd: attendanceCode,
        deviceid: deviceId,
        devicemodel: deviceModel
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
    const url = 'https://app.tarc.edu.my/MobileService/services/AJAXAttendance.jsp?act=get-today-list';

    const fetchOptions = {
        method: "GET",
        headers: {
            'X-Auth': token,
            'Content-Type': 'application/x-www-form-urlencoded'
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
