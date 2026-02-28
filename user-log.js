/**
 * user-log.js
 * Handles logic for the User Log page (user-log.html)
 */

// Check auth immediately
Auth.checkAuth('admin');

document.addEventListener('DOMContentLoaded', () => {
    // Handle Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
    });

    const createUserForm = document.getElementById('createUserForm');
    const userListContainer = document.getElementById('userList');

    // Function to render the list of users
    const renderUsers = () => {
        const users = Auth.getUsers();
        userListContainer.innerHTML = ''; // Clear container

        if (users.length === 0) {
            userListContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No users found.</p>';
            return;
        }

        // We display passwords here only because it's a simulated admin view for demonstration.
        // In reality, passwords would be hashed and not visible.
        users.forEach(user => {
            const item = document.createElement('div');
            item.className = 'user-item';
            item.style.flexDirection = 'column';
            item.style.alignItems = 'flex-start';
            item.style.gap = '8px';

            const headerRow = document.createElement('div');
            headerRow.style.display = 'flex';
            headerRow.style.justifyContent = 'space-between';
            headerRow.style.width = '100%';

            const idSpan = document.createElement('span');
            idSpan.className = 'user-id';
            idSpan.textContent = `User ID: ${user.userId}`;

            const pwdSpan = document.createElement('span');
            pwdSpan.className = 'user-password';
            pwdSpan.textContent = `Password: ${user.password}`;

            const titleCol = document.createElement('div');
            titleCol.style.display = 'flex';
            titleCol.style.flexDirection = 'column';
            titleCol.appendChild(idSpan);
            titleCol.appendChild(pwdSpan);

            const actionsCol = document.createElement('div');
            actionsCol.style.display = 'flex';
            actionsCol.style.gap = '8px';

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'btn';
            editBtn.style.padding = '4px 8px';
            editBtn.style.fontSize = '0.8rem';
            editBtn.addEventListener('click', () => openEditModal(user));

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'btn-logout';
            deleteBtn.style.padding = '4px 8px';
            deleteBtn.style.fontSize = '0.8rem';
            deleteBtn.addEventListener('click', () => deleteUser(user.userId));

            const admins = Auth.getAdmins();
            const isAdmin = admins.find(a => a.userId === user.userId);

            const adminBtn = document.createElement('button');
            adminBtn.style.padding = '4px 8px';
            adminBtn.style.fontSize = '0.8rem';
            adminBtn.style.border = 'none';
            adminBtn.style.borderRadius = '4px';
            adminBtn.style.color = 'white';
            adminBtn.style.cursor = 'pointer';
            adminBtn.style.fontWeight = '600';

            if (isAdmin) {
                adminBtn.textContent = 'Revoke Admin';
                adminBtn.style.backgroundColor = '#f59e0b'; // Amber
                adminBtn.addEventListener('click', () => {
                    const res = Auth.revokeAdminAccess(user.userId);
                    if (res.success) renderUsers();
                    else alert(res.message);
                });
            } else {
                adminBtn.textContent = 'Grant Admin';
                adminBtn.style.backgroundColor = '#10b981'; // Emerald
                adminBtn.addEventListener('click', () => {
                    const res = Auth.grantAdminAccess(user.userId);
                    if (res.success) renderUsers();
                    else alert(res.message);
                });
            }

            actionsCol.appendChild(editBtn);
            actionsCol.appendChild(deleteBtn);
            actionsCol.appendChild(adminBtn);

            headerRow.appendChild(titleCol);
            headerRow.appendChild(actionsCol);

            const detailsRow = document.createElement('div');
            detailsRow.style.fontSize = '0.85rem';
            detailsRow.style.color = 'var(--text-secondary)';
            detailsRow.innerHTML = `
                <div><strong>Name:</strong> ${user.fullname || 'N/A'}</div>
                <div><strong>Email:</strong> ${user.email || 'N/A'}</div>
                <div><strong>DOB:</strong> ${user.dob || 'N/A'} | <strong>DOJ:</strong> ${user.doj || 'N/A'}</div>
                <div><strong>Reporting To:</strong> ${user.reportingTo || 'N/A'}</div>
            `;

            item.appendChild(headerRow);
            item.appendChild(detailsRow);

            userListContainer.appendChild(item);
        });
    };

    // Initial render
    renderUsers();

    if (createUserForm) {
        createUserForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newUserId = document.getElementById('newUserId').value.trim();
            const newFullName = document.getElementById('newFullName').value.trim();
            const newEmail = document.getElementById('newEmail').value.trim();
            const newDob = document.getElementById('newDob').value;
            const newDoj = document.getElementById('newDoj').value;
            const newReportingTo = document.getElementById('newReportingTo').value.trim();
            const newUserPassword = document.getElementById('newUserPassword').value.trim();

            if (!newUserId || !newFullName || !newEmail || !newDob || !newDoj || !newReportingTo || !newUserPassword) {
                Auth.showMessage('createUserMessage', 'Please fill in all fields.', 'error');
                return;
            }

            // Attempt user creation using Auth utility
            const response = Auth.createUser(newUserId, newUserPassword, newFullName, newEmail, newDob, newDoj, newReportingTo);

            if (response.success) {
                Auth.showMessage('createUserMessage', `User '${newUserId}' created successfully!`, 'success');
                createUserForm.reset(); // Clear input fields
                renderUsers(); // Refresh the displayed list
            } else {
                Auth.showMessage('createUserMessage', response.message, 'error');
            }
        });
    }

    // Modal elements
    const editModal = document.getElementById('editUserModal');
    const closeEditModalBtn = document.getElementById('closeEditModal');
    const editUserForm = document.getElementById('editUserForm');

    window.openEditModal = (user) => {
        document.getElementById('editUserIdOriginal').value = user.userId;
        document.getElementById('editUserId').value = user.userId;
        document.getElementById('editFullName').value = user.fullname || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editDob').value = user.dob || '';
        document.getElementById('editDoj').value = user.doj || '';
        document.getElementById('editReportingTo').value = user.reportingTo || '';
        document.getElementById('editUserPassword').value = user.password || '';

        editModal.style.display = 'flex';
    };

    const closeEditModal = () => {
        editModal.style.display = 'none';
        editUserForm.reset();
        document.getElementById('editUserMessage').textContent = '';
        document.getElementById('editUserMessage').className = 'message';
    };

    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', closeEditModal);
    }

    if (editUserForm) {
        editUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const originalUserId = document.getElementById('editUserIdOriginal').value;

            const updatedData = {
                userId: document.getElementById('editUserId').value.trim(),
                fullname: document.getElementById('editFullName').value.trim(),
                email: document.getElementById('editEmail').value.trim(),
                dob: document.getElementById('editDob').value,
                doj: document.getElementById('editDoj').value,
                reportingTo: document.getElementById('editReportingTo').value.trim(),
                password: document.getElementById('editUserPassword').value.trim()
            };

            if (!updatedData.userId || !updatedData.fullname || !updatedData.email || !updatedData.dob || !updatedData.doj || !updatedData.reportingTo || !updatedData.password) {
                Auth.showMessage('editUserMessage', 'Please fill in all fields.', 'error');
                return;
            }

            const response = Auth.updateUser(originalUserId, updatedData);
            if (response.success) {
                closeEditModal();
                renderUsers();
            } else {
                Auth.showMessage('editUserMessage', response.message, 'error');
            }
        });
    }

    window.deleteUser = (userId) => {
        if (confirm(`Are you sure you want to delete user ${userId}?`)) {
            const response = Auth.deleteUser(userId);
            if (response.success) {
                renderUsers();
            } else {
                alert(response.message);
            }
        }
    };
});
