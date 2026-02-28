/**
 * auth.js
 * Utility functions for managing users and admins in localStorage.
 */

/** * auth.js 
 * Updated with Dynamic Firebase Loading (No HTML edits required)
 */

// 1. ADD YOUR FIREBASE CONFIGURATION HERE (You'll get this in Step 2 below)
  const firebaseConfig = {
    apiKey: "AIzaSyAxjET5Rl1C2Dif8euzLl_NHL-RCQxOMIk",
    authDomain: "medibyte-apps.firebaseapp.com",
    projectId: "medibyte-apps",
    storageBucket: "medibyte-apps.firebasestorage.app",
    messagingSenderId: "283326599085",
    appId: "1:283326599085:web:c0a6c725663e308b7b1b24",
    measurementId: "G-0Y9VJ08B7B"
  };

// 2. Dynamically load Firebase so you don't have to edit your HTML files
const loadFirebaseAndSync = async () => {
  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  try {
    // Load Firebase Compat libraries (works without type="module")
    await loadScript("https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js");
    await loadScript("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-compat.js");

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const collections = ['users', 'admins', 'resetRequests', 'auditNotifications', 'messages', 'chatGroups', 'clients', 'projects'];

    // Listen for secure real-time updates from Firebase
    collections.forEach(collectionName => {
      db.collection("medibyteData").doc(collectionName).onSnapshot((docSnapshot) => {
        if (docSnapshot.exists) {
          localStorage.setItem(collectionName, JSON.stringify(docSnapshot.data().items || []));
        }
      });
    });

    // Override localStorage.setItem to also push to Firebase
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, arguments); // Save locally instantly
      
      if (collections.includes(key)) {
        try {
          db.collection("medibyteData").doc(key).set({ items: JSON.parse(value) }, { merge: true });
        } catch (e) {
          console.error("Firebase Sync Error: ", e);
        }
      }
    };
  } catch (error) {
    console.error("Failed to load Firebase dynamically:", error);
  }
};

// Start the loading and syncing process
loadFirebaseAndSync();

// Ensure default storage exists immediately for your UI
const defaultKeys = ['users', 'admins', 'resetRequests', 'auditNotifications', 'messages', 'chatGroups', 'clients', 'projects'];
defaultKeys.forEach(key => {
  if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([]));
});

// --- THE REST OF YOUR Auth OBJECT REMAINS EXACTLY THE SAME BELOW THIS LINE ---


