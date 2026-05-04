document.addEventListener("DOMContentLoaded", () => {
    // 1. Fetch data from localStorage
    const workouts = JSON.parse(localStorage.getItem("workouts") || "[]");
    let activityChartInstance = null; 

    // --- 2. Calculate and Display Streaks ---
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

    // Apply the streak to the HTML
    const currentStreak = calculateStreak();
    if (currentStreak > 0) {
        document.getElementById("streakCount").textContent = currentStreak;
        document.getElementById("streakBadge").classList.remove("d-none");
    }

    // --- 3. Calculate Summary Stats (Top Cards) ---
    let totalMins = 0, totalSteps = 0, totalCals = 0;
    workouts.forEach(w => {
        totalMins += parseInt(w.min) || 0;
        totalSteps += parseInt(w.steps) || 0;
        totalCals += parseInt(w.cal) || 0;
    });

    const totalW = workouts.length;
    const avgDuration = totalW > 0 ? Math.round(totalMins / totalW) : 0;

    document.getElementById("pc-total-workouts").textContent = totalW;
    document.getElementById("pc-avg-duration").textContent = avgDuration;
    document.getElementById("pc-total-steps").textContent = totalSteps;
    document.getElementById("pc-total-calories").textContent = totalCals;

    // --- 4. Chart Rendering Function ---
    function renderChart(activeTab) {
        const emptyState = document.getElementById("emptyChartState");
        const chartCanvas = document.getElementById("activityChart");
        const chartHeader = document.getElementById("chartHeader");

        if (workouts.length === 0) {
            emptyState.style.display = "block";
            chartCanvas.style.display = "none";
            chartHeader.style.display = "none";
            if (activityChartInstance) activityChartInstance.destroy();
            return;
        } else {
            emptyState.style.display = "none";
            chartCanvas.style.display = "block";
            chartHeader.style.display = "block";
        }

        const labels = [];
        const datasetData = [];
        const now = new Date();
        now.setHours(0,0,0,0);

        // Process last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            
            const offset = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d - offset)).toISOString().split('T')[0];
            
            // Format to Day/Month (e.g., 26/4)
            labels.push(`${d.getDate()}/${d.getMonth() + 1}`);

            const dayWorkouts = workouts.filter(w => w.date === localISOTime);
            
            // Map data based on the active tab
            if (activeTab === 'duration') {
                datasetData.push(dayWorkouts.reduce((sum, w) => sum + (parseInt(w.min) || 0), 0));
            } else if (activeTab === 'steps') {
                datasetData.push(dayWorkouts.reduce((sum, w) => sum + (parseInt(w.steps) || 0), 0));
            } else if (activeTab === 'calories') {
                datasetData.push(dayWorkouts.reduce((sum, w) => sum + (parseInt(w.cal) || 0), 0));
            } else {
                // 'Types' count placeholder
                datasetData.push(dayWorkouts.length); 
            }
        }

        // Update Text Headers dynamically based on the tab
        const titles = {
            'duration': { title: 'Workout Duration', sub: 'Daily workout minutes for the last 7 days', label: 'Minutes', color: '#3b82f6', emoji: '⏱️' },
            'steps': { title: 'Total Steps', sub: 'Daily steps for the last 7 days', label: 'Steps', color: '#a855f7', emoji: '👟' },
            'calories': { title: 'Calories Burned', sub: 'Daily calories burned for the last 7 days', label: 'Calories', color: '#f97316', emoji: '🔥' },
            'types': { title: 'Workout Sessions', sub: 'Number of sessions logged per day', label: 'Sessions', color: '#22c55e', emoji: '💪' }
        };

        const config = titles[activeTab];
        document.getElementById("chartTitle").textContent = config.title;
        document.getElementById("chartSubtitle").textContent = config.sub;

        if (activityChartInstance) {
            activityChartInstance.destroy();
        }

        // Draw Line Chart
        const ctx = chartCanvas.getContext('2d');
        activityChartInstance = new Chart(ctx, {
            type: 'line', 
            data: {
                labels: labels,
                datasets: [{
                    label: config.label,
                    data: datasetData,
                    borderColor: config.color,
                    backgroundColor: '#ffffff',
                    pointBackgroundColor: '#ffffff', // White center points
                    pointBorderColor: config.color,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    tension: 0.4, // Smooth curved lines
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
                            font: { family: "'Inter', sans-serif", size: 13 } 
                        } 
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: { size: 14, family: "'Inter', sans-serif" },
                        bodyFont: { size: 13, family: "'Inter', sans-serif" },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y + ' ' + config.emoji;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#e2e8f0', borderDash: [5, 5] }, // Dashed grid lines
                        border: { display: false },
                        ticks: { precision: 0 } // Prevents decimals on steps/sessions
                    },
                    x: { 
                        grid: { display: true, color: '#e2e8f0', borderDash: [5, 5] }, // Dashed grid lines
                        border: { display: false } 
                    }
                }
            }
        });
    }

    // --- 5. Tab Clicking Logic ---
    const tabs = document.querySelectorAll('.chart-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            e.target.classList.add('active');
            // Re-render chart with new data
            renderChart(e.target.getAttribute('data-target'));
        });
    });

    // --- 6. Initialize on page load ---
    renderChart('duration');
});