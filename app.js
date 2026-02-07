// Initialize localStorage with default admin account if first time
function initializeSystem() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                role: 'administrator',
                name: 'System Administrator',
                email: 'admin@poultrysystem.cm',
                phone: '+237 674 567 890',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem('farms')) {
        localStorage.setItem('farms', JSON.stringify([]));
    }

    if (!localStorage.getItem('detections')) {
        localStorage.setItem('detections', JSON.stringify([]));
    }

    if (!localStorage.getItem('alerts')) {
        localStorage.setItem('alerts', JSON.stringify([]));
    }
    
    // Initialize IndexedDB for large files
    initializeIndexedDB();
}

// Initialize IndexedDB for storing farm media
let db;
function initializeIndexedDB() {
    const request = indexedDB.open('PoultrySystemDB', 1);
    
    request.onerror = function(event) {
        console.error('IndexedDB error:', event.target.error);
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('IndexedDB initialized successfully');
    };
    
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        
        // Create object store for farm media
        if (!db.objectStoreNames.contains('farmMedia')) {
            const objectStore = db.objectStore = db.createObjectStore('farmMedia', { keyPath: 'farmId' });
            console.log('Created farmMedia object store');
        }
    };
}

// Save farm media to IndexedDB
function saveFarmMedia(farmId, mediaData, mediaType) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Database not initialized');
            return;
        }
        
        const transaction = db.transaction(['farmMedia'], 'readwrite');
        const objectStore = transaction.objectStore('farmMedia');
        
        const media = {
            farmId: farmId,
            mediaData: mediaData,
            mediaType: mediaType,
            timestamp: new Date().toISOString()
        };
        
        const request = objectStore.put(media);
        
        request.onsuccess = function() {
            resolve(true);
        };
        
        request.onerror = function() {
            reject(request.error);
        };
    });
}

// Get farm media from IndexedDB
function getFarmMedia(farmId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Database not initialized');
            return;
        }
        
        const transaction = db.transaction(['farmMedia'], 'readonly');
        const objectStore = transaction.objectStore('farmMedia');
        const request = objectStore.get(farmId);
        
        request.onsuccess = function() {
            resolve(request.result);
        };
        
        request.onerror = function() {
            reject(request.error);
        };
    });
}

// Delete farm media from IndexedDB
function deleteFarmMedia(farmId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Database not initialized');
            return;
        }
        
        const transaction = db.transaction(['farmMedia'], 'readwrite');
        const objectStore = transaction.objectStore('farmMedia');
        const request = objectStore.delete(farmId);
        
        request.onsuccess = function() {
            resolve(true);
        };
        
        request.onerror = function() {
            reject(request.error);
        };
    });
}

// Initialize system on page load
initializeSystem();

// Get current user from session
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Set current user in session
function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

// Clear current user session
function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
}

// Login functionality
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            setCurrentUser(user);
            
            // Redirect based on role
            if (user.role === 'administrator') {
                window.location.href = 'admin.html';
            } else if (user.role === 'farmer') {
                window.location.href = 'farmer.html';
            } else if (user.role === 'veterinarian') {
                window.location.href = 'vet.html';
            }
        } else {
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.style.display = 'flex';
            
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 3000);
        }
    });
}

// Toggle password visibility
const togglePassword = document.getElementById('togglePassword');
if (togglePassword) {
    togglePassword.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
    });
}

// Logout functionality
function logout() {
    clearCurrentUser();
    window.location.href = 'index.html';
}

// Check authentication on protected pages
function checkAuth() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// Get all farms from localStorage
function getFarms() {
    return JSON.parse(localStorage.getItem('farms') || '[]');
}

// Save farms to localStorage
function saveFarms(farms) {
    localStorage.setItem('farms', JSON.stringify(farms));
}

// Get all users from localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Get detections from localStorage
function getDetections() {
    return JSON.parse(localStorage.getItem('detections') || '[]');
}

// Save detections to localStorage
function saveDetections(detections) {
    localStorage.setItem('detections', JSON.stringify(detections));
}

// Get alerts from localStorage
function getAlerts() {
    return JSON.parse(localStorage.getItem('alerts') || '[]');
}

// Save alerts to localStorage
function saveAlerts(alerts) {
    localStorage.setItem('alerts', JSON.stringify(alerts));
}

// Generate unique ID
function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date for input fields
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Show toast notification
function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#059669' : '#ef4444'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);