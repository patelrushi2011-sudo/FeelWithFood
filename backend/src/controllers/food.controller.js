const supabase = require('../supabase');

exports.logFood = async (req, res) => {
    const { food_name, calories, protein, carbs, fat, quantity, meal_type } = req.body;
    const userId = req.user.id;
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    // Let's find or create the food
    let { data: foods } = await supabase.from('Food').select('*').eq('name', food_name).limit(1);
    let food = foods && foods.length > 0 ? foods[0] : null;
    
    if (!food) {
        const { data: newFood, error } = await supabase.from('Food').insert([{
            name: food_name,
            calories: parseFloat(calories),
            protein: parseFloat(protein),
            carbs: parseFloat(carbs),
            fat: parseFloat(fat),
            servingSize: 1,
            servingUnit: 'serving',
            userId: userId,
            updatedAt: new Date().toISOString()
        }]).select().single();
        food = newFood;
    }

    const { data: log, error } = await supabase.from('MealLog').insert([{
        userId,
        foodId: food.id,
        quantity: parseFloat(quantity),
        mealType: meal_type,
        date: date.toISOString()
    }]).select().single();

    if (error) return res.status(500).json({ error: true, details: error });

    res.status(201).json(log);
};

exports.getFoodLog = async (req, res) => {
    const userId = req.user.id;
    const dateQuery = req.query.date;
    const date = dateQuery ? new Date(dateQuery) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const { data: logs } = await supabase
        .from('MealLog')
        .select('*, Food(*)')
        .eq('userId', userId)
        .gte('date', date.toISOString())
        .lt('date', nextDay.toISOString());

    const formattedLogs = (logs || []).map(log => ({
        id: log.id,
        food_name: log.Food ? log.Food.name : 'Unknown Food',
        meal_type: log.mealType,
        quantity: log.quantity,
        calories: log.Food ? log.Food.calories * log.quantity : 0,
        protein: log.Food ? log.Food.protein * log.quantity : 0,
        carbs: log.Food ? log.Food.carbs * log.quantity : 0,
        fat: log.Food ? log.Food.fat * log.quantity : 0
    }));

    res.json(formattedLogs);
};

exports.deleteFoodLog = async (req, res) => {
    const { id } = req.params;
    await supabase.from('MealLog').delete().eq('id', parseInt(id));
    res.json({ message: 'Deleted' });
};

exports.getCategories = async (req, res) => {
    const foodsData = require('../../data/foods');
    const categories = [...new Set(foodsData.map(f => f.category))];
    res.json(categories);
};

exports.searchDatabase = async (req, res) => {
    const { q, category } = req.query;
    
    // Use the static foods data file for rich category support
    const foodsData = require('../../data/foods');
    
    let results = foodsData;
    
    if (q) {
        const query = q.toLowerCase();
        results = results.filter(f => f.name.toLowerCase().includes(query));
    }
    
    if (category && category !== 'all') {
        results = results.filter(f => f.category.toLowerCase() === category.toLowerCase());
    }
    
    // Return top 50 results formatted for the frontend
    const formatted = results.slice(0, 50).map(f => ({
        name: f.name,
        category: f.category,
        calories: parseFloat(f.calories) || 0,
        protein: parseFloat(f.protein) || 0,
        carbs: parseFloat(f.carbs) || 0,
        fat: parseFloat(f.fat) || 0,
        fiber: parseFloat(f.fiber) || 0,
        serving: f.serving || '1 serving',
    }));
    
    res.json(formatted);
};

exports.getSummary = async (req, res) => {
    const userId = req.user.id;
    const dateQuery = req.query.date;
    const date = dateQuery ? new Date(dateQuery) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const { data: logs } = await supabase
        .from('MealLog')
        .select('*, Food(*)')
        .eq('userId', userId)
        .gte('date', date.toISOString())
        .lt('date', nextDay.toISOString());

    let total_calories = 0, total_protein = 0, total_carbs = 0, total_fat = 0;
    if (logs) {
        logs.forEach(log => {
            if (log.Food) {
                total_calories += log.Food.calories * log.quantity;
                total_protein += log.Food.protein * log.quantity;
                total_carbs += log.Food.carbs * log.quantity;
                total_fat += log.Food.fat * log.quantity;
            }
        });
    }

    res.json({
        summary: {
            total_calories, total_protein, total_carbs, total_fat
        }
    });
};

