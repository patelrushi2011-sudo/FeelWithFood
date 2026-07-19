// FIT FOOD — Exercise Tracker Logic

document.addEventListener('DOMContentLoaded', async () => {
    if (!app.checkAuth()) return;

    const els = {
        datePicker: document.getElementById('date-picker'),
        searchInput: document.getElementById('exercise-search'),
        catFilters: document.getElementById('category-filters'),
        searchResults: document.getElementById('exercise-results'),
        searchLoading: document.getElementById('search-loading'),
        
        logBody: document.getElementById('exercise-log-body'),
        emptyLog: document.getElementById('empty-log'),
        totalBurned: document.getElementById('total-burned'),
        totalDuration: document.getElementById('total-duration'),
        
        // Modal
        modal: document.getElementById('add-modal'),
        closeModalBtn: document.getElementById('close-modal'),
        form: document.getElementById('add-exercise-form'),
        mIcon: document.getElementById('modal-icon'),
        mName: document.getElementById('modal-exercise-name'),
        mDuration: document.getElementById('modal-duration'),
        mIntensity: document.getElementById('modal-intensity'),
        mData: document.getElementById('exercise-data'),
        cBurn: document.getElementById('calc-burn'),
        saveBtn: document.getElementById('save-exercise-btn')
    };

    let currentDate = app.formatDate(new Date());
    let searchTimeout = null;
    let userWeight = 70; // default

    // Initialization
    async function init() {
        els.datePicker.value = currentDate;
        
        const user = JSON.parse(localStorage.getItem('user'));
        // Fetch latest weight from /api/auth/me to ensure accuracy
        try {
            const me = await app.api('/api/auth/me');
            userWeight = me.weight || 70;
        } catch (e) {
            userWeight = user?.weight || 70;
        }

        await loadCategories();
        await loadExerciseLog();
        await performSearch();
    }

    // Event Listeners
    els.datePicker.addEventListener('change', (e) => {
        currentDate = e.target.value;
        loadExerciseLog();
    });

    els.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 300);
    });

    els.closeModalBtn.addEventListener('click', () => {
        els.modal.classList.remove('show');
    });

    // Calculate burn on duration or intensity change
    const calcBurn = () => {
        if (!els.mData.value) return;
        const ex = JSON.parse(els.mData.value);
        const duration = parseFloat(els.mDuration.value) || 0;
        
        // Adjust MET based on intensity slightly (simplified logic)
        let met = ex.met;
        if (els.mIntensity.value === 'low') met *= 0.8;
        if (els.mIntensity.value === 'high') met *= 1.2;

        const burn = Math.round(met * userWeight * (duration / 60));
        els.cBurn.innerText = burn;
    };

    els.mDuration.addEventListener('input', calcBurn);
    els.mIntensity.addEventListener('change', calcBurn);

    // Add Exercise Form Submit
    els.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const ex = JSON.parse(els.mData.value);
        const duration = parseFloat(els.mDuration.value);
        const intensity = els.mIntensity.value;
        const burn = parseInt(els.cBurn.innerText);
        
        els.saveBtn.disabled = true;
        els.saveBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>';

        try {
            await app.api('/api/exercises/log', {
                method: 'POST',
                body: JSON.stringify({
                    exercise_name: ex.name,
                    category: ex.category,
                    duration_min: duration,
                    intensity: intensity,
                    calories_burned: burn
                })
            });

            app.showToast('Workout logged successfully!', 'success');
            els.modal.classList.remove('show');
            await loadExerciseLog();
        } catch (error) {
            app.showToast('Failed to log workout', 'error');
        } finally {
            els.saveBtn.disabled = false;
            els.saveBtn.innerHTML = 'Log Workout';
        }
    });

    // Load Categories
    async function loadCategories() {
        try {
            const categories = await app.api('/api/exercises/categories');
            
            categories.forEach(cat => {
                const btn = document.createElement('div');
                btn.className = 'category-tab';
                btn.dataset.cat = cat;
                btn.innerText = cat;
                
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                    btn.classList.add('active');
                    performSearch();
                });
                
                els.catFilters.appendChild(btn);
            });
            
            document.querySelector('.category-tab[data-cat="all"]').addEventListener('click', (e) => {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                performSearch();
            });

        } catch (err) {
            console.error('Failed to load categories');
        }
    }

    // Search Database
    async function performSearch() {
        els.searchLoading.classList.remove('hidden');
        els.searchResults.innerHTML = '';
        
        const q = els.searchInput.value;
        const activeCat = document.querySelector('.category-tab.active').dataset.cat;
        
        let url = '/api/exercises/database';
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (activeCat !== 'all') params.append('category', activeCat);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }

        try {
            const results = await app.api(url);
            els.searchLoading.classList.add('hidden');
            
            if (results.length === 0) {
                els.searchResults.innerHTML = '<div class="col-span-full text-center text-muted">No activities found.</div>';
                return;
            }

            results.forEach(ex => {
                // Calculate estimated burn for 30 mins
                const estBurn = Math.round(ex.met * userWeight * (30 / 60));

                const card = document.createElement('div');
                card.className = 'item-card glass-card';
                card.innerHTML = `
                    <div class="item-header">
                        <div class="d-flex align-center gap-2">
                            <span style="font-size: 1.5rem;">${ex.icon || '🏃'}</span>
                            <div class="item-name">${ex.name}</div>
                        </div>
                    </div>
                    <div class="item-category" style="display: inline-block; margin-bottom: 12px; background: rgba(255, 45, 123, 0.1); color: var(--accent-magenta);">${ex.category}</div>
                    
                    <div class="d-flex justify-between align-center mt-2">
                        <div class="text-muted" style="font-size: 0.85rem;">Est. burn (30m):</div>
                        <div style="font-weight: 700; color: var(--accent-magenta); font-size: 1.1rem;">~${estBurn} kcal</div>
                    </div>
                `;
                
                card.addEventListener('click', () => openModal(ex));
                els.searchResults.appendChild(card);
            });

        } catch (error) {
            els.searchLoading.classList.add('hidden');
            app.showToast('Search failed', 'error');
        }
    }

    // Open Modal
    function openModal(ex) {
        els.mIcon.innerText = ex.icon || '🏃';
        els.mName.innerText = ex.name;
        els.mDuration.value = 30;
        els.mIntensity.value = 'moderate';
        els.mData.value = JSON.stringify(ex);
        
        calcBurn();
        els.modal.classList.add('show');
    }

    // Load Exercise Log for Date
    async function loadExerciseLog() {
        try {
            const logs = await app.api(`/api/exercises/log?date=${currentDate}`);
            const summary = await app.api(`/api/exercises/summary?date=${currentDate}`);
            
            els.totalBurned.innerText = summary.total_burned;
            els.totalDuration.innerText = summary.total_duration;

            els.logBody.innerHTML = '';
            
            if (logs.length === 0) {
                els.logBody.parentElement.style.display = 'none';
                els.emptyLog.style.display = 'block';
            } else {
                els.logBody.parentElement.style.display = 'table';
                els.emptyLog.style.display = 'none';

                logs.forEach(log => {
                    const tr = document.createElement('tr');
                    
                    // Style intensity
                    let intColor = 'var(--text-primary)';
                    if (log.intensity === 'low') intColor = 'var(--accent-cyan)';
                    if (log.intensity === 'high') intColor = 'var(--accent-magenta)';

                    tr.innerHTML = `
                        <td style="font-weight: 600;">${log.exercise_name}</td>
                        <td style="font-size: 0.85rem; color: var(--text-muted);">${log.category}</td>
                        <td>${log.duration_min} min</td>
                        <td style="color: ${intColor}; text-transform: capitalize; font-size: 0.85rem;">${log.intensity}</td>
                        <td class="cal-value" style="color: var(--accent-magenta);">${Math.round(log.calories_burned)}</td>
                        <td>
                            <button class="delete-btn" data-id="${log.id}">🗑️</button>
                        </td>
                    `;

                    tr.querySelector('.delete-btn').addEventListener('click', async () => {
                        if (confirm(`Remove ${log.exercise_name}?`)) {
                            try {
                                await app.api(`/api/exercises/log/${log.id}`, { method: 'DELETE' });
                                loadExerciseLog();
                            } catch (e) {
                                app.showToast('Failed to delete', 'error');
                            }
                        }
                    });

                    els.logBody.appendChild(tr);
                });
            }

        } catch (error) {
            app.showToast('Failed to load logs', 'error');
        }
    }

    init();
});
