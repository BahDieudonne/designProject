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

// Wait for IndexedDB to be ready before initializing
function waitForDB() {
    return new Promise((resolve) => {
        if (window.db) {
            resolve();
        } else {
            // Check every 100ms for DB to be ready
            const checkDB = setInterval(() => {
                if (window.db) {
                    clearInterval(checkDB);
                    resolve();
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkDB);
                resolve();
            }, 5000);
        }
    });
}

// Initialize page
async function initializeFarmerDashboard() {
    // Wait for database to be ready
    await waitForDB();
    
    // Now load everything
    await loadFarmMedia();
    loadDetectionHistory();
    loadNotifications();
    updateStatistics();
    scheduleNextScan();
    startCountdown();
}

// Load farm media (image/video uploaded by admin)
async function loadFarmMedia() {
    console.log('Loading farm media...');
    console.log('Farm has media?', myFarm.hasMedia);
    console.log('Farm ID:', myFarm.id);
    
    if (!myFarm.hasMedia) {
        console.log('No media flag set on farm');
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
        console.log('Attempting to get farm media from IndexedDB...');
        const media = await getFarmMedia(myFarm.id);
        console.log('Media retrieved:', media ? 'Yes' : 'No');
        
        if (!media || !media.mediaData) {
            console.log('No media data found in IndexedDB');
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

        console.log('Media data found, displaying...');
        const placeholder = document.getElementById('cameraPlaceholder');
        const image = document.getElementById('cameraImage');
        const video = document.getElementById('cameraVideo');
        const cameraInfo = document.getElementById('cameraInfo');
        
        placeholder.style.display = 'none';
        cameraInfo.style.display = 'block';
        
        // Check if media is image or video
        if (media.mediaData.startsWith('data:image/')) {
            console.log('Loading image...');
            currentImage = media.mediaData;
            image.src = currentImage;
            image.style.display = 'block';
            video.style.display = 'none';
        } else if (media.mediaData.startsWith('data:video/')) {
            console.log('Loading video...');
            currentImage = media.mediaData; // Store for scanning
            video.src = media.mediaData;
            video.style.display = 'block';
            image.style.display = 'none';
            // Play video
            video.play().catch(e => console.log('Video autoplay prevented:', e));
        }
        
        // Update info
        document.getElementById('lastUpdate').textContent = media.timestamp ? formatDate(media.timestamp) : 'Not available';
        
        // Enable scan button
        document.getElementById('scanButton').disabled = false;
        console.log('Farm media loaded successfully!');
    } catch (error) {
        console.error('Error loading farm media:', error);
        document.getElementById('cameraPlaceholder').innerHTML = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <p>Error loading farm camera feed</p>
            <small style="color: #9ca3af; display: block; margin-top: 8px;">Error: ${error.message}</small>
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
    scanStatus.textContent = 'Initializing thermal imaging system...';

    // Realistic scan time: 30-60 seconds based on farm size
    const baseScanTime = 30000; // 30 seconds base
    const additionalTime = (myFarm.totalChicks / 100) * 100; // Add time based on flock size
    const totalScanTime = Math.min(baseScanTime + additionalTime, 60000); // Max 60 seconds
    
    const updateInterval = totalScanTime / 100; // Update 100 times during scan
    
    let progress = 0;
    let currentStage = 0;
    
    // Define scanning stages with realistic messages
    const stages = [
        { threshold: 0, message: 'Initializing thermal imaging system...' },
        { threshold: 5, message: 'Calibrating thermal sensors...' },
        { threshold: 10, message: 'Capturing thermal images...' },
        { threshold: 15, message: `Scanning ${myFarm.totalChicks} chicks...` },
        { threshold: 25, message: 'Detecting droppings using YOLO algorithm...' },
        { threshold: 35, message: 'Processing thermal data patterns...' },
        { threshold: 45, message: 'Extracting sample regions of interest...' },
        { threshold: 55, message: 'Running CNN disease classification...' },
        { threshold: 65, message: 'Analyzing for Coccidiosis markers...' },
        { threshold: 72, message: 'Analyzing for Salmonella indicators...' },
        { threshold: 80, message: 'Checking for other pathogen signatures...' },
        { threshold: 85, message: 'Analyzing behavioral patterns...' },
        { threshold: 90, message: 'Calculating flock-wide risk assessment...' },
        { threshold: 95, message: 'Generating detection report...' },
        { threshold: 98, message: 'Finalizing results...' }
    ];
    
    const progressInterval = setInterval(() => {
        progress += 1;
        progressFill.style.width = progress + '%';
        
        // Update status message based on current stage
        for (let i = stages.length - 1; i >= 0; i--) {
            if (progress >= stages[i].threshold && currentStage !== i) {
                scanStatus.textContent = stages[i].message;
                currentStage = i;
                break;
            }
        }
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            scanStatus.textContent = 'Processing results...';
            // Use setTimeout to let UI update before heavy computation
            setTimeout(() => {
                completeScan(scanType);
            }, 200);
        }
    }, updateInterval);
}

// Complete scan and show results
function completeScan(scanType) {
    try {
        console.log('Starting completeScan function...');
        console.log('Farm total chicks:', myFarm.totalChicks);
        
        // Calculate detection based on farm's total chicks
        // We'll analyze a percentage of the flock (20-30%)
        const samplePercentage = 0.20 + (Math.random() * 0.10); // 20-30%
        const totalSamples = Math.floor(myFarm.totalChicks * samplePercentage);
        
        console.log('Total samples to analyze:', totalSamples);
        
        // Disease probability increases slightly with each scan for demo
        const detections = getDetections();
        const previousScans = detections.filter(d => d.farmId === myFarm.id).length;
        const diseaseProb = Math.min(0.10 + (previousScans * 0.01), 0.30);
        
        console.log('Disease probability:', diseaseProb);
        
        let healthy = 0, coccidiosis = 0, salmonella = 0, other = 0;
        
        // Distribute the total samples across health categories
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
        
        console.log('Sample results - Healthy:', healthy, 'Coccidiosis:', coccidiosis, 'Salmonella:', salmonella, 'Other:', other);
        
        // Calculate total healthy and diseased in entire flock (extrapolate from sample)
        const flockHealthyRatio = healthy / totalSamples;
        const flockCoccidiosisRatio = coccidiosis / totalSamples;
        const flockSalmonellaRatio = salmonella / totalSamples;
        const flockOtherRatio = other / totalSamples;
        
        const flockHealthy = Math.round(myFarm.totalChicks * flockHealthyRatio);
        const flockCoccidiosis = Math.round(myFarm.totalChicks * flockCoccidiosisRatio);
        const flockSalmonella = Math.round(myFarm.totalChicks * flockSalmonellaRatio);
        const flockOther = Math.round(myFarm.totalChicks * flockOtherRatio);
        
        console.log('Flock results - Healthy:', flockHealthy, 'Coccidiosis:', flockCoccidiosis, 'Salmonella:', flockSalmonella, 'Other:', flockOther);
        
        const diseased = flockCoccidiosis + flockSalmonella + flockOther;
        const diseaseRatio = diseased / myFarm.totalChicks;
        
        console.log('Disease ratio:', diseaseRatio);
        
        // Determine risk level
        let riskLevel = 'Low';
        let status = 'Healthy';
        
        if (flockCoccidiosis > 0 || flockSalmonella > 0 || diseaseRatio > 0.3) {
            riskLevel = 'High';
            status = 'Critical';
        } else if (diseaseRatio > 0.15) {
            riskLevel = 'Medium';
            status = 'Warning';
        }
        
        console.log('Risk level:', riskLevel, 'Status:', status);
        
        // Save detection to history
        const detection = {
            id: generateId(),
            farmId: myFarm.id,
            timestamp: new Date().toISOString(),
            scanType: scanType,
            healthy: flockHealthy,
            coccidiosis: flockCoccidiosis,
            salmonella: flockSalmonella,
            other: flockOther,
            total: myFarm.totalChicks,
            samplesAnalyzed: totalSamples,
            riskLevel: riskLevel,
            status: status
        };
        
        console.log('Detection object created:', detection);
        
        const currentDetections = getDetections();
        currentDetections.unshift(detection);
        saveDetections(currentDetections);
        
        console.log('Detection saved to localStorage');
        
        // Create alert if disease detected
        if (riskLevel === 'High' || riskLevel === 'Medium') {
            console.log('Creating alert...');
            createAlert(detection);
        }
        
        // ⭐ NOTIFICATION INTEGRATION: Send multi-channel notifications
        console.log('Sending multi-channel notifications...');
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (currentUser && myFarm && typeof notificationService !== 'undefined') {
            notificationService.notifyScanComplete(detection, myFarm, currentUser)
                .then(results => {
                    console.log('✅ Scan notifications sent successfully:', results);
                    const channels = [];
                    if (results.inapp?.success) channels.push('In-App');
                    if (results.email?.success) channels.push('Email');
                    if (results.sms?.success) channels.push('SMS');
                    if (channels.length > 0) {
                        showToast(`Notifications sent via ${channels.join(', ')}!`, 'success');
                    }
                })
                .catch(error => {
                    console.error('❌ Error sending notifications:', error);
                });
        }
        
        console.log('Displaying results...');
        
        // Update UI
        displayResults(detection);
        
        console.log('Loading detection history...');
        loadDetectionHistory();
        
        console.log('Updating statistics...');
        updateStatistics();
        
        console.log('Drawing detection boxes...');
        
        // Draw boxes on canvas (deferred for performance)
        setTimeout(() => {
            try {
                drawDetectionBoxes(detection);
                console.log('Detection boxes drawn successfully');
            } catch (error) {
                console.error('Error drawing detection boxes:', error);
            }
        }, 100);
        
        console.log('Hiding progress bar...');
        
        // Hide progress
        setTimeout(() => {
            document.getElementById('scanProgress').style.display = 'none';
            document.getElementById('scanStatus').textContent = 'Scan completed successfully';
        }, 500);
        
        console.log('Showing toast notification...');
        
        // Show success message
        showToast(`${scanType === 'manual' ? 'Manual' : 'Automatic'} scan completed. Analyzed ${totalSamples} samples from ${myFarm.totalChicks} chicks.`, 'success');
        
        console.log('completeScan function finished successfully!');
        
    } catch (error) {
        console.error('ERROR in completeScan:', error);
        console.error('Error stack:', error.stack);
        
        // Hide progress and show error
        document.getElementById('scanProgress').style.display = 'none';
        showToast('Error completing scan. Please try again.', 'error');
    }
}

// Display scan results
function displayResults(detection) {
    try {
        console.log('displayResults called with:', detection);
        
        document.getElementById('resultHealthy').textContent = detection.healthy;
        document.getElementById('resultCoccidiosis').textContent = detection.coccidiosis;
        document.getElementById('resultSalmonella').textContent = detection.salmonella;
        document.getElementById('resultOther').textContent = detection.other;
        document.getElementById('detectionResults').style.display = 'block';
        
        console.log('Results displayed successfully');
    } catch (error) {
        console.error('Error in displayResults:', error);
    }
}

// Draw detection boxes on image
function drawDetectionBoxes(detection) {
    const canvas = document.getElementById('detectionCanvas');
    const image = document.getElementById('cameraImage');
    const video = document.getElementById('cameraVideo');
    
    // Get the visible element (either image or video)
    const mediaElement = image.style.display !== 'none' ? image : video;
    
    if (!mediaElement || !mediaElement.complete && mediaElement.tagName === 'IMG') {
        console.log('Media not ready for canvas drawing');
        return;
    }
    
    // Set canvas size to match displayed media
    canvas.width = 600;  // Fixed width for performance
    canvas.height = 350; // Fixed height for performance
    canvas.style.display = 'block';
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate number of boxes to draw (limit for performance)
    const maxBoxes = 15; // Reduced from potentially hundreds
    const boxesToDraw = Math.min(maxBoxes, detection.samplesAnalyzed || 10);
    
    // Distribute boxes across disease categories
    const healthyBoxes = Math.round(boxesToDraw * (detection.healthy / detection.total));
    const coccidiosisBoxes = Math.round(boxesToDraw * (detection.coccidiosis / detection.total));
    const salmonellaBoxes = Math.round(boxesToDraw * (detection.salmonella / detection.total));
    const otherBoxes = boxesToDraw - healthyBoxes - coccidiosisBoxes - salmonellaBoxes;
    
    // Generate boxes
    let boxIndex = 0;
    
    // Helper function to draw a box
    function drawBox(classification, color) {
        const x = 50 + Math.random() * (canvas.width - 150);
        const y = 50 + Math.random() * (canvas.height - 100);
        const w = 60 + Math.random() * 30;
        const h = 40 + Math.random() * 20;
        
        // Draw box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        // Draw label background
        ctx.fillStyle = color;
        ctx.fillRect(x, y - 20, w + 60, 20);
        
        // Draw label text
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`${classification} ${Math.floor(85 + Math.random() * 13)}%`, x + 4, y - 6);
    }
    
    // Draw boxes for each category
    for (let i = 0; i < healthyBoxes; i++) {
        drawBox('Healthy', '#48bb78');
    }
    for (let i = 0; i < coccidiosisBoxes; i++) {
        drawBox('Coccidiosis', '#fc8181');
    }
    for (let i = 0; i < salmonellaBoxes; i++) {
        drawBox('Salmonella', '#ed8936');
    }
    for (let i = 0; i < otherBoxes; i++) {
        drawBox('Other', '#ecc94b');
    }
}

