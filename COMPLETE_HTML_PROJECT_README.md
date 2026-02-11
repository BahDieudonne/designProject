# COMPLETE POULTRY DISEASE DETECTION SYSTEM
## HTML/CSS/JavaScript Version with Veterinarian Dashboard

---

## 📋 COMPLETE SYSTEM - ALL FILES

### ✅ **11 Files Total:**

1. **index.html** - Login page
2. **admin.html** - Administrator dashboard
3. **farmer.html** - Farmer dashboard
4. **vet.html** - Veterinarian dashboard ⭐ NEW
5. **styles.css** - Complete styling for all pages
6. **app.js** - Core functions (auth, data management)
7. **admin.js** - Admin functionality
8. **farmer.js** - Farmer functionality
9. **vet.js** - Veterinarian functionality ⭐ NEW
10. **background/back1.JPG** - Farm background image
11. **README.md** - This file

---

## 🚀 QUICK START

### Step 1: Create Folder Structure
```
Poultry-Detection-System/
├── background/
│   └── back1.JPG
├── index.html
├── admin.html
├── farmer.html
├── vet.html
├── styles.css
├── app.js
├── admin.js
├── farmer.js
└── vet.js
```

### Step 2: Download All Files
- Download all 10 files from the system
- Place back1.JPG in the `background` folder
- Place all other files in the main folder

### Step 3: Open in Browser
- Open `index.html` in any modern web browser
- Login with default credentials (see below)

---

## 🔑 DEFAULT LOGIN CREDENTIALS

### Administrator:
- Username: `admin`
- Password: `admin123`

### Test Accounts (Create these via Admin):
You'll need to create farmer and veterinarian accounts through the admin dashboard.

---

## 👥 USER ROLES & FEATURES

### 1️⃣ **ADMINISTRATOR** (`admin.html`)

**Access:** Full system control

**Features:**
- ✅ Farm Management
  - Add/Edit/Delete farms
  - Upload farm thermal camera images/videos
  - Set farm details (name, location, total chicks, device ID)
  - Manage farm status (active/maintenance/inactive)

- ✅ User Management
  - Create user accounts (Farmers, Veterinarians, Administrators)
  - Assign farmers to specific farms (one farm per farmer)
  - Assign veterinarians to multiple farms
  - Edit/Delete user accounts

- ✅ System Configuration
  - Set automatic scan intervals (2-4 hours)
  - Configure alert thresholds (Medium: 15%, High: 30%)
  - View model information (YOLOv5, CNN ResNet50)

---

### 2️⃣ **FARMER** (`farmer.html`)

**Access:** Single assigned farm

**Features:**
- ✅ Live Camera Feed
  - Automatic display of farm's thermal camera image/video
  - Video auto-plays and loops
  - Shows device ID and last update timestamp

- ✅ Disease Scanning
  - **Manual Scanning:** Click "Scan Now" button anytime
  - **Automatic Scanning:** System scans every X hours (admin-configured)
  - **Scan Duration:** 30-60 seconds (based on flock size)
  - **Real-time Progress:** 15 detailed scanning stages
  - **Sample Analysis:** Analyzes 20-30% of flock, extrapolates to full flock

- ✅ Detection Results
  - Healthy count
  - Diseased count (Coccidiosis, Salmonella, Other)
  - Risk level (Low/Medium/High)
  - Detection boxes drawn on thermal image
  - Color-coded results:
    - Green = Healthy
    - Red = Coccidiosis
    - Orange = Salmonella
    - Yellow = Other

- ✅ Notifications
  - Alert banner for critical/warning alerts
  - Notification panel with unread counter
  - Receives veterinarian responses
  - Alert types: Critical (High risk), Warning (Medium risk)

- ✅ History & Reports
  - Detection history table (all scans)
  - Download CSV reports
  - Track trends over time

---

### 3️⃣ **VETERINARIAN** (`vet.html`) ⭐ NEW

**Access:** Multiple assigned farms

**Features:**
- ✅ Multi-Farm Monitoring
  - View all assigned farms in one dashboard
  - See health status of each farm
  - Track total chicks across all farms
  - Monitor latest scan results

- ✅ Disease Alerts Management
  - Receive alerts from all assigned farms
  - View active, critical, and warning alerts
  - See unread alerts highlighted
  - Mark alerts as read automatically

