const supabase = require('../supabase');

const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id; // from auth middleware
        if (!req.file) {
            return res.status(400).json({ error: true, message: 'No file uploaded', statusCode: 400 });
        }

        const avatarUrl = `/uploads/${req.file.filename}`;

        const { data: updatedUser, error } = await supabase
            .from('User')
            .update({ avatarUrl, updatedAt: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            return res.status(500).json({ error: true, message: 'Internal server error', statusCode: 500 });
        }

        res.json({
            error: false,
            message: 'Avatar uploaded successfully',
            avatarUrl: updatedUser.avatarUrl
        });
    } catch (err) {
        console.error('Error uploading avatar:', err);
        res.status(500).json({ error: true, message: 'Internal server error', statusCode: 500 });
    }
};

module.exports = {
    uploadAvatar
};