const Auth = {
    // ---- USERS ----
    getUsers: function () {
        return JSON.parse(localStorage.getItem('users')) || [];
    },

    createUser: function (userId, password, fullname, email, dob, doj, reportingTo) {
        const users = this.getUsers();
        // Check if user already exists
        if (users.find(u => u.userId === userId)) {
            return { success: false, message: 'User ID already exists.' };
        }

        users.push({ userId, password, fullname, email, dob, doj, reportingTo });
        localStorage.setItem('users', JSON.stringify(users));
        return { success: true, message: 'User created successfully.' };
    },

    loginUser: function (userId, password) {
        const users = this.getUsers();
        const user = users.find(u => u.userId === userId && u.password === password);

        if (user) {
            sessionStorage.setItem('currentUser', userId);
            sessionStorage.setItem('userRole', 'user');
            return { success: true };
        }
        return { success: false, message: 'Invalid userid or password.' };
    },

    updateUser: function (userId, updatedData) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.userId === userId);
        if (index !== -1) {
            // Check if updated userId already exists (if it was changed)
            if (updatedData.userId && updatedData.userId !== userId) {
                if (users.find(u => u.userId === updatedData.userId)) {
                    return { success: false, message: 'New User ID already exists.' };
                }
            }
            users[index] = { ...users[index], ...updatedData };
            localStorage.setItem('users', JSON.stringify(users));
            return { success: true, message: 'User updated successfully.' };
        }
        return { success: false, message: 'User not found.' };
    },

    deleteUser: function (userId) {
        const users = this.getUsers();
        const initialLength = users.length;
        const remainingUsers = users.filter(u => u.userId !== userId);
        if (remainingUsers.length < initialLength) {
            localStorage.setItem('users', JSON.stringify(remainingUsers));
            return { success: true, message: 'User deleted successfully.' };
        }
        return { success: false, message: 'User not found.' };
    },

    // ---- PASSWORD RESET REQUESTS ----
    getResetRequests: function () {
        return JSON.parse(localStorage.getItem('resetRequests')) || [];
    },
    createResetRequest: function (userId) {
        const users = this.getUsers();
        if (!users.find(u => u.userId === userId)) {
            return { success: false, message: 'User ID not found.' };
        }
        const requests = this.getResetRequests();
        const existingPending = requests.find(r => r.userId === userId && r.status === 'pending');
        if (existingPending) {
            return { success: false, message: 'A pending reset request already exists for this User ID.' };
        }
        const existingApproved = requests.find(r => r.userId === userId && r.status === 'approved');
        if (existingApproved) {
            return { success: false, message: 'Your previous request is approved. Please set a new password.' };
        }

        requests.push({
            id: Date.now().toString(),
            userId: userId,
            status: 'pending', // pending, approved, rejected, completed
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('resetRequests', JSON.stringify(requests));
        return { success: true, message: 'Password reset request sent to Admin.' };
    },
    updateResetRequestStatus: function (requestId, status) {
        let requests = this.getResetRequests();
        const index = requests.findIndex(r => r.id === requestId.toString());
        if (index !== -1) {
            requests[index].status = status;
            localStorage.setItem('resetRequests', JSON.stringify(requests));
            return { success: true, message: `Request ${status} successfully.` };
        }
        return { success: false, message: 'Reset request not found.' };
    },
    checkApprovedRequest: function (userId) {
        const requests = this.getResetRequests();
        return requests.find(r => r.userId === userId && r.status === 'approved');
    },
    executePasswordReset: function (userId, newPassword) {
        let requests = this.getResetRequests();
        const requestIndex = requests.findIndex(r => r.userId === userId && r.status === 'approved');
        if (requestIndex === -1) {
            return { success: false, message: 'No approved reset request found for this user.' };
        }

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.userId === userId);
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            localStorage.setItem('users', JSON.stringify(users));

            requests[requestIndex].status = 'completed';
            localStorage.setItem('resetRequests', JSON.stringify(requests));

            return { success: true, message: 'Password reset successfully. You can now login.' };
        }
        return { success: false, message: 'User not found.' };
    },

    // ---- ADMINS ----
    getAdmins: function () {
        return JSON.parse(localStorage.getItem('admins')) || [];
    },

    createAdmin: function (email, userId, password) {
        const admins = this.getAdmins();
        // Check if admin already exists
        if (admins.find(a => a.userId === userId || a.email === email)) {
            return { success: false, message: 'Admin with this Email or User ID already exists.' };
        }

        admins.push({ email, userId, password });
        localStorage.setItem('admins', JSON.stringify(admins));
        return { success: true, message: 'Admin account created successfully.' };
    },

    loginAdmin: function (userId, password) {
        const admins = this.getAdmins();
        const admin = admins.find(a => a.userId === userId && a.password === password);

        if (admin) {
            sessionStorage.setItem('currentAdmin', userId);
            sessionStorage.setItem('userRole', 'admin');
            return { success: true };
        }
        return { success: false, message: 'Invalid userid or password.' };
    },

    grantAdminAccess: function (userId) {
        const users = this.getUsers();
        const user = users.find(u => u.userId === userId);
        if (!user) return { success: false, message: 'User not found.' };

        const admins = this.getAdmins();
        if (admins.find(a => a.userId === userId)) {
            return { success: false, message: 'User is already an admin.' };
        }

        admins.push({ email: user.email, userId: user.userId, password: user.password });
        localStorage.setItem('admins', JSON.stringify(admins));
        return { success: true, message: 'Admin access granted.' };
    },

    revokeAdminAccess: function (userId) {
        let admins = this.getAdmins();
        const initialLength = admins.length;
        admins = admins.filter(a => a.userId !== userId);

        if (admins.length < initialLength) {
            localStorage.setItem('admins', JSON.stringify(admins));
            return { success: true, message: 'Admin access revoked.' };
        }
        return { success: false, message: 'User is not an admin.' };
    },

    // ---- SESSION MGMT ----
    logout: function () {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentAdmin');
        sessionStorage.removeItem('userRole');
        window.location.href = 'index.html';
    },

    checkAuth: function (role) {
        const currentRole = sessionStorage.getItem('userRole');

        if (role === 'both') {
            if (currentRole !== 'admin' && currentRole !== 'user') {
                window.location.href = 'index.html';
            }
            return;
        }

        if (role === 'admin' && currentRole !== 'admin') {
            window.location.href = 'admin-login.html';
        } else if (role === 'user' && currentRole !== 'user') {
            window.location.href = 'index.html';
        }
    },

    // ---- CLIENTS ----
    getClients: function () {
        return JSON.parse(localStorage.getItem('clients')) || [];
    },
    addClient: function (clientName) {
        const clients = this.getClients();
        if (clients.includes(clientName)) {
            return { success: false, message: 'Client already exists.' };
        }
        clients.push(clientName);
        localStorage.setItem('clients', JSON.stringify(clients));
        return { success: true, message: 'Client added successfully.' };
    },
    updateClient: function (oldName, newName) {
        let clients = this.getClients();
        const index = clients.indexOf(oldName);
        if (index !== -1) {
            clients[index] = newName;
            localStorage.setItem('clients', JSON.stringify(clients));
            return { success: true, message: 'Client updated successfully.' };
        }
        return { success: false, message: 'Client not found.' };
    },
    deleteClient: function (clientName) {
        let clients = this.getClients();
        clients = clients.filter(c => c !== clientName);
        localStorage.setItem('clients', JSON.stringify(clients));
        return { success: true, message: 'Client deleted successfully.' };
    },

    // ---- PROJECTS ----
    getProjects: function () {
        return JSON.parse(localStorage.getItem('projects')) || [];
    },
    addProject: function (projectName) {
        const projects = this.getProjects();
        if (projects.includes(projectName)) {
            return { success: false, message: 'Project already exists.' };
        }
        projects.push(projectName);
        localStorage.setItem('projects', JSON.stringify(projects));
        return { success: true, message: 'Project added successfully.' };
    },
    updateProject: function (oldName, newName) {
        let projects = this.getProjects();
        const index = projects.indexOf(oldName);
        if (index !== -1) {
            projects[index] = newName;
            localStorage.setItem('projects', JSON.stringify(projects));
            return { success: true, message: 'Project updated successfully.' };
        }
        return { success: false, message: 'Project not found.' };
    },
    deleteProject: function (projectName) {
        let projects = this.getProjects();
        projects = projects.filter(p => p !== projectName);
        localStorage.setItem('projects', JSON.stringify(projects));
        return { success: true, message: 'Project deleted successfully.' };
    },

    // ---- SUB PROJECTS ----
    getSubProjects: function () {
        return JSON.parse(localStorage.getItem('subProjects')) || [];
    },
    addSubProject: function (subProjectName) {
        const subProjects = this.getSubProjects();
        if (subProjects.includes(subProjectName)) {
            return { success: false, message: 'Sub Project already exists.' };
        }
        subProjects.push(subProjectName);
        localStorage.setItem('subProjects', JSON.stringify(subProjects));
        return { success: true, message: 'Sub Project added successfully.' };
    },
    updateSubProject: function (oldName, newName) {
        let subProjects = this.getSubProjects();
        const index = subProjects.indexOf(oldName);
        if (index !== -1) {
            subProjects[index] = newName;
            localStorage.setItem('subProjects', JSON.stringify(subProjects));
            return { success: true, message: 'Sub Project updated successfully.' };
        }
        return { success: false, message: 'Sub Project not found.' };
    },
    deleteSubProject: function (subProjectName) {
        let subProjects = this.getSubProjects();
        subProjects = subProjects.filter(p => p !== subProjectName);
        localStorage.setItem('subProjects', JSON.stringify(subProjects));
        return { success: true, message: 'Sub Project deleted successfully.' };
    },

    // ---- ENTRY LOGS ----
    getEntryLogs: function () {
        return JSON.parse(localStorage.getItem('entryLogs')) || [];
    },
    addEntryLog: function (logData) {
        const logs = this.getEntryLogs();
        // Check if Chart ID already exists (optional, but good practice)
        const existing = logs.find(log => log.chartId === logData.chartId);
        if (existing) {
            return { success: false, message: 'An entry with this Chart ID already exists.' };
        }
        logs.push(logData);
        localStorage.setItem('entryLogs', JSON.stringify(logs));
        return { success: true, message: 'Entry log added successfully.' };
    },
    updateEntryLog: function (chartId, updatedData) {
        const logs = this.getEntryLogs();
        const index = logs.findIndex(log => log.chartId === chartId);
        if (index !== -1) {
            logs[index] = { ...logs[index], ...updatedData };
            localStorage.setItem('entryLogs', JSON.stringify(logs));
            return { success: true, message: 'Entry log updated successfully.' };
        }
        return { success: false, message: 'Entry log not found.' };
    },
    deleteEntryLog: function (chartId) {
        let logs = this.getEntryLogs();
        const initialLength = logs.length;
        logs = logs.filter(log => log.chartId !== chartId);

        if (logs.length < initialLength) {
            localStorage.setItem('entryLogs', JSON.stringify(logs));
            return { success: true, message: 'Entry log deleted successfully.' };
        }
        return { success: false, message: 'Entry log not found.' };
    },

    // ---- AUDIT NOTIFICATIONS ----
    getAuditNotifications: function () {
        return JSON.parse(localStorage.getItem('auditNotifications')) || [];
    },
    addAuditNotification: function (chartId, userId, timestamp) {
        const notifs = this.getAuditNotifications();
        notifs.push({
            id: Date.now().toString(),
            chartId: chartId,
            userId: userId,
            timestamp: timestamp,
            status: 'pending' // pending, reviewed
        });
        localStorage.setItem('auditNotifications', JSON.stringify(notifs));
    },
    updateAuditNotificationStatus: function (id, status) {
        let notifs = this.getAuditNotifications();
        const index = notifs.findIndex(n => n.id === id.toString());
        if (index !== -1) {
            notifs[index].status = status;
            localStorage.setItem('auditNotifications', JSON.stringify(notifs));
        }
    },

    // ---- MESSAGES ----
    getMessages: function () {
        return JSON.parse(localStorage.getItem('messages')) || [];
    },
    sendMessage: function (senderId, receiverId, content, type = 'text', fileName = null) {
        const messages = this.getMessages();
        messages.push({
            id: Date.now().toString(),
            senderId: senderId,
            receiverId: receiverId,
            content: content,
            type: type, // text, image, document
            fileName: fileName,
            timestamp: new Date().toISOString(),
            status: 'unread'
        });
        localStorage.setItem('messages', JSON.stringify(messages));
        return { success: true };
    },
    deleteMessage: function (messageId) {
        let messages = this.getMessages();
        messages = messages.filter(m => m.id !== messageId.toString());
        localStorage.setItem('messages', JSON.stringify(messages));
        return { success: true };
    },
    markMessagesAsRead: function (senderId, receiverId) {
        let messages = this.getMessages();
        let updated = false;
        messages.forEach(m => {
            if (m.senderId === senderId && m.receiverId === receiverId && m.status === 'unread') {
                m.status = 'read';
                updated = true;
            }
        });
        if (updated) {
            localStorage.setItem('messages', JSON.stringify(messages));
        }
    },
    getUnreadMessageCount: function (receiverId) {
        const messages = this.getMessages();
        // Unread for direct messages
        let count = messages.filter(m => m.receiverId === receiverId && m.status === 'unread').length;
        // Group unread counts could be implemented similarly by storing read receipts per user per message, 
        // but skipping for now to keep simple.
        return count;
    },

    // ---- GROUPS ----
    getGroups: function () {
        return JSON.parse(localStorage.getItem('chatGroups')) || [];
    },
    createGroup: function (name, members, createdBy) {
        const groups = this.getGroups();
        groups.push({
            id: 'group-' + Date.now().toString(),
            name: name,
            members: members, // Array of userIds
            createdBy: createdBy,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('chatGroups', JSON.stringify(groups));
        return { success: true, message: 'Group created successfully.' };
    },
    deleteGroup: function (groupId) {
        let groups = this.getGroups();
        groups = groups.filter(g => g.id !== groupId);
        localStorage.setItem('chatGroups', JSON.stringify(groups));

        // Also delete messages associated with this group
        let messages = this.getMessages();
        messages = messages.filter(m => m.receiverId !== groupId && m.senderId !== groupId);
        localStorage.setItem('messages', JSON.stringify(messages));

        return { success: true };
    },

    // ---- UI HELPERS ----
    showMessage: function (elementId, message, type) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            el.className = `message ${type}`; // 'error' or 'success'
            // Keep message visible for longer
            setTimeout(() => {
                el.className = 'message';
                el.textContent = '';
            }, 5000);
        }
    },

    // ---- EXPORT / IMPORT DATA ----
    getAllStorageKeys: function () {
        return [
            'users',
            'admins',
            'resetRequests',
            'auditNotifications',
            'messages',
            'chatGroups',
            'clients',
            'projects',
            'subProjects',
            'entryLogs'
        ];
    }
};




