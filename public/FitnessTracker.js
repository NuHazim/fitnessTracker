// ── DOM refs ──────────────────────────────────────────────────────────────────
const workForm             = document.getElementById("workForm");
const cancelButton         = document.getElementById("cancelButton");
const templateWorkBox      = document.getElementById("templateWorkBox");

const workType             = document.getElementById("workType");
const workDate             = document.getElementById("workDate");
const workTime             = document.getElementById("workTime");
const workMin              = document.getElementById("workMin");
const workSteps            = document.getElementById("workSteps");
const workCal              = document.getElementById("workCal");
const workNotes            = document.getElementById("workNotes");

const workHisContainer     = document.getElementById("workHisContainer");

const totalWorks           = document.getElementById("totalWorks");
const totalMins            = document.getElementById("totalMins");
const totalSteps           = document.getElementById("totalSteps");
const totalCals            = document.getElementById("totalCals");
const noWorkBox            = document.getElementById("noWorkBox");

const updateWorkButton     = document.getElementById("updateWorkButton");
const saveWorkButton       = document.getElementById("saveWorkButton");
const connectStravaButton  = document.getElementById("connectStravaButton");
const importStravaButton   = document.getElementById("importStravaButton");
const stravaWorkoutContainer = document.getElementById("stravaWorkoutContainer");

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
        // Strava type aliases
        "Run":               "fa-solid fa-person-running",
        "Walk":              "fa-solid fa-person-walking",
        "Ride":              "fa-solid fa-person-biking",
        "Swim":              "fa-solid fa-person-swimming",
        "Workout":           "fa-solid fa-dumbbell",
        "Hike":              "fa-solid fa-person-hiking",
    };
    return map[type] || "fa-solid fa-shoe-prints";
}

// ── User identity ─────────────────────────────────────────────────────────────
function getCurrentUserId() {
    const activeUser = JSON.parse(localStorage.getItem("activeUser") || "{}");
    return activeUser.email || "anonymous";
}

// ── Strava token ──────────────────────────────────────────────────────────────
function getStravaToken() { return sessionStorage.getItem("strava_token") || null; }
function setStravaToken(token) { sessionStorage.setItem("strava_token", token); }

// ── Handle Strava redirect on page load ───────────────────────────────────────
(function handleStravaRedirect() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("strava");
    const token  = params.get("token");

    if (status === "connected" && token) {
        setStravaToken(token);
        connectStravaButton.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connected`;
        connectStravaButton.disabled  = true;
        importStravaButton.style.display = "block";
        showToast("Strava connected successfully!");
        window.history.replaceState({}, document.title, "/FitnessTracker.html");
    } else if (status === "denied") {
        showToast("Strava connection was cancelled.", "error");
        window.history.replaceState({}, document.title, "/FitnessTracker.html");
    } else if (status === "error") {
        showToast("Failed to connect Strava. Try again.", "error");
        window.history.replaceState({}, document.title, "/FitnessTracker.html");
    }

    if (getStravaToken()) {
        connectStravaButton.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connected`;
        connectStravaButton.disabled  = true;
        importStravaButton.style.display = "block";
    }
})();

// ── API helpers ───────────────────────────────────────────────────────────────
const API_BASE = "/api/workouts";

async function apiGetWorkouts() {
    const res = await fetch(`${API_BASE}?userId=${encodeURIComponent(getCurrentUserId())}`);
    if (!res.ok) throw new Error("Failed to fetch workouts");
    return res.json();
}

async function apiCreateWorkout(data) {
    const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: getCurrentUserId(), ...data })
    });
    if (!res.ok) throw new Error("Failed to save workout");
    return res.json();
}

async function apiUpdateWorkout(id, data) {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update workout");
    return res.json();
}

async function apiDeleteWorkout(id) {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete workout");
    return res.json();
}

// ── Build a DOM card from a workout object ────────────────────────────────────
function buildWorkBox(data) {
    const clone = templateWorkBox.content.cloneNode(true);
    const id    = data._id || data.id;

    // ── Swap icon based on workout type ──
    const iconEl = clone.querySelector(".workBoxLogo");
    iconEl.className = `${getWorkoutIcon(data.type)} workBoxLogo`;

    clone.querySelector("#workoutName").textContent = data.type;
    clone.querySelector("#dateWork").innerHTML  = `<i class="fa-regular fa-calendar"></i> ${data.date}`;
    clone.querySelector("#timeWork").innerHTML  = `<i class="fa-regular fa-clock"></i> ${data.time}`;
    clone.querySelector("#minWork").textContent = data.min + " min";

    if (data.steps != null && data.steps !== "") {
        clone.querySelector("#stepsWork").textContent = data.steps + " steps";
    }
    if (data.cal != null && data.cal !== "") {
        clone.querySelector("#calWork").textContent = data.cal + " cal";
    }
    if (data.notes != null && data.notes !== "") {
        clone.querySelector("#notesWork").textContent = data.notes;
    }

    const box = clone.querySelector(".workBox");
    box.dataset.id = id;

    return clone;
}

