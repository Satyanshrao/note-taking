const cookieParser = require('cookie-parser');
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userModel = require("./models/user")
const noteModel = require("./models/note")
const activityModel = require("./models/activity")

const { profileUpload } = require('./config/upload');
const { markdownToHtml } = require('./utils/markdown');
const { generateNotePDF } = require('./utils/pdfExport');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./config/email');

const app = express();
app.set("view engine", "ejs")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))

app.use(cookieParser())

// Middleware to check authentication
const isLoggedIn = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return next();
        }
        const decoded = jwt.verify(token, "shhhhhh");
        const user = await userModel.findOne({ email: decoded.email });
        if (user) {
            req.user = user;
        }
        next();
    } catch (err) {
        next();
    }
}

// Middleware to require authentication
const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect('/');
        }
        const decoded = jwt.verify(token, "shhhhhh");
        const user = await userModel.findOne({ email: decoded.email });
        if (!user) {
            return res.redirect('/');
        }
        req.user = user;
        next();
    } catch (err) {
        res.redirect('/');
    }
}

// Home page - shows login/signup if not logged in, dashboard if logged in
app.get('/', isLoggedIn, (req, res) => {
    if (req.user) {
        return res.render('dashboard', { user: req.user });
    }
    res.render('index', { message: null, error: null });
})

// Sign up route
app.post('/create', async (req, res) => {
    let { username, email, password, age } = req.body

    try {
        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.render('index', { 
                message: null, 
                error: 'Email already exists. Please login instead.' 
            });
        }

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
                    // Generate verification token
                    const verificationToken = crypto.randomBytes(32).toString('hex');
                    
                    const userDetails = await userModel.create({
                        username,
                        email,
                        password: hash,
                        age,
                        emailVerificationToken: verificationToken
                    })

                    // Send verification email (optional - won't break if email not configured)
                    try {
                        await sendVerificationEmail(email, verificationToken);
                        console.log('Verification email sent to:', email);
                    } catch (emailError) {
                        console.log('Email service not configured - skipping verification email');
                    }

                    let token = jwt.sign({ email }, "shhhhhh")
                    res.cookie("token", token)
                    res.redirect('/dashboard')
                } catch (error) {
                    res.render('index', { 
                        message: null, 
                        error: 'Error creating account. Please try again.' 
                    });
                }
            })
        })
    } catch (error) {
        res.render('index', { 
            message: null, 
            error: 'Error creating account. Please try again.' 
        });
    }
})

// Login route
app.post('/login', async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.body.email })
        if (!user) {
            return res.render('index', { 
                message: null, 
                error: 'Invalid email or password' 
            });
        }

        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if (result) {
                let token = jwt.sign({ email: user.email }, "shhhhhh")
                res.cookie("token", token)
                res.redirect('/dashboard')
            } else {
                res.render('index', { 
                    message: null, 
                    error: 'Invalid email or password' 
                });
            }
        })
    } catch (error) {
        res.render('index', { 
            message: null, 
            error: 'Login failed. Please try again.' 
        });
    }
})

// Dashboard route (protected)
app.get('/dashboard', isLoggedIn, async (req, res) => {
    if (!req.user) {
        return res.redirect('/');
    }
    res.render('dashboard', { user: req.user });
})

// Logout route
app.get('/logout', (req, res) => {
    res.cookie("token", "")
    res.redirect("/")
})

// Notes routes (protected)
// Get all notes for logged in user with search, filter, and category
app.get('/notes', requireAuth, async (req, res) => {
    try {
        const { search, category, tag, sort, priority, archived } = req.query;
        let query = { userId: req.user._id };
        
        // Search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Category filter
        if (category && category !== 'all') {
            query.category = category;
        }
        
        // Tag filter
        if (tag) {
            query.tags = { $in: [tag] };
        }
        
        // Priority filter
        if (priority && priority !== 'all') {
            query.priority = priority;
        }
        
        // Archived filter
        if (archived === 'true') {
            query.isArchived = true;
        } else {
            query.isArchived = false;
        }
        
        // Sorting
        let sortOption = { updatedAt: -1 };
        if (sort === 'title') sortOption = { title: 1 };
        if (sort === 'created') sortOption = { createdAt: -1 };
        if (sort === 'priority') sortOption = { priority: -1, updatedAt: -1 };
        
        const notes = await noteModel.find(query).sort(sortOption);
        
        // Get unique categories and tags for filter dropdowns
        const allNotes = await noteModel.find({ userId: req.user._id });
        const categories = [...new Set(allNotes.map(n => n.category || 'general'))];
        const tags = [...new Set(allNotes.flatMap(n => n.tags || []))];
        
        res.render('notes', { 
            user: req.user, 
            notes: notes, 
            categories,
            tags,
            error: req.query.error || null, 
            message: req.query.message || null,
            searchQuery: search || '',
            selectedCategory: category || 'all',
            selectedTag: tag || '',
            selectedSort: sort || 'updated',
            selectedPriority: priority || 'all',
            showArchived: archived === 'true'
        });
    } catch (error) {
        res.render('notes', { user: req.user, notes: [], categories: [], tags: [], error: 'Error loading notes', message: null });
    }
})

