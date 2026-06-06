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

// ── User identity ─────────────────────────────────────────────────────────────
function getCurrentUserId() {
    return localStorage.getItem("hft_user_email") || "anonymous";
}

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

// ── Build a DOM card from a workout data object ───────────────────────────────

function buildWorkBox(data) {
    const clone = templateWorkBox.content.cloneNode(true);

    // Mongoose returns _id, not id — handle both just in case
    const id = data._id || data.id;

    clone.querySelector("#workoutName").textContent = data.type;
    clone.querySelector("#dateWork").innerHTML  = `<i class="fa-regular fa-calendar"></i> ${data.date}`;
    clone.querySelector("#timeWork").innerHTML  = `<i class="fa-regular fa-clock"></i> ${data.time}`;
    clone.querySelector("#minWork").textContent = data.min + " min";

    if (data.steps !== "" && data.steps != null) {
        clone.querySelector("#stepsWork").textContent = data.steps + " steps";
    }
    if (data.cal !== "" && data.cal != null) {
        clone.querySelector("#calWork").textContent = data.cal + " cal";
    }
    if (data.notes !== "" && data.notes != null) {
        clone.querySelector("#notesWork").textContent = data.notes;
    }

    // Store the MongoDB _id on the card
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
            workouts.forEach(data => {
                workHisContainer.appendChild(buildWorkBox(data));
            });
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

// ── Simple toast notification ─────────────────────────────────────────────────

function showToast(msg, type = "success") {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        background: type === "error" ? "#ef4444" : "#4f46e5",
        color: "#fff",
        padding: "0.6rem 1.1rem",
        borderRadius: "10px",
        fontSize: "0.875rem",
        fontWeight: "600",
        zIndex: "9999",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        opacity: "0",
        transition: "opacity 0.2s"
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = "1"; });
    setTimeout(() => {
        t.style.opacity = "0";
        setTimeout(() => t.remove(), 300);
    }, 3000);
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
    if (!workForm.checkValidity()) {
        workForm.reportValidity();
        return;
    }

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
        saveWorkButton.disabled     = true;
        saveWorkButton.textContent  = "Saving…";

        await apiCreateWorkout(data);
        await renderAll();

        cancelButton.click();
        workForm.reset();
        showToast("Workout saved!");
    } catch (err) {
        console.error(err);
        showToast("Failed to save workout.", "error");
    } finally {
        saveWorkButton.disabled     = false;
        saveWorkButton.textContent  = "Save Workout";
    }
}

// ── Edit / Delete ─────────────────────────────────────────────────────────────

workHisContainer.addEventListener("click", async function (e) {

    // ── DELETE ────────────────────────────────────────────────────────────────
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

    // ── EDIT ──────────────────────────────────────────────────────────────────
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

        // Open modal pre-filled
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
            if (!workForm.checkValidity()) {
                workForm.reportValidity();
                return;
            }

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

// ── Fake Strava Workouts ──────────────────────────────────────────────────────

const stravaWorkouts = [
    { type: "Running", date: "2026-05-05", time: "18:30", min: 45, distance: 5,   calories: 320 },
    { type: "Walking", date: "2026-05-04", time: "08:15", min: 30, distance: 2.5, calories: 120 },
    { type: "Cycling", date: "2026-05-03", time: "17:00", min: 60, distance: 12,  calories: 450 }
];

// ── Connect Strava ────────────────────────────────────────────────────────────

connectStravaButton.addEventListener("click", function () {
    connectStravaButton.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connected`;
    connectStravaButton.disabled  = true;
    importStravaButton.style.display = "block";
});

// ── Open Import Modal ─────────────────────────────────────────────────────────

importStravaButton.addEventListener("click", function () {
    stravaWorkoutContainer.innerHTML = "";

    stravaWorkouts.forEach(workout => {
        const estimatedSteps = Math.round(
            (workout.distance * 1000) / (workout.type === "Running" ? 1 : 0.75)
        );

        const box = document.createElement("div");
        box.className = "stravaWorkoutBox";
        box.innerHTML = `
            <div class="stravaWorkoutTop">
                <div class="stravaWorkoutType">
                    <i class="fa-brands fa-strava" style="color:orange;"></i>
                    ${workout.type}
                </div>
                <div>${workout.distance} km</div>
            </div>
            <div class="stravaWorkoutMeta">
                ${workout.date} • ${workout.time} •
                ${workout.min} mins •
                ${workout.calories} cal
            </div>
        `;

        box.addEventListener("click", function () {
            workType.value  = workout.type;
            workDate.value  = workout.date;
            workTime.value  = workout.time;
            workMin.value   = workout.min;
            workCal.value   = workout.calories;
            workSteps.value = estimatedSteps;

            bootstrap.Modal.getInstance(document.getElementById("stravaModal")).hide();
            new bootstrap.Modal(document.getElementById("exampleModal")).show();
        });

        stravaWorkoutContainer.appendChild(box);
    });

    new bootstrap.Modal(document.getElementById("stravaModal")).show();
});

// ── Init ──────────────────────────────────────────────────────────────────────
renderAll();