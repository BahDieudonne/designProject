// Check authentication
const currentUser = checkAuth();
if (!currentUser || currentUser.role !== 'farmer') {
    window.location.href = 'index.html';
}

// Get farmer's farm
const farms = getFarms();
const myFarm = farms.find(f => f.id === currentUser.farmId);

if (!myFarm) {
    alert('No farm assigned to your account. Please contact the administrator.');
    logout();
}

// Get system configuration
const systemConfig = JSON.parse(localStorage.getItem('systemConfig') || '{"minScanInterval": 2, "maxScanInterval": 4}');
const scanIntervalHours = parseInt(systemConfig.minScanInterval) || 2;
const scanIntervalMs = scanIntervalHours * 60 * 60 * 1000;

// Display farm and user info
document.getElementById('userName').textContent = currentUser.name;
document.getElementById('farmName').textContent = myFarm.name;
document.getElementById('farmLocation').textContent = myFarm.location;
document.getElementById('totalChicks').textContent = myFarm.totalChicks;
document.getElementById('deviceId').textContent = myFarm.deviceId;
document.getElementById('scanInterval').textContent = `Every ${scanIntervalHours} hour${scanIntervalHours > 1 ? 's' : ''}`;

// Global variables
let currentImage = null;
let autoScanTimer = null;
let nextScanTime = null;
let countdownTimer = null;

// Initialize page
function initializeFarmerDashboard() {
    loadFarmMedia();
    loadDetectionHistory();
    loadNotifications();
    updateStatistics();
    scheduleNextScan();
    startCountdown();
}

// Load farm media (image/video uploaded by admin)
async function loadFarmMedia() {
    if (!myFarm.hasMedia) {
        document.getElementById('cameraPlaceholder').innerHTML = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <p>No farm camera feed available</p>
            <small style="color: #9ca3af; display: block; margin-top: 8px;">Contact administrator to upload farm camera image/video</small>
        `;
        return;
    }

    try {
        const media = await getFarmMedia(myFarm.id);
        
        if (!media || !media.mediaData) {
            document.getElementById('cameraPlaceholder').innerHTML = `
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <p>Error loading farm camera feed</p>
                <small style="color: #9ca3af; display: block; margin-top: 8px;">Please contact administrator</small>
            `;
            return;
        }

        const placeholder = document.getElementById('cameraPlaceholder');
        const image = document.getElementById('cameraImage');
        const video = document.getElementById('cameraVideo');
        const cameraInfo = document.getElementById('cameraInfo');
        
        placeholder.style.display = 'none';
        cameraInfo.style.display = 'block';
        
        // Check if media is image or video
        if (media.mediaData.startsWith('data:image/')) {
            currentImage = media.mediaData;
            image.src = currentImage;
            image.style.display = 'block';
            video.style.display = 'none';
        } else if (media.mediaData.startsWith('data:video/')) {
            currentImage = media.mediaData; // Store for scanning
            video.src = media.mediaData;
            video.style.display = 'block';
            image.style.display = 'none';
            // Play video
            video.play().catch(e => console.log('Video autoplay prevented'));
        }
        
        // Update info
        document.getElementById('lastUpdate').textContent = media.timestamp ? formatDate(media.timestamp) : 'Not available';
        
        // Enable scan button
        document.getElementById('scanButton').disabled = false;
    } catch (error) {
        console.error('Error loading farm media:', error);
        document.getElementById('cameraPlaceholder').innerHTML = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <p>Error loading farm camera feed</p>
            <small style="color: #9ca3af; display: block; margin-top: 8px;">Please contact administrator</small>
        `;
    }
}

// Handle image upload (for manual updates)
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        currentImage = e.target.result;
        
        // Display media
        const placeholder = document.getElementById('cameraPlaceholder');
        const image = document.getElementById('cameraImage');
        const video = document.getElementById('cameraVideo');
        const cameraInfo = document.getElementById('cameraInfo');
        
        placeholder.style.display = 'none';
        cameraInfo.style.display = 'block';
        
        if (file.type.startsWith('image/')) {
            image.src = currentImage;
            image.style.display = 'block';
            video.style.display = 'none';
        } else if (file.type.startsWith('video/')) {
            video.src = currentImage;
            video.style.display = 'block';
            image.style.display = 'none';
            video.play().catch(e => console.log('Video autoplay prevented'));
        }
        
        // Update info
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        
        // Enable scan button
        document.getElementById('scanButton').disabled = false;
        
        showToast('Media uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
}

