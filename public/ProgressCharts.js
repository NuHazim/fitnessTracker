document.addEventListener("DOMContentLoaded", () => {

    // ── User identity (matches FitnessTracker.js) ─────────────────────────────
    function getCurrentUserId() {
        return localStorage.getItem("hft_user_email") || "anonymous";
    }

    let activityChartInstance = null;
    let workouts = [];

    // ── Fetch workouts from MongoDB via API ───────────────────────────────────
    async function fetchWorkouts() {
        const res = await fetch(`/api/workouts?userId=${encodeURIComponent(getCurrentUserId())}`);
        if (!res.ok) throw new Error("Failed to fetch workouts");
        return res.json();
    }

    // ── Calculate Streak ──────────────────────────────────────────────────────
    function calculateStreak(workouts) {
        if (workouts.length === 0) return 0;

        const dates = [...new Set(workouts.map(w => w.date))].sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const offset = currentDate.getTimezoneOffset() * 60000;
        let expectedDateStr = (new Date(currentDate - offset)).toISOString().split('T')[0];

        if (dates[0] === expectedDateStr) {
            streak++;
        } else {
            currentDate.setDate(currentDate.getDate() - 1);
            expectedDateStr = (new Date(currentDate - offset)).toISOString().split('T')[0];
            if (dates[0] === expectedDateStr) {
                streak++;
            } else {
                return 0;
            }
        }

        for (let i = 1; i < dates.length; i++) {
            currentDate.setDate(currentDate.getDate() - 1);
            expectedDateStr = (new Date(currentDate - offset)).toISOString().split('T')[0];
            if (dates[i] === expectedDateStr) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    // ── Render Summary Stats ──────────────────────────────────────────────────
    function renderStats(workouts) {
        let totalMins = 0, totalSteps = 0, totalCals = 0;
        workouts.forEach(w => {
            totalMins  += parseInt(w.min)   || 0;
            totalSteps += parseInt(w.steps) || 0;
            totalCals  += parseInt(w.cal)   || 0;
        });

        const totalW = workouts.length;
        const avgDuration = totalW > 0 ? Math.round(totalMins / totalW) : 0;

        document.getElementById("pc-total-workouts").textContent = totalW;
        document.getElementById("pc-avg-duration").textContent   = avgDuration;
        document.getElementById("pc-total-steps").textContent    = totalSteps.toLocaleString();
        document.getElementById("pc-total-calories").textContent = totalCals.toLocaleString();
    }

    // ── Render Chart ──────────────────────────────────────────────────────────
    function renderChart(activeTab) {
        const emptyState  = document.getElementById("emptyChartState");
        const chartCanvas = document.getElementById("activityChart");
        const chartHeader = document.getElementById("chartHeader");

        if (workouts.length === 0) {
            emptyState.style.display  = "block";
            chartCanvas.style.display = "none";
            chartHeader.style.display = "none";
            if (activityChartInstance) activityChartInstance.destroy();
            return;
        }

        emptyState.style.display  = "none";
        chartCanvas.style.display = "block";
        chartHeader.style.display = "block";

        const labels = [];
        const datasetData = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);

            const offset = d.getTimezoneOffset() * 60000;
            const localISO = (new Date(d - offset)).toISOString().split('T')[0];

            labels.push(`${d.getDate()}/${d.getMonth() + 1}`);

            const dayWorkouts = workouts.filter(w => w.date === localISO);

            if (activeTab === 'duration') {
                datasetData.push(dayWorkouts.reduce((sum, w) => sum + (parseInt(w.min)   || 0), 0));
            } else if (activeTab === 'steps') {
                datasetData.push(dayWorkouts.reduce((sum, w) => sum + (parseInt(w.steps) || 0), 0));
            } else if (activeTab === 'calories') {
                datasetData.push(dayWorkouts.reduce((sum, w) => sum + (parseInt(w.cal)   || 0), 0));
            } else {
                datasetData.push(dayWorkouts.length);
            }
        }

        const titles = {
            duration: { title: 'Workout Duration',   sub: 'Daily workout minutes for the last 7 days',  label: 'Minutes',  color: '#3b82f6', emoji: '⏱️' },
            steps:    { title: 'Total Steps',         sub: 'Daily steps for the last 7 days',            label: 'Steps',    color: '#a855f7', emoji: '👟' },
            calories: { title: 'Calories Burned',     sub: 'Daily calories burned for the last 7 days',  label: 'Calories', color: '#f97316', emoji: '🔥' },
            types:    { title: 'Workout Sessions',    sub: 'Number of sessions logged per day',          label: 'Sessions', color: '#22c55e', emoji: '💪' }
        };

        const config = titles[activeTab];
        document.getElementById("chartTitle").textContent    = config.title;
        document.getElementById("chartSubtitle").textContent = config.sub;

        if (activityChartInstance) activityChartInstance.destroy();

        const isDark = document.body.classList.contains('dark-mode');
        const gridColor  = isDark ? 'rgba(99,102,241,0.12)' : '#e2e8f0';
        const labelColor = isDark ? '#94a3b8' : '#6b7280';

        const ctx = chartCanvas.getContext('2d');
        activityChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: config.label,
                    data: datasetData,
                    borderColor: config.color,
                    backgroundColor: 'transparent',
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: config.color,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    tension: 0.4,
                    borderWidth: 2,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            color: labelColor,
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 13 }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: { size: 14, family: "'Plus Jakarta Sans', sans-serif" },
                        bodyFont:  { size: 13, family: "'Plus Jakarta Sans', sans-serif" },
                        callbacks: {
                            label(context) {
                                let label = context.dataset.label ? context.dataset.label + ': ' : '';
                                if (context.parsed.y !== null) label += context.parsed.y + ' ' + config.emoji;
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid:   { color: gridColor, borderDash: [5, 5] },
                        border: { display: false },
                        ticks:  { precision: 0, color: labelColor }
                    },
                    x: {
                        grid:   { display: true, color: gridColor, borderDash: [5, 5] },
                        border: { display: false },
                        ticks:  { color: labelColor }
                    }
                }
            }
        });
    }

    // ── Loading / Error states ────────────────────────────────────────────────
    function showLoadingState() {
        const wrapper = document.getElementById("chartWrapper");
        wrapper.innerHTML = `
            <div style="text-align:center; padding: 3rem 0; color: #6b7280;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:#6366f1; margin-bottom:1rem; display:block;"></i>
                <p style="font-size:0.9rem;">Loading your workouts…</p>
            </div>
        `;
    }

    function restoreChartDOM() {
        const wrapper = document.getElementById("chartWrapper");
        wrapper.innerHTML = `
            <div class="chart-header text-start w-100 mb-4" id="chartHeader" style="display: none;">
                <h5 class="fw-bold mb-1" id="chartTitle">Workout Duration</h5>
                <p class="text-muted mb-0" id="chartSubtitle" style="font-size: 0.9rem;">Daily workout minutes for the last 7 days</p>
            </div>
            <div id="emptyChartState" style="display: none; text-align: center; padding: 2rem 0;">
                <i class="fa-solid fa-arrow-trend-up chart-empty-icon"></i>
                <h4>No workout data yet</h4>
                <p>Start logging workouts to see your progress</p>
            </div>
            <canvas id="activityChart" style="display: none;"></canvas>
        `;
    }

    function showErrorState(message) {
        const wrapper = document.getElementById("chartWrapper");
        wrapper.innerHTML = `
            <div style="text-align:center; padding: 3rem 0;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:2.5rem; color:#ef4444; margin-bottom:1rem; display:block;"></i>
                <h4 style="color:#ef4444; font-size:1rem; font-weight:700;">Failed to load workouts</h4>
                <p style="color:#6b7280; font-size:0.875rem;">${message}</p>
                <button onclick="location.reload()" style="
                    margin-top:1rem; padding:0.5rem 1.2rem;
                    background:linear-gradient(135deg,#4f46e5,#7c3aed);
                    color:white; border:none; border-radius:10px;
                    font-weight:600; font-size:0.875rem; cursor:pointer;
                ">Retry</button>
            </div>
        `;
    }

    // ── Tab click logic ───────────────────────────────────────────────────────
    function bindTabs() {
        const tabs = document.querySelectorAll('.chart-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                renderChart(e.target.getAttribute('data-target'));
            });
        });
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    async function init() {
        showLoadingState();

        try {
            workouts = await fetchWorkouts();
        } catch (err) {
            console.error("ProgressCharts: fetch error —", err);
            showErrorState("Is the server running? Check your connection and try again.");
            return;
        }

        restoreChartDOM();
        bindTabs();

        // Streak badge
        const streak = calculateStreak(workouts);
        if (streak > 0) {
            document.getElementById("streakCount").textContent = streak;
            document.getElementById("streakBadge").classList.remove("d-none");
        }

        renderStats(workouts);
        renderChart('duration');
    }

    init();
});