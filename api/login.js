export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            Status: 'Fail', 
            Data: { 
                Title: 'Method Not Allowed',
                Message: 'Only POST requests are allowed'
            }
        });
    }

    const { username, password, deviceid, devicemodel } = req.body;

    // Check whether username and password is empty
    if (!username || !password) {
        return res.status(400).json({
            Status: 'Fail',
            Data: {
                Title: 'Empty username or password',
                Message: 'Please provide valid username and password.',
                Requested_Time: new Date().toISOString()
            }
        });
    }

    // Set device info if not provided
    const finalDeviceId = deviceid || generateDeviceId();
    const finalDeviceModel = devicemodel || 'iPhone 19,2';

    // Prepare login data
    const loginData = new URLSearchParams({
        username: username,
        password: password,
        deviceid: finalDeviceId,
        devicemodel: finalDeviceModel,
        appversion: '2.0.18'
    });

    try {
        // Call school API
        const response = await fetch('https://app.tarc.edu.my/MobileService/login.jsp', {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'ionic://localhost'
            },
            body: loginData.toString()
        });

        const raw = await response.text();

        // Parse JSON from response
        const jsonStart = raw.lastIndexOf('{');
        if (jsonStart === -1) {
            return res.status(500).json({
                Status: 'Fail',
                Data: {
                    Title: 'Server Error',
                    Message: 'Invalid response from authentication server',
                    Requested_Time: new Date().toISOString()
                }
            });
        }

        const jsonPart = raw.slice(jsonStart);
        const data = JSON.parse(jsonPart);

        // Check if login was successful
        if (data.msg !== 'success') {
            return res.status(401).json({
                Status: 'Fail',
                Data: {
                    Title: 'Login Failed',
                    Message: data.msgdesc || 'Your username or password is incorrect.',
                    Requested_Time: new Date().toISOString()
                }
            });
        }

        // Return success response
        return res.status(200).json({
            Status: 'Success',
            Data: {
                Title: 'Login Successfully',
                Message: 'Welcome, ' + (data.fullname || username),
                Student_Email: data.email || '',
                Student_Name: data.fullname || '',
                Student_ID: data.userid || username,
                Auth_Token: data.token,
                Device_ID: finalDeviceId,
                Device: finalDeviceModel,
                Requested_Time: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            Status: 'Fail',
            Data: {
                Title: 'Server Error',
                Message: 'Failed to connect to authentication server',
                Requested_Time: new Date().toISOString()
            }
        });
    }
}

function generateDeviceId() {
    const randomHex = (length) => {
        return Array.from({ length }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('').toUpperCase();
    };
    
    return `${randomHex(8)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`;
}
