# Student Attendance Website

A web application for students to login and record attendance via TARC's attendance system.

## Features

- 🔐 Secure login with student credentials
- ✅ Quick attendance recording
- 📱 Mobile-friendly responsive design
- 🔒 Session management with sessionStorage
- 🌐 Works from any device on school WiFi

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Vercel Serverless Functions
- **Hosting**: Vercel (Free)

## Project Structure

```
/
├── index.html          # Main page
├── css/
│   └── style.css      # Styling
├── js/
│   └── app.js         # Frontend logic
├── api/
│   ├── login.js       # Login serverless function
│   └── attendance.js  # Attendance serverless function
├── vercel.json        # Vercel configuration
└── README.md          # This file
```

## Local Development

1. **Install Vercel CLI** (optional, for local testing):
   ```bash
   npm install -g vercel
   ```

2. **Run locally**:
   ```bash
   vercel dev
   ```
   This will start a local server at `http://localhost:3000`

3. **Or use any static server**:
   ```bash
   # Using Python
   python3 -m http.server 5500
   
   # Using Node.js
   npx serve
   ```

## Deploy to Vercel (FREE)

### Option 1: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - First time: Answer project setup questions
   - Subsequent deploys: Just run `vercel` again

4. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Using Vercel Dashboard (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Done!** Your site will be live at `https://your-project.vercel.app`

## Usage

1. Open the website
2. Enter your student ID and password
3. Click "Login"
4. Enter the attendance code provided by your lecturer
5. Click "Submit Attendance"

## Important Notes

⚠️ **School WiFi Required**: You must be connected to the school WiFi for the attendance system to work.

⚠️ **No Credentials Stored**: This website does not store or save your credentials. Your password is only sent to the authentication server.

## Security Features

- ✅ Session tokens stored in `sessionStorage` (cleared on browser close)
- ✅ No credentials stored in code
- ✅ HTTPS encryption (provided by Vercel)
- ✅ CORS protection
- ✅ Server-side API calls (credentials never exposed in browser)

## API Endpoints

### POST `/api/login`
Login with student credentials.

**Request Body**:
```json
{
  "username": "student_id",
  "password": "password",
  "deviceid": "device_id",
  "devicemodel": "device_model"
}
```

**Response**:
```json
{
  "Status": "Success",
  "Data": {
    "Title": "Login Successfully",
    "Message": "Welcome, Student Name",
    "Auth_Token": "token_here",
    "Student_ID": "student_id",
    "Student_Name": "name",
    "Student_Email": "email"
  }
}
```

### POST `/api/attendance`
Record attendance with code.

**Headers**:
```
X-Auth: your_auth_token
```

**Request Body**:
```json
{
  "fsigncd": "attendance_code",
  "deviceid": "device_id",
  "devicemodel": "device_model"
}
```

**Response**:
```json
{
  "Status": "Success",
  "Data": {
    "Title": "Attendance Recorded",
    "Message": "Attendance recorded successfully!"
  }
}
```

## Troubleshooting

**Q: Login fails with "Network error"**
- Make sure you're connected to school WiFi
- Check if the school's servers are accessible

**Q: "Session expired" message**
- Your session has timed out
- Click logout and login again

**Q: Attendance code not accepted**
- Verify the code with your lecturer
- Make sure you entered it correctly

## License

This project is for educational purposes only.

## Support

For issues or questions, please contact the repository owner.
