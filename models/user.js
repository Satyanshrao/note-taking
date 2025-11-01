const mongoose = require('mongoose')

mongoose.connect(`mongodb://127.0.0.1:27017/authtestapp`)

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String,
    age: Number,
    profilePicture: {
        type: String,
        default: ''
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorSecret: String,
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'dark'
    },
    settings: {
        notifications: {
            type: Boolean,
            default: true
        },
        emailUpdates: {
            type: Boolean,
            default: false
        }
    },
    sessions: [{
        token: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        device: String,
        ip: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("user", userSchema);
