const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const userModel = require('../models/user');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');

// Sign up route with email verification
router.post('/create', async (req, res) => {
    let { username, email, password, age } = req.body;

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.render('index', {
                message: null,
                error: 'Email already exists. Please login instead.'
            });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                return res.render('index', {
                    message: null,
                    error: 'Error creating account. Please try again.'
                });
            }
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) {
                    return res.render('index', {
                        message: null,
                        error: 'Error creating account. Please try again.'
                    });
                }
                try {
                    const userDetails = await userModel.create({
                        username,
                        email,
                        password: hash,
                        age,
                        emailVerificationToken: verificationToken
                    });

                    // Send verification email (optional - can skip if email not configured)
                    try {
                        await sendVerificationEmail(email, verificationToken);
                    } catch (emailError) {
                        console.log('Email service not configured, skipping verification email');
                    }

                    let token = jwt.sign({ email }, "shhhhhh");
                    res.cookie("token", token);
                    res.render('index', {
                        message: 'Account created! Please check your email to verify (if configured).',
                        error: null
                    });
                } catch (error) {
                    res.render('index', {
                        message: null,
                        error: 'Error creating account. Please try again.'
                    });
                }
            });
        });
    } catch (error) {
        res.render('index', {
            message: null,
            error: 'Error creating account. Please try again.'
        });
    }
});

// Email verification
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        const user = await userModel.findOne({ emailVerificationToken: token });
        
        if (!user) {
            return res.render('index', {
                message: null,
                error: 'Invalid or expired verification link.'
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();

        res.render('index', {
            message: 'Email verified successfully! You can now login.',
            error: null
        });
    } catch (error) {
        res.render('index', {
            message: null,
            error: 'Error verifying email.'
        });
    }
});

// Forgot password
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { error: null, message: null });
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });
        
        if (!user) {
            return res.render('forgot-password', {
                error: 'Email not found.',
                message: null
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        try {
            await sendPasswordResetEmail(email, resetToken);
            res.render('forgot-password', {
                error: null,
                message: 'Password reset link sent to your email!'
            });
        } catch (emailError) {
            res.render('forgot-password', {
                error: 'Email service not configured. Contact administrator.',
                message: null
            });
        }
    } catch (error) {
        res.render('forgot-password', {
            error: 'Error processing request.',
            message: null
        });
    }
});

// Reset password
router.get('/reset-password', async (req, res) => {
    try {
        const { token } = req.query;
        const user = await userModel.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.render('index', {
                message: null,
                error: 'Invalid or expired password reset link.'
            });
        }

        res.render('reset-password', { token, error: null });
    } catch (error) {
        res.render('index', {
            message: null,
            error: 'Error loading reset page.'
        });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await userModel.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.render('reset-password', {
                token,
                error: 'Invalid or expired reset token.'
            });
        }

        const hash = await bcrypt.hash(password, 10);
        user.password = hash;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.render('index', {
            message: 'Password reset successfully! You can now login.',
            error: null
        });
    } catch (error) {
        res.render('reset-password', {
            token: req.body.token,
            error: 'Error resetting password.'
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.body.email });
        if (!user) {
            return res.render('index', {
                message: null,
                error: 'Invalid email or password'
            });
        }

        bcrypt.compare(req.body.password, user.password, async (err, result) => {
            if (result) {
                // Check if 2FA is enabled
                if (user.twoFactorEnabled) {
                    req.session = { userId: user._id.toString(), needs2FA: true };
                    return res.redirect('/2fa-verify');
                }

                let token = jwt.sign({ email: user.email }, "shhhhhh");
                
                // Track session
                user.sessions.push({
                    token,
                    device: req.headers['user-agent'] || 'Unknown',
                    ip: req.ip || 'Unknown'
                });
                await user.save();

                res.cookie("token", token);
                res.redirect('/dashboard');
            } else {
                res.render('index', {
                    message: null,
                    error: 'Invalid email or password'
                });
            }
        });
    } catch (error) {
        res.render('index', {
            message: null,
            error: 'Login failed. Please try again.'
        });
    }
});

// 2FA Setup
router.get('/2fa-setup', async (req, res) => {
    try {
        const user = req.user;
        if (user.twoFactorEnabled) {
            return res.redirect('/dashboard');
        }

        const secret = speakeasy.generateSecret({
            name: `Notes App (${user.email})`
        });

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.render('2fa-setup', {
            user,
            secret: secret.base32,
            qrCodeUrl
        });
    } catch (error) {
        res.redirect('/dashboard');
    }
});

router.post('/2fa-enable', async (req, res) => {
    try {
        const { token } = req.body;
        const user = req.user;
        
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (verified) {
            user.twoFactorEnabled = true;
            await user.save();
            res.redirect('/dashboard?message=2FA enabled successfully');
        } else {
            res.render('2fa-setup', {
                user,
                error: 'Invalid token. Please try again.'
            });
        }
    } catch (error) {
        res.redirect('/dashboard');
    }
});

module.exports = router;

