const mongoose = require('../../config/databaseAuth/cachedb');
const Schema = mongoose.Schema

const UserScheme = new Schema({
    email: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['candidat', 'administrator']
    },
    activationCode: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        required: true
    },
    created: {
        type: Date,
        required: true
    },
    firstTimelogged: {
        type: Boolean,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true
    },
    candidatureNumber: {
        type: String
    }
})

const User = mongoose.model('User', UserScheme)
module.exports = User