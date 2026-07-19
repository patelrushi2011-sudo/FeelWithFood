const supabase = require('../supabase');

exports.getDashboard = async (req, res) => {
    const userId = req.user.id;
    const dateQuery = req.query.date;
    const date = dateQuery ? new Date(dateQuery) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const { data: user } = await supabase
        .from('User')
        .select('*')
        .eq('id', userId)
        .single();

    if (!user) return res.status(404).json({ error: true, message: 'User not found' });

    // Fetch foods (simulate include by using foreign tables in supabase if properly set, but let's fetch separately if it's a raw join or use Postgrest syntax)
    // Actually, Supabase supports `MealLog(*, Food(*))`
    const { data: mealLogs } = await supabase
        .from('MealLog')
        .select('*, Food(*)')
        .eq('userId', userId)
        .gte('date', date.toISOString())
        .lt('date', nextDay.toISOString());

    let calories_consumed = 0, protein_consumed = 0, carbs_consumed = 0, fat_consumed = 0;
    if (mealLogs) {
        mealLogs.forEach(log => {
            if (log.Food) {
                calories_consumed += log.Food.calories * log.quantity;
                protein_consumed += log.Food.protein * log.quantity;
                carbs_consumed += log.Food.carbs * log.quantity;
                fat_consumed += log.Food.fat * log.quantity;
            }
        });
    }

    // Fetch exercises
    const { data: workouts } = await supabase
        .from('Workout')
        .select('*')
        .eq('userId', userId)
        .gte('date', date.toISOString())
        .lt('date', nextDay.toISOString());

    let calories_burned = 0;
    if (workouts) {
        workouts.forEach(w => calories_burned += w.caloriesBurned);
    }

    // Water
    const { data: waterLogs } = await supabase
        .from('WaterLog')
        .select('*')
        .eq('userId', userId)
        .gte('date', date.toISOString())
        .lt('date', nextDay.toISOString());

    let water_intake = 0;
    if (waterLogs) {
        waterLogs.forEach(w => water_intake += w.amountMl);
    }

    res.json({
        goals: {
            calories: user.dailyCalorieGoal || 2000,
            protein: user.dailyProteinGoal || 150,
            carbs: user.dailyCarbGoal || 200,
            fat: user.dailyFatGoal || 70,
            water: 2500 // default goal
        },
        consumed: {
            calories: calories_consumed,
            protein: protein_consumed,
            carbs: carbs_consumed,
            fat: fat_consumed,
            water: water_intake
        },
        burned: {
            calories: calories_burned
        }
    });
};

