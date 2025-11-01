const mongoose = require('mongoose')

const activitySchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'note'
    },
    details: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("activity", activitySchema);

