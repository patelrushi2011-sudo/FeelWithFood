const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../supabase');
const { sendLoginNotification, sendSignupNotification, sendPasswordResetEmail } = require('../utils/mailer');

const login = async (req, res) => {
    const { email, password } = req.body;

    // email variable here could be an email address or a phone number
    const { data: users, error } = await supabase
        .from('User')
        .select('*')
        .or(`email.eq.${email},phoneNumber.eq.${email}`)
        .limit(1);

    if (error || !users || users.length === 0) {
        return res.status(401).json({ error: true, message: 'Invalid credentials', statusCode: 401 });
    }
    
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        return res.status(401).json({ error: true, message: 'Invalid credentials', statusCode: 401 });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send email notification in the background
    sendLoginNotification(user.email, user.name);

    res.json({
        error: false,
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            daily_calorie_goal: user.dailyCalorieGoal || 2000,
            avatarUrl: user.avatarUrl,
            avatar_color: user.avatarUrl ? 'transparent' : (user.avatarColor || '#a3ff12')
        }
    });
};

const register = async (req, res) => {
    const { name, email, password, phone, age, gender, height, weight, activityLevel, activity_level, goal } = req.body;
    const resolvedActivityLevel = activityLevel || activity_level;

    const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('email', email)
        .limit(1);

    if (existingUser && existingUser.length > 0) {
        return res.status(409).json({ error: true, message: 'Email already in use', statusCode: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const { data: newUserObj, error } = await supabase
        .from('User')
        .insert([{
            name,
            email,
            passwordHash,
            phoneNumber: phone || null,
            age: age ? parseInt(age) : null,
            gender,
            height: height ? parseFloat(height) : null,
            weight: weight ? parseFloat(weight) : null,
            activityLevel: resolvedActivityLevel,
            dailyCalorieGoal: 2000,
            updatedAt: new Date().toISOString()
        }])
        .select()
        .single();

    if (error || !newUserObj) {
        return res.status(500).json({ error: true, message: 'Failed to create account', statusCode: 500, details: error });
    }

    const newUser = newUserObj;
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Get total user count to send in the email
    const { count } = await supabase.from('User').select('*', { count: 'exact', head: true });
    
    // Send email notification to you (admin)
    sendSignupNotification(newUser.email, newUser.name, count || 1);

    res.status(201).json({
        error: false,
        message: 'Account created successfully',
        token,
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            daily_calorie_goal: newUser.dailyCalorieGoal || 2000,
            avatarUrl: newUser.avatarUrl,
            avatar_color: newUser.avatarUrl ? 'transparent' : (newUser.avatarColor || '#a3ff12')
        }
    });
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const { data: users } = await supabase
        .from('User')
        .select('*')
        .or(`email.eq.${email},phoneNumber.eq.${email}`)
        .limit(1);

    if (!users || users.length === 0) {
        // Return 200 anyway to prevent email enumeration
        return res.json({ error: false, message: 'If an account exists, a reset link has been sent.' });
    }
    const user = users[0];

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await supabase
        .from('User')
        .update({ resetToken, resetTokenExpiry, updatedAt: new Date().toISOString() })
        .eq('id', user.id);

    sendPasswordResetEmail(user.email, resetToken);

    res.json({ error: false, message: 'If an account exists, a reset link has been sent.' });
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    const { data: users } = await supabase
        .from('User')
        .select('*')
        .eq('resetToken', token)
        .gt('resetTokenExpiry', new Date().toISOString())
        .limit(1);

    if (!users || users.length === 0) {
        return res.status(400).json({ error: true, message: 'Invalid or expired reset token', statusCode: 400 });
    }
    const user = users[0];

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await supabase
        .from('User')
        .update({
            passwordHash,
            resetToken: null,
            resetTokenExpiry: null,
            updatedAt: new Date().toISOString()
        })
        .eq('id', user.id);

    res.json({ error: false, message: 'Password has been successfully reset.' });
};

const getMe = async (req, res) => {
    const { data: user, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', req.user.id)
        .single();
        
    if (error || !user) return res.status(404).json({ error: true, message: 'User not found' });
    
    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activity_level: user.activityLevel,
        goal: 'maintain', // dummy mapping
        daily_calorie_goal: user.dailyCalorieGoal || 2000,
        avatarUrl: user.avatarUrl,
        avatar_color: user.avatarUrl ? 'transparent' : (user.avatarColor || '#a3ff12'),
        created_at: user.createdAt
    });
};

const updateProfile = async (req, res) => {
    const { name, age, gender, height, weight, activity_level, goal } = req.body;
    
    const { data: user, error } = await supabase
        .from('User')
        .update({
            name,
            age: parseInt(age),
            gender,
            height: parseFloat(height),
            weight: parseFloat(weight),
            activityLevel: activity_level,
            updatedAt: new Date().toISOString()
        })
        .eq('id', req.user.id)
        .select()
        .single();
        
    if (error) return res.status(500).json({ error: true, message: 'Failed to update profile' });
        
    res.json({
        daily_calorie_goal: user.dailyCalorieGoal || 2000
    });
};

const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    const { data: user, error: fetchError } = await supabase
        .from('User')
        .select('passwordHash')
        .eq('id', req.user.id)
        .single();
        
    if (fetchError || !user) return res.status(404).json({ error: true, message: 'User not found' });
    
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: true, message: 'Incorrect current password' });
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const { error: updateError } = await supabase
        .from('User')
        .update({ passwordHash, updatedAt: new Date().toISOString() })
        .eq('id', req.user.id);
        
    if (updateError) return res.status(500).json({ error: true, message: 'Failed to update password' });
        
    res.json({ success: true });
};

module.exports = {
    login,
    register,
    forgotPassword,
    resetPassword,
    getMe,
    updateProfile,
    updatePassword
};