// ── Render all workouts from API ──────────────────────────────────────────────
async function renderAll() {
    workHisContainer.innerHTML = "";

    try {
        const workouts = await apiGetWorkouts();

        if (workouts.length === 0) {
            noWorkBox.style.display = "flex";
        } else {
            noWorkBox.style.display = "none";
            workouts.forEach(data => workHisContainer.appendChild(buildWorkBox(data)));
        }

        updateTotals();
    } catch (err) {
        console.error(err);
        showToast("Could not load workouts. Is the server running?", "error");
    }
}

// ── Totals ────────────────────────────────────────────────────────────────────
function updateTotals() {
    const boxes = workHisContainer.querySelectorAll(".workBox");
    totalWorks.textContent = boxes.length;

    let mins = 0, steps = 0, cals = 0;
    boxes.forEach(box => {
        mins  += parseInt(box.querySelector("#minWork").textContent)   || 0;
        const stepsText = box.querySelector("#stepsWork").textContent;
        const calText   = box.querySelector("#calWork").textContent;
        if (stepsText) steps += parseInt(stepsText) || 0;
        if (calText)   cals  += parseInt(calText)   || 0;
    });

    totalMins.textContent  = mins;
    totalSteps.textContent = steps;
    totalCals.textContent  = cals;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = "success") {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
        position: "fixed", bottom: "1.5rem", right: "1.5rem",
        background: type === "error" ? "#ef4444" : "#4f46e5",
        color: "#fff", padding: "0.6rem 1.1rem", borderRadius: "10px",
        fontSize: "0.875rem", fontWeight: "600", zIndex: "9999",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)", opacity: "0",
        transition: "opacity 0.2s"
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = "1"; });
    setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 3000);
}

// ── Log Workout / Log First Workout buttons ───────────────────────────────────
document.querySelector(".logWorkoutButton").addEventListener("click", function () {
    updateWorkButton.style.display = "none";
    saveWorkButton.style.display   = "block";
    workForm.reset();
});

document.querySelector(".logFirstWorkoutButton").addEventListener("click", function () {
    updateWorkButton.style.display = "none";
    saveWorkButton.style.display   = "block";
    workForm.reset();
});

// ── Save new workout ──────────────────────────────────────────────────────────
async function validateAndSubmit() {
    if (!workForm.checkValidity()) { workForm.reportValidity(); return; }

    const data = {
        type:  workType.value,
        date:  workDate.value,
        time:  workTime.value,
        min:   parseInt(workMin.value),
        steps: isNaN(workSteps.valueAsNumber) ? null : workSteps.valueAsNumber,
        cal:   isNaN(workCal.valueAsNumber)   ? null : workCal.valueAsNumber,
        notes: workNotes.value
    };

    try {
        saveWorkButton.disabled    = true;
        saveWorkButton.textContent = "Saving…";
        await apiCreateWorkout(data);
        await renderAll();
        cancelButton.click();
        workForm.reset();
        showToast("Workout saved!");
    } catch (err) {
        console.error(err);
        showToast("Failed to save workout.", "error");
    } finally {
        saveWorkButton.disabled    = false;
        saveWorkButton.textContent = "Save Workout";
    }
}

