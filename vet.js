// Check authentication
const currentUser = checkAuth();
if (!currentUser || currentUser.role !== 'veterinarian') {
    window.location.href = 'index.html';
}

// Get veterinarian's assigned farms
const allFarms = getFarms();
const myFarms = allFarms.filter(f => 
    currentUser.assignedFarmIds && currentUser.assignedFarmIds.includes(f.id)
);

// Display user info
document.getElementById('userName').textContent = currentUser.name;
document.getElementById('vetName').textContent = currentUser.name;

// Current state
let currentTab = 'alerts';
let currentAlertId = null;

// Initialize page
function initializeVetDashboard() {
    updateStatistics();
    loadAlerts();
    loadFarms();
    loadTeams();
}

// Switch tabs
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    if (tabName === 'alerts') {
        document.getElementById('alertsTab').classList.add('active');
        loadAlerts();
    } else if (tabName === 'farms') {
        document.getElementById('farmsTab').classList.add('active');
        loadFarms();
    } else if (tabName === 'teams') {
        document.getElementById('teamsTab').classList.add('active');
        loadTeams();
    }
}

// Update statistics
function updateStatistics() {
    // Assigned farms count
    document.getElementById('assignedFarmsCount').textContent = myFarms.length;
    
    // Get all alerts for my farms
    const allAlerts = getAlerts();
    const myAlerts = allAlerts.filter(alert => 
        myFarms.some(farm => farm.id === alert.farmId)
    );
    
    // Active alerts (unread)
    const activeAlerts = myAlerts.filter(a => !a.read);
    document.getElementById('activeAlertsCount').textContent = activeAlerts.length;
    
    // Pending responses
    const pendingAlerts = myAlerts.filter(a => a.vetStatus === 'pending');
    document.getElementById('pendingResponsesCount').textContent = pendingAlerts.length;
    
    // Total chicks across assigned farms
    const totalChicks = myFarms.reduce((sum, farm) => sum + parseInt(farm.totalChicks || 0), 0);
    document.getElementById('totalChicksCount').textContent = totalChicks;
}

