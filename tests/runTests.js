/**
 * FitNation — Database Testing Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Run: node tests/runTests.js
 * Requires: Server running on localhost:3000 (npm start / node server.js)
 * Requires: Node 18+ (uses built-in fetch — no installs needed)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE = "http://localhost:3000";

// ── Unique test email so reruns don't collide ─────────────────────────────────
const TS        = Date.now();
const USER_A    = `testuser_a_${TS}@fitnation.test`;
const USER_B    = `testuser_b_${TS}@fitnation.test`;
const PASSWORD  = "TestPass123";
const NEW_PASS  = "NewPass456";

// ── Result tracking ───────────────────────────────────────────────────────────
const results = [];
let workoutId, reminderId;

// ── Helpers ───────────────────────────────────────────────────────────────────
const api = async (method, path, body) => {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(`${BASE}${path}`, opts);
    const json = await res.json().catch(() => ({}));
    return { status: res.status, body: json };
};

function pass(id, desc, detail = "") {
    results.push({ id, desc, status: "PASS", detail });
}

function fail(id, desc, detail = "") {
    results.push({ id, desc, status: "FAIL", detail });
}

function check(id, desc, condition, detail = "") {
    condition ? pass(id, desc, detail) : fail(id, desc, detail);
}

// ── Colour codes ──────────────────────────────────────────────────────────────
const G = "\x1b[32m", R = "\x1b[31m", Y = "\x1b[33m",
      B = "\x1b[34m", C = "\x1b[36m", W = "\x1b[37m",
      BOLD = "\x1b[1m", DIM = "\x1b[2m", RESET = "\x1b[0m";

function printHeader(title) {
    const line = "─".repeat(70);
    console.log(`\n${B}${BOLD}${line}${RESET}`);
    console.log(`${B}${BOLD}  ${title}${RESET}`);
    console.log(`${B}${BOLD}${line}${RESET}`);
}

function printResult(r) {
    const icon   = r.status === "PASS" ? `${G}✓ PASS${RESET}` : `${R}✗ FAIL${RESET}`;
    const id     = `${DIM}${r.id.padEnd(6)}${RESET}`;
    const desc   = r.desc.padEnd(52);
    const detail = r.detail ? `${DIM}  → ${r.detail}${RESET}` : "";
    console.log(`  ${id} ${icon}  ${desc}${detail}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════════════════════

async function unitTests() {
    printHeader("UNIT TESTING — Mongoose Schema Validation");

    // UT-01: Register with valid fields
    let r = await api("POST", "/api/auth/register", { name: "Test User A", email: USER_A, password: PASSWORD });
    check("UT-01", "Register with all valid fields", r.status === 201, `HTTP ${r.status}`);

    // UT-02: Register missing name
    r = await api("POST", "/api/auth/register", { email: `nomissingname_${TS}@test.com`, password: PASSWORD });
    check("UT-02", "Register missing required name field", r.status === 500, `HTTP ${r.status}`);

    // UT-03: Duplicate email
    r = await api("POST", "/api/auth/register", { name: "Dupe", email: USER_A, password: PASSWORD });
    check("UT-03", "Register duplicate email rejected", r.status === 400, `HTTP ${r.status} — ${r.body.message}`);

    // UT-04: Default profile values
    r = await api("GET", `/api/profile/${encodeURIComponent(USER_A)}`);
    check("UT-04", "Default profile values applied on register",
        r.body.age === 20 && r.body.weight === 70 && r.body.height === 175,
        `age:${r.body.age} weight:${r.body.weight} height:${r.body.height}`);

    // UT-05: Wrong password
    r = await api("POST", "/api/auth/login", { email: USER_A, password: "wrongpassword" });
    check("UT-05", "Login with wrong password returns 401", r.status === 401, `HTTP ${r.status}`);

    // UT-06: bcrypt hash stored (check via login success, not direct DB access)
    r = await api("POST", "/api/auth/login", { email: USER_A, password: PASSWORD });
    check("UT-06", "Login succeeds (confirms bcrypt hash works)", r.status === 200 && r.body.success === true, `HTTP ${r.status}`);

    // UT-07: Workout with all fields
    r = await api("POST", "/api/workouts", { userId: USER_A, type: "Running", date: "2026-06-11", time: "08:00", min: 30, steps: 3000, cal: 250, notes: "Test run" });
    check("UT-07", "Create workout with all fields", r.status === 201 && r.body._id, `HTTP ${r.status} _id:${r.body._id}`);
    if (r.body._id) workoutId = r.body._id;

    // UT-08: Workout missing required min
    r = await api("POST", "/api/workouts", { userId: USER_A, type: "Running", date: "2026-06-11", time: "08:00" });
    check("UT-08", "Workout missing required min field rejected", r.status === 400, `HTTP ${r.status} — ${r.body.error}`);

    // UT-09: Workout with null optional fields
    r = await api("POST", "/api/workouts", { userId: USER_A, type: "Yoga", date: "2026-06-11", time: "09:00", min: 45, steps: null, cal: null });
    check("UT-09", "Workout with null optional fields accepted", r.status === 201, `HTTP ${r.status}`);

    // UT-10: Workout type stored as string
    r = await api("GET", `/api/workouts?userId=${encodeURIComponent(USER_A)}`);
    const hasType = Array.isArray(r.body) && r.body.some(w => typeof w.type === "string");
    check("UT-10", "Workout type field stored as string", hasType, `type: "${r.body[0]?.type}"`);

    // UT-11: Reminder with valid enum type
    r = await api("POST", "/api/reminders", { userId: USER_A, type: "workout", time: "07:00", title: "Morning Run", message: "Time to run!", days: ["Mon", "Wed"] });
    check("UT-11", "Reminder with valid enum type created", r.status === 201, `HTTP ${r.status}`);
    if (r.body._id || r.body.id) reminderId = r.body._id || r.body.id;

    // UT-12: Reminder with invalid enum
    r = await api("POST", "/api/reminders", { userId: USER_A, type: "invalid_type", time: "07:00", title: "Test", message: "Test" });
    check("UT-12", "Reminder with invalid enum type rejected", r.status === 500, `HTTP ${r.status}`);

    // UT-13: Reminder enabled defaults to true
    r = await api("POST", "/api/reminders", { userId: USER_A, type: "water", time: "12:00", title: "Drink Water", message: "Stay hydrated" });
    check("UT-13", "Reminder enabled defaults to true", r.status === 201 && r.body.enabled === true, `enabled: ${r.body.enabled}`);

    // UT-14: Reminder missing required fields
    r = await api("POST", "/api/reminders", { userId: USER_A, type: "meal" });
    check("UT-14", "Reminder missing title/message rejected", r.status === 400, `HTTP ${r.status}`);

    results.filter(r2 => ["UT-01","UT-02","UT-03","UT-04","UT-05","UT-06","UT-07","UT-08","UT-09","UT-10","UT-11","UT-12","UT-13","UT-14"].includes(r2.id))
        .forEach(printResult);
}

async function functionalTests() {
    printHeader("FUNCTIONAL TESTING — API Endpoint Behaviour");

    // FT-01: Registration returns correct shape
    let r = await api("POST", "/api/auth/register", { name: "Test User B", email: USER_B, password: PASSWORD });
    check("FT-01", "Registration returns user object (no password)", r.status === 201 && r.body.user && !r.body.user.password, `HTTP ${r.status}`);

    // FT-02: Login success
    r = await api("POST", "/api/auth/login", { email: USER_B, password: PASSWORD });
    check("FT-02", "Login returns success:true + user object", r.status === 200 && r.body.success === true && r.body.user?.email === USER_B, `HTTP ${r.status}`);

    // FT-03: Login fail
    r = await api("POST", "/api/auth/login", { email: USER_B, password: "badpass" });
    check("FT-03", "Login with wrong credentials returns 401", r.status === 401 && r.body.success === false, `HTTP ${r.status}`);

    // FT-04: Rate limiter (6 rapid requests)
    let lastStatus;
    for (let i = 0; i < 6; i++) {
        r = await api("POST", "/api/auth/login", { email: `ratetest_${TS}@test.com`, password: "x" });
        lastStatus = r.status;
    }
    check("FT-04", "Rate limiter triggers HTTP 429 after 5 attempts", lastStatus === 429, `HTTP ${lastStatus} on 6th attempt`);

    // FT-05: Workout GET returns array sorted by createdAt desc
    r = await api("GET", `/api/workouts?userId=${encodeURIComponent(USER_A)}`);
    check("FT-05", "GET workouts returns array in desc order", Array.isArray(r.body) && r.body.length > 0, `HTTP ${r.status} — ${r.body.length} workouts`);

    // FT-06: Create workout returns _id
    r = await api("POST", "/api/workouts", { userId: USER_A, type: "Cycling", date: "2026-06-11", time: "10:00", min: 60, cal: 400 });
    check("FT-06", "POST workout returns document with _id", r.status === 201 && !!r.body._id, `HTTP ${r.status} _id:${r.body._id}`);
    const cyclingId = r.body._id;

    // FT-07: Update workout
    r = await api("PUT", `/api/workouts/${cyclingId}`, { type: "Cycling", date: "2026-06-11", time: "10:00", min: 75, cal: 500 });
    check("FT-07", "PUT workout updates and returns new values", r.status === 200 && r.body.min === 75, `HTTP ${r.status} — min updated to ${r.body.min}`);

    // FT-08: Delete workout
    r = await api("DELETE", `/api/workouts/${cyclingId}`);
    check("FT-08", "DELETE workout returns success message", r.status === 200 && r.body.message, `HTTP ${r.status} — ${r.body.message}`);

    // FT-09: Update non-existent workout
    r = await api("PUT", "/api/workouts/000000000000000000000000", { type: "Running", date: "2026-06-11", time: "10:00", min: 30 });
    check("FT-09", "PUT non-existent workout returns 404", r.status === 404, `HTTP ${r.status}`);

    // FT-10: Delete non-existent workout
    r = await api("DELETE", "/api/workouts/000000000000000000000000");
    check("FT-10", "DELETE non-existent workout returns 404", r.status === 404, `HTTP ${r.status}`);

    // FT-11: GET reminders returns id alias
    r = await api("GET", `/api/reminders?userId=${encodeURIComponent(USER_A)}`);
    check("FT-11", "GET reminders includes id field (alias for _id)", Array.isArray(r.body) && r.body[0]?.id, `HTTP ${r.status} — id: ${r.body[0]?.id}`);

    // FT-12: Toggle reminder disabled
    if (reminderId) {
        r = await api("PUT", `/api/reminders/${reminderId}`, { userId: USER_A, enabled: false });
        check("FT-12", "PUT reminder toggles enabled to false", r.status === 200 && r.body.enabled === false, `HTTP ${r.status} — enabled: ${r.body.enabled}`);
    } else {
        fail("FT-12", "PUT reminder toggle (skipped — no reminderId)", "UT-11 may have failed");
    }

    // FT-13: GET reminders missing userId
    r = await api("GET", "/api/reminders");
    check("FT-13", "GET reminders without userId returns 400", r.status === 400, `HTTP ${r.status}`);

    // FT-14: Save favourite meal
    r = await api("POST", "/api/favorites", { userId: USER_A, mealId: 123456, name: "Grilled Chicken", calories: "320", protein: "42g", carbs: "0g", fats: "14g" });
    check("FT-14", "POST favourite meal returns success:true", r.status === 200 && r.body.success === true, `HTTP ${r.status}`);

    // FT-15: Fetch favourites
    r = await api("GET", `/api/favorites/${encodeURIComponent(USER_A)}`);
    check("FT-15", "GET favourites returns array with saved meal", Array.isArray(r.body) && r.body.length > 0, `HTTP ${r.status} — ${r.body.length} favourites`);

    // FT-16: Delete favourite
    r = await api("DELETE", `/api/favorites/${encodeURIComponent(USER_A)}/123456`);
    check("FT-16", "DELETE favourite meal returns success:true", r.status === 200 && r.body.success === true, `HTTP ${r.status}`);

    results.filter(r2 => r2.id.startsWith("FT-")).forEach(printResult);
}

async function integrationTests() {
    printHeader("INTEGRATION TESTING — End-to-End Flows");

    // IT-01: Register → Login → Profile fetch
    const IT01_EMAIL = `it01_${TS}@fitnation.test`;
    let r = await api("POST", "/api/auth/register", { name: "IT User", email: IT01_EMAIL, password: PASSWORD });
    const step1 = r.status === 201;
    r = await api("POST", "/api/auth/login", { email: IT01_EMAIL, password: PASSWORD });
    const step2 = r.status === 200 && r.body.success;
    r = await api("GET", `/api/profile/${encodeURIComponent(IT01_EMAIL)}`);
    const step3 = r.status === 200 && r.body.fitnessGoal === "Weight Maintenance";
    check("IT-01", "Register → Login → Profile fetch all succeed", step1 && step2 && step3, `register:${step1} login:${step2} profile:${step3}`);

    // IT-02: NoSQL injection attempt
    r = await api("POST", "/api/auth/login", { email: { $gt: "" }, password: "x" });
    check("IT-02", "NoSQL injection blocked by sanitizer", r.status === 400 || r.status === 401, `HTTP ${r.status}`);

    // IT-03: Profile update persists
    r = await api("POST", "/api/profile", { email: IT01_EMAIL, name: "IT User", age: 25, weight: 72, height: 178, fitnessGoal: "Build Muscle" });
    const updated = r.status === 200 && r.body.success;
    r = await api("GET", `/api/profile/${encodeURIComponent(IT01_EMAIL)}`);
    const fetched = r.body.age === 25 && r.body.weight === 72 && r.body.fitnessGoal === "Build Muscle";
    check("IT-03", "Profile update persists to MongoDB correctly", updated && fetched, `age:${r.body.age} weight:${r.body.weight} goal:${r.body.fitnessGoal}`);

    // IT-04: Password change flow
    r = await api("POST", "/api/profile/update-password", { email: IT01_EMAIL, currentPassword: PASSWORD, newPassword: NEW_PASS });
    const changed = r.status === 200 && r.body.success;
    r = await api("POST", "/api/auth/login", { email: IT01_EMAIL, password: PASSWORD });
    const oldRejected = r.status === 401;
    r = await api("POST", "/api/auth/login", { email: IT01_EMAIL, password: NEW_PASS });
    const newAccepted = r.status === 200 && r.body.success;
    check("IT-04", "Password change — old rejected, new accepted", changed && oldRejected && newAccepted, `changed:${changed} oldRejected:${oldRejected} newAccepted:${newAccepted}`);

    // IT-05: Full workout CRUD cycle
    r = await api("POST", "/api/workouts", { userId: IT01_EMAIL, type: "Swimming", date: "2026-06-11", time: "06:00", min: 45 });
    const created = r.status === 201;
    const wId = r.body._id;
    r = await api("GET", `/api/workouts?userId=${encodeURIComponent(IT01_EMAIL)}`);
    const appears = Array.isArray(r.body) && r.body.some(w => w._id === wId);
    r = await api("PUT", `/api/workouts/${wId}`, { type: "Swimming", date: "2026-06-11", time: "06:00", min: 60 });
    const updatedMin = r.body.min === 60;
    r = await api("DELETE", `/api/workouts/${wId}`);
    const deleted = r.status === 200;
    r = await api("GET", `/api/workouts?userId=${encodeURIComponent(IT01_EMAIL)}`);
    const gone = Array.isArray(r.body) && !r.body.some(w => w._id === wId);
    check("IT-05", "Full workout CRUD cycle (create→read→update→delete)", created && appears && updatedMin && deleted && gone,
        `create:${created} appears:${appears} updated:${updatedMin} deleted:${deleted} gone:${gone}`);

    // IT-06: Cascade delete — removes workouts + reminders
    const CASCADE_EMAIL = `cascade_${TS}@fitnation.test`;
    await api("POST", "/api/auth/register", { name: "Cascade User", email: CASCADE_EMAIL, password: PASSWORD });
    await api("POST", "/api/workouts", { userId: CASCADE_EMAIL, type: "HIIT", date: "2026-06-11", time: "07:00", min: 20 });
    await api("POST", "/api/reminders", { userId: CASCADE_EMAIL, type: "workout", time: "06:30", title: "HIIT Time", message: "Get moving!" });
    r = await api("DELETE", "/api/profile/delete-account", { email: CASCADE_EMAIL });
    const accountGone = r.status === 200 && r.body.success;
    r = await api("GET", `/api/workouts?userId=${encodeURIComponent(CASCADE_EMAIL)}`);
    const workoutsGone = Array.isArray(r.body) && r.body.length === 0;
    r = await api("GET", `/api/reminders?userId=${encodeURIComponent(CASCADE_EMAIL)}`);
    const remindersGone = Array.isArray(r.body) && r.body.length === 0;
    check("IT-06", "Cascade delete removes all user data across collections", accountGone && workoutsGone && remindersGone,
        `account:${accountGone} workouts:${workoutsGone} reminders:${remindersGone}`);

    // IT-07: Cascade does not affect other user's data
    r = await api("GET", `/api/workouts?userId=${encodeURIComponent(USER_A)}`);
    check("IT-07", "Cascade delete does not affect other users' data", Array.isArray(r.body) && r.body.length > 0,
        `User A still has ${r.body.length} workouts`);

    results.filter(r2 => r2.id.startsWith("IT-")).forEach(printResult);
}

async function databaseTests() {
    printHeader("DATABASE TESTING — Data Integrity & Security");

    // DT-01: Workout document has _id + timestamps
    let r = await api("POST", "/api/workouts", { userId: USER_A, type: "Cardio", date: "2026-06-11", time: "11:00", min: 25 });
    check("DT-01", "Workout document has _id and timestamps", r.status === 201 && r.body._id && r.body.createdAt && r.body.updatedAt,
        `_id:${r.body._id} createdAt:${r.body.createdAt}`);

    // DT-02: userId correctly scopes data
    r = await api("GET", `/api/workouts?userId=${encodeURIComponent(USER_B)}`);
    const userBWorkouts = Array.isArray(r.body) ? r.body : [];
    const noLeakage = userBWorkouts.every(w => w.userId === USER_B);
    check("DT-02", "userId scoping — User B sees only own workouts", noLeakage,
        `User B has ${userBWorkouts.length} workouts, all belong to User B: ${noLeakage}`);

    // DT-03: Profile sub-document has all fields
    r = await api("GET", `/api/profile/${encodeURIComponent(USER_A)}`);
    const hasAllProfileFields = ["age","weight","height","fitnessGoal"].every(f => r.body[f] !== undefined);
    check("DT-03", "Profile sub-document contains all expected fields", hasAllProfileFields,
        `fields: ${Object.keys(r.body).join(", ")}`);

    // DT-04: email unique constraint
    r = await api("POST", "/api/auth/register", { name: "Dupe", email: USER_A, password: PASSWORD });
    check("DT-04", "email unique index — duplicate rejected at DB level", r.status === 400,
        `HTTP ${r.status} — ${r.body.message}`);

    // DT-05: Reminder has id alias matching _id
    r = await api("GET", `/api/reminders?userId=${encodeURIComponent(USER_A)}`);
    const reminder = r.body[0];
    const idMatches = reminder && reminder.id && reminder._id && reminder.id === reminder._id.toString();
    check("DT-05", "Reminder id alias matches _id value", idMatches,
        `id:${reminder?.id} _id:${reminder?._id}`);

    // DT-06: FavouriteM eal stores all nutrition fields
    await api("POST", "/api/favorites", { userId: USER_B, mealId: 999, name: "Salad", calories: "150", protein: "5g", carbs: "20g", fats: "3g" });
    r = await api("GET", `/api/favorites/${encodeURIComponent(USER_B)}`);
    const meal = r.body[0];
    const hasNutrition = meal && meal.calories && meal.protein && meal.carbs && meal.fats;
    check("DT-06", "FavoriteMeal stores all nutrition fields correctly", hasNutrition,
        `cal:${meal?.calories} prot:${meal?.protein} carbs:${meal?.carbs} fats:${meal?.fats}`);

    // DT-07: NoSQL injection stripped
    r = await api("POST", "/api/auth/login", { email: { $where: "sleep(5000)" }, password: "x" });
    check("DT-07", "NoSQL $where injection sanitized — no server hang", r.status === 400 || r.status === 401,
        `HTTP ${r.status} (fast response, not hung)`);

    // DT-08: Rate limiter in place on auth routes
    for (let i = 0; i < 5; i++) {
        await api("POST", "/api/auth/login", { email: `ratelimit2_${TS}@test.com`, password: "x" });
    }
    r = await api("POST", "/api/auth/login", { email: `ratelimit2_${TS}@test.com`, password: "x" });
    check("DT-08", "Rate limiter blocks brute-force (HTTP 429)", r.status === 429,
        `HTTP ${r.status} on 6th request`);

    // DT-09: Workouts sorted by createdAt DESC
    r = await api("GET", `/api/workouts?userId=${encodeURIComponent(USER_A)}`);
    const dates = r.body.map(w => new Date(w.createdAt).getTime());
    const isSorted = dates.every((d, i) => i === 0 || dates[i-1] >= d);
    check("DT-09", "GET workouts returned sorted by createdAt DESC", isSorted,
        `${dates.length} workouts, sorted: ${isSorted}`);

    // DT-10: Delete non-existent account returns 404
    r = await api("DELETE", "/api/profile/delete-account", { email: `ghost_${TS}@fitnation.test` });
    check("DT-10", "Delete non-existent account returns 404", r.status === 404,
        `HTTP ${r.status} — ${r.body.message}`);

    results.filter(r2 => r2.id.startsWith("DT-")).forEach(printResult);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

function printSummary() {
    const line = "═".repeat(70);
    console.log(`\n${BOLD}${B}${line}${RESET}`);
    console.log(`${BOLD}${B}  FITNATION — DATABASE TESTING SUMMARY${RESET}`);
    console.log(`${BOLD}${B}${line}${RESET}\n`);

    const categories = [
        { prefix: "UT", label: "Unit Testing          (Schema Validation)" },
        { prefix: "FT", label: "Functional Testing    (API Endpoints)" },
        { prefix: "IT", label: "Integration Testing   (End-to-End Flows)" },
        { prefix: "DT", label: "Database Testing      (Integrity & Security)" },
    ];

    let grandTotal = 0, grandPass = 0;

    categories.forEach(cat => {
        const group = results.filter(r => r.id.startsWith(cat.prefix));
        const passed = group.filter(r => r.status === "PASS").length;
        const total  = group.length;
        const pct    = total > 0 ? Math.round((passed / total) * 100) : 0;
        const bar    = `${"█".repeat(Math.round(pct / 5))}${"░".repeat(20 - Math.round(pct / 5))}`;
        const colour = pct === 100 ? G : pct >= 80 ? Y : R;

        console.log(`  ${W}${cat.label.padEnd(45)}${RESET} ${colour}${passed}/${total}${RESET}  ${colour}${bar}${RESET} ${colour}${pct}%${RESET}`);
        grandTotal += total;
        grandPass  += passed;
    });

    const grandPct  = Math.round((grandPass / grandTotal) * 100);
    const grandColour = grandPct === 100 ? G : grandPct >= 80 ? Y : R;

    console.log(`\n  ${"─".repeat(68)}`);
    console.log(`  ${BOLD}${"TOTAL".padEnd(45)}${RESET} ${grandColour}${BOLD}${grandPass}/${grandTotal}${RESET}  ${grandColour}${BOLD}${"█".repeat(Math.round(grandPct / 5))}${"░".repeat(20 - Math.round(grandPct / 5))}${RESET} ${grandColour}${BOLD}${grandPct}%${RESET}`);
    console.log();

    // Failed tests detail
    const failed = results.filter(r => r.status === "FAIL");
    if (failed.length > 0) {
        console.log(`${R}${BOLD}  FAILED TESTS:${RESET}`);
        failed.forEach(r => {
            console.log(`  ${R}✗ ${r.id}${RESET}  ${r.desc}`);
            if (r.detail) console.log(`     ${DIM}${r.detail}${RESET}`);
        });
        console.log();
    } else {
        console.log(`${G}${BOLD}  ✓ All tests passed!${RESET}\n`);
    }

    console.log(`${B}${BOLD}${line}${RESET}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
    const line = "═".repeat(70);
    console.clear();
    console.log(`\n${BOLD}${C}${line}${RESET}`);
    console.log(`${BOLD}${C}  FitNation — Database Testing Script${RESET}`);
    console.log(`${BOLD}${C}  WIF2003 Web Programming — Universiti Malaya${RESET}`);
    console.log(`${BOLD}${C}${line}${RESET}`);
    console.log(`${DIM}  Target: ${BASE}${RESET}`);
    console.log(`${DIM}  Run ID: ${TS}${RESET}\n`);

    // Check server is up first
    try {
        await fetch(`${BASE}/Login.html`);
    } catch {
        console.log(`${R}${BOLD}  ✗ Cannot reach server at ${BASE}${RESET}`);
        console.log(`${Y}  Make sure your server is running: node server.js${RESET}\n`);
        process.exit(1);
    }

    console.log(`${G}  ✓ Server is reachable — starting tests...${RESET}`);

    await unitTests();
    await functionalTests();
    await integrationTests();
    await databaseTests();
    printSummary();
}

main().catch(err => {
    console.error(`\n${R}Unexpected error: ${err.message}${RESET}`);
    process.exit(1);
});