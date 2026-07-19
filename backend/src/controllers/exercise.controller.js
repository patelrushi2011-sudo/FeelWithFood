const supabase = require('../supabase');

exports.logWorkout = async (req, res) => {
    // Fallback to legacy frontend keys if newer keys are missing
    const type = req.body.type || req.body.exercise_name;
    const durationMinutes = req.body.durationMinutes || req.body.duration_min;
    const caloriesBurned = req.body.caloriesBurned || req.body.calories_burned;
    const category = req.body.category || 'General';
    const intensity = req.body.intensity || 'moderate';
    // Store category and intensity in notes as JSON for retrieval
    const notesData = JSON.stringify({ category, intensity });
    const userId = req.user.id;
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const { data: log, error } = await supabase
        .from('Workout')
        .insert([{
            userId,
            type,
            durationMinutes: parseInt(durationMinutes),
            caloriesBurned: parseFloat(caloriesBurned),
            date: date.toISOString(),
            notes: notesData
        }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: true, details: error });

    res.status(201).json(log);
};

exports.getWorkoutLog = async (req, res) => {
    const userId = req.user.id;
    const dateQuery = req.query.date;
    const date = dateQuery ? new Date(dateQuery) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const { data: logs } = await supabase
        .from('Workout')
        .select('*')
        .eq('userId', userId)
        .gte('date', date.toISOString())
        .lt('date', nextDay.toISOString());

    // Map to frontend-compatible fields
    const formatted = (logs || []).map(log => {
        let category = 'General';
        let intensity = 'moderate';
        try {
            if (log.notes) {
                const meta = JSON.parse(log.notes);
                category = meta.category || category;
                intensity = meta.intensity || intensity;
            }
        } catch (e) { /* ignore parse errors, use defaults */ }
        return {
            id: log.id,
            exercise_name: log.type,
            category,
            duration_min: log.durationMinutes,
            calories_burned: log.caloriesBurned,
            intensity
        };
    });

    res.json(formatted);
};

exports.deleteWorkoutLog = async (req, res) => {
    const { id } = req.params;
    await supabase.from('Workout').delete().eq('id', parseInt(id));
    res.json({ message: 'Deleted' });
};

exports.getCategories = async (req, res) => {
    const exercisesData = require('../../data/exercises');
    const categories = [...new Set(exercisesData.map(e => e.category))];
    res.json(categories);
};

exports.searchDatabase = async (req, res) => {
    const { q, category } = req.query;
    const exercisesData = require('../../data/exercises');
    
    let results = exercisesData;
    if (q) {
        results = results.filter(e => e.name.toLowerCase().includes(q.toLowerCase()));
    }
    if (category && category !== 'all') {
        results = results.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }

    res.json(results);
};

exports.getSummary = async (req, res) => {
    const userId = req.user.id;
    const dateQuery = req.query.date;
    const date = dateQuery ? new Date(dateQuery) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const { data: logs } = await supabase
        .from('Workout')
        .select('*')
        .eq('userId', userId)
        .gte('date', date.toISOString())
        .lt('date', nextDay.toISOString());

    let total_duration = 0;
    let total_burned = 0;

    if (logs) {
        logs.forEach(log => {
            total_duration += log.durationMinutes;
            total_burned += log.caloriesBurned;
        });
    }

    res.json({
        total_duration,
        total_burned
    });
};

