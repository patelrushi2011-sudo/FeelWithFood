// FIT FOOD — Progress & Analytics Logic

document.addEventListener('DOMContentLoaded', async () => {
    if (!app.checkAuth()) return;

    const els = {
        days: document.getElementById('stat-days'),
        meals: document.getElementById('stat-meals'),
        workouts: document.getElementById('stat-workouts'),
        burn: document.getElementById('stat-burn'),
        
        streak: document.getElementById('streak-count'),
        
        currentWeight: document.getElementById('current-weight'),
        weightChange: document.getElementById('weight-change'),
        bmiVal: document.getElementById('bmi-val'),
        bmiCat: document.getElementById('bmi-cat'),
        bmiIndicator: document.getElementById('bmi-indicator'),
        
        weightForm: document.getElementById('weight-form'),
        weightInput: document.getElementById('weight-input'),
        saveWeightBtn: document.getElementById('save-weight-btn'),
        
        calDaysSelect: document.getElementById('calorie-days')
    };

    let weightChartInst = null;
    let calChartInst = null;

    Chart.defaults.color = 'rgba(255, 255, 255, 0.6)';
    Chart.defaults.font.family = 'Inter';

    async function init() {
        await Promise.all([
            loadStats(),
            loadStreak(),
            loadWeightChart(),
            loadCalorieChart(7)
        ]);
    }

    // Load Overall Stats & BMI
    async function loadStats() {
        try {
            const stats = await app.api('/api/progress/stats');
            
            els.meals.innerText = stats.totalFoodEntries;
            els.workouts.innerText = stats.totalExercises;
            els.burn.innerText = stats.totalCaloriesBurned;
            
            els.currentWeight.innerText = stats.currentWeight;
            
            // Format weight change
            const change = parseFloat(stats.weightChange);
            if (change > 0) {
                els.weightChange.innerText = `+${change}`;
                els.weightChange.style.color = 'var(--accent-magenta)';
            } else if (change < 0) {
                els.weightChange.innerText = `${change}`;
                els.weightChange.style.color = 'var(--accent-lime)';
            } else {
                els.weightChange.innerText = '0';
            }

            // BMI
            els.bmiVal.innerText = stats.bmi;
            els.bmiCat.innerText = stats.bmiCategory;
            
            // BMI Indicator Position
            // BMI Range approx: 15 to 40
            let percent = ((stats.bmi - 15) / (40 - 15)) * 100;
            percent = Math.max(0, Math.min(100, percent));
            els.bmiIndicator.style.left = `${percent}%`;

            // Colorize category text
            if (stats.bmiCategory === 'Underweight') els.bmiCat.style.color = 'var(--accent-cyan)';
            else if (stats.bmiCategory === 'Normal') els.bmiCat.style.color = 'var(--accent-lime)';
            else if (stats.bmiCategory === 'Overweight') els.bmiCat.style.color = 'var(--accent-amber)';
            else els.bmiCat.style.color = 'var(--accent-magenta)';

        } catch (error) {
            console.error('Failed to load stats');
        }
    }

    // Load Streak
    async function loadStreak() {
        try {
            const data = await app.api('/api/progress/streak');
            els.streak.innerText = data.streak;
            els.days.innerText = data.totalDays;
        } catch (error) {
            console.error('Failed to load streak');
        }
    }

    // Log Weight
    els.weightForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const w = parseFloat(els.weightInput.value);
        els.saveWeightBtn.disabled = true;

        try {
            const res = await app.api('/api/progress/weight', {
                method: 'POST',
                body: JSON.stringify({ weight: w })
            });
            
            app.showToast('Weight logged successfully!', 'success');
            els.weightInput.value = '';
            
            // Reload user data locally because calorie goal might have changed
            const user = JSON.parse(localStorage.getItem('user'));
            user.weight = res.weight;
            user.daily_calorie_goal = res.daily_calorie_goal;
            localStorage.setItem('user', JSON.stringify(user));

            // Refresh UI
            await Promise.all([
                loadStats(),
                loadWeightChart()
            ]);
        } catch (error) {
            app.showToast(error.message || 'Failed to log weight', 'error');
        } finally {
            els.saveWeightBtn.disabled = false;
        }
    });

    // Weight History Chart
    async function loadWeightChart() {
        try {
            const history = await app.api('/api/progress/weight');
            
            const labels = history.map(h => new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            const data = history.map(h => h.weight);

            const ctx = document.getElementById('weightChart').getContext('2d');
            
            if (weightChartInst) weightChartInst.destroy();

            weightChartInst = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Weight (kg)',
                        data: data,
                        borderColor: '#00f0ff',
                        backgroundColor: 'rgba(0, 240, 255, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#00f0ff',
                        pointRadius: 4,
                        tension: 0.2,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            // Don't start at zero to show fluctuations better
                            beginAtZero: false,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });

        } catch (error) {
            console.error('Chart load error');
        }
    }

    // Calorie Trend Chart
    async function loadCalorieChart(days) {
        try {
            const history = await app.api(`/api/progress/calories?days=${days}`);
            
            const labels = history.map(h => new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            const consumedData = history.map(h => h.consumed);
            const burnedData = history.map(h => h.burned);

            const ctx = document.getElementById('calorieChart').getContext('2d');
            
            if (calChartInst) calChartInst.destroy();

            calChartInst = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Consumed',
                            data: consumedData,
                            backgroundColor: 'rgba(163, 255, 18, 0.8)',
                            borderRadius: 4
                        },
                        {
                            label: 'Burned (Exercise)',
                            data: burnedData,
                            backgroundColor: 'rgba(255, 45, 123, 0.8)',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });

        } catch (error) {
            console.error('Chart load error');
        }
    }

    els.calDaysSelect.addEventListener('change', (e) => {
        loadCalorieChart(e.target.value);
    });

    init();
});
