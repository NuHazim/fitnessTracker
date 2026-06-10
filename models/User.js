const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Import encryption provider

const userSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
        age:         { type: Number, default: 20 },
        weight:      { type: Number, default: 70 },
        height:      { type: Number, default: 175 },
        fitnessGoal: { type: String, default: "Weight Maintenance" }
    }
}, { timestamps: true });

// ── AUTOMATIC MIDDLEWARE INTERCEPTOR BEFORE SAVE ───────────────────
userSchema.pre('save', async function() {
    // Only execute hashing sequence if the password string was modified or is brand new
    if (!this.isModified('password')) return;
    
    // Hash the password securely without using 'next()'
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);