// ── Edit / Delete ─────────────────────────────────────────────────────────────
workHisContainer.addEventListener("click", async function (e) {

    if (e.target.classList.contains("deleteButton")) {
        const box = e.target.closest(".workBox");
        const id  = box.dataset.id;
        try {
            await apiDeleteWorkout(id);
            await renderAll();
            showToast("Workout deleted.");
        } catch (err) {
            console.error(err);
            showToast("Failed to delete workout.", "error");
        }
        return;
    }

    if (e.target.classList.contains("editButton")) {
        const box = e.target.closest(".workBox");
        const id  = box.dataset.id;

        const nameEl  = box.querySelector("#workoutName");
        const dateEl  = box.querySelector("#dateWork");
        const timeEl  = box.querySelector("#timeWork");
        const minEl   = box.querySelector("#minWork");
        const stepsEl = box.querySelector("#stepsWork");
        const calEl   = box.querySelector("#calWork");
        const notesEl = box.querySelector("#notesWork");

        document.querySelector(".logWorkoutButton").click();
        updateWorkButton.style.display = "block";
        saveWorkButton.style.display   = "none";

        workType.value  = nameEl  ? nameEl.textContent : "";
        workDate.value  = dateEl  ? dateEl.textContent.replace(/.*?(\d{4}-\d{2}-\d{2})/, "$1").trim() : "";
        workTime.value  = timeEl  ? timeEl.textContent.replace(/.*?(\d{2}:\d{2})/, "$1").trim() : "";
        workMin.value   = minEl   ? parseInt(minEl.textContent) : "";
        workSteps.value = stepsEl ? parseInt(stepsEl.textContent) || "" : "";
        workCal.value   = calEl   ? parseInt(calEl.textContent)  || "" : "";
        workNotes.value = notesEl ? notesEl.textContent : "";

        updateWorkButton.onclick = async function () {
            if (!workForm.checkValidity()) { workForm.reportValidity(); return; }

            const updated = {
                type:  workType.value,
                date:  workDate.value,
                time:  workTime.value,
                min:   parseInt(workMin.value),
                steps: isNaN(workSteps.valueAsNumber) ? null : workSteps.valueAsNumber,
                cal:   isNaN(workCal.valueAsNumber)   ? null : workCal.valueAsNumber,
                notes: workNotes.value
            };

            try {
                updateWorkButton.disabled    = true;
                updateWorkButton.textContent = "Saving…";
                await apiUpdateWorkout(id, updated);
                await renderAll();
                cancelButton.click();
                showToast("Workout updated!");
            } catch (err) {
                console.error(err);
                showToast("Failed to update workout.", "error");
            } finally {
                updateWorkButton.disabled    = false;
                updateWorkButton.textContent = "Update Workout";
            }
        };
    }
});

// ── Connect Strava ────────────────────────────────────────────────────────────
connectStravaButton.addEventListener("click", function () {
    window.location.href = "/auth/strava";
});

// ── Import from Strava ────────────────────────────────────────────────────────
importStravaButton.addEventListener("click", async function () {
    const token = getStravaToken();
    if (!token) { showToast("Please connect Strava first.", "error"); return; }

    stravaWorkoutContainer.innerHTML = `
        <div style="text-align:center; padding: 2rem; color: #6b7280;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem;"></i>
            <p style="margin-top:0.5rem;">Loading your Strava workouts…</p>
        </div>
    `;

    new bootstrap.Modal(document.getElementById("stravaModal")).show();

    try {
        const res = await fetch(`/api/strava/activities?token=${token}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const activities = await res.json();
        stravaWorkoutContainer.innerHTML = "";

        if (activities.length === 0) {
            stravaWorkoutContainer.innerHTML = `<p style="color:grey; text-align:center;">No recent activities found on Strava.</p>`;
            return;
        }

        activities.forEach(activity => {
            const iconClass = getWorkoutIcon(activity.type);
            const box = document.createElement("div");
            box.className = "stravaWorkoutBox";
            box.innerHTML = `
                <div class="stravaWorkoutTop">
                    <div class="stravaWorkoutType">
                        <i class="${iconClass}" style="color:#4f46e5;"></i>
                        ${activity.type}
                        <span style="font-size:0.8rem; font-weight:400; color:#6b7280; margin-left:0.3rem;">
                            — ${activity.name}
                        </span>
                    </div>
                    <div>${activity.distanceKm} km</div>
                </div>
                <div class="stravaWorkoutMeta">
                    ${activity.date} • ${activity.time} •
                    ${activity.min} mins
                    ${activity.cal ? `• ${activity.cal} cal` : ""}
                </div>
            `;

            box.addEventListener("click", function () {
                const typeMap = {
                    "Run": "Running", "Ride": "Cycling", "Walk": "Walking",
                    "Swim": "Swimming", "Workout": "Gym Workout",
                    "Yoga": "Yoga", "Hike": "Walking"
                };
                workType.value  = typeMap[activity.type] || "Other";
                workDate.value  = activity.date;
                workTime.value  = activity.time;
                workMin.value   = activity.min;
                workCal.value   = activity.cal   || "";
                workSteps.value = activity.steps || "";

                bootstrap.Modal.getInstance(document.getElementById("stravaModal")).hide();

                updateWorkButton.style.display = "none";
                saveWorkButton.style.display   = "block";
                new bootstrap.Modal(document.getElementById("exampleModal")).show();
            });

            stravaWorkoutContainer.appendChild(box);
        });

    } catch (err) {
        console.error(err);
        stravaWorkoutContainer.innerHTML = `
            <p style="color:#ef4444; text-align:center;">
                Failed to load Strava activities. Your session may have expired — try reconnecting.
            </p>
        `;
    }
});

// ── Init ──────────────────────────────────────────────────────────────────────
renderAll();