// Perform manual scan
function performManualScan() {
    if (!currentImage) {
        showToast('Please upload an image first', 'error');
        return;
    }

    performScan('manual');
}

// Perform automatic scan
function performAutoScan() {
    if (!currentImage) {
        console.log('No image available for automatic scan');
        return;
    }

    performScan('automatic');
}

// Main scan function
function performScan(scanType) {
    // Show progress
    const progressDiv = document.getElementById('scanProgress');
    const progressFill = document.getElementById('progressFill');
    const scanStatus = document.getElementById('scanStatus');
    
    progressDiv.style.display = 'block';
    progressFill.style.width = '0%';
    scanStatus.textContent = 'Initializing scan...';

    // Simulate AI processing
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 10;
        progressFill.style.width = progress + '%';
        
        if (progress === 30) {
            scanStatus.textContent = 'Detecting droppings...';
        } else if (progress === 60) {
            scanStatus.textContent = 'Analyzing disease markers...';
        } else if (progress === 90) {
            scanStatus.textContent = 'Calculating risk level...';
        }
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            completeScan(scanType);
        }
    }, 200);
}

// Complete scan and show results
function completeScan(scanType) {
    // Simulate detection results (random for demo)
    const totalSamples = 8 + Math.floor(Math.random() * 5);
    const diseaseProb = Math.random();
    
    let healthy = 0, coccidiosis = 0, salmonella = 0, other = 0;
    
    for (let i = 0; i < totalSamples; i++) {
        const rand = Math.random();
        if (rand < diseaseProb * 0.4) {
            coccidiosis++;
        } else if (rand < diseaseProb * 0.6) {
            salmonella++;
        } else if (rand < diseaseProb) {
            other++;
        } else {
            healthy++;
        }
    }
    
    const diseased = coccidiosis + salmonella + other;
    const diseaseRatio = diseased / totalSamples;
    
    // Determine risk level
    let riskLevel = 'Low';
    let status = 'Healthy';
    
    if (coccidiosis > 0 || salmonella > 0 || diseaseRatio > 0.3) {
        riskLevel = 'High';
        status = 'Critical';
    } else if (diseaseRatio > 0.15) {
        riskLevel = 'Medium';
        status = 'Warning';
    }
    
    // Save detection to history
    const detection = {
        id: generateId(),
        farmId: myFarm.id,
        timestamp: new Date().toISOString(),
        scanType: scanType,
        healthy: healthy,
        coccidiosis: coccidiosis,
        salmonella: salmonella,
        other: other,
        total: totalSamples,
        riskLevel: riskLevel,
        status: status
    };
    
    const detections = getDetections();
    detections.unshift(detection);
    saveDetections(detections);
    
    // Create alert if disease detected
    if (riskLevel === 'High' || riskLevel === 'Medium') {
        createAlert(detection);
    }
    
    // Update UI
    displayResults(detection);
    loadDetectionHistory();
    updateStatistics();
    
    // Hide progress
    setTimeout(() => {
        document.getElementById('scanProgress').style.display = 'none';
        document.getElementById('scanStatus').textContent = 'Scan completed';
    }, 500);
    
    // Show success message
    showToast(`${scanType === 'manual' ? 'Manual' : 'Automatic'} scan completed successfully`, 'success');
}

// Display scan results
function displayResults(detection) {
    document.getElementById('resultHealthy').textContent = detection.healthy;
    document.getElementById('resultCoccidiosis').textContent = detection.coccidiosis;
    document.getElementById('resultSalmonella').textContent = detection.salmonella;
    document.getElementById('resultOther').textContent = detection.other;
    document.getElementById('detectionResults').style.display = 'block';
    
    // Draw detection boxes on canvas
    drawDetectionBoxes(detection);
}

