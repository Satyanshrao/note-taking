const mongoose = require('mongoose')

const noteSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    category: {
        type: String,
        default: 'general'
    },
    tags: [{
        type: String
    }],
    color: {
        type: String,
        default: '#1f2937' // Default dark gray
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isShared: {
        type: Boolean,
        default: false
    },
    sharedWith: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        permission: {
            type: String,
            enum: ['read', 'write'],
            default: 'read'
        }
    }],
    attachments: [{
        filename: String,
        path: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    reminders: [{
        date: Date,
        message: String,
        notified: {
            type: Boolean,
            default: false
        }
    }],
    versionHistory: [{
        content: String,
        title: String,
        editedAt: {
            type: Date,
            default: Date.now
        },
        editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    }],
    comments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("note", noteSchema);
