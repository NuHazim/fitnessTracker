// ProgressCharts.js

document.addEventListener("DOMContentLoaded", () => {
    const workouts = JSON.parse(localStorage.getItem("workouts") || "[]");
    let activityChartInstance = null; // Store chart so we can destroy and redraw it

    // --- 1. Calculate and Display Streaks ---
    function calculateStreak() {
        if (workouts.length === 0) return 0;
        
        // Extract just the dates, remove duplicates, and sort newest first
        const dates = [...new Set(workouts.map(w => w.date))].sort((a, b) => new Date(b) - new Date(a));
        
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0,0,0,0);
        
        const offset = currentDate.getTimezoneOffset() * 60000;
        let expectedDateStr = (new Date(currentDate - offset)).toISOString().split('T')[0];

        // Check if they worked out today or yesterday
        if (dates[0] === expectedDateStr) {
            streak++;
        } else {
            currentDate.setDate(currentDate.getDate() - 1);
            expectedDateStr = (new Date(currentDate - offset)).toISOString().split('T')[0];
            if (dates[0] === expectedDateStr) {
                streak++;
            } else {
                return 0; // Streak broken
            }
        }

        // Count backwards to find consecutive days
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

    const currentStreak = calculateStreak();
    if (currentStreak > 0) {
        document.getElementById("streakCount").textContent = currentStreak;
        document.getElementById("streakBadge").classList.remove("d-none");
    }


    // --- 2. Master Render Function ---
    function renderDashboard(days) {
        const emptyState = document.getElementById("emptyChartState");
        const chartCanvas = document.getElementById("activityChart");

        // Filter workouts based on the dropdown selection
        let filteredWorkouts = workouts;
        const now = new Date();
        now.setHours(0,0,0,0);

        if (days !== 'all') {
            const cutoffDate = new Date(now);
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(days) + 1); 
            
            filteredWorkouts = workouts.filter(w => {
                const wDate = new Date(w.date);
                return wDate >= cutoffDate;
            });
        }

        // Update the 4 Cards
        let totalMins = 0, totalSteps = 0, totalCals = 0;
        filteredWorkouts.forEach(w => {
            totalMins += parseInt(w.min) || 0;
            totalSteps += parseInt(w.steps) || 0;
            totalCals += parseInt(w.cal) || 0;
        });

        const totalW = filteredWorkouts.length;
        const avgDuration = totalW > 0 ? Math.round(totalMins / totalW) : 0;

        document.getElementById("pc-total-workouts").textContent = totalW;
        document.getElementById("pc-avg-duration").textContent = avgDuration;
        document.getElementById("pc-total-steps").textContent = totalSteps;
        document.getElementById("pc-total-calories").textContent = totalCals;

        // Update Card Subtitles dynamically
        const labelText = days === 'all' ? "All Time" : `Last ${days} Days`;
        document.querySelectorAll(".timeframe-label").forEach(el => el.textContent = labelText);

        // Handle Empty State
        if (filteredWorkouts.length === 0) {
            emptyState.style.display = "block";
            chartCanvas.style.display = "none";
            if (activityChartInstance) activityChartInstance.destroy();
            return;
        } else {
            emptyState.style.display = "none";
            chartCanvas.style.display = "block";
        }

        // Build Chart Data
        const labels = [];
        const durationData = [];
        const caloriesData = [];
        const loopDays = days === 'all' ? 30 : parseInt(days); // Cap "All time" bar chart at 30 days for visual clarity

        for (let i = loopDays - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            
            const offset = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d - offset)).toISOString().split('T')[0];
            
            // Short label (Mon, Tue) for 7 days, MM/DD for longer timeframes
            if (loopDays <= 7) {
                labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
            } else {
                labels.push(`${d.getDate()}/${d.getMonth()+1}`);
            }

            const dayWorkouts = filteredWorkouts.filter(w => w.date === localISOTime);
            const dayMins = dayWorkouts.reduce((sum, w) => sum + (parseInt(w.min) || 0), 0);
            const dayCals = dayWorkouts.reduce((sum, w) => sum + (parseInt(w.cal) || 0), 0);

            durationData.push(dayMins);
            caloriesData.push(dayCals);
        }

        // Destroy old chart if it exists before drawing a new one
        if (activityChartInstance) {
            activityChartInstance.destroy();
        }

        // Draw new chart
        const ctx = chartCanvas.getContext('2d');
        activityChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Duration',
                        data: durationData,
                        backgroundColor: '#8b5cf6',
                        borderRadius: 6,
                        barPercentage: loopDays > 7 ? 0.8 : 0.6
                    },
                    {
                        label: 'Calories Burned',
                        data: caloriesData,
                        backgroundColor: '#f97316',
                        borderRadius: 6,
                        barPercentage: loopDays > 7 ? 0.8 : 0.6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { font: { family: "'Inter', sans-serif", size: 13 } } },
                    // NEW: Custom hover tooltips!
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleFont: { size: 14, family: "'Inter', sans-serif" },
                        bodyFont: { size: 13, family: "'Inter', sans-serif" },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y;
                                    // Add Emojis based on which dataset we are hovering over
                                    if (context.datasetIndex === 0) label += ' mins ⏱️';
                                    if (context.datasetIndex === 1) label += ' cal 🔥';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
                    x: { grid: { display: false }, border: { display: false } }
                }
            }
        });
    }

    // --- 3. Initialize ---
    
    // Load the 7-day view by default
    renderDashboard('7');

    // Listen for the user changing the dropdown
    document.getElementById('timeframeFilter').addEventListener('change', (e) => {
        renderDashboard(e.target.value);
    });
});