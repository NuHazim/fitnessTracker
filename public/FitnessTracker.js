const workForm=document.getElementById("workForm");
const cancelButton=document.getElementById("cancelButton");
const templateWorkBox=document.getElementById("templateWorkBox");

const workType= document.getElementById("workType");
const workDate= document.getElementById("workDate");
const workTime= document.getElementById("workTime");
const workMin= document.getElementById("workMin");
const workSteps=document.getElementById("workSteps");
const workCal=document.getElementById("workCal");
const workNotes=document.getElementById("workNotes");

const workHisContainer=document.getElementById("workHisContainer");

const totalWorks=document.getElementById("totalWorks");
const totalMins=document.getElementById("totalMins");
const totalSteps=document.getElementById("totalSteps");
const totalCals=document.getElementById("totalCals");
const noWorkBox=document.getElementById("noWorkBox");

const updateWorkButton=document.getElementById("updateWorkButton");
const saveWorkButton=document.getElementById("saveWorkButton");
const connectStravaButton=document.getElementById("connectStravaButton");
const importStravaButton=document.getElementById("importStravaButton");
const stravaWorkoutContainer=document.getElementById("stravaWorkoutContainer");
// ── LocalStorage helpers ──────────────────────────────────────────────────────

function getWorkouts() {
    return JSON.parse(localStorage.getItem("workouts") || "[]");
}

function saveWorkouts(workouts) {
    localStorage.setItem("workouts", JSON.stringify(workouts));
}

// ── Build a DOM card from a workout data object ───────────────────────────────

function buildWorkBox(data) {
    const clone = templateWorkBox.content.cloneNode(true);

    clone.querySelector("#workoutName").textContent = data.type;
    clone.querySelector("#dateWork").innerHTML = `<i class="fa-regular fa-calendar"></i> ${data.date}`;
    clone.querySelector("#timeWork").innerHTML = `<i class="fa-regular fa-clock"></i> ${data.time}`;
    clone.querySelector("#minWork").textContent = data.min + " min";

    if (data.steps !== "") {
        clone.querySelector("#stepsWork").textContent = data.steps + " steps";
    }
    if (data.cal !== "") {
        clone.querySelector("#calWork").textContent = data.cal + " cal";
    }
    if (data.notes !== "") {
        clone.querySelector("#notesWork").textContent = data.notes;
    }

    // Store the index so edit/delete know which localStorage entry to touch
    const box = clone.querySelector(".workBox");
    box.dataset.index = data.index;

    return clone;
}

// ── Render all workouts from localStorage on page load ────────────────────────

function renderAll() {
    workHisContainer.innerHTML = "";
    const workouts = getWorkouts();

    if (workouts.length === 0) {
        noWorkBox.style.display = "flex";
    } else {
        noWorkBox.style.display = "none";
        workouts.forEach((data, i) => {
            data.index = i;
            workHisContainer.appendChild(buildWorkBox(data));
        });
    }

    updateTotals();
}

// ── Totals ────────────────────────────────────────────────────────────────────

function updateTotals() {
    const boxes = workHisContainer.querySelectorAll(".workBox");
    totalWorks.textContent = boxes.length;

    let mins = 0, steps = 0, cals = 0;
    boxes.forEach(box => {
        mins  += parseInt(box.querySelector("#minWork").textContent)  || 0;
        const stepsText = box.querySelector("#stepsWork").textContent;
        const calText   = box.querySelector("#calWork").textContent;
        if (stepsText !== "") steps += parseInt(stepsText) || 0;
        if (calText   !== "") cals  += parseInt(calText)   || 0;
    });

    totalMins.textContent  = mins;
    totalSteps.textContent = steps;
    totalCals.textContent  = cals;
}

// ── Log Workout button / Log First Workout button ─────────────────────────────

document.querySelector(".logWorkoutButton").addEventListener("click", function () {
    updateWorkButton.style.display = "none";
    saveWorkButton.style.display = "block";
    workForm.reset();
});

document.querySelector(".logFirstWorkoutButton").addEventListener("click", function () {
    updateWorkButton.style.display = "none";
    saveWorkButton.style.display = "block";
    workForm.reset();
});

// ── Save new workout ──────────────────────────────────────────────────────────

function validateAndSubmit() {
    if (workForm.checkValidity()) {
        const data = {
            type:  workType.value,
            date:  workDate.value,
            time:  workTime.value,
            min:   workMin.value,
            steps: isNaN(workSteps.valueAsNumber) ? "" : workSteps.valueAsNumber,
            cal:   isNaN(workCal.valueAsNumber)   ? "" : workCal.valueAsNumber,
            notes: workNotes.value
        };

        const workouts = getWorkouts();
        workouts.push(data);
        saveWorkouts(workouts);

        renderAll();
        cancelButton.click();
        workForm.reset();
    } else {
        workForm.reportValidity();
    }
}