// Create alert notification
function createAlert(detection) {
    try {
        console.log('Creating alert for detection:', detection);
        
        const alert = {
            id: generateId(),
            farmId: myFarm.id,
            farmName: myFarm.name,
            type: detection.riskLevel === 'High' ? 'critical' : 'warning',
            title: detection.riskLevel === 'High' ? 'DISEASE OUTBREAK DETECTED' : 'Health Warning',
            message: `${detection.coccidiosis + detection.salmonella + detection.other} affected chicks detected. ${detection.coccidiosis > 0 ? 'Coccidiosis found. ' : ''}${detection.salmonella > 0 ? 'Salmonella found. ' : ''}Veterinarian has been notified.`,
            timestamp: new Date().toISOString(),
            read: false,
            vetStatus: 'pending',
            detectionId: detection.id
        };
        
        const alerts = getAlerts();
        alerts.unshift(alert);
        saveAlerts(alerts);
        
        console.log('Alert saved:', alert);
        
        // Show alert banner
        showAlertBanner(alert);
        
        // Reload notifications
        loadNotifications();
        
        console.log('Alert created successfully');
    } catch (error) {
        console.error('Error creating alert:', error);
    }
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
    // Load both alerts and notifications
    const alerts = getAlerts().filter(a => a.farmId === myFarm.id);
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const myNotifications = notifications.filter(n => n.farmId === myFarm.id);
    
    // Combine alerts and notifications
    const allNotifications = [...myNotifications, ...alerts.map(alert => ({
        id: alert.id,
        type: alert.vetStatus === 'responded' ? 'vet_response' : alert.type,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp,
        read: alert.read || false,
        farmId: alert.farmId,
        vetResponse: alert.vetResponse,
        alertId: alert.id
    }))];
    
    // Sort by timestamp
    allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const container = document.getElementById('notificationsList');
    const countBadge = document.getElementById('notificationCount');
    
    const unreadCount = allNotifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
        countBadge.textContent = unreadCount;
        countBadge.style.display = 'inline-block';
    } else {
        countBadge.style.display = 'none';
    }
    
    if (allNotifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <p style="margin-top: 12px; color: #6b7280;">No notifications</p>
                <small style="color: #9ca3af;">You're all caught up!</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allNotifications.map(notif => `
        <div class="notification-item ${!notif.read ? 'unread' : ''} ${notif.type === 'vet_response' ? 'vet-response-notif' : ''}" 
             onclick="viewNotification('${notif.id}')" 
             style="cursor: pointer;">
            
            ${notif.type === 'vet_response' ? `
                <!-- Vet Response Notification -->
                <div style="display: flex; gap: 12px; align-items: start;">
                    <div style="flex-shrink: 0; width: 40px; height: 40px; background: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #166534; font-weight: 700;">
                            👨‍⚕️ Veterinarian Responded
                        </h4>
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #16a34a;">
                            ${notif.message}
                        </p>
                        <div style="background: #f0fdf4; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #22c55e;">
                            <small style="color: #166534; font-weight: 600;">
                                Click to view full recommendations →
                            </small>
                        </div>
                        <small style="color: #6b7280; margin-top: 8px; display: block;">
                            ${formatDate(notif.timestamp)}
                        </small>
                    </div>
                </div>
            ` : `
                <!-- Regular Notification -->
                <div style="display: flex; gap: 12px; align-items: start;">
                    <div style="flex-shrink: 0; width: 40px; height: 40px; background: ${
                        notif.type === 'critical' ? '#fef2f2' : 
                        notif.type === 'warning' ? '#fef3c7' : '#eff6ff'
                    }; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${
                            notif.type === 'critical' ? '#dc2626' : 
                            notif.type === 'warning' ? '#f59e0b' : '#3b82f6'
                        }" stroke-width="2">
                            ${notif.type === 'critical' || notif.type === 'warning' ? `
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            ` : `
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            `}
                        </svg>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #1f2937; font-weight: 600;">
                            ${notif.title}
                        </h4>
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #4b5563;">
                            ${notif.message}
                        </p>
                        <small style="color: #6b7280;">
                            ${formatDate(notif.timestamp)}
                        </small>
                    </div>
                </div>
            `}
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
    try {
        console.log('Loading detection history...');
        
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
                    <td><strong style="color: #48bb78;">${d.healthy}</strong></td>
                    <td><strong style="color: #fc8181;">${d.coccidiosis}</strong></td>
                    <td><strong style="color: #ed8936;">${d.salmonella}</strong></td>
                    <td><strong style="color: #ecc94b;">${d.other}</strong></td>
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
        
        console.log('Detection history loaded successfully');
    } catch (error) {
        console.error('Error loading detection history:', error);
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
            latest.riskLevel === 'High' ? '#fc8181' : 
            latest.riskLevel === 'Medium' ? '#ed8936' : 
            '#48bb78';
    } else {
        // Initialize with total chicks (all assumed healthy initially)
        document.getElementById('healthyCount').textContent = myFarm.totalChicks;
        document.getElementById('affectedCount').textContent = '0';
        document.getElementById('riskLevel').textContent = 'Low';
        document.getElementById('riskLevel').style.color = '#48bb78';
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
// ⭐ ENHANCED NOTIFICATION VIEWER - View vet responses
function viewNotification(notificationId) {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) return;
    
    // Mark as read
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
        notifications[index].read = true;
        localStorage.setItem('notifications', JSON.stringify(notifications));
        loadNotifications();
    }
    
    // If it's a vet response, show detailed modal
    if (notification.type === 'vet_response' && notification.vetResponse) {
        showVetResponseModal(notification);
    } else {
        showNotificationModal(notification);
    }
}

