// FIT FOOD — Dashboard Logic

document.addEventListener('DOMContentLoaded', async () => {
    // Only run if authenticated
    if (!app.checkAuth()) return;

    // Elements
    const els = {
        greeting: document.getElementById('greeting'),
        date: document.getElementById('current-date'),
        consumed: document.getElementById('val-consumed'),
        burned: document.getElementById('val-burned'),
        net: document.getElementById('val-net'),
        active: document.getElementById('val-active'),
        
        calRing: document.getElementById('cal-ring'),
        ringVal: document.getElementById('ring-val'),
        ringGoal: document.getElementById('ring-goal'),
        ringRemaining: document.getElementById('ring-remaining'),
        
        pVal: document.getElementById('p-val'),
        pGoal: document.getElementById('p-goal'),
        pBar: document.getElementById('p-bar'),
        
        cVal: document.getElementById('c-val'),
        cGoal: document.getElementById('c-goal'),
        cBar: document.getElementById('c-bar'),
        
        fVal: document.getElementById('f-val'),
        fGoal: document.getElementById('f-goal'),
        fBar: document.getElementById('f-bar'),
        
        waterGrid: document.getElementById('water-grid'),
        waterCount: document.getElementById('water-count')
    };

    let chartInstance = null;

    // Initialize Dashboard
    async function initDashboard() {
        // Set date
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        els.date.innerText = new Date().toLocaleDateString('en-US', options);

        try {
            // Fetch Dashboard Data + Exercise Summary for active minutes
            const today = app.formatDate(new Date());
            const [data, exerciseSummary] = await Promise.all([
                app.api('/api/dashboard'),
                app.api(`/api/exercises/summary?date=${today}`).catch(() => ({ total_duration: 0, total_burned: 0 }))
            ]);
            
            // Set Greeting
            const user = JSON.parse(localStorage.getItem('user'));
            els.greeting.innerText = `Hello, ${user.name.split(' ')[0]}!`;

            // Calculate derived values
            const net_calories = data.consumed.calories - data.burned.calories;
            const exercise_minutes = exerciseSummary.total_duration || 0;

            // Update Summary Cards
            els.consumed.innerText = Math.round(data.consumed.calories);
            els.burned.innerText = Math.round(data.burned.calories);
            els.net.innerText = Math.round(net_calories);
            els.active.innerText = `${exercise_minutes}m`;

            // Update Calorie Ring
            els.ringVal.innerText = Math.round(data.consumed.calories);
            els.ringGoal.innerText = data.goals.calories;
            
            const remaining = data.goals.calories - net_calories;
            if (remaining >= 0) {
                els.ringRemaining.innerText = `${Math.round(remaining)} left`;
                els.ringRemaining.style.color = 'var(--accent-lime)';
            } else {
                els.ringRemaining.innerText = `${Math.round(Math.abs(remaining))} over`;
                els.ringRemaining.style.color = 'var(--accent-magenta)';
            }

            // Calculate SVG stroke-dashoffset for the ring
            // Circumference = 2 * PI * r = 2 * 3.14159 * 40 = 251.2
            const circumference = 251.2;
            const percentage = Math.min((data.consumed.calories / data.goals.calories), 1) || 0;
            const offset = circumference - (percentage * circumference);
            
            // Animate ring
            setTimeout(() => {
                els.calRing.style.strokeDashoffset = offset;
            }, 100);

            // Update Macros
            updateMacro(data.consumed.protein, data.goals.protein, els.pVal, els.pGoal, els.pBar);
            updateMacro(data.consumed.carbs, data.goals.carbs, els.cVal, els.cGoal, els.cBar);
            updateMacro(data.consumed.fat, data.goals.fat, els.fVal, els.fGoal, els.fBar);

            // Initialize Water (convert mL to glasses, assuming 250mL per glass)
            const waterGlasses = Math.floor((data.consumed.water || 0) / 250);
            renderWaterGrid(waterGlasses);

            // Load Chart
            await loadChart();

        } catch (error) {
            app.showToast('Failed to load dashboard data', 'error');
        }
    }

    function updateMacro(value, goal, valEl, goalEl, barEl) {
        valEl.innerText = Math.round(value);
        goalEl.innerText = Math.round(goal);
        const percentage = Math.min((value / goal) * 100, 100) || 0;
        setTimeout(() => {
            barEl.style.width = `${percentage}%`;
        }, 100);
    }

    // Water Tracker Logic
    function renderWaterGrid(filledCount) {
        els.waterGrid.innerHTML = '';
        els.waterCount.innerText = filledCount;

        for (let i = 1; i <= 8; i++) {
            const glass = document.createElement('div');
            glass.className = `water-glass ${i <= filledCount ? 'filled' : ''}`;
            glass.innerText = '💧';
            
            glass.addEventListener('click', async () => {
                const isFilled = glass.classList.contains('filled');
                // The new backend currently only supports adding water logs, not removing them or setting absolute values easily.
                // We'll just add 250ml if clicking an empty glass. (To fully support the old logic, the backend would need a setWater endpoint).
                
                if (isFilled) {
                    app.showToast('Cannot remove water logs yet', 'info');
                    return;
                }

                try {
                    await app.api('/api/water', {
                        method: 'POST',
                        body: JSON.stringify({ amount_ml: 250 })
                    });
                    
                    // Refresh dashboard to get updated values
                    initDashboard();
                } catch (error) {
                    app.showToast('Failed to log water', 'error');
                }
            });

            els.waterGrid.appendChild(glass);
        }
    }

    // Load Chart data
    async function loadChart() {
        try {
            const history = await app.api('/api/progress/calories?days=7');
            
            const labels = history.map(item => {
                const d = new Date(item.date + 'T00:00:00');
                return d.toLocaleDateString('en-US', { weekday: 'short' });
            });
            
            // API returns { date, calories } — use calories for consumed, 0 for burned (no per-day burned history yet)
            const consumedData = history.map(item => Math.round(item.calories || 0));
            const burnedData = history.map(item => 0);

            const ctx = document.getElementById('trendChart').getContext('2d');
            
            if (chartInstance) {
                chartInstance.destroy();
            }

            Chart.defaults.color = 'rgba(255, 255, 255, 0.6)';
            Chart.defaults.font.family = 'Inter';

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Consumed',
                            data: consumedData,
                            borderColor: '#a3ff12',
                            backgroundColor: 'rgba(163, 255, 18, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Burned',
                            data: burnedData,
                            borderColor: '#ff2d7b',
                            backgroundColor: 'rgba(255, 45, 123, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Chart load error:', error);
        }
    }

    // Start
    initDashboard();
});
