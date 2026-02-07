// Check authentication
const currentUser = checkAuth();
if (!currentUser || currentUser.role !== 'administrator') {
    window.location.href = 'index.html';
}

// Display user info
document.getElementById('userName').textContent = currentUser.name;
document.getElementById('adminName').textContent = currentUser.name;

// Load statistics
function loadStatistics() {
    const farms = getFarms();
    const users = getUsers();
    const detections = getDetections();
    const alerts = getAlerts();

    const activeFarms = farms.filter(f => f.status === 'active').length;
    const farmers = users.filter(u => u.role === 'farmer').length;
    const vets = users.filter(u => u.role === 'veterinarian').length;

    const statsHTML = `
        <div class="stat-card blue">
            <div class="stat-header">
                <svg class="stat-icon blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span class="stat-label">Total Farms</span>
            </div>
            <div class="stat-value">${farms.length}</div>
            <div class="stat-description">Active: ${activeFarms}</div>
        </div>

        <div class="stat-card green">
            <div class="stat-header">
                <svg class="stat-icon green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span class="stat-label">Total Users</span>
            </div>
            <div class="stat-value">${users.length}</div>
            <div class="stat-description">${farmers} Farmers / ${vets} Vets</div>
        </div>

        <div class="stat-card purple">
            <div class="stat-header">
                <svg class="stat-icon purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span class="stat-label">Devices</span>
            </div>
            <div class="stat-value">${farms.length}</div>
            <div class="stat-description">All Online</div>
        </div>

        <div class="stat-card orange">
            <div class="stat-header">
                <svg class="stat-icon orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span class="stat-label">Alerts</span>
            </div>
            <div class="stat-value">${alerts.length}</div>
            <div class="stat-description">Total Today</div>
        </div>

        <div class="stat-card red">
            <div class="stat-header">
                <svg class="stat-icon red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
                <span class="stat-label">Scans</span>
            </div>
            <div class="stat-value">${detections.length}</div>
            <div class="stat-description">Total Detections</div>
        </div>
    `;

    document.getElementById('statsGrid').innerHTML = statsHTML;
}

