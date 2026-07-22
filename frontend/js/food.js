// FIT FOOD — Food Logger Logic

document.addEventListener('DOMContentLoaded', async () => {
    if (!app.checkAuth()) return;

    const els = {
        datePicker: document.getElementById('date-picker'),
        mealTabs: document.querySelectorAll('.meal-tab'),
        searchInput: document.getElementById('food-search'),
        catFilters: document.getElementById('category-filters'),
        searchResults: document.getElementById('food-results'),
        searchLoading: document.getElementById('search-loading'),
        
        logBody: document.getElementById('food-log-body'),
        emptyLog: document.getElementById('empty-log'),
        totalCal: document.getElementById('total-cal'),
        goalCal: document.getElementById('goal-cal'),
        
        // Modal
        modal: document.getElementById('add-modal'),
        closeModalBtn: document.getElementById('close-modal'),
        form: document.getElementById('add-food-form'),
        mName: document.getElementById('modal-food-name'),
        mBaseCal: document.getElementById('modal-base-cal'),
        mServing: document.getElementById('modal-serving'),
        mQty: document.getElementById('modal-qty'),
        mMealType: document.getElementById('modal-meal-type'),
        mData: document.getElementById('food-data'),
        
        dQty: document.getElementById('display-qty'),
        cCal: document.getElementById('calc-cal'),
        cP: document.getElementById('calc-p'),
        cC: document.getElementById('calc-c'),
        cF: document.getElementById('calc-f'),
        saveBtn: document.getElementById('save-food-btn'),
        resetLogBtn: document.getElementById('reset-log-btn')
    };

    let selectedMealType = 'snack';
    let currentDate = app.formatDate(new Date());
    let searchTimeout = null;

    // Initialization
    async function init() {
        els.datePicker.value = currentDate;
        
        const user = JSON.parse(localStorage.getItem('user'));
        els.goalCal.innerText = user.daily_calorie_goal;

        // Load Categories
        await loadCategories();
        
        // Load Today's Log
        await loadFoodLog();
        
        // Load initial search
        await performSearch();
    }

    // Event Listeners
    if (els.resetLogBtn) {
        els.resetLogBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to reset all food logs for today?')) {
                try {
                    await app.api(`/api/foods/log/reset?date=${currentDate}`, { method: 'DELETE' });
                    app.showToast('Daily food log reset successfully!', 'success');
                    await loadFoodLog();
                } catch (e) {
                    app.showToast('Failed to reset food log', 'error');
                }
            }
        });
    }

    els.datePicker.addEventListener('change', (e) => {
        currentDate = e.target.value;
        loadFoodLog();
    });

    els.mealTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            els.mealTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            selectedMealType = tab.dataset.meal;
        });
    });

    els.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 300);
    });

    // Close modal
    els.closeModalBtn.addEventListener('click', () => {
        els.modal.classList.remove('show');
    });

    // Modal Qty Change -> Recalculate
    els.mQty.addEventListener('input', () => {
        const qty = parseFloat(els.mQty.value) || 0;
        els.dQty.innerText = qty;
        
        if (els.mData.value) {
            const food = JSON.parse(els.mData.value);
            els.cCal.innerText = Math.round(food.calories * qty);
            els.cP.innerText = (food.protein * qty).toFixed(1);
            els.cC.innerText = (food.carbs * qty).toFixed(1);
            els.cF.innerText = (food.fat * qty).toFixed(1);
        }
    });

    // Add Food Form Submit
    els.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const food = JSON.parse(els.mData.value);
        const qty = parseFloat(els.mQty.value);
        
        els.saveBtn.disabled = true;
        els.saveBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>';

        try {
            await app.api('/api/foods/log', {
                method: 'POST',
                body: JSON.stringify({
                    food_name: food.name,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fat: food.fat,
                    fiber: food.fiber,
                    quantity: qty,
                    meal_type: els.mMealType.value
                })
            });

            app.showToast('Food logged successfully!', 'success');
            els.modal.classList.remove('show');
            await loadFoodLog();
        } catch (error) {
            app.showToast('Failed to log food', 'error');
        } finally {
            els.saveBtn.disabled = false;
            els.saveBtn.innerHTML = 'Log Food';
        }
    });

    // Load Categories
    async function loadCategories() {
        try {
            const categories = await app.api('/api/foods/categories');
            
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
            
            // Add listener to 'All' tab
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
        
        let url = '/api/foods/database';
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
                els.searchResults.innerHTML = '<div class="col-span-full text-center text-muted">No foods found. Try a different search.</div>';
                return;
            }

            results.forEach(food => {
                const card = document.createElement('div');
                card.className = 'item-card glass-card';
                card.innerHTML = `
                    <div class="item-header">
                        <div class="item-name">${food.name}</div>
                        <div class="item-category">${food.category}</div>
                    </div>
                    <div class="item-calories">${food.calories} <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted)">kcal</span></div>
                    <div class="item-serving">per ${food.serving}</div>
                    <div class="item-macros">
                        <div class="macro">P: <span>${food.protein}g</span></div>
                        <div class="macro">C: <span>${food.carbs}g</span></div>
                        <div class="macro">F: <span>${food.fat}g</span></div>
                    </div>
                `;
                
                card.addEventListener('click', () => openModal(food));
                els.searchResults.appendChild(card);
            });

        } catch (error) {
            els.searchLoading.classList.add('hidden');
            app.showToast('Search failed', 'error');
        }
    }

    // Open Add Food Modal
    function openModal(food) {
        els.mName.innerText = food.name;
        els.mBaseCal.innerText = food.calories;
        els.mServing.innerText = `1 serving = ${food.serving}`;
        els.mQty.value = 1;
        els.mMealType.value = selectedMealType;
        els.mData.value = JSON.stringify(food);
        
        // Dispatch input event to trigger calculation
        els.mQty.dispatchEvent(new Event('input'));
        
        els.modal.classList.add('show');
    }

    // Load Food Log for Date
    async function loadFoodLog() {
        try {
            // Get Log
            const logs = await app.api(`/api/foods/log?date=${currentDate}`);
            
            // Get Summary
            const { summary } = await app.api(`/api/foods/summary?date=${currentDate}`);
            
            // Update total calories
            els.totalCal.innerText = Math.round(summary.total_calories);

            // Render Table
            els.logBody.innerHTML = '';
            
            if (logs.length === 0) {
                els.logBody.parentElement.style.display = 'none';
                els.emptyLog.style.display = 'block';
            } else {
                els.logBody.parentElement.style.display = 'table';
                els.emptyLog.style.display = 'none';

                logs.forEach(log => {
                    const tr = document.createElement('tr');
                    
                    const p = Math.round(log.protein);
                    const c = Math.round(log.carbs);
                    const f = Math.round(log.fat);

                    tr.innerHTML = `
                        <td style="font-weight: 600;">${log.food_name}</td>
                        <td><span class="meal-badge meal-${log.meal_type}">${log.meal_type.charAt(0).toUpperCase() + log.meal_type.slice(1)}</span></td>
                        <td>${log.quantity}</td>
                        <td class="cal-value">${Math.round(log.calories)}</td>
                        <td style="font-size: 0.8rem; color: var(--text-muted);">${p}g / ${c}g / ${f}g</td>
                        <td>
                            <button class="delete-btn" data-id="${log.id}">🗑️</button>
                        </td>
                    `;

                    // Delete handler
                    tr.querySelector('.delete-btn').addEventListener('click', async () => {
                        if (confirm(`Remove ${log.food_name}?`)) {
                            try {
                                await app.api(`/api/foods/log/${log.id}`, { method: 'DELETE' });
                                loadFoodLog();
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

    // Run
    init();
});
