const logBox = document.getElementById("logBox");
const planBox = document.getElementById("planBox");
const progressBox = document.getElementById("progressBox");

logBox.addEventListener("click", function () { window.location.href = "FitnessTracker.html"; });
planBox.addEventListener("click", function () { window.location.href = "NutritionPlanner.html"; });
progressBox.addEventListener("click", function () { window.location.href = "ProgressCharts.html"; });

// ── LocalStorage helper ───────────────────────────────────────────────────────

function getWorkouts() {
    return JSON.parse(localStorage.getItem("workouts") || "[]");
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function getTodayStr() {
    return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function getWeekRange() {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon ...
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
}

// ── Populate dashboard ────────────────────────────────────────────────────────

function populateDashboard() {
    const workouts = getWorkouts();
    const todayStr  = getTodayStr();
    const { monday, sunday } = getWeekRange();

    // Summary cards
    document.getElementById("totalWorks").textContent = workouts.length;

    const thisWeekCount = workouts.filter(w => {
        const d = new Date(w.date);
        return d >= monday && d <= sunday;
    }).length;
    document.getElementById("totalProgress").textContent = thisWeekCount;

    // Today's activity
    const todaysWorkouts = workouts.filter(w => w.date === todayStr);
    const todaysSteps   = todaysWorkouts.reduce((sum, w) => sum + (Number(w.steps) || 0), 0);
    const todaysCals    = todaysWorkouts.reduce((sum, w) => sum + (Number(w.cal)   || 0), 0);
    const todaysMins    = todaysWorkouts.reduce((sum, w) => sum + (Number(w.min)   || 0), 0);

    document.getElementById("todaysSteps").textContent    = todaysSteps;
    document.getElementById("todaysCalories").textContent = todaysCals;
    document.getElementById("todaysMinutes").textContent  = todaysMins;

    // Recent workouts — last 3, newest first
    const container = document.getElementById("workHisContainer");
    const noWorkBox = document.querySelector(".recentWorkouts .noWorkBox");

    container.innerHTML = "";

    if (workouts.length === 0) {
        noWorkBox.style.display = "flex";
        return;
    }

    noWorkBox.style.display = "none";
    document.getElementById("viewAllWorkouts").style.display = "block";

    const recent = [...workouts].reverse().slice(0, 3);
    recent.forEach(w => {
        const card = document.createElement("div");
        card.className = "workBox";
        card.innerHTML = `
            <div style="display:flex;align-items:center;">
                <i class="fa-solid fa-person-running workBoxLogo"></i>
                <div class="workDetails">
                    <p style="font-weight:bolder;margin-bottom:0.2rem;">${w.type}</p>
                    <p style="margin-bottom:0.2rem;">
                        <span><i class="fa-regular fa-calendar"></i> ${w.date}</span>
                        <span><i class="fa-regular fa-clock"></i> ${w.time}</span>
                        <span>${w.min} min</span>
                        ${w.steps !== "" ? `<span>${w.steps} steps</span>` : ""}
                        ${w.cal   !== "" ? `<span>${w.cal} cal</span>`     : ""}
                    </p>
                    ${w.notes !== "" ? `<p style="margin-bottom:0;">${w.notes}</p>` : ""}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ── Init ──────────────────────────────────────────────────────────────────────

populateDashboard();