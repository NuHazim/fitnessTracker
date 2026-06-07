
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express  = require("express");
const mongoose = require("mongoose");
const Workout  = require("./models/Workout");
const Reminder = require('./models/Reminder');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MongoDB connection ────────────────────────────────────────────────────────
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected — database: healthFitnessTracker"))
    .catch(err => {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1);
    });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());

// Redirect root to Login.html
app.get("/", (req, res) => res.redirect("/Login.html"));

app.use(express.static("public"));

// ── Spoonacular recipe routes (unchanged) ─────────────────────────────────────
app.get("/api/recipes", async (req, res) => {
    const query  = req.query.query  || "healthy";
    const number = req.query.number || 6;
    const offset = req.query.offset || 0;

    const url = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=${number}&offset=${offset}&addRecipeInformation=true&addRecipeNutrition=true&apiKey=${process.env.SPOONACULAR_API_KEY}`;

    const response = await fetch(url);
    const data     = await response.json();
    res.json(data);
});

app.get("/api/recipes/:id", async (req, res) => {
    const url = `https://api.spoonacular.com/recipes/${req.params.id}/information?apiKey=${process.env.SPOONACULAR_API_KEY}`;
    const response = await fetch(url);
    const data     = await response.json();
    res.json(data);
});

// ── Workout routes ────────────────────────────────────────────────────────────

// GET /api/workouts?userId=<string>
app.get("/api/workouts", async (req, res) => {
    try {
        const userId   = req.query.userId || "anonymous";
        const workouts = await Workout.find({ userId }).sort({ createdAt: -1 });
        res.json(workouts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch workouts" });
    }
});

// POST /api/workouts
app.post("/api/workouts", async (req, res) => {
    try {
        const { userId = "anonymous", type, date, time, min, steps, cal, notes } = req.body;

        if (!type || !date || !time || !min) {
            return res.status(400).json({ error: "type, date, time and min are required" });
        }

        const workout = await Workout.create({ userId, type, date, time, min, steps, cal, notes });
        res.status(201).json(workout);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save workout" });
    }
});

// PUT /api/workouts/:id
app.put("/api/workouts/:id", async (req, res) => {
    try {
        const { type, date, time, min, steps, cal, notes } = req.body;

        const workout = await Workout.findByIdAndUpdate(
            req.params.id,
            { type, date, time, min, steps, cal, notes },
            { new: true, runValidators: true }
        );

        if (!workout) return res.status(404).json({ error: "Workout not found" });
        res.json(workout);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update workout" });
    }
});

// DELETE /api/workouts/:id
app.delete("/api/workouts/:id", async (req, res) => {
    try {
        const workout = await Workout.findByIdAndDelete(req.params.id);
        if (!workout) return res.status(404).json({ error: "Workout not found" });
        res.json({ message: "Workout deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete workout" });
    }
});

// ── Reminder routes ───────────────────────────────────────────────────────────

app.get('/api/reminders', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId is required' });
        const list = await Reminder.find({ userId }).sort({ createdAt: -1 });
        res.json(list.map(r => ({ ...r.toObject(), id: r._id.toString() })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to load reminders' });
    }
});

app.post('/api/reminders', async (req, res) => {
    try {
        const { userId, type, time, title, message, days, enabled } = req.body;
        if (!userId || !title || !message || !time)
            return res.status(400).json({ error: 'userId, title, message and time are required' });
        const r = await Reminder.create({ userId, type, time, title, message, days, enabled });
        res.status(201).json({ ...r.toObject(), id: r._id.toString() });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create reminder' });
    }
});

app.put('/api/reminders/:id', async (req, res) => {
    try {
        const { userId, ...fields } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId is required' });
        const r = await Reminder.findOneAndUpdate(
            { _id: req.params.id, userId },
            fields,
            { new: true, runValidators: true }
        );
        if (!r) return res.status(404).json({ error: 'Reminder not found' });
        res.json({ ...r.toObject(), id: r._id.toString() });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update reminder' });
    }
});

app.delete('/api/reminders/:id', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId is required' });
        const r = await Reminder.findOneAndDelete({ _id: req.params.id, userId });
        if (!r) return res.status(404).json({ error: 'Reminder not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete reminder' });
    }
});
// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));