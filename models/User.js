const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // Embed the profile data inside the user document!
    profile: {
        age:         { type: Number, default: 20 },
        weight:      { type: Number, default: 70 },
        height:      { type: Number, default: 175 },
        fitnessGoal: { type: String, default: "Weight Maintenance" }
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);