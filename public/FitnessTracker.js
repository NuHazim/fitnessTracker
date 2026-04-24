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

// ── Init ──────────────────────────────────────────────────────────────────────

renderAll();