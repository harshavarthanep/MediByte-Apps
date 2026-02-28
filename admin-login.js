/**
 * admin-login.js
 * Handles logic for the Admin Login Page (admin-login.html)
 */

document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const adminId = document.getElementById('adminId').value.trim();
            const adminPassword = document.getElementById('adminPassword').value.trim();

            if (!adminId || !adminPassword) {
                Auth.showMessage('loginMessage', 'Please fill in all fields.', 'error');
                return;
            }

            // Attempt admin login using Auth utility
            const response = Auth.loginAdmin(adminId, adminPassword);

            if (response.success) {
                Auth.showMessage('loginMessage', 'Admin Login successful! Redirecting...', 'success');
                // Redirect to admin dashboard
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            } else {
                // Show "invalid userid or password" error
                Auth.showMessage('loginMessage', response.message, 'error');
            }
        });
    }
});
