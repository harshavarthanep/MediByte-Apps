/**
 * admin-signup.js
 * Handles logic for the Admin Signup Page (admin-signup.html)
 */

document.addEventListener('DOMContentLoaded', () => {
    const adminSignupForm = document.getElementById('adminSignupForm');

    if (adminSignupForm) {
        adminSignupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const adminEmail = document.getElementById('adminEmail').value.trim();
            const adminId = document.getElementById('adminId').value.trim();
            const adminPassword = document.getElementById('adminPassword').value.trim();
            const adminAuthPassword = document.getElementById('adminAuthPassword').value.trim();

            if (!adminEmail || !adminId || !adminPassword || !adminAuthPassword) {
                Auth.showMessage('signupMessage', 'Please fill in all fields.', 'error');
                return;
            }

            if (adminAuthPassword !== 'Papa@2606') {
                Auth.showMessage('signupMessage', 'Incorrect authorization password.', 'error');
                return;
            }

            // Attempt admin creation using Auth utility
            const response = Auth.createAdmin(adminEmail, adminId, adminPassword);

            if (response.success) {
                Auth.showMessage('signupMessage', 'Admin account created successfully! Redirecting to login...', 'success');
                // Optional: clear the form so the user sees success
                adminSignupForm.reset();
                // Redirect to admin login
                setTimeout(() => {
                    window.location.href = 'admin-login.html';
                }, 1500);
            } else {
                // Example error: "Admin with this Email or User ID already exists."
                Auth.showMessage('signupMessage', response.message, 'error');
            }
        });
    }
});
