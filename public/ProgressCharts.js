document.addEventListener("DOMContentLoaded", () => {
    const workouts = JSON.parse(localStorage.getItem("workouts") || "[]");
    let activityChartInstance = null; 

    // Calculate Summary Stats (Top Cards)
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

    // --- Chart Rendering Function ---
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
            
            // Format to "Apr 26"
            labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

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

        // Update Text Headers
        const titles = {
            'duration': { title: 'Workout Duration', sub: 'Daily workout minutes for the last 7 days', label: 'Minutes', color: '#3b82f6' },
            'steps': { title: 'Total Steps', sub: 'Daily steps for the last 7 days', label: 'Steps', color: '#a855f7' },
            'calories': { title: 'Calories Burned', sub: 'Daily calories burned for the last 7 days', label: 'Calories', color: '#f97316' },
            'types': { title: 'Workout Sessions', sub: 'Number of sessions logged per day', label: 'Sessions', color: '#22c55e' }
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
            type: 'line', // Switched to Line Chart
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
                        position: 'bottom', // Moved to bottom like the design
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
                        bodyFont: { size: 13, family: "'Inter', sans-serif" }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#e2e8f0', borderDash: [5, 5] }, // Dashed grid lines
                        border: { display: false } 
                    },
                    x: { 
                        grid: { display: true, color: '#e2e8f0', borderDash: [5, 5] }, // Dashed grid lines
                        border: { display: false } 
                    }
                }
            }
        });
    }

    // --- Tab Clicking Logic ---
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

    // Initialize with Duration tab
    renderChart('duration');
});