// ── Edit / Delete ─────────────────────────────────────────────────────────────

workHisContainer.addEventListener("click", function (e) {

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (e.target.classList.contains("deleteButton")) {
        const box = e.target.closest(".workBox");
        const idx = parseInt(box.dataset.index);

        const workouts = getWorkouts();
        workouts.splice(idx, 1);
        saveWorkouts(workouts);

        renderAll();
        return;
    }

    // ── EDIT ──────────────────────────────────────────────────────────────────
    if (e.target.classList.contains("editButton")) {
        const box = e.target.closest(".workBox");
        const idx = parseInt(box.dataset.index);
        const workouts = getWorkouts();
        const data = workouts[idx];

        // Open the modal with existing data pre-filled
        document.querySelector(".logWorkoutButton").click();
        updateWorkButton.style.display = "block";
        saveWorkButton.style.display = "none";

        workType.value  = data.type;
        workDate.value  = data.date;
        workTime.value  = data.time;
        workMin.value   = data.min;
        workSteps.value = data.steps !== "" ? data.steps : "";
        workCal.value   = data.cal   !== "" ? data.cal   : "";
        workNotes.value = data.notes;

        updateWorkButton.onclick = function () {
            if (workForm.checkValidity()) {
                const updated = {
                    type:  workType.value,
                    date:  workDate.value,
                    time:  workTime.value,
                    min:   workMin.value,
                    steps: isNaN(workSteps.valueAsNumber) ? "" : workSteps.valueAsNumber,
                    cal:   isNaN(workCal.valueAsNumber)   ? "" : workCal.valueAsNumber,
                    notes: workNotes.value
                };

                const ws = getWorkouts();
                ws[idx] = updated;
                saveWorkouts(ws);

                renderAll();
                cancelButton.click();
            } else {
                workForm.reportValidity();
            }
        };
    }
});


// ── Fake Strava Workouts ─────────────────────────────────────────

const stravaWorkouts = [
    {
        type: "Running",
        date: "2026-05-05",
        time: "18:30",
        min: 45,
        distance: 5,
        calories: 320
    },
    {
        type: "Walking",
        date: "2026-05-04",
        time: "08:15",
        min: 30,
        distance: 2.5,
        calories: 120
    },
    {
        type: "Cycling",
        date: "2026-05-03",
        time: "17:00",
        min: 60,
        distance: 12,
        calories: 450
    }
];

// ── Connect Strava ───────────────────────────────────────────────

connectStravaButton.addEventListener("click", function(){

    connectStravaButton.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        Connected
    `;

    connectStravaButton.disabled = true;

    importStravaButton.style.display = "block";
});

// ── Open Import Modal ────────────────────────────────────────────

importStravaButton.addEventListener("click", function(){

    stravaWorkoutContainer.innerHTML = "";

    stravaWorkouts.forEach(workout => {

        const estimatedSteps = Math.round(
            (workout.distance * 1000) /
            (workout.type === "Running" ? 1 : 0.75)
        );

        const box = document.createElement("div");

        box.className = "stravaWorkoutBox";

        box.innerHTML = `
            <div class="stravaWorkoutTop">
                <div class="stravaWorkoutType">
                    <i class="fa-brands fa-strava" style="color:orange;"></i>
                    ${workout.type}
                </div>

                <div>
                    ${workout.distance} km
                </div>
            </div>

            <div class="stravaWorkoutMeta">
                ${workout.date} • ${workout.time} •
                ${workout.min} mins •
                ${workout.calories} cal
            </div>
        `;

        box.addEventListener("click", function(){

            // Auto fill form

            workType.value = workout.type;
            workDate.value = workout.date;
            workTime.value = workout.time;
            workMin.value = workout.min;
            workCal.value = workout.calories;
            workSteps.value = estimatedSteps;

            // Close Strava modal
            bootstrap.Modal.getInstance(
                document.getElementById("stravaModal")
            ).hide();

            // Open workout modal
            new bootstrap.Modal(
                document.getElementById("exampleModal")
            ).show();

        });

        stravaWorkoutContainer.appendChild(box);

    });

    new bootstrap.Modal(
        document.getElementById("stravaModal")
    ).show();

});
// ── Init ──────────────────────────────────────────────────────────────────────
renderAll();