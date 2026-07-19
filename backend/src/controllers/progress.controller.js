const supabase = require('../supabase');

exports.getStats = async (req, res) => {
    const userId = req.user.id;
    const { data: user } = await supabase.from('User').select('*').eq('id', userId).single();

    // Total food entries
    const { count: totalFoodEntries } = await supabase
        .from('MealLog')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId);

    // Total exercises
    const { count: totalExercises } = await supabase
        .from('Workout')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId);

    // Total calories burned from workouts
    const { data: workouts } = await supabase
        .from('Workout')
        .select('caloriesBurned')
        .eq('userId', userId);

    let totalCaloriesBurned = 0;
    if (workouts) {
        workouts.forEach(w => totalCaloriesBurned += (w.caloriesBurned || 0));
    }

    // Weight change (latest minus previous)
    const { data: progressEntries } = await supabase
        .from('ProgressEntry')
        .select('*')
        .eq('userId', userId)
        .order('date', { ascending: false })
        .limit(2);

    let weightChange = 0;
    if (progressEntries && progressEntries.length >= 2) {
        // Most recent minus second most recent
        weightChange = (progressEntries[0].weight - progressEntries[1].weight).toFixed(1);
    }

    const currentWeight = user?.weight || 0;
    const heightM = user?.height ? user.height / 100 : 1.75;
    const bmiRaw = currentWeight && heightM ? currentWeight / (heightM * heightM) : 0;
    const bmi = parseFloat(bmiRaw.toFixed(1));

    let bmiCategory = 'Normal';
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi < 25) bmiCategory = 'Normal';
    else if (bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obese';

    res.json({
        totalFoodEntries: totalFoodEntries || 0,
        totalExercises: totalExercises || 0,
        totalCaloriesBurned: Math.round(totalCaloriesBurned),
        currentWeight,
        weightChange,
        bmi,
        bmiCategory
    });
};

exports.getStreak = async (req, res) => {
    const userId = req.user.id;

    // Count total days user logged food
    const { data: mealDays } = await supabase
        .from('MealLog')
        .select('date')
        .eq('userId', userId)
        .order('date', { ascending: false });

    let uniqueDays = new Set();
    if (mealDays) {
        mealDays.forEach(m => {
            if (m.date) uniqueDays.add(m.date.split('T')[0]);
        });
    }
    const totalDays = uniqueDays.size;

    // Calculate streak (consecutive days from today backwards)
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (uniqueDays.has(dateStr)) {
            streak++;
        } else if (i === 0) {
            // If today has no logs, check yesterday
            continue;
        } else {
            break;
        }
    }

    res.json({ streak, totalDays });
};

exports.logWeight = async (req, res) => {
    const { weight, bodyFat } = req.body;
    const userId = req.user.id;
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const { data: entry, error } = await supabase.from('ProgressEntry').insert([{
        userId,
        weight: parseFloat(weight),
        bodyFatPercent: bodyFat ? parseFloat(bodyFat) : null,
        date: date.toISOString()
    }]).select().single();

    if (error) return res.status(500).json({ error: true, details: error });

    // Update user's current weight and recalculate calorie goal
    await supabase.from('User').update({ weight: parseFloat(weight), updatedAt: new Date().toISOString() }).eq('id', userId);

    // Return with weight and daily_calorie_goal for frontend to update
    const { data: user } = await supabase.from('User').select('dailyCalorieGoal').eq('id', userId).single();

    res.status(201).json({
        ...entry,
        daily_calorie_goal: user?.dailyCalorieGoal || 2000
    });
};

exports.getWeightHistory = async (req, res) => {
    const userId = req.user.id;
    const { data: history } = await supabase
        .from('ProgressEntry')
        .select('*')
        .eq('userId', userId)
        .order('date', { ascending: true })
        .limit(30);
    
    const formatted = (history || []).map(h => ({
        date: h.date.split('T')[0],
        weight: h.weight
    }));

    res.json(formatted);
};

exports.getCaloriesHistory = async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 7;
    
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    // Fetch meal logs
    const { data: mealLogs } = await supabase
        .from('MealLog')
        .select('*, Food(*)')
        .eq('userId', userId)
        .gte('date', since.toISOString());

    // Fetch workout logs
    const { data: workoutLogs } = await supabase
        .from('Workout')
        .select('date, caloriesBurned')
        .eq('userId', userId)
        .gte('date', since.toISOString());

    // Build daily data with both consumed and burned
    const dailyData = {};

    if (mealLogs) {
        mealLogs.forEach(log => {
            if (log.Food) {
                const d = log.date.split('T')[0];
                if (!dailyData[d]) dailyData[d] = { consumed: 0, burned: 0 };
                dailyData[d].consumed += log.Food.calories * log.quantity;
            }
        });
    }

    if (workoutLogs) {
        workoutLogs.forEach(log => {
            const d = log.date.split('T')[0];
            if (!dailyData[d]) dailyData[d] = { consumed: 0, burned: 0 };
            dailyData[d].burned += (log.caloriesBurned || 0);
        });
    }

    const results = Object.keys(dailyData).map(d => ({
        date: d,
        consumed: Math.round(dailyData[d].consumed),
        burned: Math.round(dailyData[d].burned),
        // Keep 'calories' field for backwards compat with dashboard chart
        calories: Math.round(dailyData[d].consumed)
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(results);
};