// Create new note with enhanced features
app.post('/notes/create', requireAuth, async (req, res) => {
    try {
        const { title, content, category, tags, color, priority, isPinned } = req.body;
        if (!title || !content) {
            const allNotes = await noteModel.find({ userId: req.user._id });
            const categories = [...new Set(allNotes.map(n => n.category || 'general'))];
            const tags = [...new Set(allNotes.flatMap(n => n.tags || []))];
            return res.render('notes', { 
                user: req.user, 
                notes: allNotes, 
                categories,
                tags,
                error: 'Title and content are required', 
                message: null 
            });
        }
        
        // Process tags (comma-separated string to array)
        const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
        
        const note = await noteModel.create({
            title,
            content,
            userId: req.user._id,
            category: category || 'general',
            tags: tagsArray,
            color: color || '#1f2937',
            priority: priority || 'medium',
            isPinned: isPinned === 'on'
        });
        
        // Log activity
        await activityModel.create({
            userId: req.user._id,
            action: 'note_created',
            noteId: note._id
        });
        
        res.redirect('/notes?message=Note created successfully!');
    } catch (error) {
        res.redirect('/notes?error=Error creating note');
    }
})

// Update note with enhanced features
app.post('/notes/edit/:id', requireAuth, async (req, res) => {
    try {
        const { title, content, category, tags, color, priority, isPinned } = req.body;
        const noteId = req.params.id;
        
        const note = await noteModel.findOne({ _id: noteId, userId: req.user._id });
        if (!note) {
            return res.redirect('/notes?error=Note not found');
        }

        if (!title || !content) {
            return res.redirect('/notes?error=Title and content are required');
        }

        // Save to version history before updating
        note.versionHistory.push({
            content: note.content,
            title: note.title,
            editedBy: req.user._id
        });

        const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];

        await noteModel.findByIdAndUpdate(noteId, {
            title,
            content,
            category: category || 'general',
            tags: tagsArray,
            color: color || '#1f2937',
            priority: priority || 'medium',
            isPinned: isPinned === 'on',
            updatedAt: Date.now(),
            versionHistory: note.versionHistory
        });

        await activityModel.create({
            userId: req.user._id,
            action: 'note_updated',
            noteId: noteId
        });

        res.redirect('/notes?message=Note updated successfully!');
    } catch (error) {
        res.redirect('/notes?error=Error updating note');
    }
})

// Pin/Unpin note
app.post('/notes/pin/:id', requireAuth, async (req, res) => {
    try {
        const note = await noteModel.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) return res.redirect('/notes?error=Note not found');
        note.isPinned = !note.isPinned;
        await note.save();
        res.redirect('/notes?message=Note ' + (note.isPinned ? 'pinned' : 'unpinned'));
    } catch (error) {
        res.redirect('/notes?error=Error updating note');
    }
})

// Archive/Unarchive note
app.post('/notes/archive/:id', requireAuth, async (req, res) => {
    try {
        const note = await noteModel.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) return res.redirect('/notes?error=Note not found');
        note.isArchived = !note.isArchived;
        await note.save();
        res.redirect('/notes?message=Note ' + (note.isArchived ? 'archived' : 'unarchived'));
    } catch (error) {
        res.redirect('/notes?error=Error updating note');
    }
})

// Delete note
app.post('/notes/delete/:id', requireAuth, async (req, res) => {
    try {
        const noteId = req.params.id;
        
        // Verify note belongs to user
        const note = await noteModel.findOne({ _id: noteId, userId: req.user._id });
        if (!note) {
            const notes = await noteModel.find({ userId: req.user._id }).sort({ updatedAt: -1 });
            return res.render('notes', { 
                user: req.user, 
                notes: notes, 
                error: 'Note not found', 
                message: null 
            });
        }

        await noteModel.findByIdAndDelete(noteId);
        
        await activityModel.create({
            userId: req.user._id,
            action: 'note_deleted',
            noteId: noteId
        });
        
        res.redirect('/notes?message=Note deleted successfully!');
    } catch (error) {
        res.redirect('/notes?error=Error deleting note');
    }
})

// Export note as PDF
app.get('/notes/export/:id/pdf', requireAuth, async (req, res) => {
    try {
        const note = await noteModel.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) return res.redirect('/notes?error=Note not found');
        
        const outputPath = path.join(__dirname, 'temp', `note-${note._id}.pdf`);
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        
        await generateNotePDF(note, outputPath);
        res.download(outputPath, `${note.title}-${Date.now()}.pdf`, (err) => {
            if (!err) fs.unlinkSync(outputPath);
        });
    } catch (error) {
        res.redirect('/notes?error=Error exporting note');
    }
})

// Export note as JSON
app.get('/notes/export/:id/json', requireAuth, async (req, res) => {
    try {
        const note = await noteModel.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) return res.redirect('/notes?error=Note not found');
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${note.title}.json"`);
        res.json(note);
    } catch (error) {
        res.redirect('/notes?error=Error exporting note');
    }
})

