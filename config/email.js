const nodemailer = require('nodemailer');

// Load environment variables if .env file exists
require('dotenv').config();

// Email configuration
// IMPORTANT: You need to configure your email credentials below or use environment variables
// For Gmail: Use an "App Password" (not your regular password)
// Get App Password: https://myaccount.google.com/apppasswords
// Enable "Less secure app access" or use 2-Step Verification with App Password

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'example-@gmail.com',
        pass: process.env.EMAIL_PASS || 'password'
    }
});

// Test email configuration on startup
transporter.verify(function (error, success) {
    if (error) {
        console.log('❌ Email service not configured. Emails will not be sent.');
        console.log('💡 To enable emails, configure EMAIL_USER and EMAIL_PASS in config/email.js or .env file');
    } else {
        console.log('✅ Email service is ready');
    }
});

// Send verification email
async function sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER || 'sarthakyadav730@gmail.com',
        to: email,
        subject: 'Verify Your Email',
        html: `
            <h2>Email Verification</h2>
            <p>Please click the link below to verify your email:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
            <p>This link will expire in 24 hours.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
}

// Send password reset email
async function sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER || 'sarthakyadav730@gmail.com',
        to: email,
        subject: 'Password Reset',
        html: `
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};

