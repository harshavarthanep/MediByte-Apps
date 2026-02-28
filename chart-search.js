/**
 * chart-search.js
 * Handles logic for the Chart Search page (chart-search.html)
 */

Auth.checkAuth('user');

document.addEventListener('DOMContentLoaded', () => {
    // Handle Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
    });

    // Populate Projects and Sub Projects
    const projectSelect = document.getElementById('projectName');
    const subProjectSelect = document.getElementById('subProjectName');

    const projects = Auth.getProjects();
    const subProjects = Auth.getSubProjects();

    projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        projectSelect.appendChild(opt);
    });

    subProjects.forEach(sp => {
        const opt = document.createElement('option');
        opt.value = sp;
        opt.textContent = sp;
        subProjectSelect.appendChild(opt);
    });

    const searchForm = document.getElementById('chartSearchForm');
    const resultCard = document.getElementById('searchResult');
    const msgDiv = document.getElementById('searchMessage');

    const resUserId = document.querySelector('#resUserId span');
    const resUserName = document.querySelector('#resUserName span');
    const resChartStatus = document.querySelector('#resChartStatus span');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const pName = projectSelect.value;
            const spName = subProjectSelect.value;
            const chartId = document.getElementById('chartId').value.trim();

            if (!pName || !spName || !chartId) {
                Auth.showMessage('searchMessage', 'Please fill in all search fields.', 'error');
                resultCard.style.display = 'none';
                return;
            }

            // Perform search
            const logs = Auth.getEntryLogs();
            const foundLog = logs.find(log =>
                log.projectName === pName &&
                log.subProjectName === spName &&
                log.chartId === chartId
            );

            if (foundLog) {
                // Clear any previous error messages
                msgDiv.textContent = '';
                msgDiv.className = 'message';

                // Display result
                resUserId.textContent = foundLog.userId || 'N/A';
                resUserName.textContent = foundLog.userName || 'N/A';

                let statusText = foundLog.auditStatus || 'Not Audited';
                if (statusText === 'Audited') {
                    resChartStatus.style.color = '#16a34a'; // Green
                } else {
                    resChartStatus.style.color = '#eab308'; // Yellow
                }
                resChartStatus.textContent = statusText;

                resultCard.style.display = 'block';
            } else {
                resultCard.style.display = 'none';
                Auth.showMessage('searchMessage', 'No matching chart found for this Project/Sub-Project combination.', 'error');
            }
        });
    }
});
