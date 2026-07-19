const supabase = require('../supabase');

exports.logWater = async (req, res) => {
    const { amount_ml } = req.body;
    const userId = req.user.id;
    // Frontend usually doesn't pass date, let's use today
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const { data: log, error } = await supabase.from('WaterLog').insert([{
        userId,
        amountMl: parseInt(amount_ml) || 250,
        date: date.toISOString()
    }]).select().single();

    if (error) return res.status(500).json({ error: true, details: error });

    res.status(201).json(log);
};

exports.getWaterLog = async (req, res) => {
    const userId = req.user.id;
    const dateQuery = req.query.date;
    const date = dateQuery ? new Date(dateQuery) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const { data: logs } = await supabase
        .from('WaterLog')
        .select('*')
        .eq('userId', userId)
        .gte('date', date.toISOString())
        .lt('date', nextDay.toISOString());

    let total = 0;
    if (logs) {
        logs.forEach(l => total += l.amountMl);
    }

    res.json({ total_ml: total, logs: logs || [] });
};

