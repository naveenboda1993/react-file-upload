const mongoose = require('mongoose');

const SAPAuthSchema = new mongoose.Schema({
    access_token: {
        type: String,
        required: true
    },
    token_type: {
        type: String,
        required: true
    },
    expires_in: {
        type: Number,
        required: true
    },
    scope: {
        type: String,
        required: true
    },
    jti: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SAPAuth', SAPAuthSchema);