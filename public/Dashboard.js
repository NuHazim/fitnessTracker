// ── Workout type → FontAwesome icon ──────────────────────────────────────────
// Derived from w.type at render time — nothing stored in DB.
function getWorkoutIcon(type) {
    const map = {
        "Running":           "fa-solid fa-person-running",
        "Walking":           "fa-solid fa-person-walking",
        "Cycling":           "fa-solid fa-person-biking",
        "Swimming":          "fa-solid fa-person-swimming",
        "Gym Workout":       "fa-solid fa-dumbbell",
        "Yoga":              "fa-solid fa-spa",
        "HIIT":              "fa-solid fa-bolt",
        "Cardio":            "fa-solid fa-heart-pulse",
        "Strength Training": "fa-solid fa-dumbbell",
        "Sports":            "fa-solid fa-basketball",
        "Other":             "fa-solid fa-shoe-prints",
        "Run":               "fa-solid fa-person-running",
        "Walk":              "fa-solid fa-person-walking",
        "Ride":              "fa-solid fa-person-biking",
        "Swim":              "fa-solid fa-person-swimming",
        "Workout":           "fa-solid fa-dumbbell",
        "Hike":              "fa-solid fa-person-hiking",
    };
    return map[type] || "fa-solid fa-shoe-prints";
}

// ── Shortcuts ────────────────────────────────────────────────────────────────
document.getElementById("logBox").addEventListener("click",      () => window.location.href = "FitnessTracker.html");
document.getElementById("planBox").addEventListener("click",     () => window.location.href = "NutritionPlanner.html");
document.getElementById("progressBox").addEventListener("click", () => window.location.href = "ProgressCharts.html");

// ── Current user ──────────────────────────────────────────────────────────────
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("activeUser")) || null;
    } catch {
        return null;
    }
}

function getCurrentUserId() {
    const user = getCurrentUser();
    return user ? user.email : "anonymous";
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function getTodayStr() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().split("T")[0];
}

function getWeekRange() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
}

// ── API fetchers ──────────────────────────────────────────────────────────────
async function fetchWorkouts(userId) {
    const res = await fetch(`/api/workouts?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error("Failed to fetch workouts");
    return res.json();
}

async function fetchFavorites(userId) {
    const res = await fetch(`/api/favorites/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error("Failed to fetch favorites");
    return res.json();
}

async function fetchReminders(userId) {
    const res = await fetch(`/api/reminders?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error("Failed to fetch reminders");
    return res.json();
}

// ── Populate dashboard ────────────────────────────────────────────────────────
async function populateDashboard() {
    const user = getCurrentUser();

    // ── Username greeting ─────────────────────────────
    const displayName = user ? user.name.split(" ")[0] : "User";
    document.getElementById("usernameBox").textContent = displayName;

    // ── Sidebar user info ─────────────────────────────
    if (user) {
        const sidebarUsername = document.getElementById("sidebarUsername");
        const sidebarEmail    = document.getElementById("sidebarEmail");
        if (sidebarUsername) sidebarUsername.textContent = user.name;
        if (sidebarEmail)    sidebarEmail.textContent    = user.email;
    }

    const userId = getCurrentUserId();

    // ── Fetch all data in parallel ────────────────────
    let workouts  = [];
    let favorites = [];
    let reminders = [];

    try {
        [workouts, favorites, reminders] = await Promise.all([
            fetchWorkouts(userId),
            fetchFavorites(userId),
            fetchReminders(userId)
        ]);
    } catch (err) {
        console.error("Dashboard fetch error:", err);
    }

    const todayStr          = getTodayStr();
    const { monday, sunday } = getWeekRange();

    // ── Summary cards ─────────────────────────────────

    // Total workouts
    document.getElementById("totalWorks").textContent = workouts.length;

    // Avg Duration (replaces "This Week")
    const totalMins = workouts.reduce((sum, w) => sum + (parseInt(w.min) || 0), 0);
    const avgDuration = workouts.length > 0 ? Math.round(totalMins / workouts.length) : 0;
    document.getElementById("totalProgress").textContent = avgDuration + " min";

    // Favourite meals
    document.getElementById("favMeals").textContent = favorites.length;

    // Active reminders
    const activeReminders = reminders.filter(r => r.enabled === true);
    document.getElementById("totalReminders").textContent = activeReminders.length;

    // ── Today's activity ──────────────────────────────
    const todaysWorkouts = workouts.filter(w => w.date === todayStr);
    document.getElementById("todaysSteps").textContent    = todaysWorkouts.reduce((s, w) => s + (parseInt(w.steps) || 0), 0);
    document.getElementById("todaysCalories").textContent = todaysWorkouts.reduce((s, w) => s + (parseInt(w.cal)   || 0), 0);
    document.getElementById("todaysMinutes").textContent  = todaysWorkouts.reduce((s, w) => s + (parseInt(w.min)   || 0), 0);

    // ── Recent workouts ───────────────────────────────
    const container = document.getElementById("workHisContainer");
    const noWorkBox = document.querySelector(".recentWorkouts .noWorkBox");
    const viewAll   = document.getElementById("viewAllWorkouts");

    container.innerHTML = "";

    if (workouts.length === 0) {
        noWorkBox.style.display = "flex";
        viewAll.style.display   = "none";
        return;
    }

    noWorkBox.style.display = "none";
    viewAll.style.display   = "block";

    // API already returns sorted by createdAt desc, take first 3
    workouts.slice(0, 3).forEach(w => {
        const card = document.createElement("div");
        card.className = "workBox";
        card.innerHTML = `
            <div style="display:flex;align-items:center;">
                <i class="${getWorkoutIcon(w.type)} workBoxLogo"></i>
                <div class="workDetails">
                    <p style="font-weight:bolder;margin-bottom:0.2rem;">${w.type}</p>
                    <p style="margin-bottom:0.2rem;">
                        <span><i class="fa-regular fa-calendar"></i> ${w.date}</span>
                        <span><i class="fa-regular fa-clock"></i> ${w.time}</span>
                        <span>${w.min} min</span>
                        ${w.steps ? `<span>${w.steps} steps</span>` : ""}
                        ${w.cal   ? `<span>${w.cal} cal</span>`     : ""}
                    </p>
                    ${w.notes ? `<p style="margin-bottom:0;">${w.notes}</p>` : ""}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ── Init ──────────────────────────────────────────────────────────────────────
populateDashboard();