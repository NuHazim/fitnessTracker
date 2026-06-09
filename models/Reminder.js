const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    userId:  { type: String, required: true, index: true },
    type:    { type: String, enum: ['workout','meal','water','custom'], default: 'custom' },
    time:    { type: String, required: true },   // "HH:MM"
    title:   { type: String, required: true },
    message: { type: String, required: true },
    days:    { type: [String], default: [] },     // ["Mon","Tue",...]
    enabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);