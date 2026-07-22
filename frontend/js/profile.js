// FIT FOOD — Profile Logic

document.addEventListener('DOMContentLoaded', async () => {
    if (!app.checkAuth()) return;

    const els = {
        mainAvatar: document.getElementById('main-avatar'),
        profileName: document.getElementById('profile-name'),
        profileEmail: document.getElementById('profile-email'),
        memberSince: document.getElementById('member-since'),
        goalCal: document.getElementById('profile-goal-cal'),
        
        // Form Inputs
        name: document.getElementById('name'),
        age: document.getElementById('age'),
        gender: document.getElementById('gender'),
        height: document.getElementById('height'),
        weight: document.getElementById('weight'),
        activityLevel: document.getElementById('activity_level'),
        goal: document.getElementById('goal'),
        
        profileForm: document.getElementById('profile-form'),
        saveProfileBtn: document.getElementById('save-profile-btn'),
        
        pwdForm: document.getElementById('password-form'),
        currPwd: document.getElementById('current-pwd'),
        newPwd: document.getElementById('new-pwd'),
        confPwd: document.getElementById('confirm-pwd'),
        savePwdBtn: document.getElementById('save-pwd-btn'),
        
        logoutBtn: document.getElementById('logout-btn')
    };

    async function loadProfile() {
        try {
            const data = await app.api('/api/auth/me');
            
            // Header
            if (data.avatarUrl) {
                const fullAvatarUrl = data.avatarUrl.startsWith('http') ? data.avatarUrl : (BASE_URL + data.avatarUrl);
                els.mainAvatar.innerHTML = `<img src="${fullAvatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
                els.mainAvatar.style.background = 'transparent';
            } else {
                els.mainAvatar.innerText = data.name.charAt(0).toUpperCase();
                els.mainAvatar.style.background = data.avatar_color || '#a3ff12';
            }
            els.profileName.innerText = data.name;
            els.profileEmail.innerText = data.email;
            
            const d = new Date(data.created_at);
            els.memberSince.innerText = `Member since: ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
            
            els.goalCal.innerText = data.daily_calorie_goal;

            // Form
            els.name.value = data.name;
            els.age.value = data.age;
            els.gender.value = data.gender;
            els.height.value = data.height;
            els.weight.value = data.weight;
            els.activityLevel.value = data.activity_level;
            els.goal.value = data.goal;

        } catch (error) {
            app.showToast('Failed to load profile', 'error');
        }
    }

    els.profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        els.saveProfileBtn.disabled = true;
        els.saveProfileBtn.innerText = 'Saving...';

        try {
            const res = await app.api('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    name: els.name.value,
                    age: parseInt(els.age.value),
                    gender: els.gender.value,
                    height: parseFloat(els.height.value),
                    weight: parseFloat(els.weight.value),
                    activity_level: els.activityLevel.value,
                    goal: els.goal.value
                })
            });

            app.showToast('Profile updated successfully!', 'success');
            els.goalCal.innerText = res.daily_calorie_goal;
            els.profileName.innerText = els.name.value;
            
            // Update local storage user data
            const user = JSON.parse(localStorage.getItem('user'));
            user.name = els.name.value;
            user.weight = parseFloat(els.weight.value);
            user.daily_calorie_goal = res.daily_calorie_goal;
            localStorage.setItem('user', JSON.stringify(user));
            
            app.initSidebar(); // Refresh sidebar

        } catch (error) {
            app.showToast('Failed to update profile', 'error');
        } finally {
            els.saveProfileBtn.disabled = false;
            els.saveProfileBtn.innerText = 'Save Changes';
        }
    });

    els.pwdForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (els.newPwd.value !== els.confPwd.value) {
            app.showToast('New passwords do not match!', 'error');
            return;
        }

        els.savePwdBtn.disabled = true;
        els.savePwdBtn.innerText = 'Changing...';

        try {
            await app.api('/api/auth/password', {
                method: 'PUT',
                body: JSON.stringify({
                    currentPassword: els.currPwd.value,
                    newPassword: els.newPwd.value
                })
            });

            app.showToast('Password changed successfully!', 'success');
            els.pwdForm.reset();

        } catch (error) {
            app.showToast(error.message || 'Failed to change password', 'error');
        } finally {
            els.savePwdBtn.disabled = false;
            els.savePwdBtn.innerText = 'Change Password';
        }
    });

    els.logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) {
            app.logout();
        }
    });

    loadProfile();
});