- ✅ Alert Response System
  - Respond to disease outbreaks
  - Provide recommendations:
    - Isolate affected birds
    - Administer medication
    - Vaccination required
    - Schedule physical inspection
    - Treatment protocol
    - Continue monitoring
    - Consider culling if severe
  - Add detailed notes and instructions
  - Track response status (Pending/Responded)

- ✅ Team Dispatch
  - Dispatch veterinary teams to farms
  - Purposes:
    - Disease Inspection
    - Vaccination Campaign
    - Treatment Administration
    - Routine Health Checkup
    - Emergency Response
  - Set scheduled dates
  - Add team members and notes
  - Track dispatch status (Scheduled/In Progress/Completed)

- ✅ Farm Details
  - View comprehensive farm information
  - Check total scans per farm
  - See latest scan timestamps
  - Monitor farm device status

- ✅ Statistics Dashboard
  - Assigned farms count
  - Active alerts count
  - Pending responses count
  - Total chicks across all farms

---

## 📊 DATA STORAGE

### LocalStorage (Small Data):
- Users
- Farms metadata
- Detections
- Alerts
- Veterinary teams
- System configuration

### IndexedDB (Large Files):
- Farm thermal camera images
- Farm thermal camera videos

### Data Persistence:
- All data persists across browser sessions
- No server required
- Works offline

---

## 🎨 UI DESIGN

### Color Scheme:
- **Primary Green:** #4c6e32 (Farm green from background)
- **Light Green:** #8bac47 (Grass/fields)
- **Yellow-Green:** #d4e157 (Sunlight)
- **Purple:** #7c3aed (Veterinarian theme)
- **Red:** #dc3545 (Critical alerts)
- **Orange:** #ed8936 (Warnings)

### Design Features:
- Farm background image on login page
- Consistent color scheme across all pages
- Responsive design (mobile-friendly)
- Smooth animations and transitions
- Professional card-based layout
- Chicken icon branding

---

## 🔄 COMPLETE WORKFLOW

### Step-by-Step System Usage:

**1. Admin Setup:**
```
1. Login as admin (admin/admin123)
2. Add a farm:
   - Name: "Buea Farm"
   - Location: "Buea, Cameroon"
   - Total Chicks: 2500
   - Device ID: "DEV-001"
   - Upload thermal camera image/video
3. Create farmer account:
   - Name: "John Farmer"
   - Username: "john"
   - Password: "farmer123"
   - Role: Farmer
   - Assign to "Buea Farm"
4. Create veterinarian account:
   - Name: "Dr. Sarah Vet"
   - Username: "sarah"
   - Password: "vet123"
   - Role: Veterinarian
   - Assign to multiple farms (including "Buea Farm")
```

**2. Farmer Operations:**
```
1. Login as john/farmer123
2. See thermal camera feed automatically
3. Click "Scan Now (Manual)"
4. Wait 30-60 seconds (scan processes)
5. View results:
   - Healthy: 2350
   - Diseased: 150 (Coccidiosis: 80, Salmonella: 50, Other: 20)
   - Risk Level: Medium
6. Receive notification if disease detected
7. View detection history
8. Download report
```

**3. Veterinarian Response:**
```
1. Login as sarah/vet123
2. See alert from "Buea Farm"
3. View alert details:
   - Farm: Buea Farm
   - Type: WARNING
   - Message: "150 affected chicks detected..."
4. Click "Respond to Alert"
5. Select recommendation: "Administer medication"
6. Add notes: "Start antibiotic treatment immediately. Monitor for 3 days."
7. Check "Dispatch team for inspection"
8. Submit response
9. Dispatch team:
   - Select farm: Buea Farm
   - Purpose: Disease Inspection
   - Team members: "Dr. Sarah, Nurse John"
   - Schedule date: Tomorrow
   - Notes: "Bring medication supplies"
10. Submit dispatch
```

**4. Farmer Receives Response:**
```
1. Farmer sees notification
2. Reads veterinarian's recommendation
3. Follows instructions
4. Awaits team visit
```

---

## 🔧 TECHNICAL DETAILS

### Scan Time Formula:
```javascript
Base time: 30 seconds
Additional time: (Total Chicks / 100) × 100ms
Maximum time: 60 seconds

Examples:
- 1,000 chicks → 40 seconds
- 2,500 chicks → 55 seconds
- 5,000 chicks → 60 seconds (capped)
```