// Draw detection boxes on image
function drawDetectionBoxes(detection) {
    const canvas = document.getElementById('detectionCanvas');
    const image = document.getElementById('cameraImage');
    
    if (!image.complete) return;
    
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.style.display = 'block';
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Generate random detection boxes
    const boxes = [];
    for (let i = 0; i < detection.total; i++) {
        let classification = 'Healthy';
        if (i < detection.coccidiosis) {
            classification = 'Coccidiosis';
        } else if (i < detection.coccidiosis + detection.salmonella) {
            classification = 'Salmonella';
        } else if (i < detection.coccidiosis + detection.salmonella + detection.other) {
            classification = 'Other';
        }
        
        boxes.push({
            x: Math.random() * (canvas.width - 100),
            y: Math.random() * (canvas.height - 80),
            w: 60 + Math.random() * 40,
            h: 50 + Math.random() * 30,
            classification: classification
        });
    }
    
    // Draw boxes
    boxes.forEach(box => {
        let color = '#00ff00';
        if (box.classification === 'Coccidiosis') color = '#ff0000';
        else if (box.classification === 'Salmonella') color = '#ff6600';
        else if (box.classification === 'Other') color = '#ffff00';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        
        // Label
        ctx.fillStyle = color;
        ctx.fillRect(box.x, box.y - 25, box.w + 20, 25);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(box.classification, box.x + 5, box.y - 7);
    });
}

// Create alert notification
function createAlert(detection) {
    const alert = {
        id: generateId(),
        farmId: myFarm.id,
        farmName: myFarm.name,
        type: detection.riskLevel === 'High' ? 'critical' : 'warning',
        title: detection.riskLevel === 'High' ? 'DISEASE OUTBREAK DETECTED' : 'Health Warning',
        message: `${detection.coccidiosis + detection.salmonella + detection.other} affected samples detected. ${detection.coccidiosis > 0 ? 'Coccidiosis found. ' : ''}${detection.salmonella > 0 ? 'Salmonella found. ' : ''}Veterinarian has been notified.`,
        timestamp: new Date().toISOString(),
        read: false,
        vetStatus: 'pending',
        detectionId: detection.id
    };
    
    const alerts = getAlerts();
    alerts.unshift(alert);
    saveAlerts(alerts);
    
    // Show alert banner
    showAlertBanner(alert);
    
    // Reload notifications
    loadNotifications();
}

// Show alert banner
function showAlertBanner(alert) {
    const banner = document.getElementById('alertBanner');
    document.getElementById('alertTitle').textContent = alert.title;
    document.getElementById('alertMessage').textContent = alert.message;
    banner.style.display = 'block';
    
    // Play alert sound (if available)
    // const audio = new Audio('alert.mp3');
    // audio.play().catch(e => console.log('Audio play failed'));
}

// Dismiss alert banner
function dismissAlert() {
    document.getElementById('alertBanner').style.display = 'none';
}