// Export note as TXT
app.get('/notes/export/:id/txt', requireAuth, async (req, res) => {
    try {
        const note = await noteModel.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) return res.redirect('/notes?error=Note not found');
        
        const text = `Title: ${note.title}\n\n${note.content}\n\nCreated: ${note.createdAt}\nUpdated: ${note.updatedAt}`;
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${note.title}.txt"`);
        res.send(text);
    } catch (error) {
        res.redirect('/notes?error=Error exporting note');
    }
})

// Profile routes
app.get('/profile', requireAuth, (req, res) => {
    res.render('profile', { user: req.user, error: null, message: null });
})

app.post('/profile/update', requireAuth, async (req, res) => {
    try {
        const { username, email, age } = req.body;
        req.user.username = username;
        req.user.email = email;
        req.user.age = age;
        await req.user.save();
        res.render('profile', { user: req.user, error: null, message: 'Profile updated successfully!' });
    } catch (error) {
        res.render('profile', { user: req.user, error: 'Error updating profile', message: null });
    }
})

app.post('/profile/picture', requireAuth, profileUpload, async (req, res) => {
    try {
        if (req.file) {
            // Delete old picture if exists
            if (req.user.profilePicture) {
                const oldPath = path.join(__dirname, 'public', req.user.profilePicture);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            req.user.profilePicture = '/uploads/profiles/' + req.file.filename;
            await req.user.save();
            res.render('profile', { user: req.user, error: null, message: 'Profile picture updated!' });
        } else {
            res.render('profile', { user: req.user, error: 'No file uploaded', message: null });
        }
    } catch (error) {
        res.render('profile', { user: req.user, error: 'Error uploading picture', message: null });
    }
})

app.post('/profile/password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const match = await bcrypt.compare(currentPassword, req.user.password);
        if (!match) {
            return res.render('profile', { user: req.user, error: 'Current password is incorrect', message: null });
        }
        const hash = await bcrypt.hash(newPassword, 10);
        req.user.password = hash;
        await req.user.save();
        res.render('profile', { user: req.user, error: null, message: 'Password changed successfully!' });
    } catch (error) {
        res.render('profile', { user: req.user, error: 'Error changing password', message: null });
    }
})

// Settings route
app.get('/settings', requireAuth, (req, res) => {
    res.render('settings', { user: req.user, error: null, message: null });
})

app.post('/settings', requireAuth, async (req, res) => {
    try {
        const { theme, notifications, emailUpdates } = req.body;
        req.user.theme = theme || 'dark';
        req.user.settings.notifications = notifications === 'on';
        req.user.settings.emailUpdates = emailUpdates === 'on';
        await req.user.save();
        res.render('settings', { user: req.user, error: null, message: 'Settings saved!' });
    } catch (error) {
        res.render('settings', { user: req.user, error: 'Error saving settings', message: null });
    }
})

// Statistics route
app.get('/statistics', requireAuth, async (req, res) => {
    try {
        const notes = await noteModel.find({ userId: req.user._id });
        const totalNotes = notes.length;
        const totalWords = notes.reduce((sum, note) => sum + (note.content.split(' ').length || 0), 0);
        const categories = {};
        notes.forEach(note => {
            const cat = note.category || 'general';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        const pinnedNotes = notes.filter(n => n.isPinned).length;
        const archivedNotes = notes.filter(n => n.isArchived).length;
        const recentActivity = await activityModel.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10);
        
        res.render('statistics', {
            user: req.user,
            totalNotes,
            totalWords,
            categories,
            pinnedNotes,
            archivedNotes,
            recentActivity
        });
    } catch (error) {
        res.render('statistics', { user: req.user, error: 'Error loading statistics' });
    }
})

// Email verification route
app.get('/verify-email', async (req, res) => {
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
})

// Password reset routes
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { error: null, message: null });
})

app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.render('forgot-password', { error: 'Email not found', message: null });
        }
        const token = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000;
        await user.save();
        
        try {
            await sendPasswordResetEmail(email, token);
            res.render('forgot-password', { error: null, message: 'Password reset link sent to your email!' });
        } catch (emailError) {
            res.render('forgot-password', { error: 'Email service not configured', message: null });
        }
    } catch (error) {
        res.render('forgot-password', { error: 'Error processing request', message: null });
    }
})

app.get('/reset-password', async (req, res) => {
    try {
        const { token } = req.query;
        const user = await userModel.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.render('index', { message: null, error: 'Invalid or expired reset link' });
        }
        res.render('reset-password', { token, error: null });
    } catch (error) {
        res.render('index', { message: null, error: 'Error loading reset page' });
    }
})

app.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await userModel.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.render('reset-password', { token, error: 'Invalid or expired token' });
        }
        const hash = await bcrypt.hash(password, 10);
        user.password = hash;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        res.render('index', { message: 'Password reset successfully!', error: null });
    } catch (error) {
        res.render('reset-password', { token: req.body.token, error: 'Error resetting password' });
    }
})

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000')
})