### Scan Stages (15 total):
1. Initializing thermal imaging system...
2. Calibrating thermal sensors...
3. Capturing thermal images...
4. Scanning X chicks...
5. Detecting droppings using YOLO algorithm...
6. Processing thermal data patterns...
7. Extracting sample regions of interest...
8. Running CNN disease classification...
9. Analyzing for Coccidiosis markers...
10. Analyzing for Salmonella indicators...
11. Checking for other pathogen signatures...
12. Analyzing behavioral patterns...
13. Calculating flock-wide risk assessment...
14. Generating detection report...
15. Finalizing results...

### Detection Algorithm:
```
1. Sample 20-30% of flock
2. Classify each sample: Healthy, Coccidiosis, Salmonella, Other
3. Extrapolate to entire flock
4. Calculate disease ratio
5. Determine risk level:
   - Low: < 15% diseased
   - Medium: 15-30% diseased
   - High: > 30% diseased
6. Generate alerts if Medium or High risk
7. Notify farmer and assigned veterinarians
```

---

## 🐛 TROUBLESHOOTING

### Issue: Login not working
**Fix:** Check browser console (F12). Verify localStorage is enabled.

### Issue: Background image not showing
**Fix:** 
1. Ensure back1.JPG is in `background/` folder
2. Check file name is exactly `back1.JPG` (case-sensitive)
3. Clear browser cache

### Issue: Scan hangs at "Calculating risk level"
**Fix:**
1. Open browser console (F12)
2. Look for JavaScript errors
3. Refresh page and try again

### Issue: Farm image/video not uploading
**Fix:**
1. Check file size (< 50MB recommended)
2. Use MP4 for videos, JPG/PNG for images
3. Try smaller file

### Issue: Veterinarian not seeing alerts
**Fix:**
1. Verify veterinarian is assigned to farm
2. Check that alert was created (farmer scanned with disease detected)
3. Refresh page

---

## 📱 BROWSER COMPATIBILITY

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari
- ❌ Internet Explorer (not supported)

---

## 🎓 EDUCATIONAL PROJECT

**Institution:** Landmark Metropolitan University  
**Purpose:** Poultry Disease Detection for Cameroon Farms  
**Technology:** HTML5, CSS3, JavaScript, IndexedDB, LocalStorage  
**AI Models:** YOLOv5 (detection), CNN ResNet50 (classification)  
**Version:** 2.0 (Complete with Veterinarian Dashboard)

---

## ✅ FEATURE CHECKLIST

### Authentication & Users:
- [x] Role-based login (Admin, Farmer, Vet)
- [x] Session management
- [x] Password protection
- [x] User creation by admin only

### Farm Management:
- [x] Add/Edit/Delete farms
- [x] Upload images/videos (IndexedDB)
- [x] Multiple farms support
- [x] Farm status tracking

### Disease Detection:
- [x] Manual scanning
- [x] Automatic scanning (configurable intervals)
- [x] Real-time progress (15 stages)
- [x] Time based on flock size (30-60s)
- [x] Disease classification (4 types)
- [x] Sample analysis (20-30% of flock)
- [x] Result extrapolation
- [x] Risk level calculation
- [x] Detection box visualization

### Alerts & Notifications:
- [x] Automatic alert generation
- [x] Alert types (Critical, Warning)
- [x] Notification panel
- [x] Unread counter
- [x] Alert banner

### Veterinarian Features:
- [x] Multi-farm monitoring
- [x] Alert management
- [x] Response system
- [x] Recommendations
- [x] Team dispatch
- [x] Visit scheduling
- [x] Response tracking

### Reports & History:
- [x] Detection history table
- [x] CSV export
- [x] Scan statistics
- [x] Farm details

### UI/UX:
- [x] Farm-themed design
- [x] Background image
- [x] Responsive layout
- [x] Smooth animations
- [x] Toast notifications
- [x] Modal dialogs
- [x] Tab navigation

---

## 📞 SUPPORT

For issues:
1. Check browser console (F12) for errors
2. Verify all files in correct locations
3. Clear browser cache and refresh
4. Make sure localStorage is enabled in browser

---

## 🎉 YOU'RE ALL SET!

**Next Step:** Convert to React.js!

Once you've tested the HTML/CSS/JS version and confirmed all features work, we can proceed with the React.js conversion.

**Total Features:** 50+  
**Total Lines of Code:** ~3000+  
**Dashboards:** 3 (Admin, Farmer, Veterinarian)  
**User Roles:** 3  
**Complete System:** ✅ YES!

---

**End of Complete HTML Project README**
