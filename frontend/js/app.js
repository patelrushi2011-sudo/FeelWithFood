// FIT FOOD — Core Application Logic
// Handles authentication, API requests, toasts, and UI interactions

const app = {
    // Check if user is logged in
    checkAuth() {
        const token = localStorage.getItem('token');
        if (!token && window.location.pathname !== '/' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
            window.location.href = '/login';
            return false;
        }
        return true;
    },

    // Centralized API fetcher with token injection
    async api(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(endpoint, config);
            
            // Handle unauthorized or forbidden (token expired/invalid)
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return null;
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'API Request Failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Toast Notification System
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        // Remove toast after animation completes
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    },

    // Initialize sidebar user details
    initSidebar() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const avatar = document.getElementById('sidebar-avatar');
            const name = document.getElementById('sidebar-name');
            const email = document.getElementById('sidebar-email');

            if (avatar) {
                avatar.innerText = user.name.charAt(0).toUpperCase();
                avatar.style.background = user.avatar_color || '#a3ff12';
            }
            if (name) name.innerText = user.name;
            if (email) email.innerText = user.email;
        }

        // Mobile menu toggle
        const toggle = document.getElementById('mobile-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-overlay');

        if (toggle && sidebar && overlay) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('show');
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
            });
        }
    },

    // Format date string for inputs
    formatDate(date) {
        return date.toISOString().split('T')[0];
    },
    
    // Logout function
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    if (app.checkAuth()) {
        app.initSidebar();
    }
});