// Load notifications
function loadNotifications() {
    const alerts = getAlerts().filter(a => a.farmId === myFarm.id);
    const container = document.getElementById('notificationsList');
    const countBadge = document.getElementById('notificationCount');
    
    const unreadCount = alerts.filter(a => !a.read).length;
    
    if (unreadCount > 0) {
        countBadge.textContent = unreadCount;
        countBadge.style.display = 'inline-block';
    } else {
        countBadge.style.display = 'none';
    }
    
    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p style="margin-top: 12px; color: #6b7280;">No notifications</p>
                <small style="color: #9ca3af;">All systems normal</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = alerts.map(alert => `
        <div class="notification-item ${alert.read ? '' : 'unread'} ${alert.type}" onclick="markNotificationRead('${alert.id}')">
            <div class="notification-header">
                <div class="notification-title">${alert.title}</div>
                <div class="notification-time">${formatDate(alert.timestamp)}</div>
            </div>
            <div class="notification-message">${alert.message}</div>
            <div class="notification-meta">
                <span>⚠️ ${alert.type === 'critical' ? 'Critical' : 'Warning'}</span>
                <span>📍 ${alert.farmName}</span>
            </div>
            ${alert.vetResponse ? `
                <div class="vet-response">
                    <div class="vet-response-header">🩺 Veterinarian Response</div>
                    <div class="vet-response-text">${alert.vetResponse}</div>
                    ${alert.vetRecommendation ? `<div style="margin-top: 8px; font-size: 12px; font-weight: 600;">💊 ${alert.vetRecommendation}</div>` : ''}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Mark notification as read
function markNotificationRead(alertId) {
    const alerts = getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
        alert.read = true;
        saveAlerts(alerts);
        loadNotifications();
    }
}

// Load detection history
function loadDetectionHistory() {
    const detections = getDetections().filter(d => d.farmId === myFarm.id);
    const tbody = document.getElementById('historyTableBody');
    const noHistory = document.getElementById('noHistory');
    
    if (detections.length === 0) {
        tbody.innerHTML = '';
        noHistory.style.display = 'block';
    } else {
        noHistory.style.display = 'none';
        
        tbody.innerHTML = detections.slice(0, 20).map(d => `
            <tr>
                <td>${formatDate(d.timestamp)}</td>
                <td>
                    <span class="badge ${d.scanType === 'automatic' ? 'info' : 'success'}">
                        ${d.scanType === 'automatic' ? '⏰ Automatic' : '👆 Manual'}
                    </span>
                </td>
                <td><strong style="color: #059669;">${d.healthy}</strong></td>
                <td><strong style="color: #ef4444;">${d.coccidiosis}</strong></td>
                <td><strong style="color: #f97316;">${d.salmonella}</strong></td>
                <td><strong style="color: #eab308;">${d.other}</strong></td>
                <td>
                    <span class="badge ${
                        d.riskLevel === 'High' ? 'danger' : 
                        d.riskLevel === 'Medium' ? 'warning' : 
                        'success'
                    }">
                        ${d.riskLevel}
                    </span>
                </td>
                <td>
                    <span class="badge ${
                        d.status === 'Critical' ? 'danger' : 
                        d.status === 'Warning' ? 'warning' : 
                        'success'
                    }">
                        ${d.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }
}

// Update statistics
function updateStatistics() {
    const detections = getDetections().filter(d => d.farmId === myFarm.id);
    
    if (detections.length > 0) {
        const latest = detections[0];
        document.getElementById('healthyCount').textContent = latest.healthy;
        document.getElementById('affectedCount').textContent = latest.coccidiosis + latest.salmonella + latest.other;
        document.getElementById('riskLevel').textContent = latest.riskLevel;
        
        // Update risk level color
        const riskElement = document.getElementById('riskLevel');
        riskElement.style.color = 
            latest.riskLevel === 'High' ? '#ef4444' : 
            latest.riskLevel === 'Medium' ? '#f59e0b' : 
            '#059669';
    }
}

// Schedule next automatic scan
function scheduleNextScan() {
    // Clear existing timer
    if (autoScanTimer) {
        clearTimeout(autoScanTimer);
    }
    
    // Calculate next scan time
    nextScanTime = new Date(Date.now() + scanIntervalMs);
    
    // Schedule scan
    autoScanTimer = setTimeout(() => {
        performAutoScan();
        scheduleNextScan(); // Schedule next one
    }, scanIntervalMs);
}

// Update countdown timer
function startCountdown() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
    
    countdownTimer = setInterval(() => {
        if (!nextScanTime) return;
        
        const now = new Date();
        const diff = nextScanTime - now;
        
        if (diff <= 0) {
            document.getElementById('nextScanTime').textContent = 'Scanning...';
            return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('nextScanTime').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Download report
function downloadReport() {
    const detections = getDetections().filter(d => d.farmId === myFarm.id);
    
    let csvContent = 'Date & Time,Scan Type,Healthy,Coccidiosis,Salmonella,Other,Total,Risk Level,Status\n';
    
    detections.forEach(d => {
        csvContent += `${new Date(d.timestamp).toLocaleString()},${d.scanType},${d.healthy},${d.coccidiosis},${d.salmonella},${d.other},${d.total},${d.riskLevel},${d.status}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm-report-${myFarm.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Report downloaded successfully', 'success');
}

// Initialize dashboard
initializeFarmerDashboard();