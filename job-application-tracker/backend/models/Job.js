const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['applied', 'interview', 'offer', 'rejected'],
        default: 'applied'
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    interviewDate: {
        type: Date
    },
    notes: {
        type: String
    },
    resume: {
        type: String 
    },
    contact: {
        type: String
    },
    source: {
        type: String
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Job', JobSchema);
