const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express  = require("express");
const mongoose = require("mongoose");
const axios    = require("axios");
const Workout  = require("./models/Workout");
const Reminder = require("./models/Reminder");

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

app.get("/", (req, res) => res.redirect("/Login.html"));
app.use(express.static("public"));

// ── Spoonacular routes ────────────────────────────────────────────────────────
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

// ── Strava OAuth ──────────────────────────────────────────────────────────────

// Step 1: Redirect user to Strava login page
app.get("/auth/strava", (req, res) => {
    const url = `https://www.strava.com/oauth/authorize`
        + `?client_id=${process.env.STRAVA_CLIENT_ID}`
        + `&response_type=code`
        + `&redirect_uri=${encodeURIComponent(process.env.STRAVA_REDIRECT_URI)}`
        + `&approval_prompt=force`
        + `&scope=activity:read_all`;
    res.redirect(url);
});

// Step 2: Strava redirects back here with a code
// Exchange code for access token, then redirect to FitnessTracker with token in URL
app.get("/auth/strava/callback", async (req, res) => {
    const code = req.query.code;

    if (!code) {
        // User denied access — redirect back with error flag
        return res.redirect("/FitnessTracker.html?strava=denied");
    }

    try {
        const response = await axios.post("https://www.strava.com/oauth/token", {
            client_id:     process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            code:          code,
            grant_type:    "authorization_code"
        });

        const accessToken = response.data.access_token;

        // Pass the token back to the frontend via URL param
        // (short-lived token, safe for this use case)
        res.redirect(`/FitnessTracker.html?strava=connected&token=${accessToken}`);

    } catch (err) {
        console.error("Strava OAuth error:", err.message);
        res.redirect("/FitnessTracker.html?strava=error");
    }
});

// Step 3: Frontend calls this to get the 5 latest Strava activities
app.get("/api/strava/activities", async (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.status(400).json({ error: "No token provided" });
    }

    try {
        const response = await axios.get(
            "https://www.strava.com/api/v3/athlete/activities?per_page=5",
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // Map Strava activity fields to our workout shape
        const activities = response.data.map(a => {
            // Convert seconds → minutes
            const min = Math.round(a.moving_time / 60);

            // Convert metres → km for display, steps estimated for runs/walks
            const distanceKm = (a.distance / 1000).toFixed(2);
            const steps = (a.type === "Run" || a.type === "Walk")
                ? Math.round(a.distance / 0.762)   // avg stride ~76.2 cm
                : null;

            // Strava start_date_local is "2026-06-01T08:30:00Z"
            const [datePart, timePart] = a.start_date_local.split("T");
            const time = timePart.slice(0, 5); // "HH:MM"

            return {
                stravaId:   a.id,
                type:       a.type,        // "Run", "Ride", "Walk", etc.
                date:       datePart,
                time:       time,
                min:        min,
                distanceKm: distanceKm,
                steps:      steps,
                cal:        a.calories || null,
                name:       a.name         // Strava activity name e.g. "Morning Run"
            };
        });

        res.json(activities);
    } catch (err) {
        console.error("Strava activities error:", err.message);
        res.status(500).json({ error: "Failed to fetch Strava activities" });
    }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));