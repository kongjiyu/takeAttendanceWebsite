export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Auth');

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

    const token = req.headers['x-auth'];
    const { fsigncd, deviceid, devicemodel } = req.body;

    // Check whether token is empty
    if (!token) {
        return res.status(401).json({
            Status: 'Fail',
            Data: {
                Title: 'Missing Authentication Token',
                Message: 'Please login first to record attendance.',
                Requested_Time: new Date().toISOString()
            }
        });
    }

    // Check whether attendance code is empty
    if (!fsigncd) {
        return res.status(400).json({
            Status: 'Fail',
            Data: {
                Title: 'Empty Attendance Code',
                Message: 'Please provide an attendance code.',
                Requested_Time: new Date().toISOString()
            }
        });
    }

    // Set device info if not provided
    const finalDeviceId = deviceid || generateDeviceId();
    const finalDeviceModel = devicemodel || 'iPhone 19,2';

    // Prepare attendance data
    const attendanceData = new URLSearchParams({
        act: 'insert',
        fsigncd: fsigncd,
        deviceid: finalDeviceId,
        devicemodel: finalDeviceModel
    });

    try {
        // Call school API
        const response = await fetch('https://app.tarc.edu.my/MobileService/services/AJAXAttendance.jsp', {
            method: 'POST',
            headers: {
                'X-Auth': token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: attendanceData.toString()
        });

        if (!response.ok) {
            return res.status(500).json({
                Status: 'Fail',
                Data: {
                    Title: 'Server Error',
                    Message: 'Failed to connect to attendance server',
                    Requested_Time: new Date().toISOString()
                }
            });
        }

        const data = await response.json();

        // Check if attendance was successful
        if (data.msg !== 'success') {
            return res.status(400).json({
                Status: 'Fail',
                Data: {
                    Title: 'Attendance Failed',
                    Message: data.msgdesc || 'Failed to record attendance.',
                    Requested_Time: new Date().toISOString()
                }
            });
        }

        // Return success response
        return res.status(200).json({
            Status: 'Success',
            Data: {
                Title: 'Attendance Recorded',
                Message: data.msgdesc || 'Attendance recorded successfully!',
                Requested_Time: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Attendance error:', error);
        return res.status(500).json({
            Status: 'Fail',
            Data: {
                Title: 'Server Error',
                Message: 'Failed to record attendance',
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