// Load alerts
function loadAlerts() {
    const allAlerts = getAlerts();
    const myAlerts = allAlerts.filter(alert => 
        myFarms.some(farm => farm.id === alert.farmId)
    );
    
    const alertsList = document.getElementById('alertsList');
    const noAlerts = document.getElementById('noAlerts');
    
    if (myAlerts.length === 0) {
        alertsList.innerHTML = '';
        noAlerts.style.display = 'block';
        return;
    }
    
    noAlerts.style.display = 'none';
    
    alertsList.innerHTML = myAlerts.map(alert => `
        <div class="alert-item ${alert.type} ${!alert.read ? 'unread' : ''}" data-alert-id="${alert.id}">
            <div class="alert-header">
                <div>
                    <h3>${alert.title}</h3>
                    <p class="alert-farm">${alert.farmName}</p>
                </div>
                <div class="alert-meta">
                    <span class="badge ${alert.type === 'critical' ? 'danger' : 'warning'}">
                        ${alert.type.toUpperCase()}
                    </span>
                    <span class="badge ${alert.vetStatus === 'pending' ? 'warning' : alert.vetStatus === 'responded' ? 'success' : 'info'}">
                        ${alert.vetStatus.toUpperCase()}
                    </span>
                </div>
            </div>
            <div class="alert-body">
                <p>${alert.message}</p>
                <div class="alert-footer">
                    <small>${formatDate(alert.timestamp)}</small>
                    ${alert.vetStatus === 'pending' ? `
                        <button class="btn btn-primary btn-sm" onclick="openResponseModal('${alert.id}')">
                            Respond to Alert
                        </button>
                    ` : `
                        <button class="btn btn-secondary btn-sm" onclick="viewResponse('${alert.id}')">
                            View Response
                        </button>
                    `}
                </div>
            </div>
            ${alert.vetResponse ? `
                <div class="vet-response">
                    <strong>Your Response:</strong>
                    <p><strong>Recommendation:</strong> ${alert.vetResponse.recommendation}</p>
                    ${alert.vetResponse.notes ? `<p><strong>Notes:</strong> ${alert.vetResponse.notes}</p>` : ''}
                    <small>Responded on ${formatDate(alert.vetResponse.timestamp)}</small>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Load farms
function loadFarms() {
    const tbody = document.getElementById('farmsTableBody');
    
    if (myFarms.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No farms assigned to you</td></tr>';
        return;
    }
    
    tbody.innerHTML = myFarms.map(farm => {
        // Get latest detection for this farm
        const detections = getDetections().filter(d => d.farmId === farm.id);
        const latestDetection = detections.length > 0 ? detections[0] : null;
        
        return `
            <tr>
                <td><strong>${farm.name}</strong></td>
                <td>${farm.location}</td>
                <td>${farm.totalChicks}</td>
                <td>
                    ${latestDetection ? `
                        <span class="badge ${
                            latestDetection.riskLevel === 'High' ? 'danger' : 
                            latestDetection.riskLevel === 'Medium' ? 'warning' : 
                            'success'
                        }">
                            ${latestDetection.riskLevel} Risk
                        </span>
                    ` : '<span class="badge info">No Scans</span>'}
                </td>
                <td>${latestDetection ? formatDate(latestDetection.timestamp) : 'Never'}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewFarmDetails('${farm.id}')">
                        View Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Load teams
function loadTeams() {
    const teams = getTeams().filter(team => team.vetId === currentUser.id);
    const tbody = document.getElementById('teamsTableBody');
    const noTeams = document.getElementById('noTeams');
    
    if (teams.length === 0) {
        tbody.innerHTML = '';
        noTeams.style.display = 'block';
        return;
    }
    
    noTeams.style.display = 'none';
    
    tbody.innerHTML = teams.map(team => `
        <tr>
            <td><strong>${team.id}</strong></td>
            <td>${team.farmName}</td>
            <td>${formatDate(team.dispatchDate)}</td>
            <td>${team.purpose.replace(/_/g, ' ')}</td>
            <td>
                <span class="badge ${
                    team.status === 'completed' ? 'success' : 
                    team.status === 'in_progress' ? 'warning' : 
                    'info'
                }">
                    ${team.status.replace(/_/g, ' ').toUpperCase()}
                </span>
            </td>
            <td>${team.notes || '-'}</td>
        </tr>
    `).join('');
}

// Open response modal
function openResponseModal(alertId) {
    currentAlertId = alertId;
    const alert = getAlerts().find(a => a.id === alertId);
    
    if (!alert) return;
    
    // Mark as read
    markAlertAsRead(alertId);
    
    // Show alert details
    document.getElementById('alertDetails').innerHTML = `
        <h3>${alert.title}</h3>
        <p><strong>Farm:</strong> ${alert.farmName}</p>
        <p><strong>Type:</strong> <span class="badge ${alert.type === 'critical' ? 'danger' : 'warning'}">${alert.type.toUpperCase()}</span></p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${formatDate(alert.timestamp)}</p>
    `;
    
    // Show modal
    document.getElementById('responseModal').classList.add('active');
}

// Close response modal
function closeResponseModal() {
    document.getElementById('responseModal').classList.remove('active');
    document.getElementById('responseForm').reset();
    currentAlertId = null;
}

// Submit response
document.getElementById('responseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const recommendation = document.getElementById('recommendation').value;
    const notes = document.getElementById('responseNotes').value;
    const shouldDispatch = document.getElementById('dispatchTeam').checked;
    
    // Update alert with vet response
    const alerts = getAlerts();
    const alertIndex = alerts.findIndex(a => a.id === currentAlertId);
    
    if (alertIndex !== -1) {
        alerts[alertIndex].vetStatus = 'responded';
        alerts[alertIndex].vetResponse = {
            recommendation: recommendation,
            notes: notes,
            respondedBy: currentUser.name,
            timestamp: new Date().toISOString()
        };
        
        saveAlerts(alerts);
        
        // ⭐ NOTIFICATION INTEGRATION: Send notifications to farmer
        console.log('Sending vet response notifications to farmer...');
        const farmerUser = getUsers().find(u => 
            u.farmId === alerts[alertIndex].farmId && u.role === 'farmer'
        );
        const farm = getFarms().find(f => f.id === alerts[alertIndex].farmId);
        
        if (farmerUser && farm && typeof notificationService !== 'undefined') {
            notificationService.notifyVetResponse(alerts[alertIndex], farm, farmerUser)
                .then(results => {
                    console.log('✅ Vet response notifications sent:', results);
                    const channels = [];
                    if (results.inapp?.success) channels.push('In-App');
                    if (results.email?.success) channels.push('Email');
                    if (results.sms?.success) channels.push('SMS');
                    if (channels.length > 0) {
                        showToast(`Farmer notified via ${channels.join(', ')}!`, 'success');
                    }
                })
                .catch(error => {
                    console.error('❌ Error sending notifications:', error);
                });
        }
        
        // If dispatch team checkbox is checked, open dispatch modal
        if (shouldDispatch) {
            const alert = alerts[alertIndex];
            closeResponseModal();
            setTimeout(() => {
                openDispatchModal(alert.farmId);
            }, 300);
        } else {
            closeResponseModal();
        }
        
        loadAlerts();
        updateStatistics();
        showToast('Response sent successfully!', 'success');
    }
});

// View response
function viewResponse(alertId) {
    openResponseModal(alertId);
}

// Open dispatch modal
function openDispatchModal(farmId = null) {
    // Populate farms dropdown
    const select = document.getElementById('dispatchFarm');
    select.innerHTML = '<option value="">Choose a farm...</option>' +
        myFarms.map(farm => `
            <option value="${farm.id}" ${farm.id === farmId ? 'selected' : ''}>
                ${farm.name} - ${farm.location}
            </option>
        `).join('');
    
    // Set default date to today
    document.getElementById('dispatchDate').valueAsDate = new Date();
    
    document.getElementById('dispatchModal').classList.add('active');
}

// Close dispatch modal
function closeDispatchModal() {
    document.getElementById('dispatchModal').classList.remove('active');
    document.getElementById('dispatchForm').reset();
}

// Submit dispatch
document.getElementById('dispatchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const farmId = document.getElementById('dispatchFarm').value;
    const purpose = document.getElementById('dispatchPurpose').value;
    const teamMembers = document.getElementById('teamMembers').value;
    const dispatchDate = document.getElementById('dispatchDate').value;
    const notes = document.getElementById('dispatchNotes').value;
    
    const farm = myFarms.find(f => f.id === farmId);
    
    const team = {
        id: `TEAM-${Date.now()}`,
        farmId: farmId,
        farmName: farm.name,
        vetId: currentUser.id,
        vetName: currentUser.name,
        purpose: purpose,
        teamMembers: teamMembers,
        dispatchDate: dispatchDate,
        notes: notes,
        status: 'scheduled',
        createdAt: new Date().toISOString()
    };
    
    const teams = getTeams();
    teams.unshift(team);
    saveTeams(teams);
    
    closeDispatchModal();
    loadTeams();
    showToast('Team dispatched successfully!', 'success');
});

// View farm details
function viewFarmDetails(farmId) {
    const farm = myFarms.find(f => f.id === farmId);
    if (!farm) return;
    
    const detections = getDetections().filter(d => d.farmId === farmId);
    
    alert(`Farm: ${farm.name}
Location: ${farm.location}
Total Chicks: ${farm.totalChicks}
Device ID: ${farm.deviceId}
Total Scans: ${detections.length}
Latest Scan: ${detections.length > 0 ? formatDate(detections[0].timestamp) : 'Never'}
Status: ${farm.status}`);
}

// Helper: Get teams
function getTeams() {
    return JSON.parse(localStorage.getItem('teams') || '[]');
}

// Helper: Save teams
function saveTeams(teams) {
    localStorage.setItem('teams', JSON.stringify(teams));
}

// Helper: Mark alert as read
function markAlertAsRead(alertId) {
    const alerts = getAlerts();
    const index = alerts.findIndex(a => a.id === alertId);
    if (index !== -1) {
        alerts[index].read = true;
        saveAlerts(alerts);
        updateStatistics();
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize dashboard
initializeVetDashboard();

// Refresh data every 30 seconds
setInterval(() => {
    updateStatistics();
    if (currentTab === 'alerts') loadAlerts();
    if (currentTab === 'farms') loadFarms();
    if (currentTab === 'teams') loadTeams();
}, 30000);
