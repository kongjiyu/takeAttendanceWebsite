const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function login(username, password) {
    const url = 'https://app.tarc.edu.my/MobileService/login.jsp';
    
    const loginData = new URLSearchParams({
        username: username,
        password: password,
        deviceid: '12345678-1234-1234-1234-123456789012',
        devicemodel: 'Test Device',
        appversion: '2.0.18'
    });
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'ionic://localhost'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: loginData.toString()
        });

        const raw = await response.text();
        console.log('\n=== LOGIN RESPONSE (RAW) ===');
        console.log(raw);
        
        // Parse JSON from response (server may return HTML before JSON)
        const jsonStart = raw.lastIndexOf('{');
        if (jsonStart === -1) {
            throw new Error("Login response does not contain JSON");
        }
        
        const jsonPart = raw.slice(jsonStart);
        const data = JSON.parse(jsonPart);
        
        console.log('\n=== LOGIN RESPONSE (PARSED) ===');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.msg === 'success' && data.token) {
            return data.token;
        } else {
            throw new Error(data.msgdesc || 'Login failed');
        }
    } catch (error) {
        throw new Error(`Login failed: ${error.message}`);
    }
}

async function getTodayList(token) {
    const url = 'https://app.tarc.edu.my/MobileService/services/AJAXAttendance.jsp?act=get-today-list';
    
    const headers = {
        'X-Auth': token,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    try {
        console.log('\n=== CALLING GET-TODAY-LIST API ===');
        console.log('URL:', url);
        console.log('Headers:', headers);
        
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        const text = await response.text();
        console.log('\n=== TODAY LIST RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Response:');
        console.log(text);
        
        // Try to parse as JSON
        try {
            const data = JSON.parse(text);
            console.log('\n=== PARSED JSON ===');
            console.log(JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('(Not valid JSON)');
        }
        
        return text;
    } catch (error) {
        throw new Error(`Failed to get today list: ${error.message}`);
    }
}

async function main() {
    try {
        console.log('=== TARUMT API TESTER ===\n');
        
        const username = await question('Enter Student ID: ');
        const password = await question('Enter Password: ');
        
        console.log('\nLogging in...');
        const token = await login(username, password);
        console.log('\n✓ Login successful!');
        console.log('Token:', token);
        
        console.log('\nFetching today\'s attendance list...');
        await getTodayList(token);
        
        console.log('\n✓ Test completed!');
        
    } catch (error) {
        console.error('\n✗ Error:', error.message);
    } finally {
        rl.close();
    }
}

main();
