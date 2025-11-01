const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../public/uploads');
const profileDir = path.join(__dirname, '../public/uploads/profiles');
const noteAttachmentsDir = path.join(__dirname, '../public/uploads/attachments');

[uploadDir, profileDir, noteAttachmentsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Profile picture upload
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const profileUpload = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Note attachment upload
const attachmentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, noteAttachmentsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'attachment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const attachmentUpload = multer({
    storage: attachmentStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

module.exports = {
    profileUpload: profileUpload.single('profilePicture'),
    attachmentUpload: attachmentUpload.array('attachments', 5) // Max 5 files
};

