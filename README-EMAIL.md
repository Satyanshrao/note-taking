# Email Configuration Guide

## When You'll Receive Emails

### 1. **Email Verification** (On Signup)
   - Sent immediately after creating a new account
   - Contains a verification link
   - Click the link to verify your email address

### 2. **Password Reset** (When Requested)
   - Sent when you click "Forgot Password"
   - Contains a password reset link
   - Link expires in 1 hour

## How to Configure Email

### Option 1: Using Gmail (Recommended for Development)

1. **Enable 2-Step Verification** on your Google account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Notes App" or similar
   - Copy the 16-character password

3. **Create a `.env` file** in the project root:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   BASE_URL=http://localhost:3000
   ```

4. **Or edit `config/email.js`** directly:
   ```javascript
   user: 'your-email@gmail.com',
   pass: 'your-16-character-app-password'
   ```

### Option 2: Using Other Email Services

For Outlook, Yahoo, or custom SMTP, update the transporter in `config/email.js`:

```javascript
const transporter = nodemailer.createTransport({
    host: 'smtp.outlook.com', // or your SMTP server
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
```

## Testing

1. Restart your server after configuring email
2. Check the console - you should see:
   - ✅ "Email service is ready" if configured correctly
   - ❌ "Email service not configured" if not set up

3. Try the features:
   - Sign up for a new account → Should receive verification email
   - Click "Forgot Password" → Should receive reset email

## Troubleshooting

- **"Authentication failed"**: Make sure you're using an App Password, not your regular password
- **"Connection timeout"**: Check your internet connection and SMTP settings
- **No emails received**: Check spam folder, verify email configuration in console logs
- **Email service not configured**: The app will still work, but emails won't be sent

## Note

If email is not configured, the app will still function normally. You just won't receive verification or password reset emails. The app will log warnings but continue working.

