const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    type:   { type: String, required: true },
    date:   { type: String, required: true },
    time:   { type: String, required: true },
    min:    { type: Number, required: true },
    steps:  { type: Number, default: null },
    cal:    { type: Number, default: null },
    notes:  { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Workout", workoutSchema);