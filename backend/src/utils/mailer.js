const nodemailer = require('nodemailer');

// Configure your email transporter
// You should update these credentials in your .env file
const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other email service
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Helper to check if mailer is configured
const isMailerConfigured = () => {
    return process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your-app-password';
};

const sendLoginNotification = async (userEmail, userName) => {
    if (!isMailerConfigured()) {
        console.warn('Email configuration missing or invalid. Skipping login notification.');
        return;
    }
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: process.env.ADMIN_EMAIL || 'patelrushi2011@gmail.com', // Sending to you (the admin)
            subject: `FIT FOOD Alert: New Login from ${userName}`,
            html: `
                <h3>New User Login Detected!</h3>
                <p><strong>Name:</strong> ${userName}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p>Someone just logged into the FIT FOOD platform.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Login notification email sent to admin.');
    } catch (error) {
        console.error('Error sending login email:', error);
    }
};

const sendSignupNotification = async (userEmail, userName, totalUsersCount) => {
    if (!isMailerConfigured()) {
        console.warn('Email configuration missing or invalid. Skipping signup notification.');
        return;
    }
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: 'patelrushi2011@gmail.com', // Sent directly to you
            subject: `FIT FOOD Alert: New User Signup! 🎉`,
            html: `
                <h3>New User Registered!</h3>
                <p><strong>Name:</strong> ${userName}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <hr>
                <p><strong>Total Users on Platform:</strong> ${totalUsersCount}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Signup notification email sent to admin.');
    } catch (error) {
        console.error('Error sending signup email:', error);
    }
};

const sendPasswordResetEmail = async (userEmail, resetToken) => {
    if (!isMailerConfigured()) {
        console.warn('Email configuration missing or invalid. Skipping password reset email.');
        return;
    }
    try {
        const resetUrl = `http://localhost:3000/reset-password.html?token=${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: userEmail,
            subject: `FIT FOOD: Password Reset Request`,
            html: `
                <h3>Password Reset Request</h3>
                <p>You requested a password reset. Click the link below to set a new password:</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
                <p>If you did not request this, please ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent to user.');
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
};

module.exports = {
    sendLoginNotification,
    sendSignupNotification,
    sendPasswordResetEmail
};