// Load farms table
function loadFarms() {
    const farms = getFarms();
    const tbody = document.getElementById('farmsTableBody');
    const noFarms = document.getElementById('noFarms');

    if (farms.length === 0) {
        tbody.innerHTML = '';
        noFarms.style.display = 'block';
        document.querySelector('#farmsTable').style.display = 'none';
    } else {
        noFarms.style.display = 'none';
        document.querySelector('#farmsTable').style.display = 'table';

        tbody.innerHTML = farms.map(farm => `
            <tr>
                <td><strong>${farm.name}</strong></td>
                <td>${farm.location}</td>
                <td>${farm.totalChicks}</td>
                <td><code>${farm.deviceId}</code></td>
                <td>
                    <span class="badge ${
                        farm.status === 'active' ? 'success' : 
                        farm.status === 'maintenance' ? 'warning' : 
                        'danger'
                    }">
                        ${farm.status.charAt(0).toUpperCase() + farm.status.slice(1)}
                    </span>
                </td>
                <td>${formatDate(farm.installDate)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn edit" onclick="editFarm('${farm.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="icon-btn delete" onclick="deleteFarm('${farm.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

// Load users table
function loadUsers() {
    const users = getUsers();
    const farms = getFarms();
    const tbody = document.getElementById('usersTableBody');

    tbody.innerHTML = users.map(user => {
        let farmInfo = '-';
        if (user.role === 'farmer' && user.farmId) {
            const farm = farms.find(f => f.id === user.farmId);
            farmInfo = farm ? farm.name : 'Not assigned';
        } else if (user.role === 'veterinarian' && user.assignedFarmIds) {
            farmInfo = `${user.assignedFarmIds.length} farm(s)`;
        }

        return `
            <tr>
                <td><strong>${user.name}</strong></td>
                <td><code>${user.username}</code></td>
                <td>
                    <span class="badge ${
                        user.role === 'farmer' ? 'success' : 
                        user.role === 'veterinarian' ? 'info' : 
                        'purple'
                    }">
                        ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                </td>
                <td>${user.email}</td>
                <td>${user.phone || '-'}</td>
                <td>${farmInfo}</td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn edit" onclick="editUser('${user.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="icon-btn delete" onclick="deleteUser('${user.id}')" ${user.role === 'administrator' ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// Farm Modal Functions
let currentFarmMedia = null;

function previewFarmMedia(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        currentFarmMedia = e.target.result;
        
        const container = document.getElementById('mediaPreviewContainer');
        const imagePreview = document.getElementById('imagePreview');
        const videoPreview = document.getElementById('videoPreview');
        
        container.style.display = 'block';
        
        if (file.type.startsWith('image/')) {
            imagePreview.src = currentFarmMedia;
            imagePreview.style.display = 'block';
            videoPreview.style.display = 'none';
        } else if (file.type.startsWith('video/')) {
            videoPreview.src = currentFarmMedia;
            videoPreview.style.display = 'block';
            imagePreview.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

function openAddFarmModal() {
    document.getElementById('farmModalTitle').textContent = 'Add New Farm';
    document.getElementById('farmForm').reset();
    document.getElementById('farmId').value = '';
    document.getElementById('farmInstallDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('mediaPreviewContainer').style.display = 'none';
    currentFarmMedia = null;
    document.getElementById('farmModal').classList.add('active');
}

function closeFarmModal() {
    document.getElementById('farmModal').classList.remove('active');
}

async function editFarm(farmId) {
    const farms = getFarms();
    const farm = farms.find(f => f.id === farmId);
    
    if (farm) {
        document.getElementById('farmModalTitle').textContent = 'Edit Farm';
        document.getElementById('farmId').value = farm.id;
        document.getElementById('farmName').value = farm.name;
        document.getElementById('farmLocation').value = farm.location;
        document.getElementById('farmChicks').value = farm.totalChicks;
        document.getElementById('farmDevice').value = farm.deviceId;
        document.getElementById('farmStatus').value = farm.status;
        document.getElementById('farmInstallDate').value = formatDateForInput(farm.installDate);
        
        // Load existing media from IndexedDB if available
        if (farm.hasMedia) {
            try {
                const media = await getFarmMedia(farm.id);
                if (media && media.mediaData) {
                    currentFarmMedia = media.mediaData;
                    const container = document.getElementById('mediaPreviewContainer');
                    const imagePreview = document.getElementById('imagePreview');
                    const videoPreview = document.getElementById('videoPreview');
                    
                    container.style.display = 'block';
                    
                    if (media.mediaData.startsWith('data:image/')) {
                        imagePreview.src = media.mediaData;
                        imagePreview.style.display = 'block';
                        videoPreview.style.display = 'none';
                    } else if (media.mediaData.startsWith('data:video/')) {
                        videoPreview.src = media.mediaData;
                        videoPreview.style.display = 'block';
                        imagePreview.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Error loading farm media:', error);
            }
        }
        
        document.getElementById('farmModal').classList.add('active');
    }
}

async function deleteFarm(farmId) {
    if (confirm('Are you sure you want to delete this farm? This action cannot be undone.')) {
        try {
            // Delete farm media from IndexedDB
            await deleteFarmMedia(farmId);
        } catch (error) {
            console.error('Error deleting farm media:', error);
        }
        
        let farms = getFarms();
        farms = farms.filter(f => f.id !== farmId);
        saveFarms(farms);
        loadFarms();
        loadStatistics();
        showToast('Farm deleted successfully', 'success');
    }
}

// Handle farm form submission
document.getElementById('farmForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const farmId = document.getElementById('farmId').value || generateId();
    const farmData = {
        id: farmId,
        name: document.getElementById('farmName').value,
        location: document.getElementById('farmLocation').value,
        totalChicks: parseInt(document.getElementById('farmChicks').value),
        deviceId: document.getElementById('farmDevice').value,
        status: document.getElementById('farmStatus').value,
        installDate: document.getElementById('farmInstallDate').value,
        hasMedia: currentFarmMedia ? true : false,
        updatedAt: new Date().toISOString()
    };

    let farms = getFarms();
    
    try {
        // Save media to IndexedDB if available
        if (currentFarmMedia) {
            await saveFarmMedia(farmId, currentFarmMedia, currentFarmMedia.startsWith('data:image/') ? 'image' : 'video');
            farmData.hasMedia = true;
        }
        
        if (document.getElementById('farmId').value) {
            // Update existing farm
            const index = farms.findIndex(f => f.id === farmId);
            if (index !== -1) {
                farms[index] = { ...farms[index], ...farmData };
                showToast('Farm updated successfully', 'success');
            }
        } else {
            // Add new farm
            if (!currentFarmMedia) {
                showToast('Please upload farm camera image/video', 'error');
                return;
            }
            farmData.createdAt = new Date().toISOString();
            farms.push(farmData);
            showToast('Farm added successfully', 'success');
        }
        
        saveFarms(farms);
        loadFarms();
        loadStatistics();
        closeFarmModal();
    } catch (error) {
        console.error('Error saving farm:', error);
        showToast('Error saving farm. Please try again.', 'error');
    }
});

// User Modal Functions
function openAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    loadFarmOptions();
    document.getElementById('userModal').classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function handleRoleChange() {
    const role = document.getElementById('userRole').value;
    const farmGroup = document.getElementById('farmAssignmentGroup');
    const farmLabel = document.getElementById('farmAssignmentLabel');
    const farmSelect = document.getElementById('userFarm');
    
    if (role === 'farmer') {
        farmGroup.style.display = 'block';
        farmLabel.textContent = 'Assign Farm (single selection)';
        farmSelect.multiple = false;
        farmSelect.size = 3;
    } else if (role === 'veterinarian') {
        farmGroup.style.display = 'block';
        farmLabel.textContent = 'Assign Farms (multiple selection)';
        farmSelect.multiple = true;
        farmSelect.size = 5;
    } else {
        farmGroup.style.display = 'none';
    }
}

function loadFarmOptions() {
    const farms = getFarms();
    const select = document.getElementById('userFarm');
    
    select.innerHTML = farms.map(farm => 
        `<option value="${farm.id}">${farm.name} - ${farm.location}</option>`
    ).join('');
}

function editUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id == userId);
    
    if (user) {
        document.getElementById('userModalTitle').textContent = 'Edit User';
        document.getElementById('userId').value = user.id;
        document.getElementById('userFullName').value = user.name;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userPassword').value = user.password;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPhone').value = user.phone || '';
        
        handleRoleChange();
        loadFarmOptions();
        
        // Set farm selections
        const farmSelect = document.getElementById('userFarm');
        if (user.role === 'farmer' && user.farmId) {
            farmSelect.value = user.farmId;
        } else if (user.role === 'veterinarian' && user.assignedFarmIds) {
            Array.from(farmSelect.options).forEach(option => {
                option.selected = user.assignedFarmIds.includes(option.value);
            });
        }
        
        document.getElementById('userModal').classList.add('active');
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        let users = getUsers();
        users = users.filter(u => u.id != userId);
        saveUsers(users);
        loadUsers();
        loadStatistics();
        showToast('User deleted successfully', 'success');
    }
}

// Handle user form submission
document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const role = document.getElementById('userRole').value;
    const farmSelect = document.getElementById('userFarm');
    
    const userData = {
        id: userId || generateId(),
        name: document.getElementById('userFullName').value,
        username: document.getElementById('userUsername').value,
        password: document.getElementById('userPassword').value,
        role: role,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value,
        updatedAt: new Date().toISOString()
    };

    // Handle farm assignments
    if (role === 'farmer') {
        userData.farmId = farmSelect.value;
    } else if (role === 'veterinarian') {
        userData.assignedFarmIds = Array.from(farmSelect.selectedOptions).map(opt => opt.value);
    }

    let users = getUsers();
    
    if (userId) {
        // Update existing user
        const index = users.findIndex(u => u.id == userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            showToast('User updated successfully', 'success');
        }
    } else {
        // Add new user
        userData.createdAt = new Date().toISOString();
        users.push(userData);
        showToast('User account created successfully', 'success');
    }
    
    saveUsers(users);
    loadUsers();
    loadStatistics();
    closeUserModal();
});

// Save system configuration
function saveSystemConfig() {
    const config = {
        minScanInterval: document.getElementById('minScanInterval').value,
        maxScanInterval: document.getElementById('maxScanInterval').value,
        mediumRiskThreshold: document.getElementById('mediumRiskThreshold').value,
        highRiskThreshold: document.getElementById('highRiskThreshold').value
    };
    
    localStorage.setItem('systemConfig', JSON.stringify(config));
    showToast('System configuration saved successfully', 'success');
}

// Load system configuration
function loadSystemConfig() {
    const config = JSON.parse(localStorage.getItem('systemConfig') || '{}');
    
    document.getElementById('minScanInterval').value = config.minScanInterval || 2;
    document.getElementById('maxScanInterval').value = config.maxScanInterval || 4;
    document.getElementById('mediumRiskThreshold').value = config.mediumRiskThreshold || 15;
    document.getElementById('highRiskThreshold').value = config.highRiskThreshold || 30;
}

// Initialize page
loadStatistics();
loadFarms();
loadUsers();
loadSystemConfig();