// Show Vet Response Modal
function showVetResponseModal(notification) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2>👨‍⚕️ Veterinarian Response</h2>
                <button class="close-modal" onclick="this.closest('.modal').remove()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <div style="padding: 20px;">
                <!-- Notification Info -->
                <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
                    <h3 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px;">
                        ${notification.title}
                    </h3>
                    <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                        ${notification.message}
                    </p>
                    <small style="color: #60a5fa; margin-top: 8px; display: block;">
                        ${formatDate(notification.timestamp)}
                    </small>
                </div>
                
                <!-- Vet Response Details -->
                <div style="background: #f0fdf4; padding: 24px; border-radius: 12px; border: 2px solid #22c55e; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <div>
                            <h3 style="margin: 0; color: #166534; font-size: 18px;">
                                Dr. ${notification.vetResponse.respondedBy}
                            </h3>
                            <small style="color: #16a34a;">
                                Responded ${formatDate(notification.vetResponse.timestamp)}
                            </small>
                        </div>
                    </div>
                    
                    <!-- Recommendation -->
                    <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <strong style="color: #166534; display: block; margin-bottom: 8px; font-size: 14px;">
                            📋 RECOMMENDED ACTION:
                        </strong>
                        <p style="margin: 0; color: #16a34a; font-size: 16px; font-weight: bold;">
                            ${notification.vetResponse.recommendation}
                        </p>
                    </div>
                    
                    ${notification.vetResponse.notes ? `
                    <!-- Detailed Instructions -->
                    <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <strong style="color: #166534; display: block; margin-bottom: 8px; font-size: 14px;">
                            📝 DETAILED INSTRUCTIONS:
                        </strong>
                        <p style="margin: 0; color: #374151; line-height: 1.8; white-space: pre-wrap;">
                            ${notification.vetResponse.notes}
                        </p>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Action Required Box -->
                <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border: 2px solid #f59e0b;">
                    <div style="display: flex; gap: 12px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="flex-shrink: 0;">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <div>
                            <strong style="color: #92400e; display: block; margin-bottom: 8px; font-size: 16px;">
                                ⚠️ ACTION REQUIRED
                            </strong>
                            <p style="margin: 0; color: #78350f; line-height: 1.6;">
                                Please follow the veterinarian's recommendations immediately. 
                                If you have any questions or the condition worsens, contact 
                                Dr. ${notification.vetResponse.respondedBy} as soon as possible.
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Next Steps -->
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 20px; border: 1px solid #e5e7eb;">
                    <strong style="color: #1f2937; display: block; margin-bottom: 12px;">
                        📌 Next Steps:
                    </strong>
                    <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
                        <li>Implement the recommended action immediately</li>
                        <li>Monitor affected birds closely</li>
                        <li>Keep records of any treatments administered</li>
                        <li>Watch for improvements or worsening conditions</li>
                        <li>Contact veterinarian if you need clarification</li>
                        <li>Follow up as directed</li>
                    </ol>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                    ✓ I Understand
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show regular notification modal
function showNotificationModal(notification) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${notification.title}</h2>
                <button class="close-modal" onclick="this.closest('.modal').remove()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <div style="padding: 20px;">
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0; color: #374151; line-height: 1.6;">
                        ${notification.message}
                    </p>
                </div>
                
                <small style="color: #6b7280;">
                    ${formatDate(notification.timestamp)}
                </small>
            </div>
            
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}
