/**
 * login.js
 * Handles the logic for the user login page (index.html)
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Store failed attempts in memory for the session
    const failedAttempts = {};

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const userId = document.getElementById('userId').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!userId || !password) {
                Auth.showMessage('loginMessage', 'Please fill in all fields.', 'error');
                return;
            }

            // Attempt user login using Auth utility
            const response = Auth.loginUser(userId, password);

            if (response.success) {
                // Reset failed attempts for this user on success
                failedAttempts[userId] = 0;

                Auth.showMessage('loginMessage', 'Login successful! Redirecting...', 'success');
                // Redirect to main user page
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1000);
            } else {
                // Check if the user has an approved reset request
                const isApproved = Auth.checkApprovedRequest(userId);
                if (isApproved) {
                    Auth.showMessage('loginMessage', 'Your password reset request was approved! Please set a new password.', 'success');
                    const setNewPasswordModal = document.getElementById('setNewPasswordModal');
                    const approvedUserIdInput = document.getElementById('approvedUserId');
                    if (setNewPasswordModal && approvedUserIdInput) {
                        setNewPasswordModal.style.display = 'flex';
                        approvedUserIdInput.value = userId;
                    }
                    return;
                }

                // Handle Failed Login normal flow
                if (!failedAttempts[userId]) {
                    failedAttempts[userId] = 0;
                }
                failedAttempts[userId]++;

                // If failed more than 2 times
                if (failedAttempts[userId] > 2) {
                    // Try to get the user's email to simulate sending an email
                    const users = Auth.getUsers();
                    const user = users.find(u => u.userId === userId);

                    if (user && user.email) {
                        // Simulate sending an email
                        console.log(`[EMAIL DISPATCHED] To: ${user.email} | Subject: Suspicious Login Activity | Body: Someone is trying to access your account.`);
                        Auth.showMessage('loginMessage', `${response.message} A security notification has been sent to your registered email.`, 'error');
                    } else {
                        // User not found or no email, just show generic error
                        Auth.showMessage('loginMessage', `${response.message} Too many failed attempts.`, 'error');
                    }
                } else {
                    // Show standard "invalid userid or password" error
                    Auth.showMessage('loginMessage', response.message, 'error');
                }
            }
        });
    }

    // ---- PASSWORD RESET FLOW ----
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeForgotModalBtn = document.getElementById('closeForgotModalBtn');
    const resetRequestForm = document.getElementById('resetRequestForm');

    const setNewPasswordModal = document.getElementById('setNewPasswordModal');
    const closeSetPasswordModalBtn = document.getElementById('closeSetPasswordModalBtn');
    const setNewPasswordForm = document.getElementById('setNewPasswordForm');
    const approvedUserIdInput = document.getElementById('approvedUserId');

    if (forgotPasswordBtn && forgotPasswordModal) {
        forgotPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordModal.style.display = 'flex';
        });

        closeForgotModalBtn.addEventListener('click', () => {
            forgotPasswordModal.style.display = 'none';
        });

        resetRequestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const resetUserId = document.getElementById('resetUserId').value.trim();
            if (!resetUserId) return;

            // First check if already approved
            const isApproved = Auth.checkApprovedRequest(resetUserId);
            if (isApproved) {
                forgotPasswordModal.style.display = 'none';
                setNewPasswordModal.style.display = 'flex';
                approvedUserIdInput.value = resetUserId;
                return;
            }

            // Create request
            const response = Auth.createResetRequest(resetUserId);
            if (response.success) {
                Auth.showMessage('resetMessage', response.message, 'success');
                setTimeout(() => {
                    forgotPasswordModal.style.display = 'none';
                    resetRequestForm.reset();
                }, 2000);
            } else {
                if (response.message.includes('approved')) {
                    // Show Set New Password modal
                    forgotPasswordModal.style.display = 'none';
                    setNewPasswordModal.style.display = 'flex';
                    approvedUserIdInput.value = resetUserId;
                } else {
                    Auth.showMessage('resetMessage', response.message, 'error');
                }
            }
        });
    }

    if (setNewPasswordForm) {
        closeSetPasswordModalBtn.addEventListener('click', () => {
            setNewPasswordModal.style.display = 'none';
        });

        setNewPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userId = approvedUserIdInput.value;
            const newPassword = document.getElementById('newPassword').value.trim();

            if (!newPassword || newPassword.length < 6) {
                Auth.showMessage('newPasswordMessage', 'Password must be at least 6 characters.', 'error');
                return;
            }

            const response = Auth.executePasswordReset(userId, newPassword);
            if (response.success) {
                Auth.showMessage('newPasswordMessage', response.message, 'success');
                setTimeout(() => {
                    setNewPasswordModal.style.display = 'none';
                    setNewPasswordForm.reset();
                }, 2000);
            } else {
                Auth.showMessage('newPasswordMessage', response.message, 'error');
            }
        });
    }
});
